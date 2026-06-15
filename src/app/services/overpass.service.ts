import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Station } from '../models/station.model';
import { resolveBrand } from '../data/brand-config';

/**
 Načítá polohy čerpacích stanic z OpenStreetMap přes Overpass API.
 ne celou ČR najednou – to by bylo zbytečně velké.
 */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
interface OverpassResponse {
  elements: OverpassElement[];
}

@Injectable({ providedIn: 'root' })
export class OverpassService {
  constructor(private http: HttpService) {}


  async fetchAround(lat: number, lng: number, radiusMeters = 20000): Promise<Station[]> {
    const query =
      `[out:json][timeout:25];` +
      `(` +
      `node["amenity"="fuel"](around:${radiusMeters},${lat},${lng});` +
      `way["amenity"="fuel"](around:${radiusMeters},${lat},${lng});` +
      `);` +
      `out center tags;`;

    const body = 'data=' + encodeURIComponent(query);
    let lastError: unknown;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const text = await this.http.postForm(endpoint, body);
        const json = JSON.parse(text) as OverpassResponse;
        return this.mapElements(json);
      } catch (e) {
        lastError = e;
        // zkus další server
      }
    }
    throw lastError ?? new Error('Overpass API je nedostupné');
  }

  private mapElements(json: OverpassResponse): Station[] {
    const out: Station[] = [];
    for (const el of json.elements ?? []) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) continue;

      const tags = el.tags ?? {};
      if (tags['access'] === 'private' || tags['access'] === 'no') continue;

      const brandText = `${tags['brand'] ?? ''} ${tags['name'] ?? ''} ${tags['operator'] ?? ''}`;
      const brand = resolveBrand(brandText);
      const name = tags['name'] || tags['brand'] || tags['operator'] || brand.label || 'Čerpací stanice';

      out.push({
        id: `${el.type}/${el.id}`,
        name,
        brand: brand.key,
        brandLabel: brand.label,
        lat,
        lng,
        address: this.formatAddress(tags),
        city: tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || undefined,
        prices: {},
      });
    }
    return out;
  }

  private formatAddress(tags: Record<string, string>): string | undefined {
    const street = tags['addr:street'] || '';
    const hn = tags['addr:housenumber'] || '';
    const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || '';
    const line1 = [street, hn].filter(Boolean).join(' ');
    const parts = [line1, city].filter(Boolean);
    return parts.length ? parts.join(', ') : undefined;
  }
}
