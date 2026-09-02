/**
 * Single source of truth for site-wide constants, counts, and outbound links.
 *
 * Every count and URL here was verified against live pages/registries on
 * 2026-08-26. SocialKit ships four different tool counts and Postiz four
 * different channel counts because their numbers live in many places.
 * Ours live here, once. If a number is not here, it does not appear in copy.
 */

export const SITE = {
  name: 'FlightPowers',
  tagline: 'Live flight and hotel prices, and the context to judge them.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flightpowers.com',
  apiHost: 'api.flightpowers.com',
  docsUrl: '/docs',
} as const;

/** Verified counts. One place. */
export const COUNTS = {
  restEndpoints: 6, // /v1/flights/{oneway,roundtrip} + /v1/hotels/{search,by-name,rooms,resolve}
  mcpServers: 3, // flights (paid), hotels (paid), free ad-supported
  skills: 8, // github.com/mtnrabi/travel-agent-skills
  hotelFilters: 24, // documented on the hotels listing
  freeTools: 8, // /tools: the demo search engine + the free MCP server + 6 live tools
  flightsRateLimits: '150 / 250 / 500', // req/min on Pro / Ultra / Mega
} as const;

/**
 * UTM builder — every outbound CTA to a marketplace goes through this.
 * Scheme: utm_source=flightpowers, utm_medium=<surface>, utm_campaign=<api>-<yyyy-mm>.
 * Attribution is scoped to OUR analytics only; we claim nothing about what
 * survives RapidAPI's login chain.
 */
export type UtmMedium =
  | 'nav'
  | 'hero'
  | 'pricing'
  | 'docs'
  | 'demo-upsell'
  | 'tool'
  | 'mcp'
  | 'blog'
  | 'guide'
  | 'compare'
  | 'use-case'
  | 'integration'
  | 'footer'
  | 'endpoint';

const CAMPAIGN_MONTH = '2026-09';

const RAPIDAPI = {
  flights: 'https://rapidapi.com/mtnrabi/api/google-flights-live-api',
  hotels: 'https://rapidapi.com/mtnrabi/api/booking-live-api',
} as const;

/** UTM-tagged deep link straight to the /pricing tab — the only real deep link RapidAPI has. */
export function rapidApiPricingUrl(api: 'flights' | 'hotels', medium: UtmMedium): string {
  return `${RAPIDAPI[api]}/pricing?utm_source=flightpowers&utm_medium=${medium}&utm_campaign=${api}-${CAMPAIGN_MONTH}`;
}

/** Bare listing link (for "view the listing" references, not CTAs). */
export function rapidApiListingUrl(api: 'flights' | 'hotels'): string {
  return RAPIDAPI[api];
}

/**
 * Live asset URLs. Corrected against the 2026-08-26 verification pass —
 * several older documents carry stale slugs; these are the canonical ones.
 */
export const LINKS = {
  rapidapiFlights: RAPIDAPI.flights,
  rapidapiHotels: RAPIDAPI.hotels,
  apifyFlights: 'https://apify.com/mtnrabi/google-flights-real-time-api',
  apifyHotels: 'https://apify.com/mtnrabi/booking-real-time-api',
  /** One-click console deep links (actor pre-added after signup). */
  apifyFlightsConsole:
    'https://console.apify.com/actors/EXLwgzF5PkaEgycwy?addFromActorId=EXLwgzF5PkaEgycwy',
  apifyHotelsConsole:
    'https://console.apify.com/actors/9f5eaHO7dNKuV4G2p?addFromActorId=9f5eaHO7dNKuV4G2p',
  /** Canonical MCP hosts (google-flights-mcp.flightpowers.com is an alias — never use it in copy). */
  mcpFlights: 'https://flights.flightpowers.com/mcp',
  mcpHotels: 'https://hotels.flightpowers.com/mcp',
  mcpFree: 'https://google-flights-lulu.flightpowers.com/mcp',
  smitheryFlights: 'https://smithery.ai/server/mrabi/google-flights',
  smitheryHotels: 'https://smithery.ai/server/mrabi/booking',
  smitheryFree: 'https://smithery.ai/server/mrabi/freemium-google-flights-and-booking-mcp',
  npmNode: 'https://www.npmjs.com/package/n8n-nodes-flightpowers',
  skills: 'https://github.com/mtnrabi/travel-agent-skills',
  clawhubFlights: 'https://clawhub.ai/mtnrabi/google-flights-realtime-api',
  clawhubHotels: 'https://clawhub.ai/mtnrabi/booking-hotel-search',
  /** The complete authored spec (servers, auth, request/response schemas). */
  openapi: 'https://flightpowers.com/openapi.json',
  apiDocs: 'https://api.flightpowers.com/docs',
  github: 'https://github.com/mtnrabi',
  demoProduct: 'https://demo.flightpowers.com',
} as const;

/** Top navigation — five items, everything else lives in the footer. */
export const NAV: { href: string; label: string; external?: boolean }[] = [
  { href: '/#apis', label: 'APIs' },
  { href: '/guides/ai-travel-agent', label: 'Build a Travel Agent' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/tools', label: 'Free Tools' },
  { href: '/pricing', label: 'Pricing' },
  { href: SITE.docsUrl, label: 'Docs' },
  { href: '/blog', label: 'Blog' },
];

/**
 * The surface strip — the breadth argument. Every label links to a real page
 * with a working setup (Zapier and Make document the HTTP-step path until
 * their native apps list).
 */
export const SURFACES: { label: string; href: string; external?: boolean }[] = [
  { label: 'RapidAPI', href: '/integrations/rapidapi' },
  { label: 'MCP', href: '/mcp' },
  { label: 'Claude', href: '/integrations/claude' },
  { label: 'ChatGPT', href: '/integrations/chatgpt' },
  { label: 'Cursor', href: '/integrations/cursor' },
  { label: 'n8n', href: '/integrations/n8n' },
  { label: 'Zapier', href: '/integrations/zapier' },
  { label: 'Make', href: '/integrations/make' },
  { label: 'LangChain', href: '/integrations/langchain' },
  { label: 'Apify', href: '/integrations/apify' },
  { label: 'npm', href: LINKS.npmNode, external: true },
  { label: 'GitHub', href: LINKS.skills, external: true },
];
