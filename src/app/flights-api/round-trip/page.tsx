import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { PricingTable } from '@/components/PricingTable';
import { RoundtripResults } from '@/components/results';
import {
  Breadcrumbs,
  CapturedBadge,
  CheckBullets,
  Container,
  Cta,
  FaqSection,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  VerdictBadge,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Round-Trip Flight API — paired itineraries from one search',
  description:
    'POST /roundtrip returns one object per itinerary: total_price, total_duration_seconds, total_stops, and both legs already paired — with per-leg stop, airline, and time-window filters. Not two one-way calls stapled together.',
  alternates: { canonical: '/flights-api/round-trip' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Does the API return round-trip prices as one itinerary?',
    a: 'Yes. POST /roundtrip returns one flat JSON object per itinerary with total_price, total_price_as_number, total_duration_seconds, total_stops, and both legs’ details already paired under departure_flight_* and return_flight_* fields.',
  },
  {
    q: 'Can I set different filters for the outbound and return legs?',
    a: 'Yes — every one-way filter exists per leg: max_departure_stops and max_return_stops, departure_airline_codes and return_airline_codes (with exclude variants), and separate departure/arrival time windows for each leg. Nonstop out, one stop back with a morning return is a single request.',
  },
  {
    q: 'Why not just make two one-way calls?',
    a: 'Two one-way searches cost two requests per date pair, give you no combined total, and price legs independently — the sum of two one-way fares is not the fare of a round-trip ticket. The paired endpoint prices the itinerary as one purchase and ships one buy_link for it.',
  },
  {
    q: 'Is buy_link for the whole round trip?',
    a: 'Yes — one combined Google Flights deep link that reopens the exact paired itinerary, both legs, ready to book as one ticket.',
  },
  {
    q: 'What does an empty round-trip response mean?',
    a: 'Check X-Search-Status before deciding. A round-trip prices a return leg for every outbound candidate, and each of those fetches can fail on its own — so "empty" is only reported when every candidate read a real Google Flights page saying it had nothing. A blocked or truncated fan-out reports "degraded" or "partial", never "no flights".',
  },
  {
    q: 'Do the price-insights fields work on round-trips?',
    a: 'Yes. Each itinerary carries price_insights_low, price_insights_high, and the low | typical | high verdict for the route and date pair — the captured $112 BER→CDG itinerary on this page came back marked "low" against a $120–$220 band.',
  },
  {
    q: 'How many requests does a round-trip search cost?',
    a: 'One. The return-leg fan-out happens inside the API — a whole paired search, however many outbound candidates it prices, bills as a single request.',
  },
];

export default function RoundTripPage() {
  const fx = FIXTURES.roundtripBerCdg;
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
            { '@type': 'ListItem', position: 3, name: 'Round-Trip Search', item: `${SITE.url}/flights-api/round-trip` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Round-Trip Flight API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/flights-api/round-trip`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/flights-api', label: 'Flights API' }, { href: '/flights-api/round-trip', label: 'Round-Trip Search' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Round-Trip Flight API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                A round trip is <span className="text-signal-500">one search</span>, not two
              </h1>
              <p className="lede mt-5">
                POST both dates and get paired itineraries — outbound and return already matched, with a combined price,
                duration, and one booking link.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      <code className="font-mono text-[13px] text-signal-400">total_price · total_duration_seconds · total_stops</code>{' '}
                      on every itinerary
                    </>,
                    <>Per-leg controls: stops, carriers, and time windows set separately for out and back</>,
                    <>
                      &quot;Empty&quot; and &quot;failed&quot; stay distinguishable even across the return-leg fan-out — see{' '}
                      <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">
                        search status
                      </Link>
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/flights-api/one-way" variant="ghost">
                  One-way instead?
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <ExecuteWidget
              title="POST /api/google_flights/roundtrip/v1"
              tool="roundtrip-execute"
              capturedAt={fx.captured_at}
              requestText={JSON.stringify(fx.request.body, null, 2)}
              responseText={JSON.stringify(fx.data.slice(0, 1), null, 2)}
              headers={fx.headers}
            />
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The same capture, rendered"
          title="A real week in Paris, $112, marked low"
          lede="Berlin→Paris with both legs paired — the cheapest captured itinerary sits below Google's own band for the route, so it arrives wearing the verdict."
        />
        <div className="mt-8 max-w-3xl rounded-2xl border rule bg-ink-900/60 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] text-ink-500">
              BER→CDG · {rec.departure_date} → {rec.return_date}
            </p>
            <CapturedBadge date={fx.captured_at} />
          </div>
          <RoundtripResults itineraries={fx.data} />
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Each row is one object from the response. The <VerdictBadge verdict={rec.price_range_in_relation_to_other_periods} />{' '}
          badge is <code className="field">price_range_in_relation_to_other_periods</code> rendered directly — Google&apos;s own
          call that {rec.total_price} is under the usual ${rec.price_insights_low}–${rec.price_insights_high} range for these
          dates.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Response shape"
          title="One object per itinerary"
          lede="No leg-matching on your side: the pairing, the totals, and the single booking link are the endpoint's job."
        />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="total_price / total_price_as_number" type="string · number">
            The combined fare for the paired itinerary — <code className="field">{rec.total_price}</code> in the capture — as a
            display string and a sortable number. Not the sum of two separately-priced one-ways.
          </FieldRow>
          <FieldRow name="total_duration_seconds" type="number">
            Both legs&apos; flying time combined, in seconds.
          </FieldRow>
          <FieldRow name="total_stops" type="int">
            Stops across both legs — <code className="field">0</code> means nonstop in each direction.
          </FieldRow>
          <FieldRow name="buy_link" type="string">
            One Google Flights deep link for the whole paired itinerary, both legs, in the requested currency.
          </FieldRow>
          <FieldRow name="departure_flight_*" type="fields">
            The outbound leg in full: <code className="field">departure_flight_airline</code>,{' '}
            <code className="field">departure_flight_duration</code>, <code className="field">departure_flight_stops</code>,{' '}
            plain-text departure and arrival descriptions, and <code className="field">departure_stops_info</code> per layover.
          </FieldRow>
          <FieldRow name="return_flight_*" type="fields">
            The return leg, same structure — already matched to that exact outbound.
          </FieldRow>
          <FieldRow name="price_insights_low / high + verdict" type="number · string | null">
            Google&apos;s band and low | typical | high verdict for the route and date pair, same as{' '}
            <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">
              one-way
            </Link>
            . Null when Google doesn&apos;t publish a band.
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Request"
          title="Every one-way control, twice"
          lede="Four required fields; then each leg takes its own constraints — the part two stapled one-way searches cannot express."
        />
        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
          <div className="mt-2">
            <FieldRow name="departure_date / return_date" type="string">
              Both travel dates, <code className="field">YYYY-MM-DD</code>.
            </FieldRow>
            <FieldRow name="from_airport / to_airport" type="string">
              IATA codes.
            </FieldRow>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional — per leg</p>
          <div className="mt-2">
            <FieldRow name="max_departure_stops / max_return_stops" type="int">
              Stop limits per leg — nonstop out, one stop back is one request.
            </FieldRow>
            <FieldRow name="departure_airline_codes / return_airline_codes" type="string[]">
              Carrier restrictions per leg, with <code className="field">departure_exclude_airline_codes</code> and{' '}
              <code className="field">return_exclude_airline_codes</code> to remove carriers instead.
            </FieldRow>
            <FieldRow name="departure_departure_time_min / _max" type="int 0–23">
              Outbound departure-hour window, with <code className="field">departure_arrival_time_min / _max</code> for its
              arrival.
            </FieldRow>
            <FieldRow name="return_departure_time_min / _max" type="int 0–23">
              The same pair of windows for the return leg.
            </FieldRow>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional — shared</p>
          <div className="mt-2">
            <FieldRow name="sort_type · currency · max_price · seat_type · passengers · limit · strict · use_ext_proxy">
              Exactly as on{' '}
              <Link href="/flights-api/one-way" className="text-signal-400 underline underline-offset-4">
                one-way
              </Link>
              , applied to the paired search as a whole.
            </FieldRow>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The honest comparison"
          title="Paired search vs. two one-ways, stapled"
          lede="Stapling two one-way calls together is the workaround most flight APIs leave you with. Here is what it actually costs."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Two one-way calls</h3>
            <ul className="mt-4 space-y-2.5 text-[14.5px] text-ink-400 leading-relaxed">
              <li>Two requests billed per date pair — a flexible-date round-trip scan costs double.</li>
              <li>No combined total: you add two fares that may not be purchasable as one ticket at that price.</li>
              <li>Leg combinations are yours to cross-match, filter, and de-duplicate.</li>
              <li>Two separate booking links that never open a single round-trip purchase.</li>
            </ul>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">POST /roundtrip</h3>
            <ul className="mt-4 space-y-2.5 text-[14.5px] text-ink-400 leading-relaxed">
              <li>One request, one billed search, however many outbound candidates it prices.</li>
              <li>
                <code className="field">total_price</code> is the itinerary priced as one purchase.
              </li>
              <li>Legs arrive pre-paired, with per-leg filters applied inside the search.</li>
              <li>
                One <code className="field">buy_link</code> that reopens the exact paired itinerary.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 max-w-3xl rounded-xl border rule bg-ink-900 px-5 py-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">The hard part, handled</p>
          <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">
            Honest empty-vs-failed reporting is harder on round-trips than it sounds: a round-trip prices a return leg for every
            outbound candidate, and each of those fetches can fail on its own. <code className="field">empty</code> is only
            reported when every candidate was attempted and every one read a real Google Flights page saying it had nothing. A
            fan-out that was blocked, or that stopped on the request&apos;s time ceiling, reports{' '}
            <code className="field">degraded</code> or <code className="field">partial</code> — never &quot;no flights&quot;. The{' '}
            <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">
              search-status page
            </Link>{' '}
            documents the full contract.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Round-trip search on every plan" />
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
            { href: '/flights-api/one-way', label: 'One-way search', sub: 'The base endpoint' },
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
          title="Stop stapling one-ways together"
          body="Paired itineraries with combined totals, per-leg filters, and one booking link — in a single request."
        />
      </Section>
    </>
  );
}
