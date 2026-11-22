/**
 * Rival list prices for the two pricing pages (/compare/serpapi-pricing and
 * /compare/hasdata-pricing). Every figure was read from the vendor's own
 * pricing page on READ; none is estimated. Re-read the page before changing a
 * number, and move READ with it.
 *
 * SerpApi: serpapi.com/pricing (plan cards + its FAQ).
 * HasData: hasdata.com/pricing (plan cards, the per-API table, and the
 * monthly / yearly figures the page's own billing toggle carries).
 */
export const RIVAL_PRICES_READ = '2026-11-22';

export const SERPAPI_PLANS = [
  { name: 'Free', price: 0, searches: 250, perHour: 50 },
  { name: 'Starter', price: 25, searches: 1000, perHour: 200 },
  { name: 'Developer', price: 75, searches: 5000, perHour: 1000 },
  { name: 'Production', price: 150, searches: 15000, perHour: 3000 },
  { name: 'Big Data', price: 275, searches: 30000, perHour: 6000 },
] as const;

/**
 * HasData bills credits; its pricing table lists the Google Flights API at
 * the request counts below (credits / requests = 15 a request). `monthly` is
 * the month-to-month price, `annualPerMonth` the per-month figure the page
 * shows with "Billed annually, 2 months free" switched on. Startup and Basic
 * month-to-month prices are in the page's billing toggle data (59 / 119);
 * Growth's is from its offer text, "Charged once at $2,490 for twelve months,
 * the price of ten", i.e. $249 a month. `annualPerK` is their table's own
 * "Price per 1 000 requests" for the Google Flights API, quoted as printed.
 */
export const HASDATA_PLANS = [
  { name: 'Free', monthly: 0, annualPerMonth: 0, credits: 1000, flightSearches: 67, annualPerK: '$0.00' },
  { name: 'Startup', monthly: 59, annualPerMonth: 49, credits: 200000, flightSearches: 13333, annualPerK: '$3.69' },
  { name: 'Basic', monthly: 119, annualPerMonth: 99, credits: 1000000, flightSearches: 66667, annualPerK: '$1.49' },
  { name: 'Growth', monthly: 249, annualPerMonth: 208, credits: 3000000, flightSearches: 200000, annualPerK: '$1.04' },
] as const;

export const usd = (n: number, digits = 2) => `$${n.toFixed(digits)}`;
export const perThousandUsd = (price: number, searches: number) => usd((price / searches) * 1000);
