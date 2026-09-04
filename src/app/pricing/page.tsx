import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { KeyVerifyBox } from '@/components/KeyVerifyBox';
import { PricingTable } from '@/components/PricingTable';
import {
  CapturedBadge,
  Code,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  PriceBand,
  Section,
  SectionHead,
  VerdictBadge,
  type Faq,
} from '@/components/ui';
import { APIFY, FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Pricing: Google Flights & Booking.com API Plans · From $0 to $50/month',
  description:
    'Transparent API pricing. Flights: $0, $10, $25, $50/month for 10 to 50,000 requests. Hotels: $0, $10, $20, $50/month for 10 to 25,000 requests. Free tier available with no credit card. Billed on RapidAPI. Compare $ per 1,000 requests. No feature gates.',
  alternates: { canonical: '/pricing' },
});

export const dynamic = 'force-static';

/**
 * The live one-way response below. Run from this repo against the production
 * front on 2026-09-04 at 17:52 UTC:
 *
 *   POST https://api.flightpowers.com/v1/flights/oneway
 *   {"departure_id":"LHR","arrival_id":"BCN","outbound_date":"2026-10-20"}
 *
 * (executed through the site's own /api/demo route, which holds the key and
 * passes the upstream body and the X-Search-* headers through untouched).
 *
 * Trimmed to the FIRST of the five results returned, and `buy_link` is cut at
 * the query string. No field was renamed, reordered, or invented. Re-run the
 * same request before changing any number here.
 */
const LIVE_ONEWAY = {
  ranAtUtc: '2026-09-04',
  low: 50,
  high: 110,
  price: 52,
  json: `POST /v1/flights/oneway
{"departure_id":"LHR","arrival_id":"BCN","outbound_date":"2026-10-20"}

200 OK
x-search-status:       ok
x-search-results:      5
x-search-attempts:     2
x-search-retries:      1
x-search-notes:        upstream_connection

[
  {
    "price_range_in_relation_to_other_periods": "typical",
    "price_insights_low": 50,
    "price_insights_high": 110,
    "from_airport": "London (LHR)",
    "to_airport": "Barcelona (BCN)",
    "departure_date": "2026-10-20",
    "price": "$52",
    "price_as_number": 52,
    "duration": "2 hr 20 min",
    "duration_seconds": 8400,
    "airline": "Vueling | Iberia, British Airways",
    "stops": 0,
    "stops_info": [],
    "departure_description": "8:50 PM on Tue, Oct 20",
    "arrival_description": "12:10 AM on Wed, Oct 21",
    "buy_link": "https://www.google.com/travel/flights?tfs=GjwSCjIwMjYtMTAtMjAi..."
  }
  // 4 more results, same shape
]`,
};

/**
 * The live round-trip response. Same route in, same run window:
 * 2026-09-04, 17:49 UTC.
 *
 *   POST https://api.flightpowers.com/v1/flights/roundtrip
 *   {"departure_id":"JFK","arrival_id":"LAX",
 *    "outbound_date":"2026-10-15","return_date":"2026-10-22"}
 *
 * First of the itineraries returned, cut down to the paired-leg fields.
 * Nothing renamed.
 */
const LIVE_ROUNDTRIP = `{
  "total_price": "$389",
  "total_price_as_number": 389,
  "total_stops": 0,
  "total_duration_seconds": 41820,
  "price_insights_low": 180,
  "price_insights_high": 385,
  "price_range_in_relation_to_other_periods": "high",

  "departure_flight_airline": "American",
  "departure_flight_departure_description": "6:00 AM on Thu, Oct 15",
  "departure_flight_arrival_description": "9:11 AM on Thu, Oct 15",
  "departure_flight_duration": "6 hr 11 min",
  "departure_flight_stops": 0,

  "return_flight_airline": "American",
  "return_flight_departure_description": "3:29 PM on Thu, Oct 22",
  "return_flight_arrival_description": "11:55 PM on Thu, Oct 22",
  "return_flight_duration": "5 hr 26 min",
  "return_flight_stops": 0
}`;

/**
 * Rival listings, all four read on 2026-09-04 from this machine with a plain
 * desktop user-agent. Prices and quotas are parsed out of each listing page's
 * own RSC payload (the `billingplan_` objects), PUBLIC plans only, with the
 * same parser scripts/check-pricing.mjs runs against ours. The "documents"
 * column is a count of occurrences of `price_insights`, a low/typical/high
 * verdict field, and `x-search-` in that same payload, which is the surface
 * that carries the endpoint docs: ours returns 30, 9 and 62; all four of these
 * return 0.
 *
 *   https://rapidapi.com/things4u-api4upro/api/google-flights4
 *   https://rapidapi.com/DataCrawler/api/google-flights2
 *   https://rapidapi.com/ntd119/api/flights-sky
 *   https://rapidapi.com/apiheya/api/sky-scrapper
 *
 * Source of the payload for each: fetch the listing ROOT, not /pricing.
 */
const RIVALS = [
  {
    name: 'google-flights4',
    vendor: 'things4u-api4upro',
    entry: 'Pro $14 / 35,000',
    perK: '$0.40',
    free: '110 / mo',
    note: 'Google Flights. 14 endpoints, including price graphs and date grids we do not have. 5 requests/second.',
  },
  {
    name: 'google-flights2',
    vendor: 'DataCrawler',
    entry: 'Pro $12.99 / 40,000',
    perK: '$0.32',
    free: '150 / mo',
    note: 'Google Flights. 13 endpoints, multi-city included. No per-minute rate limit set on any plan.',
  },
  {
    name: 'flights-sky',
    vendor: 'ntd119',
    entry: 'Pro $15 / 15,000',
    perK: '$1.00',
    free: '50 / mo',
    note: 'Its page names Skyscanner 15 times. Different source, so not the same payload as ours.',
  },
  {
    name: 'sky-scrapper',
    vendor: 'apiheya',
    entry: 'Pro $9.99 / 10,600',
    perK: '$0.94',
    free: '20 / mo',
    note: 'Describes itself as reproducing skyscanner.com and booking.com data. Again, a different source.',
  },
];

const faq: Faq[] = [
  {
    q: 'Do flights and hotels share one plan?',
    a: 'No. They are two listings on RapidAPI with different plans: flights runs $0 / $10 / $25 / $50 at 150 to 500 requests/minute, hotels $0 / $10 / $20 / $50 at 25 to 50. Subscribe to each API you use; the same account key then works for both.',
  },
  {
    q: 'Where does billing actually happen?',
    a: 'On RapidAPI. You subscribe to a plan on the listing’s pricing tab, RapidAPI issues the key and meters usage, and their invoice is your invoice. We never see your card. If your company already uses RapidAPI, there is no new vendor to onboard.',
  },
  {
    q: 'The free tier is only 10 calls. What can I do with that?',
    a: (
      <>
        Enough to see the shape of the thing and not much else. Ten calls buys you a couple of one-way searches with the
        price band in the response, one round trip as a paired itinerary, and a look at the search-status headers. It will
        not survive a load test, and we are not going to pretend otherwise. Evaluate on the{' '}
        <Link href="/#demo" className="text-signal-400 underline underline-offset-4">
          live demo
        </Link>{' '}
        and the{' '}
        <Link href="/tools" className="text-signal-400 underline underline-offset-4">
          free tools
        </Link>{' '}
        here first, because those run real requests on our key and leave your 10 alone, then follow the{' '}
        <Link href="/docs/quickstart" className="text-signal-400 underline underline-offset-4">
          quickstart
        </Link>{' '}
        or the{' '}
        <Link href="/guides/google-flights-api-key" className="text-signal-400 underline underline-offset-4">
          API key guide
        </Link>{' '}
        when you want the key in your own code. The 10 is under review and it may go up. Nothing is promised until it
        changes on the listing itself, so plan around 10.
      </>
    ),
  },
  {
    q: 'How do I move over from Amadeus or Kiwi?',
    a: (
      <>
        Both of those are access problems before they are pricing problems, so the migration guide starts there: which
        providers you can still sign up for today, what each one gates on, and what the request and response actually look
        like next to ours. Read{' '}
        <Link
          href="/guides/amadeus-self-service-alternatives"
          className="text-signal-400 underline underline-offset-4"
        >
          Amadeus Self-Service alternatives
        </Link>
        , or the shorter side-by-side at{' '}
        <Link href="/compare/amadeus" className="text-signal-400 underline underline-offset-4">
          FlightPowers vs Amadeus
        </Link>
        . The short version for both: there is no application form here, the free tier needs no card, and you can have a
        working key before you finish the guide.
      </>
    ),
  },
  {
    q: 'What counts as a request?',
    a: 'A call to any endpoint is one request. The listings state this per plan. A round-trip search is one request. A 30-day flexible-date scan over REST is 30 requests (one per date), which is why the rate limits are sized the way they are.',
  },
  {
    q: 'Do the plans differ in features?',
    a: 'No. Within each API, every plan includes every endpoint. Plans differ only on monthly volume, overage price, and requests per minute. There is no feature gate to hit later.',
  },
  {
    q: 'What happens when I exceed my quota?',
    a: 'On paid plans the quota is soft: extra requests bill at the plan’s overage rate ($0.003/request on flights Pro and Ultra, $0.001 on Mega; $0.006 / $0.003 / $0.002 on hotels). The free tier is a hard cap: requests beyond 10 are rejected, not billed.',
  },
  {
    q: 'What if I need more than 50,000 requests a month?',
    a: 'Message through the RapidAPI listing. Custom volume plans are a normal thing there and the developer answers.',
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers pricing',
          url: `${SITE.url}/pricing`,
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-4">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          We are not the cheapest. <span className="text-signal-500">Here is what a call returns.</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Other Google Flights listings on RapidAPI sell at 32 cents per thousand calls. Ours starts at $4. Before the
          plan table, here is one real response so you can see what is in it and decide for yourself whether the
          difference buys you anything.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Cta href={rapidApiPricingUrl('flights', 'pricing')} external variant="primary">
            Start with free tier →
          </Cta>
          <Cta href="/#demo" variant="ghost">
            Try live demo
          </Cta>
        </div>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <Code label="one-way, London to Barcelona">{LIVE_ONEWAY.json}</Code>
            <div className="mt-3">
              <CapturedBadge date={LIVE_ONEWAY.ranAtUtc} />
              <p className="mt-2 font-mono text-[10.5px] text-ink-500 leading-relaxed">
                Run against api.flightpowers.com on 2026-09-04 at 17:52 UTC. First of five results, buy_link cut at the
                query string. Nothing else edited. Fares move; re-run it yourself with the free tier.
              </p>
            </div>
          </div>

          <div className="space-y-7">
            <div className="rounded-2xl border rule bg-ink-900/60 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[12px] text-signal-400">price_insights_low / high</p>
                <VerdictBadge verdict="typical" />
              </div>
              <div className="mt-4">
                <PriceBand
                  low={LIVE_ONEWAY.low}
                  high={LIVE_ONEWAY.high}
                  price={LIVE_ONEWAY.price}
                  label="$52 against Google's own band for this route and date"
                />
              </div>
              <p className="mt-4 text-[14.5px] text-ink-400 leading-relaxed">
                Google&apos;s own price band comes back inside every result, so $52 is not a number floating on its own.
                It sits at the bottom of a $50 to $110 range. A scraper that returns a list of fares makes you build that
                context yourself, usually by storing history for weeks first.
              </p>
            </div>

            <div className="rounded-2xl border rule bg-ink-900/60 p-6">
              <p className="font-mono text-[12px] text-signal-400">x-search-status</p>
              <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">
                This call took two attempts. The upstream connection dropped once, we retried, and the headers say so:{' '}
                <code className="field">attempts 2</code>, <code className="field">retries 1</code>,{' '}
                <code className="field">status ok</code>. That is the contract. Every response tells you what happened
                behind it, so an empty array is never ambiguous and a partial result is never silently passed off as a
                complete one.{' '}
                <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">
                  How the header works
                </Link>
                .
              </p>
            </div>

            <p className="text-[14.5px] text-ink-400 leading-relaxed">
              Also in there and hard to fake: a working{' '}
              <code className="field">buy_link</code> per result, layovers with durations, and{' '}
              <code className="field">price_as_number</code> next to the display string so you are not parsing currency
              out of text.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The plans"
          title="Pay for volume, nothing else"
          lede="Flights and hotels are separate APIs with separate plans. One RapidAPI account key works for both once you subscribe to each. No card for the free tier, no approval step, no feature gates."
        />
        <div className="mt-10 space-y-12">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h3 className="text-2xl font-semibold">Google Flights Live API</h3>
              <a href={rapidApiPricingUrl('flights', 'pricing')} rel="noopener" className="text-sm text-signal-400 underline underline-offset-4">
                Open the live pricing tab →
              </a>
            </div>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="pricing" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h3 className="text-2xl font-semibold">Booking.com Live API</h3>
              <a href={rapidApiPricingUrl('hotels', 'pricing')} rel="noopener" className="text-sm text-signal-400 underline underline-offset-4">
                Open the live pricing tab →
              </a>
            </div>
            <PricingTable api="hotels" plans={HOTEL_PLANS} medium="pricing" />
          </div>
        </div>
        <div className="mt-8 max-w-4xl rounded-xl border rule bg-ink-900/40 px-5 py-3.5">
          <p className="text-[13px] text-ink-300 leading-relaxed">
            <strong className="text-ink-100">Live on RapidAPI:</strong> Google Flights Live API, 9.9 popularity, 100%
            service level, ~1144ms latency. Booking Live API, 9.6 popularity, 98% service level, ~12475ms latency.
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-500">Metrics retrieved from rapidapi.com/mtnrabi listings on 2026-09-01</p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The obvious objection"
          title="Why not the $0.40 per 1,000 listing"
          lede="It is a fair question and the cheap listings are real. Here is what we found when we read their pages, and what we did not check."
        />

        <div className="mt-10 max-w-4xl overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-[14px]">
            <thead>
              <tr className="border-b rule text-[11px] uppercase tracking-wider text-ink-500">
                <th className="py-3 pr-4 font-medium">Listing</th>
                <th className="py-3 pr-4 font-medium">Entry plan</th>
                <th className="py-3 pr-4 font-medium">Per 1,000</th>
                <th className="py-3 pr-4 font-medium">Free</th>
                <th className="py-3 font-medium">What their page says</th>
              </tr>
            </thead>
            <tbody>
              {RIVALS.map((r) => (
                <tr key={r.name} className="border-b rule align-top">
                  <td className="py-4 pr-4">
                    <code className="field">{r.name}</code>
                    <span className="block mt-1 font-mono text-[11px] text-ink-600">{r.vendor}</span>
                  </td>
                  <td className="py-4 pr-4 text-ink-300 whitespace-nowrap">{r.entry}</td>
                  <td className="py-4 pr-4 font-mono tabular-nums text-ink-100 whitespace-nowrap">{r.perK}</td>
                  <td className="py-4 pr-4 text-ink-300 whitespace-nowrap">{r.free}</td>
                  <td className="py-4 text-ink-400 leading-relaxed">{r.note}</td>
                </tr>
              ))}
              <tr className="align-top">
                <td className="py-4 pr-4">
                  <code className="field">google-flights-live-api</code>
                  <span className="block mt-1 font-mono text-[11px] text-ink-600">mtnrabi (us)</span>
                </td>
                <td className="py-4 pr-4 text-ink-300 whitespace-nowrap">Pro $10 / 2,500</td>
                <td className="py-4 pr-4 font-mono tabular-nums text-signal-400 whitespace-nowrap">$4.00</td>
                <td className="py-4 pr-4 text-ink-300 whitespace-nowrap">10 / mo</td>
                <td className="py-4 text-ink-400 leading-relaxed">
                  Google Flights. Two endpoints. Price band and verdict in every result, search-status headers on every
                  response, 150 to 500 requests/minute.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">What we found</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              We pulled all four listing pages on 2026-09-04 and searched the same payload that carries their endpoint
              docs. None of them documents a price-insights band, a low / typical / high field, or any search-status
              header. Two of the four describe Skyscanner data rather than Google Flights, so they are not selling the
              same payload at a lower price, they are selling a different payload.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">What we are not claiming</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              We read their listings. We did not buy a plan or call their APIs, so this is a claim about their published
              docs on one day, not about their servers. They are genuinely cheaper, their free tiers are genuinely bigger
              than our 10, and two of them ship endpoints we do not have at all: price graphs, date grids, multi-city. If
              those are what you need, buy theirs. We would rather say that than pretend.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Two questions people ask before they subscribe"
          title="Answers, up front"
        />
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">If you scan dates</p>
            <h3 className="mt-2 text-[17px] font-semibold text-ink-100">
              &ldquo;How fast can I go?&rdquo;
            </h3>
            <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">
              One search is one request, so a 30-date scan costs 30 requests. Every paid tier fits that whole scan inside
              a single minute&apos;s allowance with room to spare, which is the point: you fire the dates in parallel and
              wait once, instead of pacing a queue.
            </p>
            <dl className="mt-5 divide-y rule border-t">
              {FLIGHT_PLANS.filter((p) => p.ratePerMinute !== null).map((p) => (
                <div key={p.name} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="font-mono text-[12.5px] text-ink-300">
                    {p.name} · ${p.priceMonthly}
                  </dt>
                  <dd className="font-mono text-[12.5px] tabular-nums text-ink-100">
                    {p.ratePerMinute} req/min
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="font-mono text-[12.5px] text-ink-300">BASIC · $0</dt>
                <dd className="font-mono text-[12.5px] text-ink-500">no per-minute limit set; the 10/mo cap binds first</dd>
              </div>
            </dl>
            <p className="mt-4 text-[13.5px] text-ink-500 leading-relaxed">
              Rate limits read off the live listing by{' '}
              <code className="field">npm run check-pricing</code>, the same script that fills the table above.{' '}
              <Link href="/flights-api/parallel-date-scan" className="text-signal-400 underline underline-offset-4">
                How the parallel scan works
              </Link>
              .
            </p>
          </div>

          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">If you price round trips</p>
            <h3 className="mt-2 text-[17px] font-semibold text-ink-100">
              &ldquo;Do I have to staple two one-ways together?&rdquo;
            </h3>
            <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">
              No. A round trip is one request and comes back as one priced itinerary: a real{' '}
              <code className="field">total_price</code> for the pair, with both legs described in the same object. Two
              one-way searches added up give you a number no airline will sell you.
            </p>
            <div className="mt-5">
              <Code label="round trip, JFK to LAX, trimmed to the paired fields">{LIVE_ROUNDTRIP}</Code>
              <div className="mt-3">
                <CapturedBadge date="2026-09-04" />
                <p className="mt-2 font-mono text-[10.5px] text-ink-500 leading-relaxed">
                  Same run window, 2026-09-04 at 17:49 UTC. First itinerary of the set, cut to the paired-leg fields.
                  Response headers on this one: <code>x-search-status: ok</code>.
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13.5px] text-ink-500 leading-relaxed">
              <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">
                Round-trip endpoint reference
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Which flights plan for which job"
          title="Price the job, not the tier"
          lede="Flight plans shown; the same logic sizes a hotels plan."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">PRO · $10</p>
            <h3 className="mt-2 text-[16px] font-semibold text-ink-100">Alerts &amp; agents</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              2,500 requests is a fare-watch checking 5 routes every morning with room to spare, or an MCP-connected
              agent used daily. At 150 req/min even a month-long scan is a single burst.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">ULTRA · $25 · recommended</p>
            <h3 className="mt-2 text-[16px] font-semibold text-ink-100">Products &amp; dashboards</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              10,000 requests is 300+ searches a day: a fare-calendar feature, a route-monitoring dashboard, a bot with
              real users. $2.50 per 1k requests, 250 req/min.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">MEGA · $50</p>
            <h3 className="mt-2 text-[16px] font-semibold text-ink-100">Scans at scale</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              50,000 requests at $1.00 per 1k, our cheapest unit price, with 500 req/min and the lowest overage
              ($0.001). Built for heatmaps over many routes and market analysis.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="From click to working key"
          title="Six steps, honestly counted"
          lede={
            <>
              Two of them are RapidAPI&apos;s walls, not ours, but none needs approval and the free tier needs no card.
              Full guides:{' '}
              <Link href="/guides/google-flights-api-key" className="text-signal-400 underline underline-offset-4">
                How to get a Google Flights API key
              </Link>{' '}
              and{' '}
              <Link href="/guides/booking-com-api-key" className="text-signal-400 underline underline-offset-4">
                How to get a Booking.com API key
              </Link>
              .
            </>
          }
        />
        <ol className="mt-10 max-w-3xl space-y-4">
          {[
            ['Open the pricing tab', 'The buttons on this site land you there directly.'],
            ['Create a RapidAPI account (or log in)', 'The wall. Standard signup; RapidAPI runs accounts and billing.'],
            ['Pick a plan', 'BASIC is free, no card, no approval. Access is immediate.'],
            ['Hit "Test Endpoint" on the Endpoints tab', 'Your key is bound automatically; the response renders in the browser.'],
            ['Copy a code snippet', 'The Code Snippets tab emits your language with the key in place.'],
            ['Verify the key below', 'Confirm it authenticates against the live API, the step RapidAPI leaves out.'],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-5">
              <span className="font-mono text-[15px] text-signal-500 tabular-nums">{i + 1}</span>
              <div>
                <p className="text-[15.5px] font-semibold text-ink-100">{title}</p>
                <p className="mt-1 text-[14px] text-ink-400 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 max-w-3xl">
          <KeyVerifyBox />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Prefer pay-per-use?"
          title="The same data as Apify actors"
          lede="No subscription: you pay per event, metered by Apify. One click adds the actor to your Apify console."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Google Flights Scraper</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              One-way and round-trip fares with airlines, layovers, Google price insights and a booking link on every result,
              packaged as an actor. Pay-per-event; see the event table on the listing for current rates.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Cta href={LINKS.apifyFlightsConsole} external variant="ghost">
                Try on Apify →
              </Cta>
              <a href={LINKS.apifyFlights} rel="noopener" className="text-sm text-ink-400 underline underline-offset-4 self-center">
                View the listing
              </a>
            </div>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Booking.com Scraper</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Live rates, availability and review scores. By the actor&apos;s own event table ({APIFY.hotelsSearchEvent},{' '}
              {APIFY.hotelsResultEvent}), a 25-property search costs about $0.004, roughly{' '}
              <strong className="text-ink-100">{APIFY.hotelsPer1kSearches}</strong>. Priced per <em>search</em>, not per result row.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Cta href={LINKS.apifyHotelsConsole} external variant="ghost">
                Try on Apify →
              </Cta>
              <a href={LINKS.apifyHotels} rel="noopener" className="text-sm text-ink-400 underline underline-offset-4 self-center">
                View the listing
              </a>
            </div>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Rule of thumb: steady monthly volume is cheaper on RapidAPI ({COUNTS.flightsRateLimits} req/min and a fixed bill);
          occasional batch jobs with zero baseline fit Apify&apos;s pay-per-event model.
        </p>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="pricing"
          title="Pick a plan, get a key, make your first call"
          body="The free tier verifies your key in a minute. The Pro tier is $10, less than the hour you'd spend fighting a scraper."
        />
      </Section>
    </>
  );
}
