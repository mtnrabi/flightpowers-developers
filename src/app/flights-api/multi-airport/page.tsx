import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { Mono, ResponseChunk } from '@/components/ResponseChunk';
import {
  Breadcrumbs,
  CheckBullets,
  Code,
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
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Multi-airport flight search API: up to 4 airports a side',
  description:
    'POST /oneway_multi_airport and /roundtrip_multi_airport: 1 to 4 airports on each side, up to 8 airport pairs, one ranked list of live Google Flights fares, billed as one request.',
  alternates: { canonical: '/flights-api/multi-airport' },
});

export const dynamic = 'force-static';

const HOST = 'google-flights-live-api.p.rapidapi.com';
const ONEWAY_PATH = '/api/google_flights/oneway_multi_airport/v1';
const ROUNDTRIP_PATH = '/api/google_flights/roundtrip_multi_airport/v1';

const ow = FIXTURES.onewayMultiTlvAth;
const rt = FIXTURES.roundtripMultiTlvLhrCdg;

const ONEWAY_CURL = `curl -X POST "https://${HOST}${ONEWAY_PATH}" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${HOST}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '${JSON.stringify(ow.request.body)}'`;

const ROUNDTRIP_CURL = `curl -X POST "https://${HOST}${ROUNDTRIP_PATH}" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: ${HOST}" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '${JSON.stringify(rt.request.body)}'`;

/** The first row of each pair in the captured one-way, trimmed. */
function firstPerPair<T extends { from_airport: string; to_airport: string }>(rows: T[], n = 2): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    const k = `${r.from_airport}>${r.to_airport}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
    if (out.length === n) break;
  }
  return out;
}

const ONEWAY_ROWS = firstPerPair(ow.data);
const ONEWAY_EXCERPT = JSON.stringify(
  ONEWAY_ROWS.map((f) => ({
    from_airport: f.from_airport,
    to_airport: f.to_airport,
    departure_date: f.departure_date,
    airline: f.airline,
    price: f.price,
    price_as_number: f.price_as_number,
    stops: f.stops,
    price_insights_low: f.price_insights_low,
    price_insights_high: f.price_insights_high,
  })),
  null,
  2
);

const RT_ROWS = firstPerPair(rt.data);

/** The first row of the pair that lands at `code` (to_airport reads like "Paris (CDG)"). */
function rtRowTo(code: string) {
  const row = RT_ROWS.find((r) => String(r.to_airport).includes(`(${code})`));
  if (!row) throw new Error(`round-trip fixture has no row to ${code}`);
  return row;
}
/** The city name from the row's own airport label, "Paris (CDG)" -> "Paris". */
function cityOf(row: { to_airport: unknown }) {
  return String(row.to_airport).replace(/\s*\([A-Z]{3}\)\s*$/, '');
}
const RT_CDG = rtRowTo('CDG');
const RT_LHR = rtRowTo('LHR');
const ROUNDTRIP_EXCERPT = JSON.stringify(
  RT_ROWS.map((r) => ({
    from_airport: r.from_airport,
    to_airport: r.to_airport,
    departure_date: r.departure_date,
    return_date: r.return_date,
    total_price: r.total_price,
    total_price_as_number: r.total_price_as_number,
    total_stops: r.total_stops,
    departure_flight_airline: r.departure_flight_airline,
    return_flight_airline: r.return_flight_airline,
    price_insights_low: r.price_insights_low,
    price_insights_high: r.price_insights_high,
    price_range_in_relation_to_other_periods: r.price_range_in_relation_to_other_periods,
  })),
  null,
  2
);

/** The 422 a city code gets on the round trip, as the API words it. */
const CITY_CODE_422 = JSON.stringify(
  {
    detail:
      'to_airport: LON is a city code; the multi-airport round trip takes airport codes, list the ones you want (up to 4), for example LHR,LGW (all of LON: LHR,LGW,STN,LTN,LCY,SEN)',
    help: 'https://flightpowers.com/docs/quickstart#errors',
    hint:
      'from_airport and to_airport each take 1 to 4 IATA codes, as a list or a comma-separated string, with at most 8 origin x destination pairs and no code on both sides; limit is 1 to 20; a round trip takes airport codes, not city codes (LHR,LGW, not LON)',
    field: 'to_airport',
  },
  null,
  2
);

const REFUSALS: { when: string; field: string; detail: string }[] = [
  { when: 'More than 4 airports on one side', field: 'from_airport / to_airport', detail: 'to_airport names 5 airports; at most 4 are allowed per side' },
  { when: 'More than 8 airport pairs (3 x 3 is 9)', field: 'to_airport', detail: 'to_airport: 3 origins x 3 destinations is 9 airport pairs; at most 8 pairs are searched in one request' },
  { when: 'The same airport on both sides', field: 'to_airport', detail: 'to_airport: ATH is on both sides; an airport can be an origin or a destination, not both' },
  { when: 'limit outside 1 to 20', field: 'limit', detail: 'limit: limit is 50; the multi-airport endpoints take a limit of 1 to 20' },
  { when: 'use_fallback: true', field: 'use_fallback', detail: 'use_fallback: the multi-airport endpoints use no fallback source; send false or omit it' },
  { when: 'Round trip only: a city code (LON, NYC, PAR …)', field: 'from_airport / to_airport', detail: 'to_airport: LON is a city code; … for example LHR,LGW (all of LON: LHR,LGW,STN,LTN,LCY,SEN)' },
];

const faq: Faq[] = [
  {
    q: 'How many requests does a multi-airport search cost?',
    a: 'One. A call to either multi-airport endpoint is one request on your RapidAPI plan, whether it covers one airport pair or eight. A round trip is still one request too: both legs and one total per result.',
  },
  {
    q: 'Can I send a city code like LON or NYC?',
    a: 'On the one-way, yes. On the round trip, no: it answers a 422 that names the city’s airports, so list the ones you want (LHR,LGW). On the one-way, do not mix a city code with one of its own airports (LON with LHR): the same flights get searched twice, and each one comes back once.',
  },
  {
    q: 'Which airports did a result actually fly?',
    a: 'Read from_airport and to_airport on the row. They are the airports that itinerary flies, as display strings like “Athens (ATH)”, not the list you sent. On a round trip the return leg and the buy_link use the same row’s airports.',
  },
  {
    q: 'Does every result carry Google’s price range?',
    a: 'On the round trip, yes when Google shows one: each airport pair is searched on its own page, so each row carries its own pair’s price_insights_low / price_insights_high and verdict. On the one-way the range is only filled when all the airports on each side are in one city (GRU,VCP to HND,NRT); across cities it is null. Rows from Google’s own search call (a party with a child or an infant, a round trip over 32 nights; X-Search-Notes: via_rpc) carry no range.',
  },
  {
    q: 'Can I search for a family?',
    a: 'Yes. Send the party in passengers (1 adult, 2 child, 3 infant on lap, 4 infant in seat, so [1, 1, 2] is two adults and a child). A party with a child or an infant is searched pair by pair on Google’s own search call, as on the single-airport endpoints, so the answer carries X-Search-Notes: via_rpc, the rows carry no price range, and it can take up to about a minute. It is still one request.',
  },
];

export default function MultiAirportPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Flights API', item: `${SITE.url}/flights-api` },
            { '@type': 'ListItem', position: 3, name: 'Multi-Airport Search', item: `${SITE.url}/flights-api/multi-airport` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Multi-Airport Flight Search API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 50 requests/month on RapidAPI' },
          url: `${SITE.url}/flights-api/multi-airport`,
          dateModified: '2026-11-07',
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/flights-api', label: 'Flights API' },
            { href: '/flights-api/multi-airport', label: 'Multi-Airport Search' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Multi-Airport Flight Search API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Up to 4 airports a side, <span className="text-signal-500">one request</span>
              </h1>
              <p className="lede mt-5">
                Send Tel Aviv and Athens to London and Paris in one call. Every airport pair is searched and the fares come
                back in one ranked list, each row naming the airports it flies.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>1 to 4 airports on each side, up to 8 airport pairs, as a list or a comma-separated string</>,
                    <>Billed as one request, one-way or round trip</>,
                    <>
                      The same filters and the same rows as the{' '}
                      <Link href="/flights-api/one-way" className="text-signal-400 underline underline-offset-4">
                        one-way
                      </Link>{' '}
                      and{' '}
                      <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">
                        round-trip
                      </Link>{' '}
                      endpoints
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <ExecuteWidget
              title={`POST ${ONEWAY_PATH}`}
              tool="multi-airport-execute"
              capturedAt={ow.captured_at}
              requestText={JSON.stringify(ow.request.body, null, 2)}
              responseText={JSON.stringify(ow.data.slice(0, 3), null, 2)}
              headers={ow.headers}
            />
          </div>
        </Container>
      </div>

      <ResponseChunk
        title="What a multi-airport flight search returns"
        answer={
          <>
            <Mono>POST {ONEWAY_PATH}</Mono> and <Mono>POST {ROUNDTRIP_PATH}</Mono> on <Mono>{HOST}</Mono> (RapidAPI
            key) take 1 to 4 airports in <code className="field">from_airport</code> and in{' '}
            <code className="field">to_airport</code>, up to 8 pairs. They return the same JSON array as the single-airport
            endpoints: every pair in one list, ranked by <code className="field">sort_type</code> and cut to{' '}
            <code className="field">limit</code>. They are on the RapidAPI host only, not on api.flightpowers.com.
          </>
        }
        request={{ label: 'curl · the captured one-way', text: ONEWAY_CURL }}
        excerptLabel={`TLV,ATH → LHR,CDG, ${String(ow.request.body.departure_date)} · first row of 2 pairs out of ${ow.data.length} results, trimmed · captured ${ow.captured_at}`}
        excerpt={ONEWAY_EXCERPT}
        valueHeading="First row"
        fields={[
          {
            name: 'from_airport / to_airport',
            type: 'string',
            meaning: 'The airports this itinerary flies, not the list you sent. Display strings in the form “City (IATA)”.',
            value: `${ONEWAY_ROWS[0]!.from_airport} → ${ONEWAY_ROWS[0]!.to_airport}`,
          },
          {
            name: 'price_as_number',
            type: 'number',
            meaning: 'The fare as a number. The rows of every pair are ranked together, so this list mixes pairs.',
            value: String(ONEWAY_ROWS[0]!.price_as_number),
          },
          {
            name: 'price_insights_low / high',
            type: 'number | null',
            meaning: 'On a one-way, filled only when all the airports on each side are in one city. Athens to London and Paris crosses cities, so null here.',
            value: String(ONEWAY_ROWS[0]!.price_insights_low),
          },
        ]}
        notes={[
          <>
            All four pairs were asked for; the {ow.data.length} rows that came back in this capture are all from Athens,
            to both London and Paris.
          </>,
          <>
            Every response carries the same{' '}
            <Link href="/flights-api/search-status" className="text-signal-400 hover:text-signal-300">
              <code className="font-mono text-[13px]">X-Search-Status</code>
            </Link>{' '}
            headers as the single-airport endpoints.
          </>,
        ]}
      />

      <Section>
        <SectionHead
          eyebrow="Round trip"
          title="Still one call: both legs and one total per result"
          lede="Each airport pair is searched on its own page, then the itineraries of every pair are ranked together. Each row carries its own pair's Google price range."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <Code label="curl · the captured round trip">{ROUNDTRIP_CURL}</Code>
          <Code
            label={`TLV → LHR,CDG, ${String(rt.request.body.departure_date)} → ${String(rt.request.body.return_date)} · first row of each pair out of ${rt.data.length} results, trimmed · captured ${rt.captured_at}`}
          >
            {ROUNDTRIP_EXCERPT}
          </Code>
        </div>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          Google marked {cityOf(RT_CDG)} <VerdictBadge verdict={RT_CDG.price_range_in_relation_to_other_periods} /> for
          these dates (range ${RT_CDG.price_insights_low} to ${RT_CDG.price_insights_high}) and {cityOf(RT_LHR)}{' '}
          <VerdictBadge verdict={RT_LHR.price_range_in_relation_to_other_periods} />{' '}
          {`(range $${RT_LHR.price_insights_low} to $${RT_LHR.price_insights_high})`}, each verdict for its own airport pair,{' '}
          in the same response. Every field on a
          row is documented on the{' '}
          <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">
            round-trip page
          </Link>
          .
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Request"
          title="What is different from the single-airport endpoints"
          lede="Every other field works exactly as on the one-way and round-trip endpoints: stops, airlines, time windows, cabin, currency, max price, sort, returns_per_outbound."
        />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="from_airport / to_airport" type="string | string[]">
            1 to 4 IATA codes each, as a list (<code className="field">[&quot;TLV&quot;, &quot;ATH&quot;]</code>) or a
            comma-separated string (<code className="field">&quot;TLV,ATH&quot;</code>). Duplicates are dropped. At most 8
            origin x destination pairs (2 x 4, 4 x 2 …), and no code on both sides. City codes (
            <code className="field">LON</code>, <code className="field">NYC</code>) work on the one-way only; the round trip
            wants airports (<code className="field">LHR,LGW</code>).
          </FieldRow>
          <FieldRow name="limit" type="int 1–20">
            How many results come back, ranked across all pairs. Defaults to <code className="field">10</code>.
          </FieldRow>
          <FieldRow name="passengers" type="int[]">
            One code per traveller: <code className="field">1</code> adult, <code className="field">2</code> child,{' '}
            <code className="field">3</code> infant on lap, <code className="field">4</code> infant in seat, so{' '}
            <code className="field">[1, 1, 2]</code> is two adults and a child. Omit it for one adult. A party with a child or
            an infant is searched pair by pair on Google&apos;s own search call, as on the single-airport endpoints (
            <code className="field">X-Search-Notes: via_rpc</code>, no price range on those rows).
          </FieldRow>
          <FieldRow name="return_date" type="string">
            Round trip only, <code className="field">YYYY-MM-DD</code>. A stay over 32 nights is searched too: Google&apos;s
            page lists nothing that long, so each pair goes to Google&apos;s own search call, as on the single-airport
            round-trip endpoint (<code className="field">X-Search-Notes: via_rpc</code>).
          </FieldRow>
          <FieldRow name="use_fallback" type="bool">
            Leave it out. <code className="field">true</code> is refused. On the round trip,{' '}
            <code className="field">false</code> keeps an adults&apos; stay over 32 nights on Google&apos;s page only, which
            on many routes lists nothing for it (a 503 with <code className="field">upstream_no_render</code>).
          </FieldRow>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Errors"
          title="Every refusal is a 422 that names the field"
          lede="Refused before any search runs. The body carries detail, help, hint and field, like every other 422 on this API."
        />
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">You sent</th>
                  <th className="px-4 py-3 font-normal">field</th>
                  <th className="px-4 py-3 font-normal">detail (example)</th>
                </tr>
              </thead>
              <tbody>
                {REFUSALS.map((r) => (
                  <tr key={r.when} className="border-t rule align-top">
                    <td className="px-4 py-3.5 text-ink-300">{r.when}</td>
                    <td className="px-4 py-3.5 font-mono text-[12.5px] text-ink-200 whitespace-nowrap">{r.field}</td>
                    <td className="px-4 py-3.5 font-mono text-[12.5px] text-ink-400">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-8 max-w-3xl">
          <Code label="422 · round trip TLV → LON, the full body">{CITY_CODE_422}</Code>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Flights API" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/one-way', label: 'One-way search', sub: 'Every request and response field' },
            { href: '/flights-api/round-trip', label: 'Round-trip search', sub: 'Paired-leg itineraries' },
            { href: '/flights-api/search-status', label: 'Search status', sub: '"empty" vs "failed"' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans, quotas and rate limits' },
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
          title="Several airports, one request"
          body="Live Google Flights fares for every airport pair, ranked together, from your first call."
        />
      </Section>
    </>
  );
}
