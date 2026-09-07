/**
 * Plan data parsed from the live RapidAPI listing payloads. Re-verified
 * against the live listings on 2026-09-07 by `npm run check-pricing`: no
 * drift, so no figure below changed. Originally parsed 2026-08-26
 * (the `billingplan_` objects in the anonymous page HTML, filtered to
 * visibility === "PUBLIC" — the payload also contains private plans which
 * must NEVER render).
 *
 * Nothing here is estimated. If a figure is not on the listing it is not here.
 * Re-read the listings before changing any number, and update READ_ON.
 * scripts/check-pricing.mjs re-parses the live listings and fails the build
 * loudly on drift or on any non-public plan reaching this file.
 */
export const READ_ON = '2026-09-07';

export type Plan = {
  name: string;
  priceMonthly: number; // USD
  quota: number; // requests / month
  /** null = hard cap, no overage purchasable */
  overagePerRequest: number | null;
  /** requests per minute; null = not set on the listing */
  ratePerMinute: number | null;
  hardLimit: boolean;
  recommended?: boolean;
};

export const FLIGHT_PLANS: Plan[] = [
  { name: 'BASIC', priceMonthly: 0, quota: 10, overagePerRequest: null, ratePerMinute: null, hardLimit: true },
  { name: 'PRO', priceMonthly: 10, quota: 2500, overagePerRequest: 0.003, ratePerMinute: 150, hardLimit: false },
  { name: 'ULTRA', priceMonthly: 25, quota: 10000, overagePerRequest: 0.003, ratePerMinute: 250, hardLimit: false, recommended: true },
  { name: 'MEGA', priceMonthly: 50, quota: 50000, overagePerRequest: 0.001, ratePerMinute: 500, hardLimit: false },
];

export const HOTEL_PLANS: Plan[] = [
  { name: 'BASIC', priceMonthly: 0, quota: 10, overagePerRequest: null, ratePerMinute: null, hardLimit: true },
  { name: 'PRO', priceMonthly: 10, quota: 2000, overagePerRequest: 0.006, ratePerMinute: 25, hardLimit: false },
  { name: 'ULTRA', priceMonthly: 20, quota: 6500, overagePerRequest: 0.003, ratePerMinute: 25, hardLimit: false },
  { name: 'MEGA', priceMonthly: 50, quota: 25000, overagePerRequest: 0.002, ratePerMinute: 50, hardLimit: false },
];

/** "$ per 1k requests" — the number a developer actually compares on. */
export function perThousand(plan: Plan): string {
  if (plan.priceMonthly === 0) return '—';
  return `$${((plan.priceMonthly / plan.quota) * 1000).toFixed(2)}`;
}

export function fmtQuota(plan: Plan): string {
  return `${plan.quota.toLocaleString('en-US')} / mo`;
}

export function fmtOverage(plan: Plan): string {
  if (plan.overagePerRequest === null) return plan.hardLimit ? 'hard cap' : '—';
  return `$${plan.overagePerRequest} / req`;
}

export function fmtRate(plan: Plan): string {
  return plan.ratePerMinute === null ? '—' : `${plan.ratePerMinute} / min`;
}

/**
 * Apify actors — pay-per-event pricing. Both figures parsed from the actors'
 * own live listing payloads on 2026-09-07: hotels `hotel_search` is
 * $0.0037 per lookup ($3.70 per 1,000) and flights `flight_search` is
 * $0.00185 per lookup ($1.85 per 1,000). Apify's auto-computed
 * "$0.01/1,000 results" badge badly understates real cost and must never be
 * quoted.
 *
 * Known future change, from the same payload: the flights actor has a
 * `futurePricing` entry raising `flight_search` to $0.003 per lookup
 * ($3.00 per 1,000) from 2026-09-19. Re-read before quoting after that date.
 */
export const APIFY = {
  read_on: '2026-09-07',
  hotelsPer1kSearches: '$3.70 per 1,000 hotel lookups',
  hotelsSearchEvent: '$0.0037 per lookup',
  hotelsResultEvent: '$0.00001 per result',
  hotelsStartEvent: '$0.00005 per run',
  flightsPer1kSearches: '$1.85 per 1,000 flight lookups',
  flightsSearchEvent: '$0.00185 per lookup',
  flightsResultEvent: '$0.00001 per result',
  flightsStartEvent: '$0.00005 per run',
} as const;
