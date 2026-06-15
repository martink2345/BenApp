import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonModal,
  IonFab,
  IonFabButton,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locateOutline,
  refreshOutline,
  navigate,
  closeOutline,
  carSportOutline,
  pricetagOutline,
  timeOutline,
  informationCircleOutline,
  locationOutline,
  warningOutline,
  speedometerOutline,
  walletOutline,
} from 'ionicons/icons';
import * as L from 'leaflet';

import { Station, FuelType, CappedPrices } from '../../models/station.model';
import { brandByKey } from '../../data/brand-config';
import { CappedPriceService } from '../../services/capped-price.service';
import { StationsService } from '../../services/stations.service';
import { LocationService, UserPosition } from '../../services/location.service';
import { NavigationService } from '../../services/navigation.service';

const CZ_FALLBACK: UserPosition = { lat: 50.0875, lng: 14.4214, accuracy: 0 }; // Praha
const PRICE_ZOOM = 12; // od tohoto přiblížení ukazujeme ceny v kroužcích
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonModal,
    IonFab,
    IonFabButton,
    IonSpinner,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  // stav UI
  cappedPrices: CappedPrices | null = null;
  loadingCaps = true;
  capsError = false;

  loadingStations = false;
  stationsError = false;
  stations: Station[] = [];

  fuel: FuelType = 'natural95';

  selected: Station | null = null;

  // Leaflet
  private map!: L.Map;
  private userMarker?: L.Marker;
  private accuracyCircle?: L.Circle;
  private markerRefs: Array<{ marker: L.Marker; station: Station }> = [];
  private watchId: string | null = null;

  constructor(
    private capped: CappedPriceService,
    private stationsSvc: StationsService,
    private location: LocationService,
    private nav: NavigationService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastController,
  ) {
    addIcons({
      locateOutline,
      refreshOutline,
      navigate,
      closeOutline,
      carSportOutline,
      pricetagOutline,
      timeOutline,
      informationCircleOutline,
      locationOutline,
      warningOutline,
      speedometerOutline,
      walletOutline,
    });
  }

  async ngAfterViewInit(): Promise<void> {
    this.initMap();
    this.loadCappedPrices(); // běží na pozadí
    await this.locateAndLoad();
  }

  ionViewDidEnter(): void {
    // mapa potřebuje přepočítat velikost po zobrazení
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  ngOnDestroy(): void {
    if (this.watchId) this.location.clearWatch(this.watchId);
    this.map?.remove();
  }

  // mapa

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [CZ_FALLBACK.lat, CZ_FALLBACK.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: TILE_ATTR,
    }).addTo(this.map);

    this.map.on('zoomend', () => this.updateMarkerIcons());
  }

  private async locateAndLoad(): Promise<void> {
    const pos = (await this.location.getCurrent()) ?? CZ_FALLBACK;
    if (pos === CZ_FALLBACK) {
      this.showToast('Poloha není dostupná – zobrazuje se Praha. Povol polohu pro zobrazení tvého okolí.');
    }
    this.setUserPosition(pos, true);
    this.startWatching();
    await this.loadStations(pos.lat, pos.lng);
  }

  private startWatching(): void {
    this.location
      .watch((p) => this.zone.run(() => this.setUserPosition(p, false)))
      .then((id) => (this.watchId = id));
  }

  private setUserPosition(pos: UserPosition, recenter: boolean): void {
    const latlng: L.LatLngExpression = [pos.lat, pos.lng];

    if (!this.userMarker) {
      this.userMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'user-div',
          html: '<div class="user-dot"><span class="user-pulse"></span></div>',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000,
      }).addTo(this.map);
    } else {
      this.userMarker.setLatLng(latlng);
    }

    if (pos.accuracy && pos.accuracy > 0) {
      if (!this.accuracyCircle) {
        this.accuracyCircle = L.circle(latlng, {
          radius: pos.accuracy,
          color: '#2F80ED',
          fillColor: '#2F80ED',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(this.map);
      } else {
        this.accuracyCircle.setLatLng(latlng).setRadius(pos.accuracy);
      }
    }

    if (recenter) this.map.setView(latlng, 14);
  }

  // ---------------------------------------------------------------- data

  private async loadCappedPrices(): Promise<void> {
    this.loadingCaps = true;
    this.capsError = false;
    try {
      this.cappedPrices = await this.capped.load();
    } catch {
      this.capsError = true;
    } finally {
      this.loadingCaps = false;
      this.cdr.detectChanges();
    }
  }

  private async loadStations(lat: number, lng: number): Promise<void> {
    this.loadingStations = true;
    this.stationsError = false;
    this.cdr.detectChanges();
    try {
      this.stations = await this.stationsSvc.load(lat, lng, 22000);
      this.renderStationMarkers();
    } catch {
      this.stationsError = true;
      this.showToast('Nepodařilo se načíst čerpací stanice. Zkontroluj připojení.');
    } finally {
      this.loadingStations = false;
      this.cdr.detectChanges();
    }
  }

  // markery stanic

  private visibleStations(): Station[] {
    return this.stations;
  }

  private renderStationMarkers(): void {
    for (const ref of this.markerRefs) ref.marker.remove();
    this.markerRefs = [];

    const zoom = this.map.getZoom();
    for (const station of this.visibleStations()) {
      const marker = L.marker([station.lat, station.lng], {
        icon: this.makeIcon(station, zoom, false),
        riseOnHover: true,
      });
      marker.on('click', () => this.zone.run(() => this.selectStation(station)));
      marker.addTo(this.map);
      this.markerRefs.push({ marker, station });
    }
  }

  private updateMarkerIcons(): void {
    const zoom = this.map.getZoom();
    for (const ref of this.markerRefs) {
      const isSel = this.selected?.id === ref.station.id;
      ref.marker.setIcon(this.makeIcon(ref.station, zoom, isSel));
    }
  }

  private makeIcon(station: Station, zoom: number, selected: boolean): L.DivIcon {
    const color = brandByKey(station.brand).color;
    const showPrice = zoom >= PRICE_ZOOM;
    const selCls = selected ? ' is-selected' : '';

    if (!showPrice) {
      return L.divIcon({
        className: 'fuel-div',
        html: `<div class="fuel-marker${selCls}"><span class="fuel-dot" style="background:${color}"></span></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    }

    const price = station.prices[this.fuel];
    const label = price != null ? this.formatPrice(price) : '—';
    return L.divIcon({
      className: 'fuel-div',
      html:
        `<div class="fuel-marker${selCls}">` +
        `<span class="fuel-pill" style="border-color:${color}">` +
        `<i class="fuel-dot-sm" style="background:${color}"></i>${label}` +
        `</span></div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  private selectStation(station: Station): void {
    this.selected = station;
    this.updateMarkerIcons();
    this.map.panTo([station.lat, station.lng], { animate: true });
    this.cdr.detectChanges();
  }

  // akce UI

  onFuelChange(value: string | undefined): void {
    if (value === 'natural95' || value === 'diesel') {
      this.fuel = value;
      this.updateMarkerIcons();
    }
  }

  togglePriority(): void {
    // filtr odstraněn – stanice se zobrazují vždy
  }

  recenter(): void {
    if (this.userMarker) {
      this.map.setView(this.userMarker.getLatLng(), 14, { animate: true });
    }
  }

  async reloadHere(): Promise<void> {
    const c = this.map.getCenter();
    await this.loadStations(c.lat, c.lng);
  }

  closeSheet(): void {
    this.selected = null;
    this.updateMarkerIcons();
  }

  async navigateToSelected(): Promise<void> {
    if (!this.selected) return;
    await this.nav.navigateTo(this.selected.lat, this.selected.lng, this.selected.name);
  }

  //helpery

  formatPrice(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toFixed(2).replace('.', ',');
  }

  brandColor(station: Station): string {
    return brandByKey(station.brand).color;
  }

  selectedPrice(): number | null {
    return (this.selected?.prices[this.fuel] ?? null) as number | null;
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2600, position: 'top' });
    await t.present();
  }
}
