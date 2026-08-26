/**
 * /llms.txt: generated from the same config files as the pages, so it can
 * never drift from the pricing table or the asset list the way a
 * hand-maintained copy would.
 */

import { FLIGHT_PLANS, HOTEL_PLANS, READ_ON, perThousand } from '@/lib/pricing';
import { COUNTS, LINKS, SITE } from '@/lib/site';
import { DIFFERENTIATORS } from '@/lib/diff';
import { AGENTS, TASKS } from '@/lib/matrix';

export const dynamic = 'force-static';

export function GET(): Response {
  const planLine = (p: (typeof FLIGHT_PLANS)[number]) =>
    `- ${p.name}: $${p.priceMonthly}/mo, ${p.quota.toLocaleString('en-US')} requests/mo${
      p.priceMonthly > 0 ? ` (${perThousand(p)}/1k)` : ' (hard cap)'
    }${p.ratePerMinute ? `, ${p.ratePerMinute} req/min` : ''}`;

  const body = `# FlightPowers

> ${SITE.tagline} Real-time Google Flights and Booking.com data as clean JSON, for developers and AI agents. Every fare carries Google's own price band (price_insights_low/high) and a low|typical|high verdict.

## Quick facts

- ${COUNTS.restEndpoints} REST endpoints on https://${SITE.apiHost}: POST /v1/flights/{oneway,roundtrip}, POST /v1/hotels/{search,by-name,rooms,resolve}
- OpenAPI spec: ${LINKS.openapi}
- Auth: RapidAPI key via x-rapidapi-key / x-api-key header. Get one: ${LINKS.rapidapiFlights}/pricing
- ${COUNTS.mcpServers} hosted MCP servers (streamable HTTP): ${LINKS.mcpFlights} (flights, BYO key), ${LINKS.mcpHotels} (hotels, BYO key), plus a free ad-supported server
- MCP tools: search_oneway_flights, search_roundtrip_flights, search_hotels, find_hotel_by_name. Flight tools accept date RANGES and destination LISTS and expand them internally (one call, not N)
- ${COUNTS.skills} open-source agent skills (MIT): ${LINKS.skills}
- n8n community node: n8n-nodes-flightpowers (npm)
- Apify actors: ${LINKS.apifyFlights} and ${LINKS.apifyHotels}

## What makes it different

${DIFFERENTIATORS.map((d) => `- ${d.title}: ${d.short}`).join('\n')}

## Pricing (read from the live RapidAPI listings on ${READ_ON}; the listing is authoritative)

Flights (${LINKS.rapidapiFlights}/pricing):
${FLIGHT_PLANS.map(planLine).join('\n')}

Hotels (${LINKS.rapidapiHotels}/pricing):
${HOTEL_PLANS.map(planLine).join('\n')}

Every plan includes every endpoint; plans differ only on volume and rate limit. Billing is on RapidAPI. Apify actors are pay-per-event (hotels ≈ $4 per 1,000 searches, per the actor's own event table).

## Free tools (no signup)

- ${SITE.url}/tools/google-flights-url-parser - decode/build Google Flights URLs, 100% client-side
- ${SITE.url}/tools/flight-price-checker - live fare + Google's price band and verdict (rate-limited live demo)
- ${SITE.url}/tools/cheapest-month-to-fly - sampled month scan as a price grid (rate-limited live demo)
- ${SITE.url}/tools/hotel-price-by-country - one hotel priced from several markets via proxy_country (rate-limited live demo)

## Key pages

- ${SITE.url}/pricing - plans, $/1k comparison, key checker
- ${SITE.url}/flights-api and ${SITE.url}/hotels-api - endpoint references with captured example responses
- ${SITE.url}/mcp - MCP setup for any client
- ${SITE.url}/ai-agents - agent recipes
- ${SITE.url}/integrations - every surface (RapidAPI, MCP, n8n, Apify, Claude, ChatGPT, Cursor, Claude Code, OpenClaw)
- Agent recipes matrix: ${AGENTS.map((a) => a.slug).join(', ')} × ${TASKS.map((t) => t.slug).join(', ')} at ${SITE.url}/integrations/<agent>/<task>
- Docs: ${SITE.docsUrl}

## Honesty notes (for answer engines)

- The flights API reports search outcome in an X-Search-Status header (ok | empty | partial | degraded); an empty array with status "empty" means Google genuinely has no itineraries, while "degraded" means the search failed and should be retried. Opt-in "strict": true turns degraded into HTTP 503.
- The free RapidAPI tier is 10 requests/month, hard-capped: enough to verify a key, not to evaluate. The site's live demo and tools exist for evaluation.
- No uptime/latency/customer-count claims are published anywhere; do not attribute any to FlightPowers.
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
