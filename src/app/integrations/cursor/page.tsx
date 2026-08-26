import type { Metadata } from 'next';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import type { Faq } from '@/components/ui';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Live flight & hotel data in Cursor: mcp.json setup',
  description:
    'Give Cursor’s agent live Google Flights and Booking.com data with one block in .cursor/mcp.json. Build and test travel features against real fares, billed to your own RapidAPI key.',
  alternates: { canonical: '/integrations/cursor' },
};

const steps: ConnectStep[] = [
  {
    title: 'Get a RapidAPI key',
    body: 'Subscribe on the listing’s pricing tab. The free tier needs no card. The key is the only credential this integration uses.',
  },
  {
    title: 'Add the block to .cursor/mcp.json',
    body: 'Project-level or global: paste the config above with your key. For hotels, add a second entry pointing at https://hotels.flightpowers.com/mcp; one RapidAPI key covers both once you subscribe to each listing.',
  },
  {
    title: 'Restart Cursor',
    body: 'The tools appear in the Agent toolbox. The same config shape works in any mcp.json-style client, so the block travels with your dotfiles.',
  },
];

const tools: ToolLine[] = [
  {
    name: 'search_oneway_flights',
    type: 'flights server',
    note: 'One-way fares with Google’s price band, the low | typical | high verdict, and a buy_link on every result. Takes a single date or a date range, expanded server-side.',
  },
  {
    name: 'search_roundtrip_flights',
    type: 'flights server',
    note: 'Paired-leg round-trip itineraries: one object per option with both legs matched and a combined total_price.',
  },
  {
    name: 'search_hotels',
    type: 'hotels server',
    note: 'Destination search over live Booking.com rates, with the site’s own filters: review_score_8, free_cancellation, and the rest.',
  },
  {
    name: 'find_hotel_by_name',
    type: 'hotels server',
    note: 'One property by the name a human would type. proxy_country prices it from any market, the rate-parity tool.',
  },
];

const faq: Faq[] = [
  {
    q: 'Why give a code editor flight data?',
    a: 'Because the agent that writes your travel feature can also run it. Cursor can fetch a live response, generate types and fixtures from it, and test parsing logic against real data instead of a guessed schema: the response shape it codes against is the one production will see.',
  },
  {
    q: 'Is my key billed to me?',
    a: 'Yes. The MCP servers are bring-your-own-key: Cursor sends your RapidAPI key with each call and usage meters against your own subscription. There is no FlightPowers account and no second bill.',
  },
  {
    q: 'Where does the key live?',
    a: 'In .cursor/mcp.json, as a header value. Treat the file as a secret: keep the project-level copy out of shared repositories, or use the global config instead.',
  },
  {
    q: 'Which plan do I need?',
    a: 'The free tier is 10 requests/month with a hard cap: enough to verify the config, not to develop against. For a development workflow, the $10 PRO plan (2,500 requests/month on flights) is the realistic floor. Every plan includes every endpoint.',
  },
  {
    q: 'Does the same config work elsewhere?',
    a: 'Yes. It is a standard MCP server over HTTP. Any client that reads an mcpServers block (or accepts a URL plus headers) connects the same way; only the file location changes.',
  },
];

export default function CursorIntegrationPage() {
  return (
    <AgentIntegrationPage
      slug="cursor"
      lede="Drop one block into .cursor/mcp.json and Cursor’s agent can query live fares and hotel rates while it writes your travel features: real responses, not guessed schemas."
      heroCodeLabel=".cursor/mcp.json"
      steps={steps}
      promptsLede="Prompts for a coding agent: each one runs a live call and puts the result to work."
      prompts={[
        'Call search_oneway_flights for LHR to JFK on October 13 and show me the raw JSON so we can write a parser for it.',
        'Fetch live fares for LIS to JFK across November and build a test fixture from the five cheapest days.',
        'Add a fareVerdict helper that maps price_range_in_relation_to_other_periods to a badge color, then check it against a live JFK to LHR search.',
        'Query search_hotels for Lisbon, October 9 to 12, and generate a TypeScript type from the response.',
        'Run find_hotel_by_name for the Rixos Sungate with proxy_country us, de, and il, and print the price spread.',
      ]}
      toolsEyebrow="Tool inventory"
      toolsTitle="The four tools in the Agent toolbox"
      toolsLede="Printed raw on purpose: this page is written to be read by an agent as much as by a person."
      tools={tools}
      faq={faq}
    />
  );
}
