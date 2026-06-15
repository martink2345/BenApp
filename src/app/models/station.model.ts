

/** Sledujeme jen dvě paliva */
export type FuelType = 'natural95' | 'diesel';


export type BrandKey =
  | 'omv'
  | 'mol'
  | 'orlen'
  | 'shell'
  | 'ono'
  | 'eurooil'
  | 'robinoil'
  | 'globus'
  | 'prim'
  | 'papoil'
  | 'other';

/** Ceny u jedné stanice (Kč/litr). */
export interface FuelPrice {
  natural95?: number | null;
  diesel?: number | null;
  /** Odkud cena pochází – 'značka' | 'město' | 'override' | název providera. */
  source?: string | null;
  /** Volitelně datum/čas aktualizace ceny. */
  updated?: string | null;
}

/** Jedna čerpací stanice. */
export interface Station {
  /** Stabilní ID – odvozené z OSM (např. 'node/123456'). */
  id: string;
  /** Zobrazovaný název. */
  name: string;
  /** Normalizovaná značka. */
  brand: BrandKey;
  brandLabel: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  prices: FuelPrice;
  /** Vzdálenost od uživatele (km) – dopočítává se. */
  distanceKm?: number;
}

/** Zastropované (maximální přípustné) ceny od státu. */
export interface CappedPrices {
  /** Maximální cena benzinu Kč/l. */
  benzin: number | null;
  /** Maximální cena nafty Kč/l. */
  nafta: number | null;
  effectiveFrom?: string | null;
  /** Kdy aplikace data načetla. */
  fetchedAt: string;
}
