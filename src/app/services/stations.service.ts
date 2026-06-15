import { Injectable } from '@angular/core';
import { OverpassService } from './overpass.service';
import { PriceService } from './price.service';
import { Station } from '../models/station.model';
import { OnoPriceProvider } from '../providers/ono-price.provider';
import { PriceProvider } from '../providers/price-provider.interface';


@Injectable({ providedIn: 'root' })
export class StationsService {
  private liveProviders: PriceProvider[];

  constructor(
    private overpass: OverpassService,
    private prices: PriceService,
    ono: OnoPriceProvider,
  ) {
    this.liveProviders = [ono];
  }

  async load(lat: number, lng: number, radiusMeters = 20000): Promise<Station[]> {
    let stations = await this.overpass.fetchAround(lat, lng, radiusMeters);
    stations = this.dedupe(stations);

    // 1) základní ceny ze souboru
    this.prices.applyBundled(stations);

    // 2) živé ceny (pokud je nějaký provider zapnutý)
    for (const p of this.liveProviders) {
      if (!p.enabled) continue;
      try {
        await p.enrich(stations);
      } catch {
      }
    }

    this.computeDistances(stations, lat, lng);
    stations.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return stations;
  }

  // Odstraní duplicity (stejná značka na skoro stejných souřadnicích).
  private dedupe(stations: Station[]): Station[] {
    const byId = new Map<string, Station>();
    for (const s of stations) byId.set(s.id, s);

    const seen = new Map<string, Station>();
    for (const s of byId.values()) {
      const key = `${s.brand}:${s.lat.toFixed(4)}:${s.lng.toFixed(4)}`;
      if (!seen.has(key)) seen.set(key, s);
    }
    return [...seen.values()];
  }

  private computeDistances(stations: Station[], lat: number, lng: number): void {
    for (const s of stations) s.distanceKm = haversineKm(lat, lng, s.lat, s.lng);
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
