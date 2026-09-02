/**
 * The fixed set of query shapes the demo surfaces may execute.
 * Free text (the hero agent) and tool forms both compile down to one of
 * these — there is no path from visitor input to an arbitrary upstream call.
 *
 * Every shape declares its upstream cost so the budget layer can price it
 * before anything is spent.
 */

import 'server-only';
import { callUpstream } from './upstream';
import { cacheGet, cacheSet } from './budget';
import type { HotelByName, OnewayFlight, RoundtripItinerary, ScanDay, YearMonth } from '@/lib/fixtures';

const IATA = /^[A-Za-z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/**
 * Countries the geo-pricing demo may route through. Deliberately short: the
 * demo spends its budget on asking a few markets several times rather than on
 * asking many markets once, because one reading per market is not a
 * comparison. The API itself takes any two-letter code.
 */
const GEO_COUNTRIES = new Set(['de', 'jp', 'us', 'gb', 'il', 'br']);
const MAX_RESULTS = 5;
/**
 * How many times the geo demo asks each market the same question. One sample
 * per market is not a comparison: a market's own quote moves between identical
 * requests, so a single-sample delta can be pure noise. The demo pays for the
 * repeats by comparing two markets instead of many; the page says so.
 */
const GEO_SAMPLES_PER_MARKET = 3;
/** Two markets, sampled properly, beats several markets sampled once. */
const GEO_MAX_MARKETS = 2;
const MAX_DAYS_AHEAD = 320;
const SCAN_SAMPLE_DAYS = 10;

const TTL = {
  flight: 6 * 3600_000,
  hotel: 6 * 3600_000,
  scan: 24 * 3600_000,
} as const;

export type ShapeRequest =
  | { shape: 'oneway'; from: string; to: string; date: string }
  | { shape: 'roundtrip'; from: string; to: string; date: string; returnDate: string }
  | { shape: 'month-scan'; from: string; to: string; month: string /* YYYY-MM */ }
  | { shape: 'year-scan'; from: string; to: string }
  | { shape: 'hotel-geo'; hotel: string; area?: string; checkin: string; checkout: string; countries: string[] };

export type ShapeError = { valid: false; message: string };
export type ShapeOk = { valid: true; req: ShapeRequest; cost: number; cacheKey: string };

function daysFromNow(date: string): number {
  return Math.round((Date.parse(date) - Date.now()) / 86_400_000);
}

function validDate(date: string, label: string): string | null {
  if (!DATE.test(date) || Number.isNaN(Date.parse(date))) return `${label} must be a real date in YYYY-MM-DD form.`;
  const d = daysFromNow(date);
  if (d < 0) return `${label} is in the past. Live fares only exist for future dates.`;
  if (d > MAX_DAYS_AHEAD) return `${label} is too far out for the demo (max ~${MAX_DAYS_AHEAD} days ahead).`;
  return null;
}

/**
 * The mid-month departure dates a year scan samples: the 15th of each coming
 * month that is at least a day away and inside the demo horizon. Usually 10
 * or 11 dates. Used by checkShape to price the scan and by runShape to run
 * it, so the budget is charged for exactly the searches that happen.
 */
export function yearScanDates(): { month: string; date: string }[] {
  const now = new Date();
  const out: { month: string; date: string }[] = [];
  for (let offset = 0; offset <= 12 && out.length < 12; offset++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 15));
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const date = `${month}-15`;
    const ahead = daysFromNow(date);
    if (ahead >= 1 && ahead <= MAX_DAYS_AHEAD) out.push({ month, date });
  }
  return out;
}

/** Validate + normalize + price a shape request. Nothing is spent here. */
export function checkShape(input: ShapeRequest): ShapeOk | ShapeError {
  switch (input.shape) {
    case 'oneway':
    case 'roundtrip': {
      const from = input.from?.toUpperCase?.() ?? '';
      const to = input.to?.toUpperCase?.() ?? '';
      if (!IATA.test(from) || !IATA.test(to)) return { valid: false, message: 'Airports must be 3-letter IATA codes (like JFK or LHR).' };
      if (from === to) return { valid: false, message: 'Origin and destination are the same airport.' };
      const dateErr = validDate(input.date, 'Departure date');
      if (dateErr) return { valid: false, message: dateErr };
      if (input.shape === 'roundtrip') {
        const retErr = validDate(input.returnDate, 'Return date');
        if (retErr) return { valid: false, message: retErr };
        if (Date.parse(input.returnDate) <= Date.parse(input.date)) {
          return { valid: false, message: 'The return date must be after the departure date.' };
        }
        const req: ShapeRequest = { shape: 'roundtrip', from, to, date: input.date, returnDate: input.returnDate };
        return { valid: true, req, cost: 1, cacheKey: JSON.stringify(req) };
      }
      const req: ShapeRequest = { shape: 'oneway', from, to, date: input.date };
      return { valid: true, req, cost: 1, cacheKey: JSON.stringify(req) };
    }
    case 'month-scan': {
      const from = input.from?.toUpperCase?.() ?? '';
      const to = input.to?.toUpperCase?.() ?? '';
      if (!IATA.test(from) || !IATA.test(to)) return { valid: false, message: 'Airports must be 3-letter IATA codes (like LIS or JFK).' };
      if (from === to) return { valid: false, message: 'Origin and destination are the same airport.' };
      if (!/^\d{4}-\d{2}$/.test(input.month)) return { valid: false, message: 'Month must look like 2026-11.' };
      const first = `${input.month}-01`;
      if (Number.isNaN(Date.parse(first))) return { valid: false, message: 'That month does not exist.' };
      const monthEnd = new Date(Date.parse(first));
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      if (monthEnd.getTime() < Date.now()) return { valid: false, message: 'That month is in the past.' };
      if (daysFromNow(first) > MAX_DAYS_AHEAD) return { valid: false, message: `That month is too far out for the demo (max ~${MAX_DAYS_AHEAD} days ahead).` };
      const req: ShapeRequest = { shape: 'month-scan', from, to, month: input.month };
      return { valid: true, req, cost: SCAN_SAMPLE_DAYS, cacheKey: JSON.stringify(req) };
    }
    case 'year-scan': {
      const from = input.from?.toUpperCase?.() ?? '';
      const to = input.to?.toUpperCase?.() ?? '';
      if (!IATA.test(from) || !IATA.test(to)) return { valid: false, message: 'Airports must be 3-letter IATA codes (like LIS or JFK).' };
      if (from === to) return { valid: false, message: 'Origin and destination are the same airport.' };
      const months = yearScanDates();
      if (months.length === 0) return { valid: false, message: 'No scannable months inside the demo horizon right now.' };
      const req: ShapeRequest = { shape: 'year-scan', from, to };
      return { valid: true, req, cost: months.length, cacheKey: JSON.stringify(req) };
    }
    case 'hotel-geo': {
      const hotel = (input.hotel ?? '').trim();
      if (hotel.length < 3 || hotel.length > 80) return { valid: false, message: 'Give the hotel name as you would type it into Booking.com.' };
      const countries = [...new Set((input.countries ?? []).map((c) => c.toLowerCase()))]
        .filter((c) => GEO_COUNTRIES.has(c))
        .slice(0, GEO_MAX_MARKETS);
      if (countries.length !== GEO_MAX_MARKETS) {
        return { valid: false, message: `Pick ${GEO_MAX_MARKETS} markets from: ${[...GEO_COUNTRIES].join(', ')}.` };
      }
      const ciErr = validDate(input.checkin, 'Check-in');
      if (ciErr) return { valid: false, message: ciErr };
      const coErr = validDate(input.checkout, 'Check-out');
      if (coErr) return { valid: false, message: coErr };
      const nights = (Date.parse(input.checkout) - Date.parse(input.checkin)) / 86_400_000;
      if (nights < 1 || nights > 14) return { valid: false, message: 'Stays between 1 and 14 nights, please.' };
      const area = input.area?.trim().slice(0, 40) || undefined;
      const req: ShapeRequest = { shape: 'hotel-geo', hotel, area, checkin: input.checkin, checkout: input.checkout, countries };
      return { valid: true, req, cost: countries.length * GEO_SAMPLES_PER_MARKET, cacheKey: JSON.stringify(req) };
    }
    default:
      return { valid: false, message: 'Unknown query shape.' };
  }
}

export type ShapeResult =
  | { kind: 'oneway'; flights: OnewayFlight[]; headers: Record<string, string>; ms: number }
  | { kind: 'roundtrip'; itineraries: RoundtripItinerary[]; headers: Record<string, string>; ms: number }
  | { kind: 'month-scan'; days: ScanDay[]; sampledEvery: number; ms: number }
  | { kind: 'year-scan'; months: YearMonth[]; ms: number }
  | {
      kind: 'hotel-geo';
      /** `samples` is every request made for that market; `result` is the first one that answered. */
      markets: { country: string; result: HotelByName | null; samples: (HotelByName | null)[] }[];
      samplesPerMarket: number;
      ms: number;
    }
  | { kind: 'error'; error: 'timeout' | 'upstream_error' | 'not_configured'; ms: number };

/** Execute a validated shape. Returns cached results without spending. */
export async function runShape(ok: ShapeOk): Promise<{ result: ShapeResult; fromCache: boolean; actualCost: number }> {
  const cached = cacheGet<ShapeResult>(ok.cacheKey);
  if (cached) return { result: cached, fromCache: true, actualCost: 0 };

  const { req } = ok;
  let result: ShapeResult;
  let actualCost = ok.cost;

  if (req.shape === 'oneway') {
    const r = await callUpstream<OnewayFlight[]>(
      '/v1/flights/oneway',
      { from_airport: req.from, to_airport: req.to, departure_date: req.date, limit: MAX_RESULTS, currency: 'usd' },
      30_000
    );
    result = r.ok
      ? { kind: 'oneway', flights: r.data.slice(0, MAX_RESULTS), headers: r.searchHeaders, ms: r.ms }
      : { kind: 'error', error: r.error, ms: r.ms };
  } else if (req.shape === 'roundtrip') {
    const r = await callUpstream<RoundtripItinerary[]>(
      '/v1/flights/roundtrip',
      { from_airport: req.from, to_airport: req.to, departure_date: req.date, return_date: req.returnDate, limit: MAX_RESULTS, currency: 'usd' },
      45_000
    );
    result = r.ok
      ? { kind: 'roundtrip', itineraries: r.data.slice(0, MAX_RESULTS), headers: r.searchHeaders, ms: r.ms }
      : { kind: 'error', error: r.error, ms: r.ms };
  } else if (req.shape === 'month-scan') {
    // Sample the month every ~3 days instead of scanning all 30 —
    // the tool says so on the page. A full scan is what the API is for.
    const first = new Date(Date.parse(`${req.month}-01T00:00:00Z`));
    const daysInMonth = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate();
    const step = Math.ceil(daysInMonth / SCAN_SAMPLE_DAYS);
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d += step) {
      const date = `${req.month}-${String(d).padStart(2, '0')}`;
      if (daysFromNow(date) >= 0) dates.push(date);
    }
    const started = Date.now();
    const settled = await Promise.all(
      dates.map((date) =>
        callUpstream<OnewayFlight[]>(
          '/v1/flights/oneway',
          { from_airport: req.from, to_airport: req.to, departure_date: date, limit: MAX_RESULTS, currency: 'usd' },
          30_000
        ).then((r) => ({ date, r }))
      )
    );
    actualCost = dates.length;
    const days: ScanDay[] = settled.map(({ date, r }) => {
      if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) {
        const status = r.ok ? (r.searchHeaders['x-search-status'] ?? 'empty') : 'degraded';
        return { date, status, price: null, verdict: null, low: null, high: null, airline: null, stops: null, duration: null };
      }
      const best = r.data.reduce((a, b) => (a.price_as_number <= b.price_as_number ? a : b));
      return {
        date,
        status: r.searchHeaders['x-search-status'] ?? 'ok',
        price: best.price_as_number,
        verdict: best.price_range_in_relation_to_other_periods,
        low: best.price_insights_low,
        high: best.price_insights_high,
        airline: best.airline,
        stops: best.stops,
        duration: best.duration,
      };
    });
    result = { kind: 'month-scan', days, sampledEvery: step, ms: Date.now() - started };
  } else if (req.shape === 'year-scan') {
    // One real search per coming month, departing the 15th. The month-scan
    // answers "which day"; this answers "which month" and costs the same
    // order of upstream calls (~10), priced per sampled month.
    const monthDates = yearScanDates();
    const started = Date.now();
    const settled = await Promise.all(
      monthDates.map(({ month, date }) =>
        callUpstream<OnewayFlight[]>(
          '/v1/flights/oneway',
          { from_airport: req.from, to_airport: req.to, departure_date: date, limit: MAX_RESULTS, currency: 'usd' },
          30_000
        ).then((r) => ({ month, date, r }))
      )
    );
    actualCost = monthDates.length;
    const months: YearMonth[] = settled.map(({ month, date, r }) => {
      if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) {
        const status = r.ok ? (r.searchHeaders['x-search-status'] ?? 'empty') : 'degraded';
        return { month, date, status, price: null, verdict: null, low: null, high: null, airline: null, stops: null, duration: null, buy_link: null };
      }
      const best = r.data.reduce((a, b) => (a.price_as_number <= b.price_as_number ? a : b));
      return {
        month,
        date,
        status: r.searchHeaders['x-search-status'] ?? 'ok',
        price: best.price_as_number,
        verdict: best.price_range_in_relation_to_other_periods,
        low: best.price_insights_low,
        high: best.price_insights_high,
        airline: best.airline,
        stops: best.stops,
        duration: best.duration,
        buy_link: best.buy_link,
      };
    });
    result = { kind: 'year-scan', months, ms: Date.now() - started };
  } else {
    const started = Date.now();
    // Every market is asked the same question more than once, so the page can
    // show how much one market moves before it compares two of them.
    const calls = req.countries.flatMap((country) =>
      Array.from({ length: GEO_SAMPLES_PER_MARKET }, () =>
        callUpstream<HotelByName>(
          '/v1/hotels/by-name',
          {
            hotel_name: req.hotel,
            ...(req.area ? { area: req.area } : {}),
            checkin_date: req.checkin,
            checkout_date: req.checkout,
            currency: 'USD',
            proxy_country: country,
          },
          45_000
        ).then((r) => ({ country, r }))
      )
    );
    const settled = await Promise.all(calls);
    actualCost = calls.length;
    const markets = req.countries.map((country) => {
      const samples = settled.filter((s) => s.country === country).map(({ r }) => (r.ok ? r.data : null));
      return { country, result: samples.find((s) => s != null) ?? null, samples };
    });
    if (markets.every((m) => m.result === null)) {
      result = { kind: 'error', error: 'upstream_error', ms: Date.now() - started };
    } else {
      result = { kind: 'hotel-geo', markets, samplesPerMarket: GEO_SAMPLES_PER_MARKET, ms: Date.now() - started };
    }
  }

  if (result.kind !== 'error') {
    const ttl = req.shape === 'month-scan' || req.shape === 'year-scan' ? TTL.scan : req.shape === 'hotel-geo' ? TTL.hotel : TTL.flight;
    cacheSet(ok.cacheKey, result, ttl);
  }
  return { result, fromCache: false, actualCost };
}
