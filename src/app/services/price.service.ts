import { Injectable } from '@angular/core';
import { Station } from '../models/station.model';
import {
  BRAND_PRICES,
  CITY_PRICE_OVERRIDES,
  STATION_PRICE_OVERRIDES,
  BrandPriceEntry,
} from '../data/fuel-prices.data';


@Injectable({ providedIn: 'root' })
export class PriceService {
  applyBundled(stations: Station[]): void {
    for (const s of stations) {
      const base: BrandPriceEntry = BRAND_PRICES[s.brand] ?? BRAND_PRICES['other'];

      const cityKey = s.city ? `${s.brand}|${s.city.toLowerCase()}` : '';
      const cityOverride = cityKey ? CITY_PRICE_OVERRIDES[cityKey] : undefined;
      const stationOverride = STATION_PRICE_OVERRIDES[s.id];

      const merged: BrandPriceEntry = {
        ...base,
        ...(cityOverride ?? {}),
        ...(stationOverride ?? {}),
      };

      s.prices = {
        natural95: merged.natural95 ?? null,
        diesel: merged.diesel ?? null,
        source: stationOverride ? 'override' : cityOverride ? 'město' : 'značka',
        updated: null,
      };
    }
  }
}
