/**
 * The {agent} × {task} matrix: one dataset, ~42 recipe pages at
 * /integrations/<agent>/<task>. Every fact here was verified 2026-08-26 and
 * the tool names re-verified 2026-08-27: MCP tool names and parameters via a
 * live tools/list against flights.flightpowers.com and
 * hotels.flightpowers.com; REST fields from the live listing reference;
 * package names from the npm registry. Connect snippets cover BOTH APIs on
 * the agent heroes; task pages use connectSnippetFor(agent, task.api).
 *
 * Pages generated from this are docs-as-landing-pages: a real runnable
 * recipe, with a copyable config/install line as the CTA.
 */

import { LINKS } from './site';

export type AgentDef = {
  slug: string;
  name: string;
  /** how this agent connects to FlightPowers */
  connectKind: 'mcp-config' | 'mcp-connector' | 'skill' | 'n8n-node' | 'http-step' | 'rest' | 'apify-actor';
  connectLabel: string;
  /** the copyable connect block covering BOTH APIs (used on the agent hero) */
  connectSnippet: string;
  /** per-API connect blocks for the task pages; omit when one snippet covers both */
  connectSnippets?: { flights: string; hotels: string };
  connectNote: string;
};

/** The connect block for one API (task pages); falls back to the shared block. */
export function connectSnippetFor(agent: AgentDef, api: 'flights' | 'hotels'): string {
  return agent.connectSnippets?.[api] ?? agent.connectSnippet;
}

export type TaskDef = {
  slug: string;
  name: string;
  /** which server/tool does the work */
  api: 'flights' | 'hotels';
  tool: string;
  /** a verbatim prompt a user would give the agent */
  prompt: string;
  /** the tool call the agent makes (real parameter names) */
  toolCall: Record<string, unknown>;
  /** the response fields the recipe branches on */
  fields: string[];
  /** 2–3 sentences of what the recipe does and why the fields matter */
  description: string;
  /**
   * The same recipe as a plain HTTP call on our own domain. Path and body
   * fields are the ones in public/openapi.json — nothing modelled. This is
   * what the REST, RapidAPI, Zapier and Make pages render instead of a tool
   * call, because those surfaces never see an MCP tool name.
   */
  rest: { path: string; body: Record<string, unknown>; note?: string };
  /**
   * The same recipe as an Apify actor input. Field names and the `endpoint`
   * enum values were read from the actors' own published input schemas on
   * 2026-09-02 (api.apify.com/v2/acts/mtnrabi~<actor>/builds/default).
   */
  apify: { actor: 'flights' | 'hotels'; input: Record<string, unknown>; note?: string };
};

const MCP_JSON = (server: 'flights' | 'hotels') => `{
  "mcpServers": {
    "${server}": {
      "url": "https://${server}.flightpowers.com/mcp",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    }
  }
}`;

/** Both hosted servers in one mcpServers block: flights AND hotels. */
const MCP_JSON_BOTH = `{
  "mcpServers": {
    "flights": {
      "url": "https://flights.flightpowers.com/mcp",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    },
    "hotels": {
      "url": "https://hotels.flightpowers.com/mcp",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    }
  }
}`;

const CONNECTOR_URL = (server: 'flights' | 'hotels') =>
  `https://${server}.flightpowers.com/mcp?rapidapi_key=YOUR_RAPIDAPI_KEY`;

const CONNECTOR_URLS_BOTH = `${CONNECTOR_URL('flights')}
${CONNECTOR_URL('hotels')}`;

export const AGENTS: AgentDef[] = [
  {
    slug: 'claude',
    name: 'Claude',
    connectKind: 'mcp-connector',
    connectLabel: 'Add the MCP servers as connectors',
    connectSnippet: CONNECTOR_URLS_BOTH,
    connectSnippets: { flights: CONNECTOR_URL('flights'), hotels: CONNECTOR_URL('hotels') },
    connectNote:
      'Settings → Connectors → Add custom connector, one connector per URL: flights and hotels are separate servers, and one RapidAPI key covers both once you subscribe to each listing. If your client supports custom headers, prefer sending the key as x-rapidapi-key instead of in the URL.',
  },
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    connectKind: 'mcp-connector',
    connectLabel: 'Add the MCP servers as connectors',
    connectSnippet: CONNECTOR_URLS_BOTH,
    connectSnippets: { flights: CONNECTOR_URL('flights'), hotels: CONNECTOR_URL('hotels') },
    connectNote:
      'Settings → Connectors (developer mode) → add each server URL: flights and hotels are separate servers, and one RapidAPI key covers both once you subscribe to each listing. The key rides on the server URL; ChatGPT never sees it in chat.',
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    connectKind: 'mcp-config',
    connectLabel: 'Add to .cursor/mcp.json',
    connectSnippet: MCP_JSON_BOTH,
    connectSnippets: { flights: MCP_JSON('flights'), hotels: MCP_JSON('hotels') },
    connectNote: 'Restart Cursor and the tools appear in the Agent toolbox. Same shape works in any mcp.json-style client.',
  },
  {
    slug: 'claude-code',
    name: 'Claude Code',
    connectKind: 'skill',
    connectLabel: 'Install the open-source skills',
    connectSnippet: `npx skills add mtnrabi/travel-agent-skills`,
    connectNote:
      'Eight MIT-licensed skills (cheapest dates, fare watch, trip planning, hotel search, rate-parity monitoring…). They talk to the same API over MCP or plain REST with your key.',
  },
  {
    slug: 'n8n',
    name: 'n8n',
    connectKind: 'n8n-node',
    connectLabel: 'Install the community node',
    connectSnippet: `n8n-nodes-flightpowers`,
    connectNote:
      'Settings → Community nodes → Install → n8n-nodes-flightpowers (v0.2.2 on npm). Add your RapidAPI key once as a credential; every workflow reuses it.',
  },
  {
    slug: 'openclaw',
    name: 'OpenClaw',
    connectKind: 'skill',
    connectLabel: 'Install the ClawHub skills',
    connectSnippet: `clawhub install mtnrabi/google-flights-realtime-api
clawhub install mtnrabi/booking-hotel-search`,
    connectSnippets: {
      flights: `clawhub install mtnrabi/google-flights-realtime-api`,
      hotels: `clawhub install mtnrabi/booking-hotel-search`,
    },
    connectNote: `Two ClawHub listings, one per API: ${LINKS.clawhubFlights.replace('https://', '')} for flights, ${LINKS.clawhubHotels.replace('https://', '')} for hotels. The skills wrap the same live API with your key.`,
  },
  {
    slug: 'claude-mcp',
    name: 'Claude Desktop',
    connectKind: 'mcp-config',
    connectLabel: 'Add to claude_desktop_config.json',
    connectSnippet: MCP_JSON_BOTH,
    connectSnippets: { flights: MCP_JSON('flights'), hotels: MCP_JSON('hotels') },
    connectNote:
      'Settings → Developer → Edit Config, paste the block under mcpServers, restart Claude Desktop. On a Mac the file is ~/Library/Application Support/Claude/claude_desktop_config.json. The key lives in that file, never in the conversation.',
  },
  {
    slug: 'smithery',
    name: 'Smithery',
    connectKind: 'mcp-config',
    connectLabel: 'Install from the Smithery registry',
    connectSnippet: `mrabi/google-flights
mrabi/booking

Set rapidapi_key in the server's configuration on Smithery.`,
    connectSnippets: {
      flights: `mrabi/google-flights

Set rapidapi_key in the server's configuration on Smithery.`,
      hotels: `mrabi/booking

Set rapidapi_key in the server's configuration on Smithery.`,
    },
    connectNote:
      'Qualified names verified against the live Smithery pages on 2026-08-26. The gateway proxies the connection and forwards the key you set in the server config, so usage still meters on your own RapidAPI subscription. Connecting to flights.flightpowers.com and hotels.flightpowers.com directly is one hop shorter and works identically.',
  },
  {
    slug: 'langchain',
    name: 'LangChain',
    connectKind: 'mcp-config',
    connectLabel: 'Load the servers with langchain-mcp-adapters',
    connectSnippet: `from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "flights": {"transport": "http", "url": "${LINKS.mcpFlights}",
                "headers": {"x-rapidapi-key": "YOUR_KEY"}},
    "hotels": {"transport": "http", "url": "${LINKS.mcpHotels}",
               "headers": {"x-rapidapi-key": "YOUR_KEY"}},
})

tools = await client.get_tools()`,
    connectSnippets: {
      flights: `from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "flights": {"transport": "http", "url": "${LINKS.mcpFlights}",
                "headers": {"x-rapidapi-key": "YOUR_KEY"}},
})

tools = await client.get_tools()`,
      hotels: `from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "hotels": {"transport": "http", "url": "${LINKS.mcpHotels}",
               "headers": {"x-rapidapi-key": "YOUR_KEY"}},
})

tools = await client.get_tools()`,
    },
    connectNote:
      'get_tools() returns ordinary LangChain tools, so they pass to create_agent or any LangGraph graph unchanged. There is no first-party package to install from us. If you would rather not run MCP at all, the REST endpoints wrap into a @tool in a few lines: see /integrations/langchain.',
  },
  {
    slug: 'zapier',
    name: 'Zapier',
    connectKind: 'http-step',
    connectLabel: 'Webhooks by Zapier → Custom Request',
    connectSnippet: `URL      https://api.flightpowers.com/v1/flights/oneway
Method   POST

Headers  x-api-key: YOUR_RAPIDAPI_KEY
         Content-Type: application/json`,
    connectNote:
      'A native Zapier app is in review and not listed yet, so this page documents the built-in Webhooks step, which works today. Zapier parses the JSON response, so every field below is mappable in later steps.',
  },
  {
    slug: 'make',
    name: 'Make',
    connectKind: 'http-step',
    connectLabel: 'HTTP → Make a request',
    connectSnippet: `URL             https://api.flightpowers.com/v1/flights/oneway
Method          POST
Body type       Raw
Content type    JSON (application/json)

Headers         x-api-key: YOUR_RAPIDAPI_KEY
Parse response  Yes`,
    connectNote:
      'Set Parse response to Yes and the JSON fields become mappable in every later module. No dedicated Make app is needed; the generic HTTP module is the whole integration.',
  },
  {
    slug: 'api',
    name: 'REST',
    connectKind: 'rest',
    connectLabel: 'POST to api.flightpowers.com',
    connectSnippet: `curl -X POST "https://api.flightpowers.com/v1/flights/oneway" \\
  -H "x-api-key: $RAPIDAPI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"from_airport":"LHR","to_airport":"JFK","departure_date":"2026-10-13"}'`,
    connectNote:
      'The API on our own domain, with an OpenAPI spec at a fixed path. x-api-key, x-rapidapi-key and Authorization: Bearer are all accepted and equivalent. The key is the one RapidAPI issued you; there is no second account.',
  },
  {
    slug: 'rapidapi',
    name: 'RapidAPI',
    connectKind: 'rest',
    connectLabel: 'Call the listing host',
    connectSnippet: `curl -X POST "https://google-flights-live-api.p.rapidapi.com/api/google_flights/oneway/v1" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: google-flights-live-api.p.rapidapi.com" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{"from_airport":"LHR","to_airport":"JFK","departure_date":"2026-10-13"}'`,
    connectSnippets: {
      flights: `curl -X POST "https://google-flights-live-api.p.rapidapi.com/api/google_flights/oneway/v1" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: google-flights-live-api.p.rapidapi.com" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{"from_airport":"LHR","to_airport":"JFK","departure_date":"2026-10-13"}'`,
      hotels: `curl -X POST "https://booking-live-api.p.rapidapi.com/search" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: booking-live-api.p.rapidapi.com" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{"destination":"Lisbon","checkin_date":"2026-10-09","checkout_date":"2026-10-12"}'`,
    },
    connectNote:
      'The marketplace host is where the key comes from and where the usage meters. Same API, same request bodies; the only difference from our own domain is the host and the extra x-rapidapi-host header. Flights and hotels are separate listings with separate subscriptions.',
  },
  {
    slug: 'apify',
    name: 'Apify',
    connectKind: 'apify-actor',
    connectLabel: 'Run the actor',
    connectSnippet: `# one-click: the console links on /integrations/apify pre-add the actor
# or run it from the API with your Apify token
curl -X POST "https://api.apify.com/v2/acts/mtnrabi~google-flights-real-time-api/run-sync-get-dataset-items?token=$APIFY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"endpoint":"oneway","from_airport":"LHR","to_airport":"JFK","departure_date":"2026-10-13","currency":"usd"}'`,
    connectSnippets: {
      flights: `curl -X POST "https://api.apify.com/v2/acts/mtnrabi~google-flights-real-time-api/run-sync-get-dataset-items?token=$APIFY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"endpoint":"oneway","from_airport":"LHR","to_airport":"JFK","departure_date":"2026-10-13","currency":"usd"}'`,
      hotels: `curl -X POST "https://api.apify.com/v2/acts/mtnrabi~booking-real-time-api/run-sync-get-dataset-items?token=$APIFY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"endpoint":"/search","destination":"Lisbon","checkin_date":"2026-10-09","checkout_date":"2026-10-12","adults":2,"currency":"USD"}'`,
    },
    connectNote:
      'Pay-per-event through your own Apify account: no monthly plan, and an idle month costs nothing. The input field names and the endpoint values are the actors\u2019 own published input schemas, read from api.apify.com on 2026-09-02. Nothing to subscribe to on RapidAPI for this path.',
  },
];

export const TASKS: TaskDef[] = [
  {
    slug: 'one-way-search',
    name: 'One-way flight search',
    api: 'flights',
    tool: 'search_oneway_flights',
    prompt: 'Find me a nonstop JFK to Cancun flight on January 1 and tell me if the price is any good.',
    toolCall: { from_airport: 'JFK', to_airport: 'CUN', departure_date: '2027-01-01', max_stops: 0, limit: 5 },
    fields: ['price', 'price_insights_low', 'price_insights_high', 'price_range_in_relation_to_other_periods', 'buy_link'],
    description:
      'The agent searches live Google Flights data and answers with fares it can actually judge: every result carries Google’s historical price band and a low | typical | high verdict, so “is the price any good” is a field read, not a guess. The buy_link hands the user a working booking deep link.',
    rest: {
      path: '/v1/flights/oneway',
      body: { from_airport: 'JFK', to_airport: 'CUN', departure_date: '2027-01-01', max_stops: 0, limit: 5 },
    },
    apify: {
      actor: 'flights',
      input: { endpoint: 'oneway', from_airport: 'JFK', to_airport: 'CUN', departure_date: '2027-01-01', currency: 'usd', limit: 5 },
    },
  },
  {
    slug: 'round-trip-search',
    name: 'Round-trip search',
    api: 'flights',
    tool: 'search_roundtrip_flights',
    prompt: 'I need a round trip New York to Paris, out October 6, back October 13. What are my options?',
    toolCall: { from_airport: 'JFK', to_airport: 'CDG', departure_date: '2026-10-06', return_date: '2026-10-13', limit: 5 },
    fields: ['total_price', 'total_duration_seconds', 'departure_flight_airline', 'return_flight_airline', 'buy_link'],
    description:
      'Round-trip is a first-class paired-leg search: one object per itinerary with both legs already matched and a combined total, not two one-way lists the agent has to cross-join. The agent reads total_price and presents real bookable combinations.',
    rest: {
      path: '/v1/flights/roundtrip',
      body: { from_airport: 'JFK', to_airport: 'CDG', departure_date: '2026-10-06', return_date: '2026-10-13', limit: 5 },
    },
    apify: {
      actor: 'flights',
      input: {
        endpoint: 'roundtrip',
        from_airport: 'JFK',
        to_airport: 'CDG',
        departure_date: '2026-10-06',
        return_date: '2026-10-13',
        currency: 'usd',
        limit: 5,
      },
    },
  },
  {
    slug: 'price-insights-check',
    name: 'Price-insights check',
    api: 'flights',
    tool: 'search_oneway_flights',
    prompt: 'I was quoted $129 for JFK→Cancún on January 1. Should I take it?',
    toolCall: { from_airport: 'JFK', to_airport: 'CUN', departure_date: '2027-01-01', limit: 3 },
    fields: ['price_insights_low', 'price_insights_high', 'price_range_in_relation_to_other_periods'],
    description:
      'The recipe that only this API can run: the agent compares a quoted fare against Google’s own price band for the route and dates. Below the band’s low end → take it; above the high end → wait. The verdict field gives the agent a defensible recommendation with a source.',
    rest: {
      path: '/v1/flights/oneway',
      body: { from_airport: 'JFK', to_airport: 'CUN', departure_date: '2027-01-01', limit: 3 },
      note: 'The band and the verdict ride on every result of the ordinary search. There is no separate insights endpoint to call and nothing extra to enable.',
    },
    apify: {
      actor: 'flights',
      input: { endpoint: 'oneway', from_airport: 'JFK', to_airport: 'CUN', departure_date: '2027-01-01', currency: 'usd', limit: 3 },
    },
  },
  {
    slug: 'cheapest-date-scan',
    name: 'Cheapest-date scan',
    api: 'flights',
    tool: 'search_oneway_flights',
    prompt: 'What is the cheapest day to fly LIS to New York in November?',
    toolCall: { from_airport: 'LIS', to_airport: 'JFK', departure_date_from: '2026-11-01', departure_date_to: '2026-11-30', limit: 5 },
    fields: ['departure_date', 'price', 'price_range_in_relation_to_other_periods'],
    description:
      'The tool accepts a date RANGE and expands it internally: one call, not thirty. The agent gets a fare per day and answers with the cheapest date and how much picking it saves. Over REST, the same scan is a parallel burst of per-date requests; the rate limits (150–500/min by tier) exist exactly for this.',
    rest: {
      path: '/v1/flights/oneway',
      body: { from_airport: 'LIS', to_airport: 'JFK', departure_date: '2026-11-01', limit: 5 },
      note: 'The date range is an MCP convenience. Over HTTP it is one request per date, fired in parallel: 30 dates meters as 30 requests, and the per-minute rate limit on your plan is what makes the burst finish quickly.',
    },
    apify: {
      actor: 'flights',
      input: { endpoint: 'oneway', from_airport: 'LIS', to_airport: 'JFK', departure_date: '2026-11-01', currency: 'usd', limit: 5 },
      note: 'The actor input takes one departure_date. A month scan is one run per date, which is what Apify\u2019s own scheduling and concurrency are for.',
    },
  },
  {
    slug: 'hotel-search',
    name: 'Hotel search',
    api: 'hotels',
    tool: 'search_hotels',
    prompt: 'Find me a hotel in Lisbon, October 9 to 12, 2 adults, review score 8+, free cancellation.',
    toolCall: { destination: 'Lisbon', checkin_date: '2026-10-09', checkout_date: '2026-10-12', adults: 2, filters: ['review_score_8', 'free_cancellation'] },
    fields: ['name', 'price_string', 'review_score', 'review_count', 'room_type', 'link'],
    description:
      'Live Booking.com rates with the filters the real site has (24 of them). Every property returns with a price, review score, room type, and a working booking link, so the agent can present a shortlist the user can act on immediately.',
    rest: {
      path: '/v1/hotels/search',
      body: {
        destination: 'Lisbon',
        checkin_date: '2026-10-09',
        checkout_date: '2026-10-12',
        adults: 2,
        filters: ['review_score_8', 'free_cancellation'],
      },
      note: 'destination is required and takes free text. The field is not called location; sending location returns a 400 that says so.',
    },
    apify: {
      actor: 'hotels',
      input: {
        endpoint: '/search',
        destination: 'Lisbon',
        checkin_date: '2026-10-09',
        checkout_date: '2026-10-12',
        adults: 2,
        currency: 'USD',
      },
    },
  },
  {
    slug: 'rate-parity-check',
    name: 'Rate-parity check',
    api: 'hotels',
    tool: 'find_hotel_by_name',
    prompt: 'Price the Rixos Sungate in Antalya for Oct 5–10 as seen from Germany and from Japan. Ask each market three times.',
    toolCall: { hotel_name: 'Rixos Sungate Antalya', checkin_date: '2026-10-05', checkout_date: '2026-10-10', price_as_seen_from: 'de' },
    fields: ['available', 'price_string', 'price', 'room_type'],
    description:
      'Identical calls except price_as_seen_from (the REST field is proxy_country), a two-letter code that prices the stay as a shopper in that country would see it. Ask each market more than once: in a controlled run on 2026-08-28, Germany and Japan answered with the same number every time while the US market moved between identical requests. The agent compares the ranges and calls a gap real only when one market’s whole range sits below the other’s.',
    rest: {
      path: '/v1/hotels/by-name',
      body: {
        hotel_name: 'Rixos Sungate Antalya',
        checkin_date: '2026-10-05',
        checkout_date: '2026-10-10',
        proxy_country: 'de',
      },
      note: 'proxy_country is an input, never a response field. Hold one named property fixed and sample each market several times back to back: rates move between identical calls, so a single reading per country measures the noise as much as the market.',
    },
    apify: {
      actor: 'hotels',
      input: {
        endpoint: '/hotel_by_name',
        hotel_name: 'Rixos Sungate Antalya',
        checkin_date: '2026-10-05',
        checkout_date: '2026-10-10',
        currency: 'USD',
        proxy_country: 'de',
      },
    },
  },
  {
    slug: 'fare-alert-cron',
    name: 'Fare-alert cron',
    api: 'flights',
    tool: 'search_oneway_flights',
    prompt: 'Every morning, check JFK→LHR fares for my December dates and alert me when Google’s verdict flips to low.',
    toolCall: { from_airport: 'JFK', to_airport: 'LHR', departure_date: '2026-12-10', limit: 3 },
    fields: ['price', 'price_range_in_relation_to_other_periods', 'buy_link'],
    description:
      'The verdict field makes alerting trivial: poll on a schedule and fire only when price_range_in_relation_to_other_periods === "low". No home-grown price-history database needed, because Google’s band IS the history. Send the buy_link in the alert so the user can book from the notification.',
    rest: {
      path: '/v1/flights/oneway',
      body: { from_airport: 'JFK', to_airport: 'LHR', departure_date: '2026-12-10', limit: 3 },
      note: 'One request per run. A daily check is about 30 requests a month.',
    },
    apify: {
      actor: 'flights',
      input: { endpoint: 'oneway', from_airport: 'JFK', to_airport: 'LHR', departure_date: '2026-12-10', currency: 'usd', limit: 3 },
      note: 'Apify runs this on its own schedule. Pay-per-event means a daily run costs only the events it fires.',
    },
  },
];

export function matrixPairs(): { agent: AgentDef; task: TaskDef }[] {
  const out: { agent: AgentDef; task: TaskDef }[] = [];
  for (const agent of AGENTS) for (const task of TASKS) out.push({ agent, task });
  return out;
}
