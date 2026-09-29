import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CapturedBadge,
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  PriceBand,
  Section,
  SectionHead,
  VerdictBadge,
  type Faq,
} from '@/components/ui';
import { FLIGHT_PLANS, HOTEL_PLANS, READ_ON, fmtOverage, type Plan } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

/**
 * A one-pager for teams building consumer AI assistants.
 *
 * Every claim on this page comes from the api-growth agent's facts sheet for
 * the assistants pitch (state/gtm/gtm/ASSISTANTS-PITCH-FINAL-2026-09-29.md:
 * "One-pager", "Facts sheet", "Objection handling") or from lib/pricing.ts.
 * The example is ONE recorded paid-MCP run (2026-09-29, 13:06:50Z to
 * 13:08:56Z); its numbers are that run's and are never re-typed from memory.
 * Only the paid servers are named here: an assistant product does not route
 * its users through an ad-carrying server.
 */

export const metadata: Metadata = {
  ...withOg({
    title: 'FlightPowers for assistant products',
    description:
      'Live Google Flights fares and Booking.com rates for AI assistants: a month, several cities and trip lengths in one MCP call, a booking link on every row.',
    alternates: { canonical: '/assistants' },
  }),
  // The layout template would append " · FlightPowers" to a title that already
  // starts with the brand.
  title: { absolute: 'FlightPowers for assistant products' },
};

export const dynamic = 'force-static';

const CONTACT_EMAIL = 'matan@flightpowers.com';

/** The recorded run (facts sheet 8; key fields from the product draft's Run A). */
const RUN = {
  stamp: '2026-09-29 13:08Z',
  combinations: 270,
  rowsReturned: 60,
  typical: 50,
  high: 10,
  elapsedSeconds: 126,
} as const;

const RUN_CALL = `{
  "from_airport": "JFK",
  "to_airport": ["LIS", "BCN", "FCO"],
  "departure_date_from": "2026-11-01",
  "departure_date_to": "2026-11-30",
  "nights": [4, 5, 6],
  "sort_by": "price"
}`;

const RUN_COUNTS = `requested_combinations  ${RUN.combinations}
searched_combinations   ${RUN.combinations}
truncated               false
results_returned        ${RUN.rowsReturned}
hub_requests_billed     ${RUN.combinations}`;

type CityRow = {
  city: string;
  price: number;
  dates: string;
  nights: number;
  airline: string;
  verdict: 'typical' | 'high';
  low: number;
  high: number;
};

/** by_destination from that one call: each city's own cheapest fare. */
const CITIES: CityRow[] = [
  {
    city: 'Barcelona',
    price: 552,
    dates: 'Nov 8 to Nov 13',
    nights: 5,
    airline: 'British Airways out via London, Air Europa back via Madrid, one stop each way',
    verdict: 'typical',
    low: 435,
    high: 660,
  },
  {
    city: 'Rome',
    price: 573,
    dates: 'Nov 11 to Nov 17',
    nights: 6,
    airline: 'TAP',
    verdict: 'high',
    low: 370,
    high: 560,
  },
  {
    city: 'Lisbon',
    price: 606,
    dates: 'Nov 7 to Nov 13',
    nights: 6,
    airline: 'Aer Lingus',
    verdict: 'typical',
    low: 415,
    high: 680,
  },
];

/* Arithmetic from the live plan data, so the words cannot drift from the table. */
const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const PER_SEARCH = PRO.priceMonthly / PRO.quota;
const SCAN_COST = (RUN.combinations * PER_SEARCH).toFixed(2);
const WEEK_CENTS = Math.round(7 * PER_SEARCH * 100);
const SCANS_PER_PRO = Math.floor(PRO.quota / RUN.combinations);
const fmtInt = (n: number) => n.toLocaleString('en-US');
const HOTEL_PRO = HOTEL_PLANS.find((p) => p.name === 'PRO')!;

const RATE_LADDER = FLIGHT_PLANS.filter((p) => p.ratePerMinute !== null)
  .map((p) => `${p.name} ${p.ratePerMinute} a minute (${fmtInt(p.quota)} a month)`)
  .join(', ');
const PRO_RATE = PRO.ratePerMinute;
const MEGA_RATE = FLIGHT_PLANS.find((p) => p.name === 'MEGA')!.ratePerMinute;

const KEY_CONFIG = `{
  "mcpServers": {
    "flights": {
      "url": "${LINKS.mcpFlights}",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    },
    "hotels": {
      "url": "${LINKS.mcpHotels}",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    }
  }
}`;

const faq: Faq[] = [
  {
    q: 'How long does a call take?',
    a: `The ${RUN.combinations}-combination MCP call above came back in ${RUN.elapsedSeconds} seconds end to end: one round trip for your agent instead of a browser session per city and trip length. On REST a request is one date pair. A 7-date run took 26 seconds as 7 sequential calls with a 1.2 second pause between them, and a month-wide scan on REST runs in parallel at ${PRO_RATE} a minute on PRO and ${MEGA_RATE} on MEGA. Fares are fetched live at request time, no cache, so what comes back is what Google shows at that second. Both times are the elapsed times of those two runs on 2026-09-29.`,
  },
  {
    q: 'What about uptime? Is there an SLA?',
    a: 'It is a resilient design with no UI elements in the path, and it has run a year without a Google break. Scheduled tests run a few times a day, so I notice a break and fix it right away. The same lane serves 33 paying API customers and about 1.2M calls per 8 days on the flights listing (September 2026).',
  },
  {
    q: 'What are the rate limits at our volume?',
    a: `${RATE_LADDER}, and I can also create a custom plan for real volume. One MCP call prices up to 300 combinations and bills one request per combination, so you can size a test on a slice of your travel questions before you run it.`,
  },
  {
    q: 'Do you book?',
    a: 'No. Every flight row carries Google’s booking link, and every hotel its Booking.com property link. The booking, the payment, the loyalty logins and the commission stay on your side, exactly as today. No PNR, no card, no passport data and no user credentials ever reach us.',
  },
  {
    q: 'What can we do with the results?',
    a: 'Whatever you want, including storing them.',
  },
];

function PlanLadder({ title, plans }: { title: string; plans: Plan[] }) {
  return (
    <div>
      <p className="font-mono text-[12px] uppercase tracking-wider text-ink-400">{title}</p>
      <div className="mt-3 overflow-x-auto rounded-2xl border rule">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
              <th className="px-4 py-3 font-normal">Plan</th>
              <th className="px-4 py-3 font-normal text-right">Per month</th>
              <th className="px-4 py-3 font-normal text-right">Searches</th>
              <th className="px-4 py-3 font-normal text-right">Rate</th>
              <th className="px-4 py-3 font-normal text-right">Past the quota</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.name} className="border-t rule">
                <td className="px-4 py-3 font-semibold text-ink-100">{plan.name}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-100">
                  {plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}`}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{fmtInt(plan.quota)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-400">
                  {plan.ratePerMinute === null ? 'n/a' : `${plan.ratePerMinute} / min`}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-400">{fmtOverage(plan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AssistantsPage() {
  return (
    <>
      <Container className="pt-14 sm:pt-20 pb-4">
        <p className="eyebrow">For assistant products</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          FlightPowers for <span className="text-signal-500">assistant products</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Live Google Flights fares and Booking.com rates your assistant can call, with Google&apos;s own verdict on the price
          and a booking link on every row. I&apos;m Matan, I built this, and I answer the email myself.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Cta href={`mailto:${CONTACT_EMAIL}?subject=FlightPowers%20for%20our%20assistant`} external variant="accent">
            Email me
          </Cta>
          <Cta href={rapidApiPricingUrl('flights', 'assistants')} external variant="ghost">
            Get a flights key
          </Cta>
        </div>
        <p className="mt-6 font-mono text-[12px] text-ink-500">
          33 paying API customers · about 1.2M calls per 8 days on the flights listing (September 2026)
        </p>
      </Container>

      <Section className="mt-10">
        <SectionHead eyebrow="The question" title="What your users ask" />
        <blockquote className="mt-8 max-w-3xl border-l-2 border-signal-500 pl-5 text-[1.25rem] sm:text-[1.5rem] leading-snug text-ink-100">
          &ldquo;Find me the cheapest week in Lisbon, Barcelona or Rome this November, 4 to 6 nights, from New York.&rdquo;
        </blockquote>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          In a browser that is a page per city and trip length, in a session a CAPTCHA can end. Here it is one MCP call.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="One call" title="What one call returns" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Every combination, priced live.</strong> One MCP call takes a date range, a list
                of destination airports and a list of night options, and prices every combination on our side, up to 300 in one
                call.
              </>,
              <>
                <strong className="text-ink-100">A round trip is one request.</strong> Both legs priced together, one total, one
                booking link.
              </>,
              <>
                <strong className="text-ink-100">Google&apos;s verdict on every row.</strong> The low and high of Google&apos;s
                usual range for that route and period (<code className="field">price_insights_low</code> /{' '}
                <code className="field">price_insights_high</code>) and its low / typical / high verdict, so your assistant can say
                whether a fare is a good one.
              </>,
              <>
                <strong className="text-ink-100">Each city&apos;s cheapest.</strong>{' '}
                <code className="field">by_destination</code> names every requested city&apos;s own cheapest fare.
              </>,
              <>
                <strong className="text-ink-100">Families and cabins.</strong> Children and infant fares, premium economy and
                first, long stays.
              </>,
              <>
                <strong className="text-ink-100">Hotels on the same RapidAPI account, their own plan.</strong> Live Booking.com
                rates by destination or by property name (the match is echoed back), and the rate as seen from a country you
                choose.
              </>,
            ]}
          />
        </div>
      </Section>

      <Section id="example">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">Example</p>
          <CapturedBadge date={RUN.stamp} />
        </div>
        <h2 className="mt-3 text-[1.75rem] sm:text-4xl font-semibold max-w-3xl">That question, run once</h2>
        <p className="lede mt-4 max-w-2xl">
          New York to Lisbon, Barcelona or Rome, any day in November, 4, 5 or 6 nights: {RUN.combinations} combinations in one
          call on the paid flights server.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Code label={`search_roundtrip_flights · ${LINKS.mcpFlights.replace('https://', '')}`}>{RUN_CALL}</Code>
          <Code label="What came back">{RUN_COUNTS}</Code>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {CITIES.map((c) => (
            <div key={c.city} className="rounded-2xl border rule bg-ink-900/60 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[16px] font-semibold text-ink-100">{c.city}</p>
                <VerdictBadge verdict={c.verdict} />
              </div>
              <p className="mt-2 font-mono text-[1.75rem] tabular-nums text-ink-100">${c.price}</p>
              <p className="mt-1 text-[14px] text-ink-300">
                {c.dates}, {c.nights} nights
              </p>
              <p className="mt-1 text-[13px] text-ink-400">{c.airline}</p>
              <div className="mt-4">
                <PriceBand low={c.low} high={c.high} price={c.price} label="Google's usual range" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-3xl space-y-3 text-[15px] text-ink-300 leading-relaxed">
          <p>
            Cheapest overall: ${CITIES[0].price} to Barcelona, and Google marks it typical. Rome comes in under Lisbon in dollars,
            but Google marks it high for that route. Of the {RUN.rowsReturned} rows returned, {RUN.typical} were typical and{' '}
            {RUN.high} high.
          </p>
          <p>
            The call was billed as {RUN.combinations} searches, about ${SCAN_COST} on PRO. Prices are live at fetch time, so a
            re-run gives that day&apos;s numbers.
          </p>
        </div>
      </Section>

      <Section id="integrate">
        <SectionHead eyebrow="Integration" title="How it plugs in" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">MCP over streamable HTTP</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              <code className="field">{LINKS.mcpFlights.replace('https://', '')}</code> and{' '}
              <code className="field">{LINKS.mcpHotels.replace('https://', '')}</code>, your RapidAPI key in an{' '}
              <code className="field">x-rapidapi-key</code> header. Hosted, nothing to run. For a person on your team trying it in
              Claude or Cursor, sign in with Google and paste the key once at{' '}
              <a href={LINKS.mcpConnectFlights} rel="noopener" className="text-signal-400 hover:text-signal-500">
                {LINKS.mcpConnectFlights.replace('https://', '')}
              </a>
              .
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">REST</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              The same data on RapidAPI (
              <a href={LINKS.rapidapiFlights} rel="noopener" className="text-signal-400 hover:text-signal-500">
                google-flights-live-api
              </a>
              ,{' '}
              <a href={LINKS.rapidapiHotels} rel="noopener" className="text-signal-400 hover:text-signal-500">
                booking-live-api
              </a>
              ) and on <code className="field">{SITE.apiHost}</code>. One date pair per request, run in parallel at your
              plan&apos;s rate.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">n8n</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              The{' '}
              <a href={LINKS.npmNode} rel="noopener" className="text-signal-400 hover:text-signal-500">
                n8n-nodes-flightpowers
              </a>{' '}
              community node, if your team prototypes flows before writing code.{' '}
              <Link href="/integrations/n8n" className="text-signal-400 hover:text-signal-500">
                Setup
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="mt-8 max-w-3xl">
          <Code label="MCP client config, key in a header">{KEY_CONFIG}</Code>
          <p className="mt-4 text-[14px] text-ink-400">
            Tool names and arguments are on the{' '}
            <Link href="/mcp" className="text-signal-400 hover:text-signal-500">
              MCP page
            </Link>{' '}
            and in the{' '}
            <Link href="/docs" className="text-signal-400 hover:text-signal-500">
              docs
            </Link>
            .
          </p>
        </div>
      </Section>

      <Section id="price">
        <SectionHead
          eyebrow="Price"
          title="The plans"
          lede={`On PRO a search costs $${PER_SEARCH}, so a ${RUN.combinations}-combination scan is about $${SCAN_COST}, a 7-date week about ${WEEK_CENTS} cents, and ${fmtInt(PRO.quota)} searches is about ${SCANS_PER_PRO} month-wide scans.`}
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <PlanLadder title="Flights" plans={FLIGHT_PLANS} />
          <PlanLadder title="Hotels" plans={HOTEL_PLANS} />
        </div>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          Flights and hotels are separate subscriptions on the same RapidAPI account (hotels PRO is ${HOTEL_PRO.priceMonthly}{' '}
          for {fmtInt(HOTEL_PRO.quota)}). Custom plans for volume:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-signal-400 hover:text-signal-500">
            write to me
          </a>
          .
        </p>
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          Read from the live listings on {READ_ON}; the listing is authoritative.
        </p>
      </Section>

      <Section id="questions">
        <FaqSection items={faq} heading="The five questions a CTO asks" />
      </Section>

      <Section id="not">
        <SectionHead eyebrow="Scope" title="What we do not do" />
        <div className="mt-8 max-w-3xl space-y-3 text-[15px] text-ink-300 leading-relaxed">
          <p>
            No booking, no payment, no PNR, and we are not a GDS. No card, no passport data, no user credentials.
          </p>
          <p>
            Live fares and rates with a link: your agent books where it books today and keeps its commission.
          </p>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <div className="rounded-3xl border rule bg-ink-900/70 px-6 py-10 sm:px-12 sm:py-16 text-center">
          <h2 className="text-[1.75rem] sm:text-4xl font-semibold">Talk to the person who built it</h2>
          <p className="lede mx-auto mt-4 max-w-2xl">
            Tell me what your assistant gets asked and how many searches a trip takes. I answer myself.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta href={`mailto:${CONTACT_EMAIL}?subject=FlightPowers%20for%20our%20assistant`} external variant="primary">
              {CONTACT_EMAIL}
            </Cta>
            <Cta href="/pricing" variant="ghost">
              See pricing
            </Cta>
          </div>
        </div>
      </Section>
    </>
  );
}
