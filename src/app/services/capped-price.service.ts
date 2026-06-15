import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { CappedPrices } from '../models/station.model';

/**
  Načítá MAXIMÁLNÍ PŘÍPUSTNÉ (zastropované) ceny benzinu a nafty
  přímo ze stránky Ministerstva financí. Text na stránce vypadá takto:

    "Maximální přípustná cena benzinu: 41,98 Kč s DPH / litr"
    "Maximální přípustná cena nafty: 39,51 Kč s DPH / litr"

  Hodnoty se čas od času mění, proto je parsujeme při každém otevření appky.
 */
const MF_URL =
  'https://mf.gov.cz/cs/kontrola-a-regulace/cenova-regulace-a-kontrola/maximalni-pripustne-ceny-benzinu-a-nafty';

/** Klíč pro uschování poslední úspěšně načtené hodnoty (localStorage). */
const CACHE_KEY = 'capped_prices_v1';

/** Záložní hodnota, když selže i živé načtení i cache (stav 6/2026). */
const FALLBACK: CappedPrices = {
  benzin: 41.49,
  nafta: 39.29,
  effectiveFrom: null,
  fetchedAt: '',
};

@Injectable({ providedIn: 'root' })
export class CappedPriceService {
  constructor(private http: HttpService) {}

  async load(): Promise<CappedPrices> {
    try {
      const html = await this.http.getText(MF_URL);
      const parsed = this.parse(html);
      if (parsed.benzin != null || parsed.nafta != null) {
        this.saveCache(parsed); // cachene poslední platnou hodnotu
        return parsed;
      }
    } catch {
      // spadlo (typicky CORS v prohlížeči nebo offline) → použije cachované
    }
    return this.loadCache() ?? { ...FALLBACK, fetchedAt: new Date().toISOString() };
  }

  private saveCache(p: CappedPrices): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(p));
    } catch {
    }
  }

  private loadCache(): CappedPrices | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) as CappedPrices) : null;
    } catch {
      return null;
    }
  }


  parse(html: string): CappedPrices {
    const benzin = this.extractNumber(
      html,
      /Maxim[aá]ln[ií]\s+p[řr][ií]pustn[aá]\s+cena\s+benzinu\s*:?\s*([\d\s\u00a0]+,\d+)/i,
    );
    const nafta = this.extractNumber(
      html,
      /Maxim[aá]ln[ií]\s+p[řr][ií]pustn[aá]\s+cena\s+nafty\s*:?\s*([\d\s\u00a0]+,\d+)/i,
    );
    const effectiveFrom = this.extractString(
      html,
      /[ÚU]?[čc]innost[:\s]*([^<\n\r]*?\d{1,2}\.?\s*[^<\n\r]*?\d{4}[^<\n\r]*)/i,
    );

    return {
      benzin,
      nafta,
      effectiveFrom: effectiveFrom ? this.clean(effectiveFrom) : null,
      fetchedAt: new Date().toISOString(),
    };
  }

  private extractNumber(html: string, re: RegExp): number | null {
    const m = html.match(re);
    if (!m) return null;
    const normalized = m[1].replace(/[\s\u00a0]/g, '').replace(',', '.');
    const val = parseFloat(normalized);
    return Number.isFinite(val) ? val : null;
  }

  private extractString(html: string, re: RegExp): string | null {
    const m = html.match(re);
    return m ? m[1] : null;
  }

  private clean(s: string): string {
    return s.replace(/\s+/g, ' ').replace(/&nbsp;/g, ' ').trim();
  }
}
