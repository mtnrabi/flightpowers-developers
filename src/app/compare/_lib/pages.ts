/**
 * Every page in the alternatives hub, in the order /compare lists them. The
 * index and the "Other alternatives" block on each page read this list, so a
 * new page is linked from all of its siblings the day it ships.
 *
 * `read` is the day the rival's own pages were last read for that page; it is
 * printed next to the card so a stale page is visible from the index.
 */
export type ComparePage = {
  href: string;
  /** Short card title. */
  title: string;
  /** One or two sentences, specific to the page, no adjectives. */
  sub: string;
  read: string;
  group: 'google-flights' | 'gated' | 'booking' | 'mcp' | 'rapidapi';
};

export const COMPARE_PAGES: ComparePage[] = [
  {
    href: '/guides/serpapi-google-flights-alternative',
    title: 'SerpApi alternative for Google Flights',
    sub: 'The move-a-workload guide: what changes in your code, one round trip instead of two calls, and when to stay on SerpApi.',
    read: '2026-10-06',
    group: 'google-flights',
  },
  {
    href: '/compare/serpapi',
    title: 'vs SerpApi, row by row',
    sub: 'Cost per search at every tier, the departure_token round trip, their MCP server, and the rows SerpApi wins: price history, multi-city, the legal shield.',
    read: '2026-10-06',
    group: 'google-flights',
  },
  {
    href: '/compare/searchapi',
    title: 'vs SearchApi',
    sub: 'Same $4 per 1,000 as our PRO, a $40 entry against $10, and a calendar endpoint that prices a date grid in one call, which our REST API does not have.',
    read: '2026-10-06',
    group: 'google-flights',
  },
  {
    href: '/compare/hasdata',
    title: 'vs HasData',
    sub: 'A Google Flights API and a hosted MCP server from a scraping vendor, 15 credits a search, a free tier of 66 searches a month against our 10.',
    read: '2026-10-06',
    group: 'google-flights',
  },
  {
    href: '/compare/flightapi-io',
    title: 'vs FlightAPI.io',
    sub: 'Fares from many sellers per itinerary at 2 credits a call, cheaper per search than our PRO at a $49 entry. Different data source, different job.',
    read: '2026-10-06',
    group: 'google-flights',
  },
  {
    href: '/compare/skyscanner',
    title: 'vs the Skyscanner API',
    sub: 'An application, a two-week review and a commission model, against a key that works today. What their partners get that we cannot give.',
    read: '2026-10-06',
    group: 'gated',
  },
  {
    href: '/compare/kiwi-tequila',
    title: 'vs Kiwi.com Tequila',
    sub: 'New Tequila partnerships are invitation only since May 2024. Kiwi does run a free flight-search MCP server; this page says when to use it instead.',
    read: '2026-10-06',
    group: 'gated',
  },
  {
    href: '/compare/amadeus',
    title: 'vs Amadeus Self-Service',
    sub: 'Self-Service closed on July 17, 2026; the sandbox host has no DNS record. What we replace, the parameter mapping, and what we do not replace.',
    read: '2026-10-06',
    group: 'gated',
  },
  {
    href: '/compare/duffel',
    title: 'vs Duffel',
    sub: 'A booking API against a data API: $3.00 per order and $0.005 per search past 1,500 per order, against $10 for 2,500 searches and no booking.',
    read: '2026-10-06',
    group: 'booking',
  },
  {
    href: '/compare/flight-mcp',
    title: 'vs flight-mcp.com',
    sub: 'They bill cache misses, not calls. Whether that saves you money depends on how often your queries repeat.',
    read: '2026-09-05',
    group: 'mcp',
  },
  {
    href: '/compare/datacrawler',
    title: 'vs DataCrawler on RapidAPI',
    sub: 'A 12-endpoint Google Flights listing with calendar grids and a 150-request free tier, against specialist unit prices.',
    read: '2026-09-01',
    group: 'rapidapi',
  },
  {
    href: '/compare/crawlio',
    title: 'vs Crawlio on RapidAPI',
    sub: 'A two-stage round trip (pick the outbound, then fetch priced returns) against one paired-leg request.',
    read: '2026-09-01',
    group: 'rapidapi',
  },
  {
    href: '/compare/scrapebadger',
    title: 'vs ScrapeBadger',
    sub: 'Pay-per-use credits that never expire against monthly plans. When an occasional batch job beats a subscription.',
    read: '2026-09-01',
    group: 'rapidapi',
  },
];

export const GROUPS: { id: ComparePage['group']; title: string; lede: string }[] = [
  {
    id: 'google-flights',
    title: 'Other Google Flights APIs',
    lede: 'Same source data as ours, so the comparison is price, request shape and the extras each one sells.',
  },
  {
    id: 'gated',
    title: 'APIs you have to be let into',
    lede: 'Skyscanner, Kiwi.com and Amadeus all put an application, an invitation or an enterprise contract in front of the data.',
  },
  {
    id: 'booking',
    title: 'Booking APIs',
    lede: 'They can issue a ticket and we cannot. The comparison is only useful if you do not need to.',
  },
  {
    id: 'mcp',
    title: 'Flight MCP servers',
    lede: 'For flight search inside Claude, Cursor or another MCP client.',
  },
  {
    id: 'rapidapi',
    title: 'Other listings on RapidAPI',
    lede: 'Same marketplace, same key, different products.',
  },
];
