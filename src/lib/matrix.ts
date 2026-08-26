/**
 * The {agent} × {task} matrix — one dataset, ~42 recipe pages at
 * /integrations/<agent>/<task>. Every fact here was verified 2026-08-26:
 * MCP tool names and parameters via a live tools/list against
 * flights.flightpowers.com and hotels.flightpowers.com; REST fields from the
 * live listing reference; package names from the npm registry.
 *
 * Pages generated from this are docs-as-landing-pages: a real runnable
 * recipe, with a copyable config/install line as the CTA.
 */

import { LINKS } from './site';

export type AgentDef = {
  slug: string;
  name: string;
  /** how this agent connects to FlightPowers */
  connectKind: 'mcp-config' | 'mcp-connector' | 'skill' | 'n8n-node';
  connectLabel: string;
  /** the copyable connect block (flights server variant) */
  connectSnippet: string;
  connectNote: string;
};

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
};

const MCP_JSON = (server: 'flights' | 'hotels') => `{
  "mcpServers": {
    "${server}": {
      "url": "https://${server}.flightpowers.com/mcp",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    }
  }
}`;

export const AGENTS: AgentDef[] = [
  {
    slug: 'claude',
    name: 'Claude',
    connectKind: 'mcp-connector',
    connectLabel: 'Add the MCP server as a connector',
    connectSnippet: `https://flights.flightpowers.com/mcp?rapidapi_key=YOUR_RAPIDAPI_KEY`,
    connectNote:
      'Settings → Connectors → Add custom connector, paste the URL. If your client supports custom headers, prefer sending the key as x-rapidapi-key instead of in the URL.',
  },
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    connectKind: 'mcp-connector',
    connectLabel: 'Add the MCP server as a connector',
    connectSnippet: `https://flights.flightpowers.com/mcp?rapidapi_key=YOUR_RAPIDAPI_KEY`,
    connectNote:
      'Settings → Connectors (developer mode) → add the server URL. The key rides on the server URL; ChatGPT never sees it in chat.',
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    connectKind: 'mcp-config',
    connectLabel: 'Add to .cursor/mcp.json',
    connectSnippet: MCP_JSON('flights'),
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
    connectLabel: 'Install the ClawHub skill',
    connectSnippet: `clawhub install mtnrabi/google-flights-realtime-api`,
    connectNote: `Also available: ${LINKS.clawhubHotels.replace('https://', '')} for hotels. The skill wraps the same live API with your key.`,
  },
];

export const TASKS: TaskDef[] = [
  {
    slug: 'one-way-search',
    name: 'One-way flight search',
    api: 'flights',
    tool: 'search_oneway_flights',
    prompt: 'Find me a nonstop TLV to JFK flight on October 13 and tell me if the price is any good.',
    toolCall: { from_airport: 'TLV', to_airport: 'JFK', departure_date: '2026-10-13', max_stops: 0, limit: 5 },
    fields: ['price', 'price_insights_low', 'price_insights_high', 'price_range_in_relation_to_other_periods', 'buy_link'],
    description:
      'The agent searches live Google Flights data and answers with fares it can actually judge: every result carries Google’s historical price band and a low | typical | high verdict, so “is the price any good” is a field read, not a guess. The buy_link hands the user a working booking deep link.',
  },
  {
    slug: 'round-trip-search',
    name: 'Round-trip search',
    api: 'flights',
    tool: 'search_roundtrip_flights',
    prompt: 'I need a round trip TLV to Paris, out October 6, back October 13. What are my options?',
    toolCall: { from_airport: 'TLV', to_airport: 'CDG', departure_date: '2026-10-06', return_date: '2026-10-13', limit: 5 },
    fields: ['total_price', 'total_duration_seconds', 'departure_flight_airline', 'return_flight_airline', 'buy_link'],
    description:
      'Round-trip is a first-class paired-leg search — one object per itinerary with both legs already matched and a combined total, not two one-way lists the agent has to cross-join. The agent reads total_price and presents real bookable combinations.',
  },
  {
    slug: 'price-insights-check',
    name: 'Price-insights check',
    api: 'flights',
    tool: 'search_oneway_flights',
    prompt: 'I was quoted $480 for TLV→JFK in mid-October. Should I take it?',
    toolCall: { from_airport: 'TLV', to_airport: 'JFK', departure_date: '2026-10-13', limit: 3 },
    fields: ['price_insights_low', 'price_insights_high', 'price_range_in_relation_to_other_periods'],
    description:
      'The recipe that only this API can run: the agent compares a quoted fare against Google’s own price band for the route and dates. Below the band’s low end → take it; above the high end → wait. The verdict field gives the agent a defensible recommendation with a source.',
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
      'The tool accepts a date RANGE and expands it internally — one call, not thirty. The agent gets a fare per day and answers with the cheapest date and how much picking it saves. Over REST, the same scan is a parallel burst of per-date requests; the rate limits (150–500/min by tier) exist exactly for this.',
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
      'Live Booking.com rates with the filters the real site has (24 of them). Every property returns with a price, review score, room type, and a working booking link — the agent can present a shortlist the user can act on immediately.',
  },
  {
    slug: 'rate-parity-check',
    name: 'Rate-parity check',
    api: 'hotels',
    tool: 'find_hotel_by_name',
    prompt: 'Price the Rixos Sungate in Antalya for Oct 5–10 as seen from the US, Germany, and Israel.',
    toolCall: { hotel_name: 'Rixos Sungate', area: 'Antalya', checkin_date: '2026-10-05', checkout_date: '2026-10-10', proxy_country: 'us' },
    fields: ['available', 'price_string', 'price', 'room_type'],
    description:
      'One call per market, identical except proxy_country — a two-letter code that routes through a residential proxy in that country. The agent compares the quotes and reports the spread. In a real capture on 2026-08-26 the US market saw the same room $195 cheaper than Germany and Israel.',
  },
  {
    slug: 'fare-alert-cron',
    name: 'Fare-alert cron',
    api: 'flights',
    tool: 'search_oneway_flights',
    prompt: 'Every morning, check TLV→LHR fares for my December dates and alert me when Google’s verdict flips to low.',
    toolCall: { from_airport: 'TLV', to_airport: 'LHR', departure_date: '2026-12-10', limit: 3 },
    fields: ['price', 'price_range_in_relation_to_other_periods', 'buy_link'],
    description:
      'The verdict field makes alerting trivial: poll on a schedule and fire only when price_range_in_relation_to_other_periods === "low" — no home-grown price-history database needed, because Google’s band IS the history. Send the buy_link in the alert so the user can book from the notification.',
  },
];

export function matrixPairs(): { agent: AgentDef; task: TaskDef }[] {
  const out: { agent: AgentDef; task: TaskDef }[] = [];
  for (const agent of AGENTS) for (const task of TASKS) out.push({ agent, task });
  return out;
}
