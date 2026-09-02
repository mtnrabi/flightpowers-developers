/**
 * The verified differentiators — the only feature claims allowed to carry
 * weight in copy. Every one is traceable to code or to the live listing.
 * Pages render from this list so the story is identical everywhere.
 */

export type Differentiator = {
  id: string;
  title: string;
  short: string;
  /** where a visitor can see it proven */
  provenBy: { label: string; href: string };
};

export const DIFFERENTIATORS: Differentiator[] = [
  {
    id: 'price-insights',
    title: "Google's own price band, plus a verdict",
    short:
      'Every fare carries price_insights_low / price_insights_high (Google\'s historical band for the route and dates) and a low | typical | high verdict. You can tell a user "$112 is a good price," not just "$112."',
    provenBy: { label: 'Price Insights API', href: '/flights-api/price-insights' },
  },
  {
    id: 'paired-round-trip',
    title: 'Round-trip as one paired itinerary',
    short:
      'A real /roundtrip endpoint: one object per itinerary with total_price, total_duration_seconds and both legs already paired, not two one-way searches stapled together.',
    provenBy: { label: 'Round-Trip API', href: '/flights-api/round-trip' },
  },
  {
    id: 'search-status',
    title: '"No flights" and "the search failed" are different answers',
    short:
      'X-Search-Status separates a genuine empty result from a degraded search. An empty array is only ever reported when the page it came from positively said so. Opt-in strict mode turns a degraded search into an HTTP 503.',
    provenBy: { label: 'Search Status', href: '/flights-api/search-status' },
  },
  {
    id: 'buy-link',
    title: 'A working buy_link on every result',
    short:
      'Every itinerary ships with a deep link straight into Google Flights for that exact flight. Metasearch and agent handoff without reconstructing the booking URL.',
    provenBy: { label: 'One-Way API', href: '/flights-api/one-way' },
  },
  {
    id: 'parallel-scans',
    title: 'Rate limits sized for parallel date scans',
    short:
      '150 requests/minute on Pro, 250 on Ultra, 500 on Mega. A flexible-date search (31 dates × 3 durations) finishes in one burst instead of a slow serial loop.',
    provenBy: { label: 'Parallel Date Scans', href: '/flights-api/parallel-date-scan' },
  },
  {
    id: 'proxy-country',
    title: 'Per-country hotel pricing with proxy_country',
    short:
      'Every hotels endpoint accepts a two-letter proxy_country that routes through a residential proxy in that market. The same room, checked as a resident of Germany or Japan would see it, sampled a few times per market so a real gap is distinguishable from movement. Rate-parity monitoring from a single API.',
    provenBy: { label: 'Geo-Pricing API', href: '/hotels-api/geo-pricing' },
  },
];
