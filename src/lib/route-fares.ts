import fs from 'node:fs';
import path from 'node:path';

/**
 * The /flights/<from>-to-<to> pages: one route, its fetched one-way fares, and the request
 * that produced them (2026-11-11).
 *
 * Data: src/data/routes/routes.json (the curated list) and src/data/routes/fares/<slug>.json,
 * written by scripts/route-fares.mjs from real searches against our own flights API. Every
 * number a page prints is read from those files or counted from them here; nothing is
 * estimated. A date whose search failed or found nothing is shown as such, never filled in.
 *
 * Thin pages are not generated: a route needs MIN_PRICED_DATES priced dates to get a page.
 * Google declined ~100 of our template route pages in 2026-09 (GRID_NOINDEX in grid.ts);
 * these pages exist only because each carries a dated run of its own route.
 */

export const MIN_PRICED_DATES = 6;

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'routes');

export type RouteAirport = { iata: string; city: string; name: string; country: string };

export type Fare = {
  price: number;
  price_text: string | null;
  airline: string | null;
  stops: number | null;
  duration: string | null;
  departure_description: string | null;
  verdict: 'low' | 'typical' | 'high' | null;
  band_low: number | null;
  band_high: number | null;
  buy_link: string | null;
};

export type FarePoint = {
  date: string;
  status: 'ok' | 'empty' | 'failed';
  fare?: Fare;
  reason?: string;
  fetched_at: string;
  source: string;
};

export type PricedPoint = FarePoint & { fare: Fare };

export type MonthRow = { month: string; label: string; searched: number; priced: number; cheapest: PricedPoint | null };

export type RouteFares = {
  slug: string;
  from: RouteAirport;
  to: RouteAirport;
  currency: string;
  trip: string;
  points: FarePoint[];
  priced: PricedPoint[];
  cheapest: PricedPoint;
  months: MonthRow[];
  cheapestMonth: MonthRow;
  /** first and last fetch day (UTC, YYYY-MM-DD) */
  fetchedFirst: string;
  fetchedLast: string;
  verdictCounts: { low: number; typical: number; high: number; none: number };
};

type RoutesFile = {
  airports: Record<string, { city: string; name: string; country: string }>;
  origins: Record<string, string[]>;
};

let cache: RouteFares[] | null = null;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** "2026-12-16" -> "Dec 16, 2026" (UTC, no locale dependence) */
export function dayLabel(date: string, withYear = true): string {
  const [y, m, d] = date.split('-');
  return `${SHORT[Number(m) - 1]} ${Number(d)}${withYear ? `, ${y}` : ''}`;
}

export function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function slugFor(from: string, to: string): string {
  return `${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

function airport(file: RoutesFile, iata: string): RouteAirport {
  const a = file.airports[iata];
  if (!a) throw new Error(`routes.json: no airport ${iata}`);
  return { iata, ...a };
}

/** One route's file -> its page model, or null when it has too few priced dates for a page. */
export function summarise(file: RoutesFile, raw: { slug: string; from: string; to: string; currency: string; trip: string; points: FarePoint[] }): RouteFares | null {
  const points = [...raw.points].sort((a, b) => a.date.localeCompare(b.date));
  const priced = points.filter((p): p is PricedPoint => p.status === 'ok' && !!p.fare && Number.isFinite(p.fare.price) && p.fare.price > 0);
  if (priced.length < MIN_PRICED_DATES) return null;
  const cheapest = priced.reduce((a, b) => (b.fare.price < a.fare.price ? b : a));
  const byMonth = new Map<string, MonthRow>();
  for (const p of points) {
    const ym = p.date.slice(0, 7);
    const row = byMonth.get(ym) ?? { month: ym, label: monthLabel(ym), searched: 0, priced: 0, cheapest: null };
    row.searched++;
    if (p.status === 'ok' && p.fare) {
      row.priced++;
      if (!row.cheapest || p.fare.price < row.cheapest.fare.price) row.cheapest = p as PricedPoint;
    }
    byMonth.set(ym, row);
  }
  const months = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  const cheapestMonth = months.filter((m) => m.cheapest).reduce((a, b) => (b.cheapest!.fare.price < a.cheapest!.fare.price ? b : a));
  const fetched = points.map((p) => p.fetched_at.slice(0, 10)).sort();
  const verdictCounts = { low: 0, typical: 0, high: 0, none: 0 };
  for (const p of priced) verdictCounts[p.fare.verdict ?? 'none']++;
  return {
    slug: raw.slug,
    from: airport(file, raw.from),
    to: airport(file, raw.to),
    currency: raw.currency,
    trip: raw.trip,
    points,
    priced,
    cheapest,
    months,
    cheapestMonth,
    fetchedFirst: fetched[0]!,
    fetchedLast: fetched[fetched.length - 1]!,
    verdictCounts,
  };
}

/** Every route that has a page, in routes.json order. */
export function allRouteFares(): RouteFares[] {
  if (cache) return cache;
  const file = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'routes.json'), 'utf8')) as RoutesFile;
  const out: RouteFares[] = [];
  for (const [from, dests] of Object.entries(file.origins)) {
    for (const to of dests) {
      const f = path.join(DATA_DIR, 'fares', `${slugFor(from, to)}.json`);
      if (!fs.existsSync(f)) continue;
      const s = summarise(file, JSON.parse(fs.readFileSync(f, 'utf8')));
      if (s) out.push(s);
    }
  }
  cache = out;
  return out;
}

export function findRouteFares(slug: string): RouteFares | undefined {
  return allRouteFares().find((r) => r.slug === slug);
}

/** "New York to London" (codes added when one city name is used by both ends). */
export function routeName(r: Pick<RouteFares, 'from' | 'to'>): string {
  return `${r.from.city} to ${r.to.city}`;
}

export function routeFareTitle(r: Pick<RouteFares, 'from' | 'to'>): string {
  return `${routeName(r)} flights: cheapest dates (${r.from.iata}-${r.to.iata})`;
}

/** Fits Google's ~155-character snippet; every figure in it comes from the data. */
export function routeFareDescription(r: RouteFares): string {
  const d = `${r.from.iata} to ${r.to.iata} one-way: cheapest ${money(r.cheapest.fare.price)} on ${dayLabel(r.cheapest.date)}, fetched ${dayLabel(r.fetchedLast)}. ${r.points.length} departure dates charted, plus the API request.`;
  return d.length <= 155 ? d : `${r.from.iata} to ${r.to.iata} one-way: cheapest ${money(r.cheapest.fare.price)} on ${dayLabel(r.cheapest.date)}, fetched ${dayLabel(r.fetchedLast)}, with the API request.`;
}

/** Other route pages that share an airport with this one, nearest in the list first. */
export function relatedRouteFares(r: RouteFares, limit = 6): RouteFares[] {
  const all = allRouteFares();
  const back = all.find((o) => o.from.iata === r.to.iata && o.to.iata === r.from.iata);
  const rest = all.filter((o) => o !== r && o !== back && (o.from.iata === r.from.iata || o.to.iata === r.to.iata));
  return [...(back ? [back] : []), ...rest].slice(0, limit);
}

/** Titles for the share-card prerender (src/app/og/titles.ts). */
export function routeFareTitles(): string[] {
  return [...allRouteFares().map(routeFareTitle), ROUTE_INDEX_TITLE];
}

export const ROUTE_INDEX_TITLE = 'Flight prices by route: fetched fare charts';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** How the searched dates are spaced, read from the dates themselves: "one a week, every Wednesday". */
export function spacingText(r: Pick<RouteFares, 'points'>): { cadence: string; weekday: string | null } {
  const t = r.points.map((p) => Date.parse(`${p.date}T00:00:00Z`));
  const gaps = t.slice(1).map((x, i) => Math.round((x - t[i]!) / 864e5));
  const days = new Set(t.map((x) => new Date(x).getUTCDay()));
  const weekday = days.size === 1 ? DAYS[[...days][0]!]! : null;
  const cadence = gaps.every((g) => g === 7) ? 'one a week' : gaps.every((g) => g % 7 === 0) ? 'one every week or two' : 'spread over the season';
  return { cadence, weekday };
}

/**
 * The schema.org Dataset for a route page. Google Search Console flagged the route pages
 * (2026-11-12, "Missing field 'license'"), so every Dataset points at /data-license, the
 * page that states the terms for these fare tables. Every other field is read from the
 * route's own files: nothing here is a claim the page cannot back.
 */
export const DATA_LICENSE_PATH = '/data-license';

export function routeDatasetJsonLd(r: RouteFares, siteUrl: string): Record<string, unknown> {
  const first = r.points[0]!.date;
  const last = r.points[r.points.length - 1]!.date;
  const place = (a: RouteAirport) => ({ '@type': 'Place', name: `${a.name} (${a.iata}), ${a.city}, ${a.country}` });
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${routeName(r)} one-way fares by departure date (${r.from.iata}-${r.to.iata})`,
    description: `The cheapest one-way economy fare for one adult on each of ${r.points.length} departure dates from ${dayLabel(first)} to ${dayLabel(last)}, read from Google Flights through the FlightPowers flights API and fetched between ${dayLabel(r.fetchedFirst)} and ${dayLabel(r.fetchedLast)}, in US dollars.`,
    url: `${siteUrl}/flights/${r.slug}`,
    license: `${siteUrl}${DATA_LICENSE_PATH}`,
    isAccessibleForFree: true,
    temporalCoverage: `${first}/${last}`,
    spatialCoverage: [place(r.from), place(r.to)],
    dateModified: r.fetchedLast,
    creator: { '@type': 'Organization', name: 'FlightPowers', url: siteUrl },
    variableMeasured: ['departure date', 'one-way fare (USD)', 'airline', 'stops', 'Google price verdict'],
  };
}
