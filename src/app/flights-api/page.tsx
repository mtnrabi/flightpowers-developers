import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  CheckBullets,
  Container,
  Cta,
  FaqSection,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Google Flights API: live fares with a price verdict on every result',
  description:
    'A REST API over live Google Flights results. POST /oneway and POST /roundtrip return flat JSON with Google’s price_insights band, a low | typical | high verdict, honest X-Search-Status headers, and a booking link on every itinerary.',
  alternates: { canonical: '/flights-api' },
});

export const dynamic = 'force-static';

const ENDPOINT_PAGES = [
  {
    href: '/flights-api/one-way',
    method: 'POST /oneway',
    label: 'One-way search',
    sub: 'The base endpoint: route and date in, every live fare out. Full filter set, flat JSON.',
  },
  {
    href: '/flights-api/round-trip',
    method: 'POST /roundtrip',
    label: 'Round-trip search',
    sub: 'One object per itinerary, both legs pre-paired, with combined price, duration, and stops.',
  },
  {
    href: '/flights-api/price-insights',
    method: 'response fields',
    label: 'Price insights',
    sub: 'Google’s historical price band and its low | typical | high verdict, on every result.',
  },
  {
    href: '/flights-api/search-status',
    method: 'response headers',
    label: 'Search status',
    sub: 'ok | empty | partial | degraded. An empty array is an answer, never a shrug.',
  },
  {
    href: '/flights-api/parallel-date-scan',
    method: 'rate limits',
    label: 'Parallel date scans',
    sub: `${COUNTS.flightsRateLimits} req/min by plan: a whole month of dates in one burst.`,
  },
] as const;

const GAPS: { problem: string; answer: string }[] = [
  {
    problem: 'Round-trips return broken or unpaired legs',
    answer: 'A real /roundtrip endpoint with paired itineraries and combined totals.',
  },
  {
    problem: 'No sense of whether a price is good',
    answer: 'Google’s own price band and a low | typical | high verdict on every result.',
  },
  {
    problem: 'You have to bring your own SerpApi key and pay twice',
    answer: 'One subscription. No third-party key, no second bill.',
  },
  {
    problem: 'An empty response could mean “no flights” or a failed scrape, and you cannot tell which',
    answer:
      'Failed reads are retried, and an empty array counts as an answer only when the page said so. X-Search-Status tells a real empty apart from a degraded search, and opt-in strict turns a degraded one into a 503.',
  },
  {
    problem: 'Blocked by Google under load',
    answer: 'Residential proxy routing on by default, switchable per request.',
  },
  {
    problem: 'Filters are a thin subset of the Google Flights UI',
    answer: 'Stops, airlines, exclusions, time-of-day windows per leg, cabin, passenger mix, max price, currency.',
  },
  {
    problem: 'Serial only, so flexible dates take minutes',
    answer: `Rate limits sized for parallel date scans: ${COUNTS.flightsRateLimits} requests per minute by plan.`,
  },
];

const PAID = FLIGHT_PLANS.filter((p) => p.priceMonthly > 0);
const planName = (n: string) => n[0] + n.slice(1).toLowerCase();

const faq: Faq[] = [
  {
    q: 'Is there a free Google Flights API?',
    a: "Yes, with limits. The FlightPowers Google Flights API on RapidAPI has a BASIC plan with 10 requests per month at $0, no card required. That is enough to verify your key and see the response shape, not to evaluate or use day-to-day. Google's own QPX Express API was retired in 2018 and is no longer available. The RapidAPI free tier is not affiliated with or endorsed by Google; it is an independent API that reads the public Google Flights site live at request time. Retrieved 2026-09-01: 368 subscribers, 4.2/5 rating on the RapidAPI listing.",
  },
  {
    q: 'Is this an official Google API?',
    a: 'No. FlightPowers is an independent API that reads the public Google Flights site live at request time; it is not affiliated with or endorsed by Google. The fields it returns, including the price band and the low | typical | high verdict, are the values Google shows travellers, passed through as-is.',
  },
  {
    q: 'What data does each flight result include?',
    a: 'Flat JSON per itinerary: price as a display string and a number (price / price_as_number), airline, duration in text and seconds, stop count with per-layover details, local departure and arrival times, a buy_link that reopens the exact itinerary on Google Flights, and Google’s price_insights_low / price_insights_high band with a low | typical | high verdict.',
  },
  {
    q: 'Is the round-trip endpoint really one search?',
    a: 'Yes. POST /roundtrip returns one object per itinerary with total_price, total_duration_seconds, total_stops, and the outbound and return legs already paired, not two one-way responses you have to combine yourself. Each leg takes its own filters.',
  },
  {
    q: 'What happens when a route has no flights?',
    a: 'The response says so explicitly. X-Search-Status: empty means the search completed and Google genuinely has no itineraries. The empty array is the answer. X-Search-Status: degraded means the search did not complete and the empty array says nothing about availability. Opt-in strict: true turns a degraded search into an HTTP 503 instead.',
  },
  {
    q: 'How do I search flexible dates?',
    a: `One request per date, fired in parallel. “3 to 5 nights, JFK to Paris or Prague, anywhere in May” is 31 dates × 3 durations × 2 destinations = 186 requests. The per-minute rate limits (${PAID.map((p) => `${p.ratePerMinute} on ${planName(p.name)}`).join(', ')}) are sized so that finishes in a burst or two, not a serial loop.`,
  },
  {
    q: 'Do I need a SerpApi key or another scraping subscription?',
    a: 'No. One RapidAPI subscription covers everything on this page. There is no third-party key to bring and no second bill.',
  },
  {
    q: 'How much does the Google Flights API cost?',
    a: `Plans on RapidAPI: a $0 BASIC tier (10 requests/month, hard cap: it verifies your key, it doesn’t evaluate), then ${PAID.map((p) => `$${p.priceMonthly}`).join(', ')} per month for ${PAID.map((p) => p.quota.toLocaleString('en-US')).join(', ')} requests. Every plan includes both endpoints and every response field.`,
  },
  {
    q: 'How fast is a search?',
    a: 'Results are scanned live against Google Flights at request time, not served from a cache, so response time tracks route complexity. Dense routes with many connections take longer than trunk routes, and a search that has to retry an unreadable page takes longer still. Set a generous client timeout.',
  },
];

export default function FlightsApiHubPage() {
  const fx = FIXTURES.onewayJfkCun;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebAPI',
          name: 'FlightPowers Google Flights API',
          url: `${SITE.url}/flights-api`,
          description:
            'REST API over live Google Flights results: one-way and paired round-trip search, Google\u2019s price_insights band with a low | typical | high verdict on every itinerary, and X-Search-Status headers that make an empty result unambiguous.',
          documentation: `${SITE.url}/flights-api`,
          termsOfService: `${SITE.url}/terms`,
          provider: { '@type': 'Organization', name: 'FlightPowers', url: SITE.url },
          potentialAction: {
            '@type': 'ConsumeAction',
            target: { '@type': 'EntryPoint', urlTemplate: `https://${SITE.apiHost}/v1/flights/oneway`, httpMethod: 'POST', contentType: 'application/json' },
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Google Flights API',
          url: `${SITE.url}/flights-api`,
          description:
            'Live Google Flights fares as flat JSON: one-way and round-trip search with price insights, honest search-status headers, and parallel date scans.',
          hasPart: ENDPOINT_PAGES.map((p) => ({
            '@type': 'WebPage',
            name: p.label,
            url: `${SITE.url}${p.href}`,
          })),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Flights API', item: `${SITE.url}/flights-api` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/flights-api', label: 'Flights API' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Google Flights API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Live Google Flights data, with a <span className="text-signal-500">price verdict</span>
              </h1>
              <p className="lede mt-5">
                Two endpoints over live Google Flights results: fares as flat JSON, with Google&apos;s price band, a
                low | typical | high verdict, and a booking link.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      <code className="font-mono text-[13px] text-signal-400">POST /oneway</code> and{' '}
                      <code className="font-mono text-[13px] text-signal-400">POST /roundtrip</code>: round-trips come back as
                      paired itineraries, not stapled legs
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">price_insights_low / high</code> + Google&apos;s
                      verdict on every result, on every plan
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> separates &quot;no
                      flights&quot; from &quot;the search failed&quot;
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/tools/flight-price-checker" variant="ghost">
                  Try it for free
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <ExecuteWidget
              title="POST /api/google_flights/oneway/v1"
              tool="flights-hub-execute"
              capturedAt={fx.captured_at}
              requestText={JSON.stringify(fx.request.body, null, 2)}
              responseText={JSON.stringify(fx.data.slice(0, 2), null, 2)}
              headers={fx.headers}
            />
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The endpoints"
          title="Two endpoints, five things worth a page each"
          lede="Every plan gets all of it. You only ever choose volume and rate limit."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENDPOINT_PAGES.map((p) => (
            <Link key={p.href} href={p.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="font-mono text-[11px] text-signal-500">{p.method}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{p.label}</p>
              <p className="mt-1.5 text-[13.5px] text-ink-400 leading-relaxed">{p.sub}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-[14.5px] text-ink-400">
          After hotel data instead? The{' '}
          <Link href="/hotels-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            Booking.com Hotels API docs
          </Link>{' '}
          are documented to the same depth: destination search, name lookup, room-level pricing and geo-pricing.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="POST /api/google_flights/oneway/v1"
          title="One-way: the full request surface"
          lede="Three required fields; everything else narrows the search. The dedicated one-way page covers each response field too."
        />
        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
          <div className="mt-2">
            <FieldRow name="departure_date" type="string">
              The travel date as <code className="field">YYYY-MM-DD</code>.
            </FieldRow>
            <FieldRow name="from_airport" type="string">
              Origin IATA code. New York is <code className="field">JFK</code>.
            </FieldRow>
            <FieldRow name="to_airport" type="string">
              Destination IATA code.
            </FieldRow>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional · filtering</p>
          <div className="mt-2">
            <FieldRow name="max_stops" type="int">
              Maximum stops per itinerary. <code className="field">0</code> for nonstop only.
            </FieldRow>
            <FieldRow name="airline_codes / exclude_airline_codes" type="string[]">
              Restrict results to these carriers, or keep everything except them.
            </FieldRow>
            <FieldRow name="departure_time_min / _max, arrival_time_min / _max" type="int 0–23">
              Hour-of-day windows for departure and arrival.
            </FieldRow>
            <FieldRow name="max_price" type="int">
              Upper bound on the fare, in the requested currency.
            </FieldRow>
            <FieldRow name="seat_type" type="int">
              Cabin: <code className="field">1</code> Economy, <code className="field">3</code> Business.
            </FieldRow>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional · shape &amp; behavior</p>
          <div className="mt-2">
            <FieldRow name="sort_type" type='"Overall" | "Price" | "Duration"'>
              Default <code className="field">Overall</code>. Note that <code className="field">&quot;Price&quot;</code> reflects
              Google&apos;s own ordering, not a strict sort. Sort locally on <code className="field">price_as_number</code> for
              exact price order.
            </FieldRow>
            <FieldRow name="passengers" type="int[]">
              Passenger mix: <code className="field">1</code> adult, <code className="field">2</code> child,{' '}
              <code className="field">3</code> infant on lap, <code className="field">4</code> infant in seat.
            </FieldRow>
            <FieldRow name="currency" type="string">
              Defaults to <code className="field">USD</code>.
            </FieldRow>
            <FieldRow name="limit" type="int">
              Maximum results returned. Defaults to <code className="field">10</code>.
            </FieldRow>
            <FieldRow name="strict" type="bool">
              Opt-in, default <code className="field">false</code>: a search that did not complete returns HTTP 503 instead of an
              empty array. Details on the <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">search-status page</Link>.
            </FieldRow>
            <FieldRow name="use_ext_proxy" type="bool">
              Default <code className="field">true</code>: routes through a residential proxy to reduce blocks. Set{' '}
              <code className="field">false</code> for lower latency on easy routes.
            </FieldRow>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="POST /api/google_flights/roundtrip/v1"
          title="Round-trip: same controls, split per leg"
          lede="Four required fields, and every one-way filter exists twice: once for the outbound, once for the return."
        />
        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
          <div className="mt-2">
            <FieldRow name="departure_date / return_date" type="string">
              Both travel dates, <code className="field">YYYY-MM-DD</code>.
            </FieldRow>
            <FieldRow name="from_airport / to_airport" type="string">
              IATA codes, as on one-way.
            </FieldRow>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional · per leg</p>
          <div className="mt-2">
            <FieldRow name="max_departure_stops / max_return_stops" type="int">
              Stop limits set independently. Nonstop out, one stop back is a valid ask.
            </FieldRow>
            <FieldRow name="departure_airline_codes / return_airline_codes" type="string[]">
              Per-leg carrier restrictions, with matching <code className="field">_exclude_</code> variants for both legs.
            </FieldRow>
            <FieldRow name="departure_* / return_* time windows" type="int 0–23">
              <code className="field">departure_departure_time_min/_max</code>,{' '}
              <code className="field">departure_arrival_time_min/_max</code>, and the{' '}
              <code className="field">return_</code>-prefixed equivalents.
            </FieldRow>
          </div>
          <p className="mt-4 text-[13.5px] text-ink-500">
            There is no <code className="field">max_stops</code> field here: on the RapidAPI endpoints use{' '}
            <code className="field">max_departure_stops</code> / <code className="field">max_return_stops</code>. It is
            accepted as a convenience alias only when calling through{' '}
            <Link href="/integrations/api" className="text-signal-400 underline underline-offset-4">
              api.flightpowers.com
            </Link>
            .
          </p>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional · shared</p>
          <div className="mt-2">
            <FieldRow name="sort_type · currency · max_price · seat_type · passengers · limit · strict · use_ext_proxy">
              Exactly as on one-way, applied to the paired search as a whole.
            </FieldRow>
          </div>
          <div className="mt-8">
            <Cta href="/flights-api/round-trip" variant="ghost">
              The full round-trip page →
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Why this one"
          title="Common gaps in other Google Flights APIs"
          lede="Each row is a failure mode this API was designed against, and every right-hand answer is provable on the pages above, not adjectives."
        />
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                <th className="px-4 py-3 font-normal">The problem</th>
                <th className="px-4 py-3 font-normal">How this API handles it</th>
              </tr>
            </thead>
            <tbody>
              {GAPS.map((g) => (
                <tr key={g.problem} className="border-t rule align-top">
                  <td className="px-4 py-3.5 text-ink-300">{g.problem}</td>
                  <td className="px-4 py-3.5 text-ink-200">{g.answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Every plan gets both endpoints" />
        <div className="mt-8">
          <PricingTable api="flights" plans={FLIGHT_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep going" title="Related" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/hotels-api', label: 'Hotels API', sub: 'Booking.com rates, with per-country pricing' },
            { href: '/tools/flight-price-checker', label: 'Flight price checker', sub: 'Try the API free, no signup' },
            { href: '/mcp', label: 'MCP servers', sub: 'The same data, one URL for your agent' },
            { href: '/pricing', label: 'Full pricing', sub: 'Both APIs, the Apify option, key check' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="endpoint"
          title="Every fare, judged, from one subscription"
          body="Live Google Flights data with the price band, verdict, and booking link attached to every result."
        />
      </Section>
    </>
  );
}
