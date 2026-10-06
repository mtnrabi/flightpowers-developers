import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  Code,
  Container,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FLIGHT_PLANS, perThousand } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';
import { CompareTable, Quotable } from '../_components/CompareTable';
import { OtherAlternatives } from '../_components/OtherAlternatives';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;

export const metadata: Metadata = withOg({
  title: 'FlightPowers vs HasData Google Flights API',
  description: `HasData: $59 for 13,333 Google Flights searches, return legs on a second call, 66 free. FlightPowers: $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}, round trip in one. Read 2026-10-06.`,
  alternates: { canonical: '/compare/hasdata' },
});

export const dynamic = 'force-static';

/**
 * Competitor figures below are sourced from hasdata.com/apis/google-flights-api,
 * hasdata.com/prices (the Offer JSON-LD on that page gives the monthly-billed
 * prices; the visible cards default to the annual equivalent) and the official
 * MCP registry (com.hasdata/google-flights, com.hasdata/google-flights-deals),
 * all re-read 2026-10-06. Do not edit any HasData figure without re-reading
 * those pages.
 *
 * 2026-09-06 correction: their Google Flights page documents a priceInsights object
 * with lowestPrice, typicalPriceRange, priceLevel ("low | typical | high right now")
 * and priceHistory. An earlier version of this page framed their price context as a
 * history series against our verdict. That was wrong: they publish both.
 */
const RETRIEVED = '2026-10-06';
/** The live FlightPowers run pasted below (raw: src/app/compare/_runs/2026-10-06/LHR-JFK-l10.json). */
const CAPTURED = '19:54 UTC on 2026-10-06';

const faq: Faq[] = [
  {
    q: 'How big is the HasData free tier compared to this one?',
    a: 'Bigger, and it is not close. HasData\'s free plan "renews 1,000 credits every month, enough for up to 66 flight requests", at 15 credits a route search. Our free BASIC plan is 10 requests a month. If your question is "how much can I try before paying", HasData wins that row outright. Read on 2026-10-06.',
  },
  {
    q: 'Which is cheaper per search once you are paying?',
    a: 'On the entry plan, ours, by a little. HasData says "paid plans start at $59 per month for 13,333 route searches", which is $4.43 per 1,000; our PRO is $10 for 2,500, $4.00 per 1,000. Their page also says the unit price "drops with volume from $4.43 to $1.25 per 1,000 searches", so at high volume the comparison flips. Round trips change the sum: their return flights take a second request. Read on 2026-10-06.',
  },
  {
    q: 'Do both ship an MCP server?',
    a: 'Yes. HasData runs hosted MCP servers at mcp.hasdata.com; the official MCP registry lists com.hasdata/google-flights and, since 2026-10-05, com.hasdata/google-flights-deals. Ours are flights.flightpowers.com/mcp and hotels.flightpowers.com/mcp, on your own RapidAPI key, also in the official registry. Our flight tools take a date range and a list of destinations in one call. Checked 2026-10-06.',
  },
  {
    q: 'What does HasData return that is listed on their page and not on ours?',
    a: 'Carbon estimates, a price history series, and a Deals search. Their FAQ reads "priceInsights returns the lowest fare, the typical price range for the route, whether prices are low or high right now, and a price history over time", so the band and the verdict are a tie and the history series is theirs. Their Deals endpoint "accepts a trip description and a departure airport, then lets Google suggest matching destinations and dates"; we have nothing like it. Read on 2026-10-06.',
  },
];

export default function CompareHasDataPage() {
  const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const mega = FLIGHT_PLANS.find((p) => p.name === 'MEGA')!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers vs HasData Google Flights API',
          url: `${SITE.url}/compare/hasdata`,
          dateModified: RETRIEVED,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE.url}/compare` },
            { '@type': 'ListItem', position: 3, name: 'HasData', item: `${SITE.url}/compare/hasdata` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/compare', label: 'Compare' },
            { href: '/compare/hasdata', label: 'HasData' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">HasData</span> Google Flights API
          </h1>
          <Quotable>
            FlightPowers is a HasData alternative for Google Flights: the same Google fares and price band, both legs of a round trip
            in one request where HasData needs a second departureToken call, and ${pro.priceMonthly} for{' '}
            {pro.quota.toLocaleString('en-US')} searches against HasData&apos;s $59 for 13,333. Best for small round-trip workloads;
            HasData for a bigger free tier and price history.
          </Quotable>
          <p className="lede mt-5 max-w-3xl">
            HasData is an established scraping vendor that ships a Google Flights API and a hosted MCP server. Their free tier is
            several times the size of ours, and their entry plan costs a little more per search than ours. Both of those are their
            published numbers, and both are stated here because a comparison that only reports the flattering half is not one.
          </p>
          <p className="mt-5 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
            Looking for an alternative? FlightPowers is a{' '}
            <Link href="/flights-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Flights API
            </Link>{' '}
            over live Google Flights fares and a{' '}
            <Link href="/hotels-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Hotels API
            </Link>{' '}
            over live Booking.com rates, with{' '}
            <Link href="/mcp" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              MCP servers
            </Link>{' '}
            for Claude and Cursor; PRO is $10 for 2,500 flight searches, and the{' '}
            <Link href="/guides" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              guides
            </Link>{' '}
            have working code for each.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The one-paragraph version" title="They win the trial, we win the entry unit price" />
        <p className="mt-6 max-w-3xl text-[15.5px] text-ink-300 leading-relaxed">
          If you have not decided yet and you want to test properly before paying anyone,{' '}
          <strong className="text-ink-100">start on HasData</strong>: 1,000 free credits a month, which their page calls 66 flight
          searches, is a real evaluation and our 10 requests is not. If you already know the workload and you are pricing a
          production line item at the entry tier, run the arithmetic below, because their Startup plan works out dearer per search
          than our PRO. At their larger plans the unit price falls and that advantage goes away.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Both sides, from the published pages"
          lede="HasData figures read from their own pricing and Google Flights API pages on the stamped date. Ours render from the same file as /pricing, parsed from the live listing."
        />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">HasData</h3>
            <div className="rounded-2xl border rule bg-ink-900/60 p-6 max-w-2xl">
              <ul className="space-y-2 text-[14.5px] text-ink-300 leading-relaxed list-disc pl-5">
                <li>&quot;A route search costs 15 credits; a Deals search costs 15 credits.&quot;</li>
                <li>Free: 1,000 credits every month, no card, &quot;enough for up to 66 flight requests&quot;.</li>
                <li>Startup: $59 a month billed monthly for 200,000 credits, which they state as 13,333 route searches, $4.43 per 1,000.</li>
                <li>Basic: $119 for 1,000,000 credits. Growth: $249 for 3,000,000 credits. Their page: the unit price &quot;drops with volume from $4.43 to $1.25 per 1,000 searches&quot;.</li>
                <li>Annual billing is &quot;the price of ten&quot; months; the cards on their pricing page show that annual figure ($49 for Startup) by default.</li>
                <li>Hosted MCP servers at mcp.hasdata.com, including com.hasdata/google-flights in the official MCP registry.</li>
              </ul>
              <p className="mt-4 text-[13.5px] text-ink-400 leading-relaxed">
                Source:{' '}
                <a href="https://hasdata.com/apis/google-flights-api" rel="noopener" className="text-signal-400 underline underline-offset-4">
                  hasdata.com/apis/google-flights-api
                </a>{' '}
                and their pricing page, read {RETRIEVED}. Credits per search is their number, not our estimate. If their page
                disagrees with this one today, believe their page.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers (Google Flights Live API)</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed max-w-2xl">
              Per thousand requests: PRO is {perThousand(pro)}, MEGA is {perThousand(mega)}. Our free plan is 10 requests a month and
              is a hard cap, so request 11 is refused rather than billed.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Capabilities" title="Feature by feature, in prose" lede="No tick marks. Each cell says what is documented, and by whom." />
        <div className="mt-8">
          <CompareTable
            caption={`HasData cells quote or summarise their own live pages, read ${RETRIEVED}; FlightPowers cells are traceable to the live listing, the run below and the pages linked from each row.`}
            head={['', 'HasData', 'FlightPowers']}
            rows={[
              [
                'Free tier',
                '1,000 credits a month, no card. Their page calls that 66 flight searches. This row is theirs.',
                <>10 requests a month, hard cap, every endpoint and every field included. Smaller by design, and smaller than most of the field.</>,
              ],
              [
                'Price context',
                'A priceInsights object with lowestPrice, typicalPriceRange, priceLevel ("low | typical | high right now") and a priceHistory array of timestamped points. Band, verdict and history. This row is theirs on the history column and a tie on the rest.',
                <>
                  Google&apos;s own band plus a low, typical or high verdict on every result. No history array, so if you want a series you accumulate it.{' '}
                  <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">Price Insights →</Link>
                </>,
              ],
              [
                'MCP',
                'Hosted servers at mcp.hasdata.com: Google Flights, and Google Flights Deals since 2026-10-05, both in the official MCP registry.',
                <>
                  <code className="font-mono text-[12px]">{LINKS.mcpFlights}</code> and{' '}
                  <code className="font-mono text-[12px]">{LINKS.mcpHotels}</code> on your own RapidAPI key, both in the official
                  registry. The flight tools take a date range and a destination list in one call; each date and destination counts
                  as one search.{' '}
                  <Link href="/mcp" className="text-signal-400 underline underline-offset-4">MCP servers →</Link>
                </>,
              ],
              [
                'Round trips',
                'Documented. Their FAQ: "For a round trip, use type=roundTrip and include returnDate. Return-leg options are retrieved separately using departureToken." So the return leg is a second call, and a second 15 credits.',
                <>
                  One paired-leg request with a combined total and one booking link.{' '}
                  <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">Round-Trip API →</Link>
                </>,
              ],
              [
                'Per 1,000 round trips with the return flight',
                'About $8.85 on Startup: $59 buys 13,333 route searches, and a round trip with its return flight is two of them.',
                `${perThousand(pro)} on PRO: one request.`,
              ],
              [
                'Deals search',
                'Google Flights Deals: a trip description and a departure airport, and Google suggests destinations and dates. 15 credits.',
                'None. You name the route and the dates (or, on the MCP servers, a date range and a list of destinations).',
              ],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="A real run"
          title="Their example route, both legs in one answer"
          lede="HasData's Google Flights page uses London Heathrow to New York JFK as its curl example. Same route, one call to our API."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Code label="request">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "LHR",
    "to_airport": "JFK",
    "departure_date": "2026-11-17",
    "return_date": "2026-11-24",
    "currency": "USD",
    "limit": 10
  }'`}</Code>
            <p className="text-[14.5px] text-ink-400 leading-relaxed">
              Ten itineraries, each with both legs. The cheapest, on the right, is $500 on TAP through Lisbon, inside Google&apos;s
              usual range of $470 to $580, so “typical”. It is cheap for a reason: a 24-hour stop in Lisbon on the way out. The
              nonstop British Airways options in the same answer were $720. On HasData, seeing the return flight of any one of these
              is a second request.
            </p>
          </div>
          <Code label={`response · cheapest of 10 rows · captured ${CAPTURED}`}>{`{
  "price_range_in_relation_to_other_periods": "typical",
  "price_insights_low": 470,
  "price_insights_high": 580,
  "from_airport": "London (LHR)",
  "to_airport": "New York (JFK)",
  "departure_date": "2026-11-17",
  "return_date": "2026-11-24",
  "total_price": "$500",
  "total_price_as_number": 500,
  "total_stops": 2,
  "departure_flight_airline": "Tap Air Portugal",
  "departure_flight_duration": "35 hr 25 min",
  "departure_flight_stops": 1,
  "departure_stops_info": [
    { "stop_airport": "LIS", "stop_duration_seconds": 86700 }
  ],
  "return_flight_airline": "Tap Air Portugal",
  "return_flight_duration": "14 hr 30 min",
  "return_flight_stops": 1,
  "return_stops_info": [
    { "stop_airport": "LIS", "stop_duration_seconds": 16500 }
  ],
  "buy_link": "https://www.google.com/travel/flights?tfs=..."
}`}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which should you pick" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose HasData when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You want a proper unpaid evaluation before committing. Sixty-six searches is one, ten is not.</li>
              <li>You need a price history series. They return one, we do not.</li>
              <li>Carbon data is on your requirements list.</li>
              <li>Your volume is high enough to reach their larger plans, where the unit price drops.</li>
              <li>You want Google to suggest destinations and dates from a description (their Deals search).</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You are pricing an entry-tier production workload and the per-search cost decides it.</li>
              <li>You want the return leg in the same response rather than a second call with a token.</li>
              <li>Round trips are a real share of your searches and you want them priced as one itinerary.</li>
              <li>You want flights and hotels from one vendor on one key.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <OtherAlternatives current="/compare/hasdata" />
        <p className="mt-8 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Want to skip all of this and judge the data? A key is on{' '}
          <a href={rapidApiPricingUrl('flights', 'compare')} rel="noopener" className="text-signal-400 underline underline-offset-4">
            the RapidAPI listing
          </a>
          , free plan included.
        </p>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="compare"
          title="Judge the data, not the comparison"
          body="Live Google Flights fares with Google's own price band and a low, typical or high verdict on every result."
        />
      </Section>
    </>
  );
}
