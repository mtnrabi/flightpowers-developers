/**
 * "Cheapest day to fly": the pure half of the /tools/cheapest-day tool and
 * the widget on every /flights/<route> page. Isomorphic and dependency-free,
 * so the server route, the client component and the node tests share it.
 *
 * One run = ONE request to the cheapest-dates endpoint
 * (POST /v1/flights/cheapest-dates on api.flightpowers.com), which returns
 * Google Flights' calendar estimate, the lowest fare Google shows, for every
 * departure date of the month. The tool says so on the page: these are
 * calendar estimates, not a full search of each date.
 */

/** Trip lengths the form offers. 0 = one-way. The endpoint itself takes 1 to 30 nights. */
export const NIGHT_OPTIONS = [0, 3, 5, 7, 10, 14] as const;

/** How far ahead a month may start, in days. Same horizon as the other demo tools. */
export const MAX_DAYS_AHEAD = 320;

export type CheapestDayQuery = {
  from: string;
  to: string;
  /** YYYY-MM */
  month: string;
  /** 0 = one-way, otherwise a round trip of this many nights. */
  nights: number;
};

export type CheapestDateRow = { departure_date: string; return_date?: string | null; price: number | null };

export type CheapestDatesAnswer = {
  from_airport: string;
  to_airport: string;
  trip_type: string;
  nights: number | null;
  currency: string;
  fetched_at: string;
  dates_searched: number;
  dates_with_price: number;
  cheapest: CheapestDateRow | null;
  dates: CheapestDateRow[];
};

const IATA = /^[A-Z]{3}$/;
const MONTH = /^(\d{4})-(\d{2})$/;

/** Validate and normalise visitor input. Nothing is spent here. */
export function checkCheapestDay(
  input: Partial<Record<keyof CheapestDayQuery, unknown>>,
  now: Date = new Date()
): { ok: true; query: CheapestDayQuery } | { ok: false; message: string } {
  const from = typeof input.from === 'string' ? input.from.trim().toUpperCase() : '';
  const to = typeof input.to === 'string' ? input.to.trim().toUpperCase() : '';
  if (!IATA.test(from) || !IATA.test(to)) return { ok: false, message: 'Airports must be 3-letter IATA codes (like JFK or LAX).' };
  if (from === to) return { ok: false, message: 'Origin and destination are the same airport.' };

  const month = typeof input.month === 'string' ? input.month.trim() : '';
  const m = MONTH.exec(month);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return { ok: false, message: 'Month must look like 2027-01.' };
  const year = Number(m[1]);
  const mon = Number(m[2]);
  const thisMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();
  if (year * 12 + (mon - 1) < thisMonth) return { ok: false, message: 'That month is in the past.' };
  const firstDay = Date.UTC(year, mon - 1, 1);
  if ((firstDay - now.getTime()) / 86_400_000 > MAX_DAYS_AHEAD) {
    return { ok: false, message: `That month is too far out (Google's calendar reaches about ${MAX_DAYS_AHEAD} days ahead).` };
  }

  const nights = Number(input.nights ?? 0);
  if (!Number.isInteger(nights) || nights < 0 || nights > 30) return { ok: false, message: 'Trip length must be one-way or 1 to 30 nights.' };

  return { ok: true, query: { from, to, month, nights } };
}

/** The request body for POST /v1/flights/cheapest-dates (and the RapidAPI path). */
export function cheapestDatesBody(q: CheapestDayQuery): Record<string, string | number> {
  const body: Record<string, string | number> = { from_airport: q.from, to_airport: q.to, month: q.month };
  if (q.nights > 0) body.nights = q.nights;
  body.currency = 'USD';
  return body;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y!, m!, 0)).getUTCDate();
}

export function monthLabel(month: string): string {
  return new Date(Date.parse(`${month}-01T00:00:00Z`)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function tripLabel(nights: number): string {
  return nights > 0 ? `round trip, ${nights} night${nights === 1 ? '' : 's'}` : 'one-way';
}

/** The next month (YYYY-MM) after `now`, the form's default. */
export function nextMonth(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export type CalendarCell =
  | { kind: 'pad' }
  | {
      kind: 'day';
      date: string;
      day: number;
      price: number | null;
      returnDate: string | null;
      /** 0 = the month's cheapest, 1 = its most expensive; null when unpriced. */
      heat: number | null;
      cheapest: boolean;
      /** True when the answer carried no row for this date (a past day, or outside what Google returned). */
      missing: boolean;
    };

/**
 * Lay the answer out as a Monday-first month calendar: leading pads, one
 * cell per day of the month, trailing pads to a full week. Every day of the
 * month gets a cell; a day the answer did not cover is `missing`, a day
 * Google shows no fare for is priced null. Heat is relative to this month only.
 */
export function calendarCells(month: string, rows: CheapestDateRow[]): CalendarCell[] {
  const byDate = new Map(rows.map((r) => [r.departure_date, r]));
  const prices = rows.map((r) => r.price).filter((p): p is number => typeof p === 'number');
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const span = max - min || 1;
  const [y, m] = month.split('-').map(Number);
  const firstWeekday = (new Date(Date.UTC(y!, m! - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const cells: CalendarCell[] = Array.from({ length: firstWeekday }, () => ({ kind: 'pad' as const }));
  const n = daysInMonth(month);
  for (let d = 1; d <= n; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const row = byDate.get(date);
    const price = typeof row?.price === 'number' ? row.price : null;
    cells.push({
      kind: 'day',
      date,
      day: d,
      price,
      returnDate: row?.return_date ?? null,
      heat: price == null ? null : prices.length > 1 ? (price - min) / span : 0,
      cheapest: price != null && price === min,
      missing: !row,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: 'pad' });
  return cells;
}

/** The lowest priced row; the earliest date wins a tie. */
export function cheapestRow(rows: CheapestDateRow[]): CheapestDateRow | null {
  let best: CheapestDateRow | null = null;
  for (const r of rows) {
    if (typeof r.price !== 'number') continue;
    if (!best || r.price < (best.price as number)) best = r;
  }
  return best;
}

/**
 * Google Flights' own results page for one date, so the visitor can see the
 * full flight list behind a calendar estimate. Uses Google's documented `q`
 * natural-language form.
 */
export function googleFlightsUrl(from: string, to: string, date: string, returnDate?: string | null): string {
  const q = returnDate
    ? `Flights from ${from} to ${to} on ${date} through ${returnDate}`
    : `One way flights from ${from} to ${to} on ${date}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&curr=USD`;
}

/** The sentence a visitor pastes into Claude, Cursor or ChatGPT with the flights connector. */
export function mcpPrompt(q: CheapestDayQuery): string {
  const trip = q.nights > 0 ? `a ${q.nights}-night round trip` : 'a one-way flight';
  return `Find the cheapest day in ${monthLabel(q.month)} for ${trip} from ${q.from} to ${q.to}, and tell me how Google rates that price.`;
}

/** Whole-dollar display; the endpoint sends floats like 313.0. */
export function usd(price: number): string {
  return `$${Math.round(price).toLocaleString('en-US')}`;
}
