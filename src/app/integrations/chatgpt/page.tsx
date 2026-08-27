import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import type { Faq } from '@/components/ui';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Live flight & hotel data in ChatGPT: MCP connector setup',
  description:
    'Connect ChatGPT to live Google Flights and Booking.com data through developer-mode MCP connectors: one URL per API, your own RapidAPI key, and Google’s low/typical/high price verdict on every fare.',
  alternates: { canonical: '/integrations/chatgpt' },
});

const steps: ConnectStep[] = [
  {
    title: 'Get a RapidAPI key',
    body: 'Subscribe on the listing’s pricing tab. The free tier needs no card. The key is the only credential this integration uses.',
  },
  {
    title: 'Add both connectors in developer mode',
    body: 'Settings → Connectors, enable developer mode, and add each server URL above (flights, then hotels) with your key in place of YOUR_RAPIDAPI_KEY. Developer mode is what gates custom connectors, and OpenAI ships it on the Pro and Business plans (per its own help pages, checked 2026-08-27). They are separate servers; one RapidAPI key covers both once you subscribe to each listing.',
  },
  {
    title: 'Use it in a chat',
    body: 'The flight and hotel tools become available in conversations. The key rides on the server URL in your settings. ChatGPT never sees it in the chat itself.',
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
    note: 'One property by the name a human would type. price_as_seen_from prices it from any market, the rate-parity tool.',
  },
];

const faq: Faq[] = [
  {
    q: 'Is my key billed to me?',
    a: 'Yes. The MCP servers are bring-your-own-key: ChatGPT sends your RapidAPI key with each call and usage meters against your own subscription. There is no FlightPowers account and no second bill.',
  },
  {
    q: 'Where does my key live?',
    a: 'On the connector URL, stored in your ChatGPT settings: it is configuration, not conversation. Treat the URL as a secret: anyone who has it can spend your quota.',
  },
  {
    q: 'Which plan do I need?',
    a: 'The free tier is 10 requests/month with a hard cap: enough to verify the connector works, not to use it. For day-to-day use, the $10 PRO plan (2,500 requests/month on flights) is the realistic floor. Every plan includes all of its API’s endpoints.',
  },
  {
    q: 'Why developer mode, and which ChatGPT plan has it?',
    a: 'Custom MCP connectors in ChatGPT are added through its developer-mode connector settings, which OpenAI documents as a Pro and Business plan feature (checked 2026-08-27). Nothing about the server itself is experimental: the same URL serves Claude, Cursor, and any other MCP client.',
  },
  {
    q: 'Can ChatGPT run these searches on a schedule?',
    a: 'Not confirmed. ChatGPT has scheduled Tasks on every plan, but OpenAI does not document whether custom developer-mode connectors run inside a Task, and we have not verified that they do. If you want a scheduled daily fare scan today, Claude is the verified path: its scheduled tasks run the same two connector URLs on any paid Claude plan.',
  },
  {
    q: 'Can I try it before adding a key?',
    a: 'Yes. The live demo on the homepage and the free tools on this site run real requests on our key, so you can see the exact responses ChatGPT will get before you subscribe.',
  },
];

export default function ChatGptIntegrationPage() {
  return (
    <AgentIntegrationPage
      slug="chatgpt"
      lede="ChatGPT’s developer-mode connectors speak MCP. Two URLs, flights and hotels, connect it to live Google Flights and Booking.com data, billed to your own key, judged by Google’s own price band."
      heroCodeLabel="add each as a connector (developer mode)"
      steps={steps}
      promptsLede="ChatGPT picks the tool and fills the parameters itself: these all work as written."
      prompts={[
        'Is $480 for LHR to JFK in mid-October a good price, or should I wait?',
        'Find me the cheapest nonstop from Berlin to Paris in the second week of June.',
        'Round trip JFK to London, out September 22, back September 29. Rank the options by value rather than price alone.',
        'Find a hotel in Tokyo Shibuya for November 3 to 7, 2 adults, breakfast included.',
        'Compare what the same room at the Kremlin Palace in Antalya costs when booked from Germany versus the US.',
      ]}
      toolsEyebrow="Tool inventory"
      toolsTitle="The four tools ChatGPT sees"
      toolsLede="Printed raw on purpose: this page is written to be read by an agent as much as by a person."
      tools={tools}
      faq={faq}
    />
  );
}
