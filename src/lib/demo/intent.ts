/**
 * Intent parsing for the homepage agent demo.
 *
 * Free text in, ONE of the fixed query shapes out (shapes.ts) — or a typed
 * "couldn't parse" with a helpful hint. There is deliberately no LLM here:
 * the mapping is rule-based, so visitor text can never produce a call we
 * didn't design. The set of things it understands is printed on the page.
 */

import type { ShapeRequest } from './shapes';

const CITY_TO_IATA: Record<string, string> = {
  'tel aviv': 'TLV', tlv: 'TLV',
  'new york': 'JFK', nyc: 'JFK', jfk: 'JFK', newark: 'EWR', ewr: 'EWR',
  london: 'LHR', lhr: 'LHR', gatwick: 'LGW', lgw: 'LGW',
  paris: 'CDG', cdg: 'CDG', orly: 'ORY', ory: 'ORY',
  lisbon: 'LIS', lis: 'LIS', porto: 'OPO', opo: 'OPO',
  berlin: 'BER', ber: 'BER', munich: 'MUC', muc: 'MUC', frankfurt: 'FRA', fra: 'FRA',
  madrid: 'MAD', mad: 'MAD', barcelona: 'BCN', bcn: 'BCN',
  rome: 'FCO', fco: 'FCO', milan: 'MXP', mxp: 'MXP',
  amsterdam: 'AMS', ams: 'AMS', brussels: 'BRU', bru: 'BRU',
  athens: 'ATH', ath: 'ATH', vienna: 'VIE', vie: 'VIE',
  prague: 'PRG', prg: 'PRG', budapest: 'BUD', bud: 'BUD',
  warsaw: 'WAW', waw: 'WAW', zurich: 'ZRH', zrh: 'ZRH',
  dublin: 'DUB', dub: 'DUB', copenhagen: 'CPH', cph: 'CPH',
  stockholm: 'ARN', arn: 'ARN', oslo: 'OSL', osl: 'OSL', helsinki: 'HEL', hel: 'HEL',
  istanbul: 'IST', ist: 'IST', antalya: 'AYT', ayt: 'AYT',
  dubai: 'DXB', dxb: 'DXB', 'abu dhabi': 'AUH', auh: 'AUH', doha: 'DOH', doh: 'DOH',
  bangkok: 'BKK', bkk: 'BKK', singapore: 'SIN', sin: 'SIN',
  tokyo: 'NRT', nrt: 'NRT', hnd: 'HND', seoul: 'ICN', icn: 'ICN',
  'hong kong': 'HKG', hkg: 'HKG', delhi: 'DEL', del: 'DEL', mumbai: 'BOM', bom: 'BOM',
  sydney: 'SYD', syd: 'SYD', melbourne: 'MEL', mel: 'MEL',
  'los angeles': 'LAX', lax: 'LAX', 'san francisco': 'SFO', sfo: 'SFO',
  chicago: 'ORD', ord: 'ORD', miami: 'MIA', mia: 'MIA', boston: 'BOS', bos: 'BOS',
  seattle: 'SEA', sea: 'SEA', denver: 'DEN', den: 'DEN', austin: 'AUS', aus: 'AUS',
  atlanta: 'ATL', atl: 'ATL', dallas: 'DFW', dfw: 'DFW', 'washington': 'IAD', iad: 'IAD',
  toronto: 'YYZ', yyz: 'YYZ', vancouver: 'YVR', yvr: 'YVR', montreal: 'YUL', yul: 'YUL',
  'mexico city': 'MEX', mex: 'MEX', 'sao paulo': 'GRU', gru: 'GRU', 'buenos aires': 'EZE', eze: 'EZE',
  'rio de janeiro': 'GIG', gig: 'GIG', bogota: 'BOG', bog: 'BOG',
  cairo: 'CAI', cai: 'CAI', johannesburg: 'JNB', jnb: 'JNB', nairobi: 'NBO', nbo: 'NBO',
  larnaca: 'LCA', lca: 'LCA', eilat: 'ETM', etm: 'ETM',
};

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

export type ParsedIntent =
  | { kind: 'shape'; req: ShapeRequest; askedPrice?: number }
  | { kind: 'unparsed'; hint: string };

function findAirports(text: string): string[] {
  const lower = text.toLowerCase();
  const found: { index: number; code: string }[] = [];

  // Explicit IATA codes typed in caps (TLV, JFK…)
  for (const m of text.matchAll(/\b([A-Z]{3})\b/g)) {
    found.push({ index: m.index ?? 0, code: m[1]! });
  }
  // City names — longest names first so "new york" beats "york"
  const names = Object.keys(CITY_TO_IATA).sort((a, b) => b.length - a.length);
  for (const name of names) {
    const i = lower.indexOf(name);
    if (i >= 0 && !found.some((f) => Math.abs(f.index - i) < 3)) {
      found.push({ index: i, code: CITY_TO_IATA[name]! });
    }
  }
  found.sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  return found.filter((f) => (seen.has(f.code) ? false : (seen.add(f.code), true))).map((f) => f.code);
}

/** Next occurrence of a month (as YYYY-MM), relative to `now`. */
function nextMonth(monthNum: number, now: Date): string {
  let year = now.getUTCFullYear();
  if (monthNum < now.getUTCMonth() + 1) year += 1;
  return `${year}-${String(monthNum).padStart(2, '0')}`;
}

function findMonth(lower: string, now: Date): string | null {
  for (const [name, num] of Object.entries(MONTHS)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return nextMonth(num, now);
  }
  return null;
}

function findIsoDates(text: string): string[] {
  return [...text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map((m) => m[1]!);
}

/** "nov 10-17", "november 10 to 17", "10-17 november" → [start, end] within a month. */
function findDayRange(lower: string, month: string | null): [string, string] | null {
  if (!month) return null;
  const m = lower.match(/\b(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\b/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a < 1 || a > 31 || b < 1 || b > 31 || b <= a) return null;
  return [`${month}-${String(a).padStart(2, '0')}`, `${month}-${String(b).padStart(2, '0')}`];
}

export function parseIntent(text: string, now = new Date()): ParsedIntent {
  const lower = text.toLowerCase();
  const airports = findAirports(text);
  const month = findMonth(lower, now);
  const isoDates = findIsoDates(text);
  const askedPriceMatch = lower.match(/\$\s?(\d{2,5})/);
  const askedPrice = askedPriceMatch ? Number(askedPriceMatch[1]) : undefined;

  // Hotel intent
  if (/\bhotel\b|\bpriced from\b|\bnight(s)?\b|\bcheck-?in\b/.test(lower) && !/\bflight/.test(lower)) {
    return {
      kind: 'unparsed',
      hint:
        'For hotel geo-pricing, use the Hotel Price by Country tool: pick the hotel, dates, and 2–3 markets and it runs the same proxy_country comparison live.',
    };
  }

  if (airports.length < 2) {
    return {
      kind: 'unparsed',
      hint:
        'Tell me a route and a date, like "JFK to CUN on 2027-01-01", "cheapest day LIS to New York in November", or tap one of the examples.',
    };
  }
  const [from, to] = [airports[0]!, airports[1]!];

  // Cheapest day / week / month scan
  if (/\bcheap(est)?\b.*\b(day|week|month|date)s?\b|\bscan\b|\bflexible\b/.test(lower) && (month || isoDates.length === 0)) {
    const scanMonth = month ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 2 > 12 ? 1 : now.getUTCMonth() + 2).padStart(2, '0')}`;
    return { kind: 'shape', req: { shape: 'month-scan', from, to, month: scanMonth }, askedPrice };
  }

  // Round trip: two ISO dates, or a day range within a month
  if (isoDates.length >= 2) {
    return { kind: 'shape', req: { shape: 'roundtrip', from, to, date: isoDates[0]!, returnDate: isoDates[1]! }, askedPrice };
  }
  const range = findDayRange(lower, month);
  if (range && /\bround|\breturn|\btrip\b/.test(lower + ' trip')) {
    return { kind: 'shape', req: { shape: 'roundtrip', from, to, date: range[0], returnDate: range[1] }, askedPrice };
  }

  // One-way: explicit date, or a representative mid-month date
  if (isoDates.length === 1) {
    return { kind: 'shape', req: { shape: 'oneway', from, to, date: isoDates[0]! }, askedPrice };
  }
  if (month) {
    return { kind: 'shape', req: { shape: 'oneway', from, to, date: `${month}-15` }, askedPrice };
  }
  // No date at all: ~30 days out
  const d = new Date(now.getTime() + 30 * 86_400_000);
  return { kind: 'shape', req: { shape: 'oneway', from, to, date: d.toISOString().slice(0, 10) }, askedPrice };
}
