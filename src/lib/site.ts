/**
 * Single source of truth for site-wide constants and outbound links.
 * Every URL here was verified against the agent asset register on 2026-08-25.
 */
export const SITE = {
  name: 'FlightPowers',
  tagline: 'Real-time flight and hotel pricing, as an API.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://developers.flightpowers.com',
  apiHost: 'api.flightpowers.com',
} as const;

export const LINKS = {
  rapidapiFlights: 'https://rapidapi.com/mtnrabi/api/google-flights-live-api',
  rapidapiHotels: 'https://rapidapi.com/mtnrabi/api/booking-live-api',
  apifyFlights: 'https://apify.com/mtnrabi/google-flights-real-time-api',
  apifyHotels: 'https://apify.com/mtnrabi/booking-real-time-api',
  mcpPaid: 'https://google-flights-mcp.flightpowers.com/mcp',
  smithery: 'https://smithery.ai/servers/mrabi/google-flights-mcp',
  npmNode: 'https://www.npmjs.com/package/n8n-nodes-flight-hotel-data',
  skills: 'https://github.com/mtnrabi/travel-agent-skills',
  product: 'https://flightpowers.com',
} as const;

/** Primary navigation. Only routes that actually exist belong here. */
export const NAV: { href: string; label: string }[] = [
  { href: '/flights-api', label: 'Flights API' },
  { href: '/hotels-api', label: 'Hotels API' },
  { href: '/changelog', label: 'Changelog' },
];
