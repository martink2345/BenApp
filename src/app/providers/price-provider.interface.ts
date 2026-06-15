import { Station } from '../models/station.model';

/**
  Rozhraní pro "živé" cenové providery.

  Provider dostane už načtené stanice (s polohami z OSM a základními cenami)
  a může u nich PŘEPSAT ceny aktuálními daty z webu. Když nemá data pro danou
  stanici, nechá ji být.

 * Provider NESMÍ shodit appku – případnou chybu si ošetří sám a vrátí se bez změny.
 */
export interface PriceProvider {
  /** Krátké id pro logování. */
  readonly id: string;
  /** Zapnuto/vypnuto.  */
  readonly enabled: boolean;
  /** Doplní/přepíše ceny ve `stations` na místě. */
  enrich(stations: Station[]): Promise<void>;
}

/**
  Pomůcka pro nastavení ceny u stanice z provideru (zachová zdroj a čas).
 */
export function setLivePrice(
  s: Station,
  patch: { natural95?: number | null; diesel?: number | null },
  source: string,
): void {
  s.prices = {
    natural95: patch.natural95 ?? s.prices.natural95 ?? null,
    diesel: patch.diesel ?? s.prices.diesel ?? null,
    source,
    updated: new Date().toISOString(),
  };
}
