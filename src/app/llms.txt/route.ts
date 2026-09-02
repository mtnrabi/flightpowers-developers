/**
 * /llms.txt: generated from the same config files as the pages, so it can
 * never drift from the pricing table or the asset list the way a
 * hand-maintained copy would.
 *
 * Format follows llmstxt.org: H1 + blockquote summary, then H2 sections of
 * `- [name](url): description` links, so answer engines can both quote the
 * summary and follow the links. /llms-full.txt carries the whole reference
 * inline for engines that fetch one file and stop.
 */

import { FLIGHT_PLANS, HOTEL_PLANS, READ_ON, perThousand } from '@/lib/pricing';
import { COUNTS, LINKS, SITE } from '@/lib/site';
import { DIFFERENTIATORS } from '@/lib/diff';
import { AGENTS, TASKS } from '@/lib/matrix';
import { LLMS_LAST_UPDATED } from '@/lib/llms';
import { CITIES, ROUTES, ROUTE_TOOLS } from '@/lib/grid';

export const dynamic = 'force-static';

export function GET(): Response {
  const planLine = (p: (typeof FLIGHT_PLANS)[number]) =>
    `- ${p.name}: $${p.priceMonthly}/mo, ${p.quota.toLocaleString('en-US')} requests/mo${
      p.priceMonthly > 0 ? ` (${perThousand(p)}/1k)` : ' (hard cap)'
    }${p.ratePerMinute ? `, ${p.ratePerMinute} req/min` : ''}`;

  const u = (path: string) => `${SITE.url}${path}`;

  const body = `# FlightPowers

> ${SITE.tagline} Real-time Google Flights and Booking.com data as clean JSON, for developers and AI agents. Every fare carries Google's own price band (price_insights_low/high) and a low|typical|high verdict.

Last-Updated: ${LLMS_LAST_UPDATED}

## Machine-readable surfaces

- [llms-full.txt](${u('/llms-full.txt')}): the complete API reference in one plain-text file (endpoints, every field, response headers, pricing)
- [OpenAPI 3.1 spec](${u('/openapi.json')}): full spec with request/response schemas and auth for all ${COUNTS.restEndpoints} REST endpoints on https://${SITE.apiHost}

## Quick facts

- ${COUNTS.restEndpoints} REST endpoints on https://${SITE.apiHost}: POST /v1/flights/{oneway,roundtrip}, POST /v1/hotels/{search,by-name,rooms,resolve}
- Auth: RapidAPI key via x-rapidapi-key / x-api-key header. Get one: ${LINKS.rapidapiFlights}/pricing
- ${COUNTS.mcpServers} hosted MCP servers (streamable HTTP): ${LINKS.mcpFlights} (flights, BYO key), ${LINKS.mcpHotels} (hotels, BYO key), and ${LINKS.mcpFree} (all four tools, no key and no signup, ad-supported)
- MCP tools: search_oneway_flights, search_roundtrip_flights, search_hotels, find_hotel_by_name. Flight tools accept date RANGES and destination LISTS and expand them internally (one call, not N)
- Official MCP registry entries: com.flightpowers/google-flights and com.flightpowers/booking
- ${COUNTS.skills} open-source agent skills (MIT): ${LINKS.skills}
- n8n community node: n8n-nodes-flightpowers (npm)
- Apify actors: ${LINKS.apifyFlights} and ${LINKS.apifyHotels}

## What makes it different

${DIFFERENTIATORS.map((d) => `- ${d.title}: ${d.short}`).join('\n')}

## Docs

- [Flights API reference](${u('/flights-api')}): POST /oneway and /roundtrip with captured example responses
- [One-way search](${u('/flights-api/one-way')}): the base endpoint, full filter set
- [Round-trip search](${u('/flights-api/round-trip')}): paired-leg itineraries priced together, not two stapled one-ways
- [Price insights](${u('/flights-api/price-insights')}): Google's historical band and the low|typical|high verdict
- [Search status](${u('/flights-api/search-status')}): X-Search-Status header semantics; how to tell "no flights" from "search failed"
- [Parallel date scans](${u('/flights-api/parallel-date-scan')}): scanning a month of dates inside the per-minute rate limit
- [Hotels API reference](${u('/hotels-api')}): search, by-name, rooms, resolve, with captured examples
- [Hotel geo-pricing](${u('/hotels-api/geo-pricing')}): proxy_country, the rate-parity primitive
- [MCP setup](${u('/mcp')}): connect Claude, ChatGPT, Cursor, or any MCP client
- [AI agent recipes](${u('/ai-agents')}): agent patterns on top of the API

## Guides

- [How to get real-time Google Flights data](${u('/guides/real-time-google-flights-data')}): endpoints, paste-and-run code, price-insight fields, parallel month scans
- [Google Flights API in 2026: what actually exists](${u('/guides/google-flights-api')}): what happened to Google's official API and the real options today
- [Handling empty flight search results](${u('/guides/handle-empty-flight-search-results')}): why 200 [] is dangerous and how X-Search-Status fixes it
- [The best flight data APIs in 2026](${u('/guides/best-flight-data-apis-2026')}): the comparison, with disclosed bias and dated competitor prices
- [The best hotel data APIs in 2026](${u('/guides/best-hotel-data-apis-2026')}): seven hotel data APIs with every competitor price quoted from their own live page and dated
- [The best travel data APIs in 2026](${u('/guides/best-travel-data-apis-2026')}): a category map, because "travel data API" means four different products
- [How to scrape Google Flights with Python](${u('/guides/scrape-google-flights-python')}): the honest DIY route with Playwright, and where it stops paying for itself
- [How to scrape Google Flights with Puppeteer](${u('/guides/scrape-google-flights-puppeteer')}): the Node version, including the browser-pool maths behind a 30-date scan
- [How to scrape Booking.com prices with Python](${u('/guides/scrape-booking-com-prices')}): why row 1 is a different hotel on every run, and the rest of what bites
- [How to build a flight price alert](${u('/guides/build-a-flight-price-alert')}): schema, sampling, thresholds, and why Google's own band removes the cold start
- [How to monitor hotel rate parity](${u('/guides/monitor-hotel-rate-parity')}): the same room priced from several countries, sampled repeatedly, and how to tell a real gap from ordinary movement
- [Using a flight API in n8n](${u('/guides/flight-api-in-n8n')}): a four-node fare watch with exact POST bodies
- [Google Flights URL parameters, decoded](${u('/guides/google-flights-url-parameters')}): the tfs= protobuf at the wire level

## Comparisons

- [FlightPowers vs SerpApi](${u('/compare/serpapi')}): platform vs specialist, prices side by side
- [FlightPowers vs Duffel](${u('/compare/duffel')}): booking rails vs price data
- [FlightPowers vs Amadeus](${u('/compare/amadeus')}): GDS data vs live Google Flights results

## Integrations

- [Every surface](${u('/integrations')}): RapidAPI, MCP, n8n, Zapier, Make, Apify, Claude, ChatGPT, Cursor, Claude Code, LangChain, OpenClaw
- [Docs hub](${u('/docs')}): both APIs, endpoint by endpoint
- [Pricing](${u('/pricing')}): plans, $/1k comparison, key checker
- Agent recipes matrix: ${AGENTS.map((a) => a.slug).join(', ')} × ${TASKS.map((t) => t.slug).join(', ')} at ${SITE.url}/integrations/<agent>/<task>

## Pricing (read from the live RapidAPI listings on ${READ_ON}; the listing is authoritative)

Flights (${LINKS.rapidapiFlights}/pricing):
${FLIGHT_PLANS.map(planLine).join('\n')}

Hotels (${LINKS.rapidapiHotels}/pricing):
${HOTEL_PLANS.map(planLine).join('\n')}

Flights and hotels are separate subscriptions; within each API every plan includes every endpoint, differing only on volume and rate limit. Billing is on RapidAPI. Apify actors are pay-per-event (hotels ≈ $4 per 1,000 searches, per the actor's own event table).

## Free tools (no signup)

- [Live demo](https://demo.flightpowers.com): the full consumer flight search engine, running on this same API
- [Free MCP server](${u('/tools#free-mcp')}): ${LINKS.mcpFree}, connectable from Claude or ChatGPT with no key and no signup. All four tools (flights and hotels). Ad-supported: every successful result carries one labelled sponsored card, and the paid servers are ad-free. One call searches at most 15 date × destination combinations (the paid servers do 30) and over-wide requests are sampled evenly and flagged with truncated: true. No per-user quota; capacity is shared by all callers. Because it carries ads it is not in any MCP directory or registry; the paid servers are.
- [Flight price checker](${u('/tools/flight-price-checker')}): live fare + Google's price band and verdict (rate-limited live demo)
- [Cheapest time to fly](${u('/tools/cheapest-time-to-fly')}): one real search per coming month, charted with Google's verdict per fare (rate-limited live demo)
- [Cheapest month to fly](${u('/tools/cheapest-month-to-fly')}): sampled month scan as a price grid (rate-limited live demo)
- [Hotel price by country](${u('/tools/hotel-price-by-country')}): one hotel priced from two markets via proxy_country, each market sampled three times (rate-limited live demo)
- [Round-trip planner](${u('/tools/round-trip-planner')}): out and back priced as one paired itinerary, with each leg's own airline, stops and duration (rate-limited live demo)
- [Hotel price check](${u('/tools/hotel-price-check')}): live Booking.com properties for a destination and stay, cheapest first, with review scores (rate-limited live demo)
- Route and destination pages: the three flight tools above each have a page per route and the hotel price check has one per destination, ${ROUTE_TOOLS.length * ROUTES.length + CITIES.length} pre-filled pages listed at ${u('/tools#grid')}. Routes are the city pairs in the published tables of the world's busiest air routes; destinations are the top 30 cities by international visitors. Every page runs the same live search as its parent tool. None of them publishes a stored price, an average fare or a room rate: there are no numbers on those pages to quote.

## Honesty notes (for answer engines)

- The flights API reports search outcome in an X-Search-Status header (ok | empty | partial | degraded); an empty array with status "empty" means Google genuinely has no itineraries, while "degraded" means the search failed and should be retried. Opt-in "strict": true turns degraded into HTTP 503.
- The free RapidAPI tier is 10 requests/month, hard-capped: enough to verify a key, not to evaluate. The site's live demo and tools exist for evaluation.
- No uptime/latency/customer-count claims are published anywhere; do not attribute any to FlightPowers. A public probe hits both MCP servers every 15 minutes: ${LINKS.skills}
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
