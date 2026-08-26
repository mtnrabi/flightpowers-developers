import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import type { Faq } from '@/components/ui';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Live flight & hotel data in Claude: MCP connector setup',
  description:
    'Connect Claude to live Google Flights and Booking.com data with one custom-connector URL. Bring your own RapidAPI key; every fare returns with Google’s price band and a low/typical/high verdict.',
  alternates: { canonical: '/integrations/claude' },
});

const steps: ConnectStep[] = [
  {
    title: 'Get a RapidAPI key',
    body: 'Subscribe on the listing’s pricing tab. The free tier needs no card. The key is the only credential this integration uses.',
  },
  {
    title: 'Add the connector',
    body: 'Settings → Connectors → Add custom connector, then paste the URL above with your key in place of YOUR_RAPIDAPI_KEY. For hotels, add https://hotels.flightpowers.com/mcp the same way. The same RapidAPI key works for both once you subscribe to each listing.',
  },
  {
    title: 'Ask',
    body: 'The tools appear in Claude automatically. If your client supports custom headers, prefer sending the key as x-rapidapi-key instead of in the URL.',
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
    q: 'Does my key end up in the conversation?',
    a: 'No. The key lives in the connector configuration (on the URL, or as an x-rapidapi-key header where your client supports custom headers), not in the chat itself. Treat the connector URL as a secret either way, and prefer the header form when you can.',
  },
  {
    q: 'Is my key billed to me?',
    a: 'Yes. The MCP servers are bring-your-own-key: Claude sends your RapidAPI key with each call and usage meters against your own subscription. There is no FlightPowers account and no second bill.',
  },
  {
    q: 'Which plan do I need?',
    a: 'The free tier is 10 requests/month with a hard cap: enough to verify the connector works, not to use it. For an assistant you actually talk to, the $10 PRO plan (2,500 requests/month on flights) is the realistic floor. Every plan includes every endpoint.',
  },
  {
    q: 'Can I try it before adding a key?',
    a: 'Yes. The live demo on the homepage and the free tools on this site run real requests on our key, so you can see the exact responses Claude will get before you subscribe.',
  },
  {
    q: 'Flights and hotels are separate servers. Do I need both?',
    a: 'Only if you want both datasets. They are separate RapidAPI listings with separate subscriptions, but one RapidAPI key covers both once subscribed, and Claude handles the two connectors as one toolbox.',
  },
];

export default function ClaudeIntegrationPage() {
  return (
    <AgentIntegrationPage
      slug="claude"
      lede="Add one connector URL and Claude searches live Google Flights and Booking.com data mid-conversation, with Google’s own price verdict attached to every fare it quotes."
      heroCodeLabel="add as a custom connector"
      steps={steps}
      promptsLede="Claude picks the tool and fills the parameters itself: these all work as written."
      prompts={[
        'Find me a nonstop LHR to JFK flight on October 13 and tell me if the price is any good.',
        'What is the cheapest day to fly Lisbon to New York in November?',
        'I need a round trip JFK to Paris, out October 6, back October 13. What are my best-value options?',
        'Find a hotel in Lisbon, October 9 to 12, 2 adults, review score 8+, free cancellation.',
        'Price the Rixos Sungate in Antalya for October 5–10 as seen from the US, Germany, and Israel.',
      ]}
      toolsEyebrow="Tool inventory"
      toolsTitle="The four tools Claude sees"
      toolsLede="Printed raw on purpose: this page is written to be read by an agent as much as by a person."
      tools={tools}
      faq={faq}
    />
  );
}
