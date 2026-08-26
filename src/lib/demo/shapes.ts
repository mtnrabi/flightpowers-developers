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
import type { HotelByName, OnewayFlight, RoundtripItinerary, ScanDay } from '@/lib/fixtures';

const IATA = /^[A-Za-z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Countries the geo-pricing demo may route through. */
const GEO_COUNTRIES = new Set(['us', 'de', 'il', 'gb', 'fr', 'br', 'in', 'jp', 'au', 'es', 'it', 'nl', 'tr']);
const MAX_RESULTS = 5;
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
    case 'hotel-geo': {
      const hotel = (input.hotel ?? '').trim();
      if (hotel.length < 3 || hotel.length > 80) return { valid: false, message: 'Give the hotel name as you would type it into Booking.com.' };
      const countries = [...new Set((input.countries ?? []).map((c) => c.toLowerCase()))].filter((c) => GEO_COUNTRIES.has(c)).slice(0, 3);
      if (countries.length < 2) return { valid: false, message: `Pick 2–3 markets from: ${[...GEO_COUNTRIES].join(', ')}.` };
      const ciErr = validDate(input.checkin, 'Check-in');
      if (ciErr) return { valid: false, message: ciErr };
      const coErr = validDate(input.checkout, 'Check-out');
      if (coErr) return { valid: false, message: coErr };
      const nights = (Date.parse(input.checkout) - Date.parse(input.checkin)) / 86_400_000;
      if (nights < 1 || nights > 14) return { valid: false, message: 'Stays between 1 and 14 nights, please.' };
      const area = input.area?.trim().slice(0, 40) || undefined;
      const req: ShapeRequest = { shape: 'hotel-geo', hotel, area, checkin: input.checkin, checkout: input.checkout, countries };
      return { valid: true, req, cost: countries.length, cacheKey: JSON.stringify(req) };
    }
    default:
      return { valid: false, message: 'Unknown query shape.' };
  }
}

export type ShapeResult =
  | { kind: 'oneway'; flights: OnewayFlight[]; headers: Record<string, string>; ms: number }
  | { kind: 'roundtrip'; itineraries: RoundtripItinerary[]; headers: Record<string, string>; ms: number }
  | { kind: 'month-scan'; days: ScanDay[]; sampledEvery: number; ms: number }
  | { kind: 'hotel-geo'; markets: { country: string; result: HotelByName | null }[]; ms: number }
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
  } else {
    const started = Date.now();
    const settled = await Promise.all(
      req.countries.map((country) =>
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
    const markets = settled.map(({ country, r }) => ({ country, result: r.ok ? r.data : null }));
    if (markets.every((m) => m.result === null)) {
      result = { kind: 'error', error: 'upstream_error', ms: Date.now() - started };
    } else {
      result = { kind: 'hotel-geo', markets, ms: Date.now() - started };
    }
  }

  if (result.kind !== 'error') {
    const ttl = req.shape === 'month-scan' ? TTL.scan : req.shape === 'hotel-geo' ? TTL.hotel : TTL.flight;
    cacheSet(ok.cacheKey, result, ttl);
  }
  return { result, fromCache: false, actualCost };
}
