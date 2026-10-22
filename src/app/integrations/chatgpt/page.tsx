import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import type { Faq } from '@/components/ui';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Live flight & hotel data in ChatGPT: MCP connector setup',
  description:
    'Connect ChatGPT to live Google Flights and Booking.com data through developer-mode MCP connectors: one URL per API, a Google sign-in, and Google’s low/typical/high price verdict on every fare.',
  alternates: { canonical: '/integrations/chatgpt' },
});

const steps: ConnectStep[] = [
  {
    title: 'Turn on developer mode',
    body: 'On chatgpt.com, open the Plugins settings and switch Developer mode on (the first link below). It needs a paid ChatGPT plan (Plus or above) on the web; free accounts can’t add custom servers yet.',
  },
  {
    title: 'Add the server as a plugin',
    body: 'Go to chatgpt.com/plugins → + → Add custom MCP server. Name it and paste the Server URL: https://free-trial.flightpowers.com/mcp for the free server. Set Authentication to OAuth and leave the client id and secret empty. Select I understand and want to continue, then Create as a plugin.',
  },
  {
    title: 'Install it, sign in, then @ it in a chat',
    body: 'It is your own private plugin, not a listing: install it from your plugins, sign in with Google, and in a new chat type @ and pick FlightPowers. For no ads and the big scans, add https://flights.flightpowers.com/mcp the same way: the first 10 searches a day are free after sign-in, then the PRO key above. We have no paid ChatGPT account, so we have not run this end to end ourselves; if the plugin refuses to attach, the fallback is the keyed URL with ?rapidapi_key= on it and authentication set to none.',
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
    a: 'ChatGPT adds custom MCP servers as plugins, and only with developer mode on. It needs a paid ChatGPT plan (Plus or above) on the web; free accounts can’t add custom servers yet (OpenAI’s docs, read 2026-09-16). Nothing about the server itself is experimental: the same URL serves Claude, Cursor, and any other MCP client.',
  },
  {
    q: 'Can ChatGPT run these searches on a schedule?',
    a: 'Not confirmed. ChatGPT has scheduled Tasks on every plan, but OpenAI does not document whether custom developer-mode connectors run inside a Task, and we have not verified that they do. If you want a scheduled daily fare scan today, Claude is the verified path: its scheduled tasks run the same two connector URLs on any paid Claude plan.',
  },
  {
    q: 'Can I try it before adding a key?',
    a: 'Yes, two ways. The free server (free-trial.flightpowers.com/mcp) needs only a Google sign-in: 50 searches a day, with one labelled sponsored card per result. The keyed servers give you the first 10 searches a day free and ad-free after the same sign-in, before you paste any key.',
  },
];

export default function ChatGptIntegrationPage() {
  return (
    <AgentIntegrationPage
      slug="chatgpt"
      lede="ChatGPT’s developer mode speaks MCP. Add one URL, free, and ChatGPT searches live Google Flights and Booking.com data, judged by Google’s own price band."
      heroCodeLabel="the ad-free server URLs (developer mode)"
      steps={steps}
      promptsLede="ChatGPT picks the tool and fills the parameters itself: these all work as written."
      prompts={[
        'Is $480 for LHR to JFK in mid-March 2027 a good price, or should I wait?',
        'Find me the cheapest nonstop from Berlin to Paris in the second week of June 2027.',
        'Round trip JFK to London, out March 22, 2027, back March 29. Rank the options by value rather than price alone.',
        'Find a hotel in Tokyo Shibuya for March 3 to 7, 2027, 2 adults, breakfast included.',
        'Compare what the same room at the Kremlin Palace in Antalya costs when booked from Germany versus the US.',
      ]}
      toolsEyebrow="Tool inventory"
      toolsTitle="The search tools ChatGPT sees"
      toolsLede="The free server lists these four. On the ad-free servers the flight tools sit on the flights connector and the hotel tools on the hotels one, and the hotels connector also lists compare_hotel_rates; ChatGPT shows each connector’s full list. Printed raw on purpose: this page is written to be read by an agent as much as by a person."
      tools={tools}
      faq={faq}
      install="chatgpt"
      stepsNote={
        <>
          <p>
            Two shortcuts into ChatGPT’s settings (they fill nothing in; if one lands somewhere else, follow the steps above):{' '}
            <a href="https://chatgpt.com/plugins#settings/Security" rel="noopener" className="text-signal-400 underline underline-offset-4">
              turn on developer mode
            </a>{' '}
            and{' '}
            <a
              href="https://chatgpt.com/plugins#settings/Connectors?create-connector=true"
              rel="noopener"
              className="text-signal-400 underline underline-offset-4"
            >
              add a server
            </a>
            .
          </p>
          <p>
            Needs a paid ChatGPT plan (Plus or above) on the web; free accounts can’t add custom servers yet (OpenAI’s docs,
            read 2026-09-16).
          </p>
        </>
      }
    />
  );
}
