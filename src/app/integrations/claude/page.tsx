import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import Link from 'next/link';
import { Section, SectionHead, type Faq } from '@/components/ui';
import { CLAUDE_FARE_ALERT_PAGE } from '@/lib/matrix';
import { CopyPrompt } from '@/components/CopyPrompt';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';

const FLIGHTS_PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const HOTELS_PRO = HOTEL_PLANS.find((p) => p.name === 'PRO')!;

/*
 * Conversion pass 2026-10-23 (state/gtm/research/site-fronts-2026-10-23.md in the
 * agents repo). This page produced a payer the same day (Google -> this page ->
 * paid connector sign-in -> 10 free searches -> PRO), while fp_events showed 0
 * install_click on it since the Add buttons shipped 10-22 (9 sessions). So the
 * Add buttons and the free-then-$10 line move into the phone's first screen, and
 * the box carries one first prompt sized to fit the free 10 a day: a 7-date
 * scan, where a month across three cities (90 searches) is refused on the free
 * allowance with nothing spent. Copies are counted (api_upsell_click/copy_prompt).
 */
const FIRST_PROMPT =
  'Check one-way fares from London Heathrow to Lisbon for every day from March 1 to March 7, 2027. Which day is cheapest, and does Google call that price low, typical or high?';

export const dynamic = 'force-static';

// "google flights connector claude" is the query cluster that already clicks
// (25% CTR); the title uses that word. title.absolute keeps the suffix off.
export const metadata: Metadata = {
  ...withOg({
    title: 'Google Flights connector for Claude: live fares in claude.ai',
    description:
      "Google Flights connector for Claude: two connector URLs in claude.ai, Google sign-in, every fare with Google's price band and a low/typical/high verdict.",
    alternates: { canonical: '/integrations/claude' },
  }),
  title: { absolute: 'Google Flights connector for Claude: live fares in claude.ai' },
};

const steps: ConnectStep[] = [
  {
    title: 'Add the connector',
    body: 'Press Add to Claude on the flights row above (and on the hotels row if you want hotels too): claude.ai opens Add custom connector with the name and URL filled in: press Continue, choose ‘Sign in when needed’ (not the pre-selected ‘No sign-in’), then Add. By hand it is Customize → Connectors → + Add → Add custom connector, a name and the URL flights.flightpowers.com/mcp (hotels.flightpowers.com/mcp for hotels), then the same: press Continue, choose ‘Sign in when needed’ (not the pre-selected ‘No sign-in’), then Add.',
  },
  {
    title: 'Turn it on in a chat, then ask',
    body: 'In a chat, press + → Connectors and turn FlightPowers on, then ask for a fare. Claude asks you to sign in with Google the first time it searches: the first 10 searches a day are free, with no ads, shared by the flights and hotels connectors.',
  },
  {
    title: 'For the big scans, add your key',
    body: 'When you want more than 10 a day, paste a RapidAPI key once at flights.flightpowers.com/connect (the PRO plan above). For scripts and clients without a sign-in button, send the same URL with an x-rapidapi-key header instead.',
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
    q: 'Does my key end up in the conversation?',
    a: 'No. On the sign-in path it goes into the form at flights.flightpowers.com/connect once and never reaches your client. On the key path it lives in the connector configuration, as a header or on the URL, not in the chat. A URL with a key on it is a secret: anyone holding it can spend your quota.',
  },
  {
    q: 'Is my key billed to me?',
    a: 'Yes. The MCP servers are bring-your-own-key: Claude sends your RapidAPI key with each call and usage meters against your own subscription. There is no FlightPowers account and no second bill.',
  },
  {
    q: 'Which plan do I need?',
    a: 'The free tier is 10 requests/month with a hard cap: enough to verify the connector works, not to use it. For an assistant you actually talk to, the $10 PRO plan (2,500 requests/month on flights) is the realistic floor. Every plan includes all of its API’s endpoints.',
  },
  {
    q: 'Can I try it before adding a key?',
    a: 'Yes. Sign in with Google and the first 10 searches a day are free and ad-free, shared by the flights and hotels connectors, before you paste any key.',
  },
  {
    q: 'Can Claude run these searches on a schedule?',
    a: 'Yes. Claude has native scheduled tasks on paid plans (sidebar → Scheduled → New task, per Anthropic\u2019s help pages, checked 2026-08-27): they run server-side on a schedule you set and can use these connectors, which turns this setup into a daily fare scan that pings you when the verdict says low.',
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
      lede={`Add the connector to Claude and sign in with Google: 10 free searches a day, then $${FLIGHTS_PRO.priceMonthly} for ${FLIGHTS_PRO.quota.toLocaleString('en-US')} flight searches on your own key. Claude searches live Google Flights fares and Booking.com rates mid-conversation, with Google’s own price verdict on the fares it quotes.`}
      installFirst
      installExtra={
        <>
          <p className="text-[13.5px] text-ink-300 leading-relaxed">
            Then paste this as your first message. It is 7 searches, inside the free 10 a day:
          </p>
          <CopyPrompt prompt={FIRST_PROMPT} tool="claude-connector" />
          <p className="text-[12.5px] text-ink-400 leading-relaxed">
            30 days of dates to three cities is 90 searches: that is what the ${FLIGHTS_PRO.priceMonthly} key is for. The Hotels
            connector searches live Booking.com rates on the same 10 free a day (hotels PRO is ${HOTELS_PRO.priceMonthly} for{' '}
            {HOTELS_PRO.quota.toLocaleString('en-US')}).{' '}
            <Link href="/integrations/claude/connectors" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Both connectors
            </Link>
          </p>
        </>
      }
      heroCodeLabel="the ad-free servers, to add by hand"
      steps={steps}
      promptsLede="Claude picks the tool and fills the parameters itself: these all work as written."
      prompts={[
        'Find me a nonstop LHR to JFK flight on March 10, 2027 and tell me if the price is any good.',
        'What is the cheapest day to fly Lisbon to New York in February 2027?',
        'I need a round trip JFK to Paris, out March 10, 2027, back March 17. What are my best-value options?',
        'Find a hotel in Lisbon, March 5 to 8, 2027, 2 adults, review score 8+, free cancellation.',
        'Price the Rixos Sungate in Antalya for May 5–10, 2027 as seen from the US, Germany, and Israel.',
      ]}
      toolsEyebrow="Tool inventory"
      toolsTitle="The search tools Claude sees"
      toolsLede="The flight tools sit on the flights connector and the hotel tools on the hotels one; Claude shows each connector’s full list. Printed raw on purpose: this page is written to be read by an agent as much as by a person."
      tools={tools}
      extra={
        <Section>
          <SectionHead eyebrow="Fare alerts" title="A Claude fare alert" />
          <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
            Poll a route on a schedule and act only when Google&apos;s verdict reads low: the{' '}
            <Link href="/integrations/claude/fare-alert-cron" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              fare-alert recipe for these connectors
            </Link>{' '}
            has the prompt, the call and the fields it reads. On the desktop app with a config file instead, use the{' '}
            <Link href={CLAUDE_FARE_ALERT_PAGE} className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Claude fare alert in Claude Desktop
            </Link>
            .
          </p>
        </Section>
      }
      faq={faq}
      install="claude"
      stepsNote={
        <>
          <p>Claude Free allows one custom connector: add Flights, or Hotels if rooms are what you need.</p>
          <p>
            The ad-free Flights and Hotels connectors have their own page:{' '}
            <Link href="/integrations/claude/connectors" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              FlightPowers connectors for Claude
            </Link>
            .
          </p>
          <p>Add it on the web once, then it works in the Claude app on your phone.</p>
          <p>On a Team plan an Owner adds the connector first; members then press Connect.</p>
        </>
      }
    />
  );
}
