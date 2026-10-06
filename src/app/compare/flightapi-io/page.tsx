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
 * FlightAPI.io figures are QUOTES from flightapi.io (the pricing block on the
 * home page; /pricing itself answers 404), flightapi.io/documentation/flight-price-api/
 * and flightapi.io/documentation/round-trip-api/, all read 2026-10-06.
 * Do not edit a FlightAPI.io number without re-reading those pages.
 */
const READ = '2026-10-06';
/** The live FlightPowers run pasted below (raw: src/app/compare/_runs/2026-10-06/HAN-SGN-l10.json). */
const CAPTURED = '19:54 UTC on 2026-10-06';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const ULTRA = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
const HOTEL_PRO = HOTEL_PLANS.find((p) => p.name === 'PRO')!;

/** $49 for 30,000 credits at 2 credits a search: 15,000 searches. */
const FA_PER_1K = `$${((49 / 15000) * 1000).toFixed(2)}`;

const TITLE = 'FlightAPI.io alternative: Google Flights fares, $10 to start';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description: `FlightAPI.io: $49 for 30,000 credits at 2 a search, many sellers' fares. FlightPowers: Google Flights fares and band, $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}. Read ${READ}.`,
    alternates: { canonical: '/compare/flightapi-io' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'How much does FlightAPI.io cost per search?',
    a: `Their LITE plan is $49 a month for 30,000 API credits, and their docs say a flight price request costs 2 credits, so 15,000 searches, about ${FA_PER_1K} per 1,000 (flightapi.io, read ${READ}). Our PRO is ${perThousand(PRO)} per 1,000 and ULTRA is ${perThousand(ULTRA)}. At the entry plan they are cheaper per search than our PRO; we are cheaper to start.`,
  },
  {
    q: 'Do FlightAPI.io and FlightPowers return the same fares?',
    a: 'No, and that is the main thing to decide on. FlightAPI.io says it compares "fares from over 700 OTAs and vendors" and its sample response lists several sellers per itinerary, each with its own price. FlightPowers returns the fare Google Flights shows, with Google\'s price band and a link that opens the trip on Google Flights.',
  },
  {
    q: 'Is there a free tier?',
    a: `FlightAPI.io: "Start with 20 free API calls". FlightPowers: 10 requests a month on the BASIC plan, no card. Neither is enough to evaluate a production workload; both are enough to see the response shape.`,
  },
  {
    q: 'Can I book flights with either API?',
    a: 'No. FlightAPI.io answers this in its own FAQ: "NO. You cannot book flights using our API. This API only tracks prices." Same for us: we return prices and a booking link, the purchase happens elsewhere. For booking inside your product you need a booking API such as Duffel.',
  },
];

export default function CompareFlightApiIoPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: TITLE,
          url: `${SITE.url}/compare/flightapi-io`,
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
            { '@type': 'ListItem', position: 3, name: 'FlightAPI.io', item: `${SITE.url}/compare/flightapi-io` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/flightapi-io', label: 'FlightAPI.io' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · FlightAPI.io pages read {READ}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            A <span className="text-signal-500">FlightAPI.io</span> alternative built on Google Flights
          </h1>
          <Quotable>
            FlightPowers is a FlightAPI.io alternative for flight price data: the fare Google Flights shows, with Google&apos;s low /
            typical / high price band, and a ${PRO.priceMonthly} plan for {PRO.quota.toLocaleString('en-US')} searches against
            FlightAPI.io&apos;s $49 for 30,000 credits at 2 credits a search. Best for small budgets and fare verdicts;
            FlightAPI.io if you want each seller&apos;s price.
          </Quotable>
          <p className="mt-5 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            FlightAPI.io figures are quoted from flightapi.io and its documentation on{' '}
            <strong className="text-ink-200">{READ}</strong>. Their <code className="font-mono text-[13px]">/pricing</code> URL
            answered 404 that day, so the plans come from the pricing block on their home page.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead
          eyebrow="Start here"
          title="Two different sources of fares"
          lede="Before price, decide which answer you want. The two APIs are not reading the same thing."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">FlightAPI.io: many sellers per trip</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Their docs say you can “compare fares from over 700 OTAs and vendors”. In their sample round-trip response each
              itinerary has a <code className="font-mono text-[13px]">pricing_options</code> list, one entry per seller, each with
              its own price, a <code className="font-mono text-[13px]">quote_age</code> and fare basis codes per segment. If your
              product shows “this trip costs X here and Y there”, that is the shape you want.
            </p>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">FlightPowers: the Google Flights answer</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              We return the fare Google Flights shows for the trip, plus Google&apos;s own range for the route
              (<code className="font-mono text-[13px]">price_insights_low</code> /{' '}
              <code className="font-mono text-[13px]">price_insights_high</code>) and its low / typical / high verdict. If your
              product asks “is this a good price right now”, that band is the part you would otherwise have to build.{' '}
              <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">
                The band, explained
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Side by side" title="The numbers, read the same day" />
        <div className="mt-8">
          <CompareTable
            caption={`FlightAPI.io cells: flightapi.io and /documentation, read ${READ}. FlightPowers cells: src/lib/pricing.ts and the run below.`}
            head={['', 'FlightAPI.io', 'FlightPowers']}
            rows={[
              ['Smallest paid plan', '$49 a month, 30,000 credits (LITE)', `$${PRO.priceMonthly} a month, ${PRO.quota.toLocaleString('en-US')} searches (PRO)`],
              ['Cost of one search', '"Each successful request will cost you 2 credits."', '1 request'],
              ['Per 1,000 searches, entry plan', `${FA_PER_1K} (15,000 searches for $49)`, `${perThousand(PRO)} on PRO, ${perThousand(ULTRA)} on ULTRA`],
              ['Free to try', '"Start with 20 free API calls"', '10 requests a month on BASIC'],
              ['Round trip', 'One GET to /roundtrip, 2 credits, both legs in each itinerary.', 'One POST to /v1/flights/roundtrip, both legs, one total, one booking link.'],
              ['Price verdict', 'We did not find a price band or verdict in their round-trip docs.', 'Google\'s low / typical / high verdict and range on every result.'],
              ['Sellers per itinerary', 'Several, each with its own price and quote age.', 'One: the price Google Flights shows.'],
              ['Market', '"region": "Check local prices of any country by passing the ISO code of that country."', 'Flights: currency only. Hotels: proxy_country prices a stay as seen from another country.'],
              ['Other data', 'Multi-city, flight tracking, airport schedules, and a separate hotel price API (Makcorps).', `Booking.com hotel rates on their own plan, $${HOTEL_PRO.priceMonthly} for ${HOTEL_PRO.quota.toLocaleString('en-US')}. No tracking or schedules.`],
              [
                'MCP',
                'We did not find an MCP server in their docs.',
                <>
                  <code className="font-mono text-[12px]">{LINKS.mcpFlights}</code>, with a date range and a list of destinations in one
                  tool call.
                </>,
              ],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="A real run"
          title="Their example route, through our API"
          lede="FlightAPI.io's round-trip docs use Hanoi to Ho Chi Minh City. Same route, one call, dates six weeks out."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Code label="request">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "HAN",
    "to_airport": "SGN",
    "departure_date": "2026-11-17",
    "return_date": "2026-11-24",
    "currency": "USD",
    "limit": 10
  }'`}</Code>
            <p className="text-[14.5px] text-ink-400 leading-relaxed">
              Ten itineraries came back. The cheapest, on the right, is $85 return on Vietjet, nonstop both ways, and Google puts the
              usual range for this trip at $70 to $90, so it reads “typical”. That one word is what a fare alert needs to decide
              whether to notify anyone.
            </p>
          </div>
          <Code label={`response · cheapest of 10 rows · captured ${CAPTURED}`}>{`{
  "price_range_in_relation_to_other_periods": "typical",
  "price_insights_low": 70,
  "price_insights_high": 90,
  "from_airport": "Hanoi (HAN)",
  "to_airport": "Ho Chi Minh City (SGN)",
  "departure_date": "2026-11-17",
  "return_date": "2026-11-24",
  "total_price": "$85",
  "total_price_as_number": 85,
  "total_stops": 0,
  "departure_flight_airline": "Vietjet",
  "departure_flight_duration": "2 hr 10 min",
  "departure_flight_stops": 0,
  "return_flight_airline": "Vietjet",
  "return_flight_duration": "2 hr 10 min",
  "return_flight_stops": 0,
  "buy_link": "https://www.google.com/travel/flights?tfs=..."
}`}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which one to pick" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Pick FlightAPI.io when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You show several sellers&apos; prices for the same trip.</li>
              <li>You need multi-city, flight status or airport schedules from the same vendor.</li>
              <li>You run more than 2,500 searches a month and $49 is fine: their per-search price at entry is lower than our PRO.</li>
              <li>You want flight prices as seen from a given country.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Pick FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You want the price people see on Google Flights, with a verdict on it.</li>
              <li>You are starting small and $10 covers your month.</li>
              <li>You scan dates and destinations from an AI agent over MCP.</li>
              <li>You also need Booking.com hotel rates by country.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <OtherAlternatives current="/compare/flightapi-io" />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="compare"
          title="Check the Google price on your route"
          body="Live Google Flights fares with the price band and verdict on every result. Free tier on RapidAPI, no card."
        />
      </Section>
    </>
  );
}
