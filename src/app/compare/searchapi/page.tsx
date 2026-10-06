import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Code, Container, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FLIGHT_PLANS, HOTEL_PLANS, perThousand } from '@/lib/pricing';
import { LINKS, SITE } from '@/lib/site';
import { CompareTable, Quotable } from '../_components/CompareTable';
import { OtherAlternatives } from '../_components/OtherAlternatives';

/**
 * SearchApi figures are QUOTES from searchapi.io/pricing,
 * searchapi.io/docs/google-flights-api and
 * searchapi.io/docs/google-flights-calendar-api, all read 2026-10-06.
 * Do not edit a SearchApi number without re-reading those pages.
 */
const READ = '2026-10-06';
/** The live FlightPowers run pasted below (raw: src/app/compare/_runs/2026-10-06/JFK-MAD-l10.json). */
const CAPTURED = '19:54 UTC on 2026-10-06';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const ULTRA = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
const HOTEL_PRO = HOTEL_PLANS.find((p) => p.name === 'PRO')!;

const TITLE = 'SearchApi alternative for Google Flights, priced per search';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description: `SearchApi starts at $40 for 10,000 searches; FlightPowers at $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}, with both legs of a round trip in one request. Read ${READ}.`,
    alternates: { canonical: '/compare/searchapi' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Is there a cheaper alternative to SearchApi for Google Flights?',
    a: `Cheaper to start, yes. SearchApi's smallest plan is $40 a month for 10,000 searches (searchapi.io/pricing, read ${READ}). FlightPowers PRO is $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}. Per search the two are the same, $4 per 1,000. At SearchApi's volume, our ULTRA plan is $${ULTRA.priceMonthly} for ${ULTRA.quota.toLocaleString('en-US')} searches.`,
  },
  {
    q: 'Does SearchApi charge for failed searches?',
    a: `No. Their pricing page says "Only successful searches with a 200 status code incur charges" (read ${READ}). On RapidAPI every request that reaches our listing is counted, including errors, so on that one row SearchApi bills more kindly than we do.`,
  },
  {
    q: 'How many requests is a round trip on SearchApi?',
    a: 'The first call lists outbound flights, each with a price. To see the return flights you send a second call with the departure_token from the outbound you picked; their docs describe the token as "used to select a flight and view return flights (for round trips)". On FlightPowers one POST /v1/flights/roundtrip returns both legs, the total and one booking link.',
  },
  {
    q: 'Can FlightPowers price a whole range of dates like the SearchApi calendar?',
    a: `Not in one REST call. Our REST API takes one date pair per request, so a month of departure dates is about 30 requests, which PRO's ${PRO.ratePerMinute} requests a minute runs in parallel. Our MCP servers do take a date range and a list of destinations in one tool call, and each date and destination still counts as one search. SearchApi's calendar endpoint returns a date grid in one request.`,
  },
  {
    q: 'Does SearchApi have hotels too?',
    a: `Yes: Google Hotels, Booking.com Search and Airbnb Search are sold on the same plans. Our Hotels API is Booking.com only, $${HOTEL_PRO.priceMonthly} for ${HOTEL_PRO.quota.toLocaleString('en-US')} searches, with a proxy_country parameter that prices a stay as seen from another country.`,
  },
];

export default function CompareSearchApiPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: TITLE,
          url: `${SITE.url}/compare/searchapi`,
          dateModified: READ,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE.url}/compare` },
            { '@type': 'ListItem', position: 3, name: 'SearchApi', item: `${SITE.url}/compare/searchapi` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/searchapi', label: 'SearchApi' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · SearchApi pages read {READ}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            A <span className="text-signal-500">SearchApi</span> alternative for Google Flights
          </h1>
          <Quotable>
            FlightPowers is a SearchApi alternative for Google Flights: the same Google fares and price band, both legs of a round
            trip in one request where SearchApi needs a second call for the return flight, and a ${PRO.priceMonthly} plan for{' '}
            {PRO.quota.toLocaleString('en-US')} searches against SearchApi&apos;s $40 for 10,000. Best for small flight workloads;
            SearchApi for its date-grid calendar.
          </Quotable>
          <p className="mt-5 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            SearchApi figures are quoted from searchapi.io on <strong className="text-ink-200">{READ}</strong>. Ours come from the
            same file as our{' '}
            <Link href="/pricing" className="text-signal-400 underline underline-offset-4">
              pricing page
            </Link>
            . If their site says something different today, their site is right.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead
          eyebrow="Side by side"
          title="Same price per search, different first bill"
          lede="SearchApi's Developer plan and our PRO plan both work out at $4 per 1,000 searches. What differs is how much you pay before the first search, and what a round trip costs."
        />
        <div className="mt-8">
          <CompareTable
            caption={`SearchApi cells: searchapi.io/pricing and /docs, read ${READ}. FlightPowers cells: src/lib/pricing.ts and the run below.`}
            head={['', 'SearchApi', 'FlightPowers']}
            rows={[
              ['Smallest paid plan', '$40 a month, 10,000 searches', `$${PRO.priceMonthly} a month, ${PRO.quota.toLocaleString('en-US')} searches (PRO)`],
              ['Per 1,000 searches, entry plan', '$4 ("$4 per 1,000 searches")', `${perThousand(PRO)} on PRO, ${perThousand(ULTRA)} on ULTRA ($${ULTRA.priceMonthly} for ${ULTRA.quota.toLocaleString('en-US')})`],
              ['Free to try', '"Sign up for 100 free requests"', '10 requests a month on BASIC, no card'],
              [
                'Round trip with the return flight',
                'Two calls: the search, then a second call with the departure_token of the outbound you picked. $8 per 1,000 priced round trips on Developer.',
                `One call to POST /v1/flights/roundtrip: both legs, one total, one booking link. ${perThousand(PRO)} per 1,000 on PRO.`,
              ],
              [
                'Google price band',
                'Yes: price_insights with typical_price_range and a price_history series.',
                'Yes: price_insights_low / price_insights_high and a low / typical / high verdict on every result. No history series.',
              ],
              [
                'A range of dates in one call',
                'Yes, on REST: the google_flights_calendar engine returns every date pair in a range, up to 200 combinations.',
                'Not on REST (one date pair per request). Yes on our MCP servers: a date range and a destination list in one tool call, each combination counted as one search.',
              ],
              ['Hotels', 'Google Hotels, Booking.com Search and Airbnb Search on the same plans.', `Booking.com only, on its own plan: $${HOTEL_PRO.priceMonthly} for ${HOTEL_PRO.quota.toLocaleString('en-US')}, with proxy_country.`],
              [
                'MCP',
                'Their docs menu has an MCP section ("Your MCPs") behind sign-in. We did not test it.',
                <>
                  Hosted servers at <code className="font-mono text-[12px]">{LINKS.mcpFlights}</code> and{' '}
                  <code className="font-mono text-[12px]">{LINKS.mcpHotels}</code>, on your own RapidAPI key.
                </>,
              ],
              ['Failed requests', '"Only successful searches with a 200 status code incur charges."', 'Counted by RapidAPI like any request.'],
              ['Rate limit', '"up to 20% of your plan\'s credits each hour": 2,000 an hour on Developer.', `${PRO.ratePerMinute} a minute on PRO, ${ULTRA.ratePerMinute} on ULTRA.`],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The round trip"
          title="One request on their own example route"
          lede="SearchApi's Google Flights docs use New York to Madrid as the round-trip example. Here is the same route through our API, one call, run on the date shown."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Code label="request">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "JFK",
    "to_airport": "MAD",
    "departure_date": "2026-11-17",
    "return_date": "2026-11-24",
    "currency": "USD",
    "limit": 10
  }'`}</Code>
            <p className="text-[14.5px] text-ink-400 leading-relaxed">
              The call returned ten itineraries with <code className="font-mono text-[13px]">X-Search-Status: ok</code>. The
              cheapest is on the right: $498 on TAP through Lisbon, which Google calls typical for this route ($350 to $530). Both
              legs, their stops and the total are in the one object. The nonstop Iberia and Delta options in the same answer were
              $660.
            </p>
          </div>
          <Code label={`response · cheapest of 10 rows · captured ${CAPTURED}`}>{`{
  "price_range_in_relation_to_other_periods": "typical",
  "price_insights_low": 350,
  "price_insights_high": 530,
  "from_airport": "New York (JFK)",
  "to_airport": "Madrid (MAD)",
  "departure_date": "2026-11-17",
  "return_date": "2026-11-24",
  "total_price": "$498",
  "total_price_as_number": 498,
  "total_stops": 2,
  "departure_flight_airline": "Tap Air Portugal",
  "departure_flight_duration": "10 hr 5 min",
  "departure_flight_stops": 1,
  "departure_stops_info": [
    { "stop_airport": "LIS", "stop_duration_seconds": 6000 }
  ],
  "return_flight_airline": "Tap Air Portugal",
  "return_flight_duration": "18 hr 25 min",
  "return_flight_stops": 1,
  "return_stops_info": [
    { "stop_airport": "LIS", "stop_duration_seconds": 30600 }
  ],
  "buy_link": "https://www.google.com/travel/flights?tfs=..."
}`}</Code>
        </div>
        <blockquote className="mt-8 max-w-3xl border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
          “departure_token: Used to select a flight and view return flights (for round trips) or flights for the next leg (for
          multi-city trips).”
          <footer className="mt-2 font-mono text-[11px] text-ink-500">searchapi.io/docs/google-flights-api · read {READ}</footer>
        </blockquote>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          To be fair to them: in SearchApi&apos;s own sample response the first call already shows a price on each outbound row,
          marked “Round trip”, so if you only need the number, one call may be enough there too. The second call is for the return flight itself, which a fare alert or a booking link usually
          needs.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Their side" title="What SearchApi does that we do not" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">A date grid in one request</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Their calendar engine takes an outbound range and a return range and, in their words, “will return all possible
              outbound-return date combinations within the specified ranges”, up to 200. If a price calendar is your product, that
              is one request where our REST API needs one per date pair.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Dozens of other engines on one key</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Google Search, Maps, Shopping, Hotels, Booking.com, Airbnb, Tripadvisor and more are sold on the same plans. If
              flights are one feature among several, one vendor is simpler than two.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">A legal protection clause</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Their Production plan and every plan above it list a Legal Protection Guarantee: “We accept legal responsibility
              for how SearchApi collects and parses publicly available search results, backed by up to $2M in coverage.” We offer
              no indemnity.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Price history and multi-city</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Their price_insights carries a price_history series, and flight_type=multi_city prices three or more legs. We return
              the band without history, and one-way or round trip only.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which one to pick" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Pick SearchApi when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You build a price calendar and want the grid in one REST call.</li>
              <li>You already use their other engines and want one bill.</li>
              <li>You need multi-city or a fare history series.</li>
              <li>Your legal team wants a coverage clause.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Pick FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>Your volume is under 10,000 searches a month and $40 is more than you need to spend.</li>
              <li>Most of your searches are round trips and you need the return flight.</li>
              <li>You want flights inside Claude or Cursor with a date range in one tool call.</li>
              <li>You also price hotels as seen from different countries.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <OtherAlternatives current="/compare/searchapi" />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="compare"
          title="Run the same route on your own key"
          body="Live Google Flights fares with Google's price band on every result, and a round trip in one request."
        />
      </Section>
    </>
  );
}
