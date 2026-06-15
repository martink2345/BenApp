import { BrandKey } from '../models/station.model';

export interface BrandInfo {
  key: BrandKey;
  label: string;
  color: string;
  aliases: string[];
  priority: boolean;
}

export const BRANDS: BrandInfo[] = [
  { key: 'omv',      label: 'OMV',       color: '#003366', aliases: ['omv', 'avanti'],            priority: true },
  { key: 'mol',      label: 'MOL',       color: '#8bcc73', aliases: ['mol', 'slovnaft'],          priority: true },
  { key: 'orlen',    label: 'ORLEN',     color: '#E2231A', aliases: ['orlen', 'benzina'],         priority: true },
  { key: 'shell',    label: 'Shell',     color: '#FFD500', aliases: ['shell'],                    priority: true },
  { key: 'ono',      label: 'ONO',       color: '#E7BF07', aliases: ['ono', 'tank ono'],          priority: true },
  { key: 'eurooil',  label: 'EuroOil',   color: '#0A2A75', aliases: ['eurooil', 'euro oil', 'cepro', 'čepro'], priority: true },
  { key: 'robinoil', label: 'RoBiN OIL', color: '#1C4C8C', aliases: ['robin'],                    priority: true },
  { key: 'globus',   label: 'Globus',    color: '#CD5700', aliases: ['globus'],                   priority: false },
  { key: 'prim',     label: 'PRIM',      color: '#4AB74B', aliases: ['prim'],                     priority: false },
  { key: 'papoil',   label: 'PAP OIL',   color: '#118AB2', aliases: ['pap oil', 'papoil'],        priority: false },
  { key: 'other',    label: 'Ostatní',   color: '#64748B', aliases: [],                           priority: false },
];

const OTHER = BRANDS[BRANDS.length - 1];

function aliasMatches(text: string, alias: string): boolean {
  if (!alias) return false;

  if (alias.length <= 3) {
    return new RegExp(`(^|[^a-z0-9])${alias}([^a-z0-9]|$)`, 'i').test(text);
  }
  return text.includes(alias);
}

export function resolveBrand(text: string): BrandInfo {
  const t = (text || '').toLowerCase();
  for (const b of BRANDS) {
    if (b.key === 'other') continue;
    if (b.aliases.some((a) => aliasMatches(t, a))) return b;
  }
  return OTHER;
}

export function brandByKey(key: BrandKey): BrandInfo {
  return BRANDS.find((b) => b.key === key) ?? OTHER;
}
