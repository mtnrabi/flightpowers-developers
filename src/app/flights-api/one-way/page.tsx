import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { PricingTable } from '@/components/PricingTable';
import { FlightResults } from '@/components/results';
import {
  Breadcrumbs,
  CapturedBadge,
  CheckBullets,
  Code,
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

export const metadata: Metadata = {
  title: 'One-Way Flight Search API: live Google Flights fares as flat JSON',
  description:
    'POST /oneway: a route and a date in, every live Google Flights fare out. Stops, airline, time-window, cabin, and price filters; price_insights band and verdict; a buy_link that reopens the exact itinerary.',
  alternates: { canonical: '/flights-api/one-way' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'What does a one-way flight result look like?',
    a: 'One flat JSON object per itinerary: price ("$983") and price_as_number (983), airline, duration in text and seconds, stop count with per-layover airports and durations, plain-text local departure and arrival times, a buy_link into Google Flights, and Google’s price_insights_low / price_insights_high band with a low | typical | high verdict.',
  },
  {
    q: 'Is sort_type "Price" a strict cheapest-first sort?',
    a: 'No. It reflects Google’s own “Price” ordering, which is not a strict numeric sort. If you need exact price order, sort locally on price_as_number; it is one line and the field exists precisely for that.',
  },
  {
    q: 'How do I filter by airline or time of day?',
    a: 'airline_codes restricts results to specific carriers and exclude_airline_codes removes them; both take arrays of IATA codes. departure_time_min/max and arrival_time_min/max take hours 0–23 and window the local departure and arrival times.',
  },
  {
    q: 'What formats do dates and airports use?',
    a: 'Requests take YYYY-MM-DD dates and IATA airport codes. Responses return airports as display strings in the form “City (IATA)”, for example “New York (JFK)”, so parse accordingly if you store them.',
  },
  {
    q: 'What does an empty array mean?',
    a: 'On its own, nothing certain. That is why every response carries an X-Search-Status header. "empty" means Google genuinely has no itineraries for the route and date; "degraded" means the search did not complete and you should retry. Send strict: true if you would rather get an HTTP 503 than a misleading [].',
  },
  {
    q: 'Can I search business class, or for a family?',
    a: 'seat_type selects the cabin: 1 for Economy, 3 for Business. passengers is an array of per-passenger codes: 1 adult, 2 child, 3 infant on lap, 4 infant in seat, so [1, 1, 2] is two adults and a child.',
  },
  {
    q: 'Do I pay extra for the price-insights fields?',
    a: 'No. The band and verdict ride on every one-way result on every plan, including the free tier.',
  },
];

export default function OneWayPage() {
  const fx = FIXTURES.onewayJfkCun;
  const rec = fx.data[0]!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Flights API', item: `${SITE.url}/flights-api` },
            { '@type': 'ListItem', position: 3, name: 'One-Way Search', item: `${SITE.url}/flights-api/one-way` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers One-Way Flight Search API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/flights-api/one-way`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/flights-api', label: 'Flights API' }, { href: '/flights-api/one-way', label: 'One-Way Search' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">One-Way Flight Search API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                One route, one date, <span className="text-signal-500">every live fare</span>
              </h1>
              <p className="lede mt-5">
                POST a route and a departure date; get every live Google Flights itinerary back as flat JSON: priced, timed,
                judged, and linkable.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>Filters matching the real Google Flights UI: stops, carriers, time windows, cabin, passenger mix, max price</>,
                    <>
                      Google&apos;s <code className="font-mono text-[13px] text-signal-400">price_insights</code> band and verdict
                      on every result
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">buy_link</code> reopens that exact itinerary on
                      Google Flights
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/flights-api/round-trip" variant="ghost">
                  Need a round trip?
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <ExecuteWidget
              title="POST /api/google_flights/oneway/v1"
              tool="oneway-execute"
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
          eyebrow="The same capture, rendered"
          title="Four live fares, one field access from a UI"
          lede="The response is flat on purpose. Each row below is one array element, no unpacking."
        />
        <div className="mt-8 max-w-3xl rounded-2xl border rule bg-ink-900/60 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] text-ink-500">JFK→CUN · {rec.departure_date}</p>
            <CapturedBadge date={fx.captured_at} />
          </div>
          <FlightResults flights={fx.data} />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Request"
          title="Every request field"
          lede="Three required fields. Everything else narrows the search, and each optional field maps to a control in the Google Flights UI."
        />
        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
          <div className="mt-2">
            <FieldRow name="departure_date" type="string">
              The travel date, <code className="field">YYYY-MM-DD</code>.
            </FieldRow>
            <FieldRow name="from_airport" type="string">
              Origin IATA code. New York is <code className="field">JFK</code>.
            </FieldRow>
            <FieldRow name="to_airport" type="string">
              Destination IATA code.
            </FieldRow>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional</p>
          <div className="mt-2">
            <FieldRow name="max_stops" type="int">
              Maximum stops per itinerary: <code className="field">0</code> returns nonstop only.
            </FieldRow>
            <FieldRow name="sort_type" type='"Overall" | "Price" | "Duration"'>
              Default <code className="field">Overall</code>. <code className="field">&quot;Price&quot;</code> reflects
              Google&apos;s own ordering, see the note below.
            </FieldRow>
            <FieldRow name="airline_codes" type="string[]">
              Restrict results to these carriers.
            </FieldRow>
            <FieldRow name="exclude_airline_codes" type="string[]">
              Exclude these carriers.
            </FieldRow>
            <FieldRow name="departure_time_min / departure_time_max" type="int 0–23">
              Departure-hour window in local time.
            </FieldRow>
            <FieldRow name="arrival_time_min / arrival_time_max" type="int 0–23">
              Arrival-hour window in local time.
            </FieldRow>
            <FieldRow name="currency" type="string">
              Defaults to <code className="field">USD</code>. Prices, the band, and the <code className="field">buy_link</code>{' '}
              all follow it.
            </FieldRow>
            <FieldRow name="max_price" type="int">
              Upper bound on the fare.
            </FieldRow>
            <FieldRow name="seat_type" type="int">
              Cabin: <code className="field">1</code> Economy, <code className="field">3</code> Business.
            </FieldRow>
            <FieldRow name="passengers" type="int[]">
              Per-passenger codes: <code className="field">1</code> adult, <code className="field">2</code> child,{' '}
              <code className="field">3</code> infant on lap, <code className="field">4</code> infant in seat.
            </FieldRow>
            <FieldRow name="limit" type="int">
              Maximum results returned. Defaults to <code className="field">10</code>.
            </FieldRow>
            <FieldRow name="strict" type="bool">
              Opt-in, default <code className="field">false</code>. A search that did not complete returns HTTP 503 instead of an
              empty array, the{' '}
              <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">
                search-status page
              </Link>{' '}
              explains when you want that.
            </FieldRow>
            <FieldRow name="use_ext_proxy" type="bool">
              Default <code className="field">true</code>: routes the scan through a residential proxy to reduce blocks. Set{' '}
              <code className="field">false</code> for lower latency on easy routes.
            </FieldRow>
          </div>

          <div className="mt-8 rounded-xl border rule bg-ink-900 px-5 py-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Sorting honestly</p>
            <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">
              <code className="field">sort_type: &quot;Price&quot;</code> mirrors what Google Flights shows under its own
              &quot;Price&quot; tab, and that is not a strict numeric sort. When exact cheapest-first order matters, sort locally:
            </p>
            <div className="mt-3">
              <Code label="python">{`fares = sorted(r.json(), key=lambda f: f["price_as_number"])`}</Code>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Response"
          title="Every response field"
          lede="Values below in brackets are from the captured JFK→CUN run above. Real output, not invented examples."
        />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="price / price_as_number" type="string · number">
            The fare twice: a display string (<code className="field">{rec.price}</code>) and a number ({rec.price_as_number})
            you can sort and compare on.
          </FieldRow>
          <FieldRow name="airline" type="string">
            Operating carrier: <code className="field">{rec.airline}</code> in the capture, where a pipe joins codeshare
            partners.
          </FieldRow>
          <FieldRow name="duration / duration_seconds" type="string · number">
            Total trip time, formatted (<code className="field">{rec.duration}</code>) and in seconds ({rec.duration_seconds}).
          </FieldRow>
          <FieldRow name="stops / stops_info[]" type="int · object[]">
            Stop count plus one object per layover with <code className="field">stop_airport</code> and{' '}
            <code className="field">stop_duration_seconds</code>. Empty on nonstop flights, like the captured one.
          </FieldRow>
          <FieldRow name="departure_description / arrival_description" type="string">
            Local times in plain text, like <code className="field">&quot;{rec.departure_description}&quot;</code>, ready to show a
            user or hand to an agent without timezone math.
          </FieldRow>
          <FieldRow name="buy_link" type="string">
            A Google Flights deep link that reopens this exact itinerary (carrier, flight, date) rather than a fresh search.
          </FieldRow>
          <FieldRow name="price_insights_low / price_insights_high" type="number | null">
            Google&apos;s historical price band for the route and dates: ${rec.price_insights_low} to ${rec.price_insights_high} in
            the capture. Null when Google doesn&apos;t publish a band.
          </FieldRow>
          <FieldRow name="price_range_in_relation_to_other_periods" type='"low" | "typical" | "high" | null'>
            Google&apos;s verdict on the current fare against that band: <code className="field">&quot;{rec.price_range_in_relation_to_other_periods}&quot;</code>{' '}
            in the capture. The{' '}
            <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">
              price-insights page
            </Link>{' '}
            is about nothing but these three fields.
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="One-way search on every plan" />
        <div className="mt-8">
          <PricingTable api="flights" plans={FLIGHT_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Flights API" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/round-trip', label: 'Round-trip search', sub: 'Paired-leg itineraries' },
            { href: '/flights-api/price-insights', label: 'Price insights', sub: 'The band & the verdict' },
            { href: '/flights-api/search-status', label: 'Search status', sub: '"empty" vs "failed"' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel date scans', sub: `${COUNTS.flightsRateLimits} req/min` },
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
          title="A route and a date is all it takes"
          body="Live fares with Google's price band, a verdict, and a booking link, from your first request."
        />
      </Section>
    </>
  );
}
