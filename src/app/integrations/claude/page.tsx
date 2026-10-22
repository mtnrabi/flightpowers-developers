import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import { AgentIntegrationPage, type ConnectStep, type ToolLine } from '../_agent-page';
import Link from 'next/link';
import { Section, SectionHead, type Faq } from '@/components/ui';
import { CLAUDE_FARE_ALERT_PAGE } from '@/lib/matrix';

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
    title: 'Add the free server',
    body: 'Press Add to Claude above: claude.ai opens Add custom connector with the name and URL filled in. Press Add, then Connect, and sign in with Google. By hand it is Customize → Connectors → + Add → Add custom connector, with the URL free-trial.flightpowers.com/mcp.',
  },
  {
    title: 'Turn it on in a chat, then ask',
    body: 'In a chat, press + → Connectors and turn FlightPowers on, then ask for a fare. 50 searches a day, flights and hotels, with one labelled sponsored card per result.',
  },
  {
    title: 'For no ads and the big scans, add the keyed servers',
    body: 'Press Add to Claude on the flights row above (and hotels if you want them) and sign in with Google: the first 10 searches a day are free and ad-free. When you want more, paste a RapidAPI key once on the page that opens (the PRO plan above). For scripts and clients without a sign-in button, send the same URL with an x-rapidapi-key header instead.',
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
    a: 'Yes, two ways. The free server (free-trial.flightpowers.com/mcp) needs only a Google sign-in: 50 searches a day, with one labelled sponsored card per result. The keyed servers give you the first 10 searches a day free and ad-free after the same sign-in, before you paste any key.',
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
      lede="Add one connector, free, and Claude searches live Google Flights and Booking.com data mid-conversation, with Google’s own price verdict attached to every fare it quotes."
      heroCodeLabel="the ad-free servers, to add by hand"
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
          <p>Claude Free allows one custom connector: use the free server, it has flights and hotels in one URL.</p>
          <p>Add it on the web once, then it works in the Claude app on your phone.</p>
          <p>On a Team plan an Owner adds the connector first; members then press Connect.</p>
        </>
      }
    />
  );
}
