import { BrandKey } from '../models/station.model';

export interface BrandPriceEntry {
  natural95: number;
  diesel: number;
  note?: string;
}

/** Výchozí ceny pro každou značku. */
export const BRAND_PRICES: Record<BrandKey, BrandPriceEntry> = {
  omv:      { natural95: 39.9, diesel: 37.9 },
  mol:      { natural95: 39.5, diesel: 37.5 },
  orlen:    { natural95: 38.9, diesel: 36.9 },
  shell:    { natural95: 40.4, diesel: 38.4 },
  ono:      { natural95: 37.9, diesel: 35.9 },
  eurooil:  { natural95: 38.4, diesel: 36.4 },
  robinoil: { natural95: 38.2, diesel: 36.2 },
  globus:   { natural95: 37.5, diesel: 35.6 },
  prim:     { natural95: 38.0, diesel: 36.0 },
  papoil:   { natural95: 38.6, diesel: 36.6 },
  other:    { natural95: 38.8, diesel: 36.8 },
};

/**
  Přesnější ceny pro konkrétní MĚSTO (volitelné).
  Klíč: `${brandKey}|${mesto_lowercase}` (město = OSM addr:city stanice).
  Stačí vyplnit jen pole, která chceš přepsat.
 */
export const CITY_PRICE_OVERRIDES: Record<string, Partial<BrandPriceEntry>> = {
  // Příklad:
  // 'ono|kroměříž': { natural95: 37.6, diesel: 35.7 },
  // 'eurooil|brno': { natural95: 38.1 },
};

/**
  Override na úroveň KONKRÉTNÍ STANICE podle jejího OSM id (např. 'node/123456789').
  ID stanice zjistíš kliknutím na stanici v appce (zobrazuje se v detailu),
  nebo na https://www.openstreetmap.org.
 */
export const STATION_PRICE_OVERRIDES: Record<string, Partial<BrandPriceEntry>> = {
  // 'node/123456789': { natural95: 37.4, diesel: 35.5 },
};
