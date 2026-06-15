import { Injectable } from '@angular/core';
import { HttpService } from '../services/http.service';
import { Station } from '../models/station.model';
import { PriceProvider, setLivePrice } from './price-provider.interface';

/**
  ŽIVÉ CENY TANK ONO.

  Oficiální ceník (https://www.tank-ono.cz/cz/index.php?page=cenik) je jeden
  pro CELÝ řetězec – platí pro všechny pobočky. Ceny jsou v HTML jako čtyřmístné
  číslo v haléřích, např.:
      NATURAL 95  3790   > 37,90 Kč
      DIESEL      3590   > 35,90 Kč


  Funguje na zařízení (CapacitorHttp obchází CORS). V prohlížeči může CORS blokovat –
 */
const ONO_CENIK_URL = 'https://www.tank-ono.cz/cz/index.php?page=cenik';

@Injectable({ providedIn: 'root' })
export class OnoPriceProvider implements PriceProvider {
  readonly id = 'ono';
  readonly enabled = true;

  constructor(private http: HttpService) {}

  async enrich(stations: Station[]): Promise<void> {
    const targets = stations.filter((s) => s.brand === 'ono');
    if (!targets.length) return;

    let html: string;
    try {
      html = await this.http.getText(ONO_CENIK_URL);
    } catch {
      return; // necháme ceny ze souboru
    }

    // Odstraníme HTML tagy, ať se regex nechytí na čísla v atributech.
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ');

    // "NATURAL 95" NE následované '+' ani dalším číslem (vyloučí 95+ a 98).
    const natural95 = this.toKc(
      this.match(text, /NATURAL\s*95(?![+\d])\D*?(\d{2,4}(?:[.,]\d{1,2})?)/i),
    );
    // "DIESEL" NE následované '+' (vyloučí DIESEL+).
    const diesel = this.toKc(this.match(text, /DIESEL(?!\+)\D*?(\d{2,4}(?:[.,]\d{1,2})?)/i));

    if (natural95 == null && diesel == null) return;

    for (const s of targets) {
      setLivePrice(s, { natural95, diesel }, 'Tank ONO (ceník)');
    }
  }

  private match(text: string, re: RegExp): string | null {
    const m = text.match(re);
    return m ? m[1] : null;
  }

  /** "3790" (haléře) → 37.90; "37,90" → 37.90. */
  private toKc(raw: string | null): number | null {
    if (!raw) return null;
    if (raw.includes(',') || raw.includes('.')) {
      const v = parseFloat(raw.replace(',', '.'));
      return Number.isFinite(v) ? v : null;
    }
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return null;
    return n >= 1000 ? n / 100 : n; // čtyřmístné číslo je v haléřích
  }
}
