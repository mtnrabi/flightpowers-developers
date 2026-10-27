/**
 * "Read next" links for guides, use cases and blog posts that few other pages
 * link to (onsite crawl of 2026-10-26: 1-2 inbound pages each). One map, read
 * by the guide layout and the blog / use-case layouts through <RelatedLinks />.
 *
 * Rules for this map (scripts/related-links.test.mjs checks them):
 * - 3-4 links per page, chosen by topic, never a link to the page itself.
 * - Anchor = the target page's own title, its h1, or a plain description of
 *   it; no keyword-only anchors. No anchor text is used twice in the map, so
 *   a page's own title appears as an anchor at most once.
 * - Pages changed by site PRs #106-#108 and #116 are left out on both sides
 *   (no block on them, no links to them) until their post-merge reads on
 *   2026-11-02 and 2026-11-06; see HOLD_PATHS in the test.
 * - Every target must be a page that exists on this site.
 */
export type RelatedLink = { href: string; label: string };

export const RELATED: Record<string, RelatedLink[]> = {
  '/guides/google-flights-api-zapier': [
    { href: '/guides/google-flights-api-make', label: 'Using the Google Flights API in Make.com' },
    { href: '/guides/booking-api-zapier', label: 'The same Zapier setup for Booking.com hotel rates' },
    { href: '/use-cases/fare-alerts', label: 'Fare Alerts: flight price alerts without a price-history database' },
  ],
  '/guides/google-flights-api-make': [
    { href: '/guides/google-flights-api-zapier', label: 'Using Google Flights API in Zapier with HTTP Request' },
    { href: '/guides/booking-api-make', label: 'Using the Booking.com API in Make.com' },
    { href: '/use-cases/fare-calendars', label: 'Fare Calendars: price a whole month of dates in one burst' },
  ],
  '/guides/booking-api-make': [
    { href: '/guides/booking-api-zapier', label: 'Using the Booking.com hotel API in Zapier with HTTP Request' },
    { href: '/guides/scrape-booking-com-prices', label: 'How to scrape Booking.com prices with Python' },
    { href: '/guides/hotel-rates-api-benchmark-2026', label: 'Hotel rates API benchmark 2026: seven APIs, one hotel' },
  ],
  '/guides/booking-api-zapier': [
    { href: '/guides/google-flights-api-zapier', label: 'The same Zapier setup for live flight fares' },
    { href: '/guides/scrape-booking-com-prices', label: 'Scraping Booking.com prices yourself, with Python and Playwright' },
    {
      href: '/use-cases/rate-parity-monitoring',
      label: 'Rate-Parity Monitoring: see your hotel rates the way each market sees them',
    },
  ],
  '/guides/scrape-booking-com-prices': [
    { href: '/guides/booking-api-make', label: 'Pulling Booking.com rates into a scheduled Make scenario' },
    { href: '/guides/hotel-rates-api-benchmark-2026', label: 'Seven hotel price APIs tested on the same searches, three runs each' },
    { href: '/guides/hotel-prices-by-hotel-name-api', label: 'Hotel rates API: every room price for one hotel by name' },
    { href: '/guides/scrape-google-flights-puppeteer', label: 'How to scrape Google Flights with Puppeteer' },
  ],
  '/guides/scrape-google-flights-puppeteer': [
    { href: '/guides/google-flights-prices-python', label: 'How to get Google Flights prices with Python' },
    { href: '/guides/scrape-booking-com-prices', label: 'The Booking.com version: scraping hotel prices with Python' },
    {
      href: '/guides/amadeus-flight-offers-vs-google-flights',
      label: 'Amadeus Flight Offers Search vs an extraction API, for price trackers',
    },
  ],
  '/guides/google-flights-prices-python': [
    { href: '/guides/scrape-google-flights-puppeteer', label: 'Scraping Google Flights in Node with Puppeteer' },
    { href: '/guides/overpaying-for-flights', label: 'How to check if your company is overpaying for flights' },
    { href: '/blog/cheapest-month-to-fly-api', label: 'Cheapest month to fly API: scan a whole month in one parallel burst' },
  ],
  '/guides/google-flights-mcp-cline': [
    { href: '/blog/chatgpt-flight-api', label: 'ChatGPT flight API: connect live Google Flights data via MCP' },
    { href: '/use-cases/ai-travel-agents', label: 'AI Travel Agents: live flight & hotel data your agent can reason with' },
    { href: '/use-cases/trip-planning-bots', label: 'Trip-Planning Bots: flight answers a chatbot can stand behind' },
  ],
  '/blog/chatgpt-flight-api': [
    { href: '/guides/google-flights-mcp-cline', label: 'Using the Google Flights MCP in Cline' },
    { href: '/guides/google-flights-mcp-claude', label: 'Using the Google Flights MCP in Claude' },
    { href: '/use-cases/ai-travel-agents', label: 'What an AI travel agent needs from live flight and hotel data' },
  ],
  '/use-cases/ai-travel-agents': [
    { href: '/guides/google-flights-mcp-cline', label: 'Setting up the flights and hotels MCP servers in Cline' },
    { href: '/blog/chatgpt-flight-api', label: 'Connecting ChatGPT to live flight data through MCP' },
    { href: '/use-cases/fare-alerts', label: 'Price alerts backed by real-time data' },
  ],
  '/use-cases/trip-planning-bots': [
    { href: '/blog/chatgpt-flight-api', label: 'Live flight data inside ChatGPT, through an MCP connector' },
    { href: '/guides/google-flights-mcp-cline', label: 'Giving Cline live flight and hotel prices while it codes' },
    { href: '/use-cases/metasearch', label: 'Metasearch: live fares with a booking link on every result' },
  ],
  '/use-cases/metasearch': [
    { href: '/use-cases/fare-calendars', label: 'A month of fares in one burst' },
    {
      href: '/guides/amadeus-flight-offers-vs-google-flights',
      label: 'Amadeus offers or live Google Flights fares, compared for a price tracker',
    },
    { href: '/guides/roundtrip-flight-prices-one-request', label: 'How to get round-trip flight prices in one request' },
  ],
  '/use-cases/fare-alerts': [
    { href: '/guides/build-a-flight-price-alert', label: 'Build a fare alert with a cron, step by step' },
    {
      href: '/guides/amadeus-flight-offers-vs-google-flights',
      label: 'Amadeus flight offers or live Google Flights fares: which one for a price tracker',
    },
    {
      href: '/use-cases/market-analysis',
      label: 'Market Analysis: track fare movement with Google’s own baseline attached',
    },
    { href: '/guides/google-flights-api-zapier', label: 'A fare watch in Zapier with the HTTP Request action' },
  ],
  '/use-cases/fare-calendars': [
    { href: '/blog/cheapest-month-to-fly-api', label: 'Scanning a whole month of dates in one parallel burst' },
    { href: '/use-cases/metasearch', label: 'Metasearch with a bookable result on every row' },
    { href: '/guides/google-flights-api-make', label: 'A daily flight search scheduled in Make.com' },
  ],
  '/use-cases/market-analysis': [
    { href: '/guides/overpaying-for-flights', label: 'Checking whether your company is overpaying for flights' },
    { href: '/use-cases/fare-alerts', label: 'Price alerts that branch on Google’s price context' },
    {
      href: '/guides/amadeus-flight-offers-vs-google-flights',
      label: 'Which source a price tracker should read: Amadeus offers or Google Flights fares',
    },
  ],
  '/guides/amadeus-flight-offers-vs-google-flights': [
    { href: '/use-cases/fare-alerts', label: 'Flight price alerts without a price-history database' },
    { href: '/use-cases/market-analysis', label: 'Fare analysis with a baseline included' },
    { href: '/guides/overpaying-for-flights', label: 'Grading company flight bookings against Google’s usual price band' },
  ],
  '/guides/overpaying-for-flights': [
    { href: '/use-cases/market-analysis', label: 'Tracking fare movement with Google’s own baseline attached' },
    {
      href: '/guides/amadeus-flight-offers-vs-google-flights',
      label: 'What Amadeus Flight Offers returns next to a live Google Flights fare',
    },
    { href: '/blog/cheapest-month-to-fly-api', label: 'How a month-wide fare scan works, one request per date' },
  ],
  '/blog/cheapest-month-to-fly-api': [
    { href: '/use-cases/fare-calendars', label: 'Fare calendars and heatmaps built from one search per date' },
    { href: '/guides/google-flights-prices-python', label: 'Google Flights prices in Python with requests, no browser' },
    { href: '/blog/rebuilding-flightpowers-com', label: 'Rebuilding flightpowers.com' },
  ],
  '/blog/rebuilding-flightpowers-com': [
    { href: '/blog/chatgpt-flight-api', label: 'Connecting ChatGPT to live Google Flights data' },
    { href: '/blog/cheapest-month-to-fly-api', label: 'A month of flight dates as a price grid, in one parallel scan' },
    { href: '/use-cases/metasearch', label: 'Flight metasearch on live Google Flights data, with a buy link per result' },
  ],
};

/** The links for one path; trailing slash and query are ignored. */
export function relatedFor(pathname: string | null | undefined): RelatedLink[] {
  if (!pathname) return [];
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return RELATED[path] ?? [];
}
