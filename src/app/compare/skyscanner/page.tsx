import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Code, Container, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { SITE } from '@/lib/site';
import { CompareTable, Quotable } from '../_components/CompareTable';
import { OtherAlternatives } from '../_components/OtherAlternatives';

/**
 * Skyscanner facts are QUOTES from partners.skyscanner.net/product/travel-api,
 * developers.skyscanner.net/docs/getting-started/authentication and
 * developers.skyscanner.net/docs/flights-indicative-prices/overview, all
 * read 2026-10-06. Skyscanner publishes no API price; none appears here.
 */
const READ = '2026-10-06';
/** The live FlightPowers run pasted below (raw: src/app/compare/_runs/2026-10-06/EDI-BCN.json). */
const CAPTURED = '19:54 UTC on 2026-10-06';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const HOTEL_PRO = HOTEL_PLANS.find((p) => p.name === 'PRO')!;

const TITLE = 'Skyscanner API alternative: no partner approval, live fares';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description: `Skyscanner reviews each API application within two weeks. FlightPowers: a key today, $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')} live Google Flights searches. Read ${READ}.`,
    alternates: { canonical: '/compare/skyscanner' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Is the Skyscanner API free?',
    a: `There is no public price to pay, and no public sign-up either. Skyscanner's developer docs say: "To access the Skyscanner APIs, you're required to submit an application with our Partnerships team for reviewal and our team will reach out to you if your application is successful" (read ${READ}). Approved partners earn commission on the traffic they send.`,
  },
  {
    q: 'Who can get Skyscanner API access?',
    a: `Their partner page says: "If you're an established business with a large audience, you can apply for our Travel API. Our team reviews each application and will get back to you within two weeks." A side project or a new product usually does not fit that description.`,
  },
  {
    q: 'Are Skyscanner API prices live?',
    a: 'Both kinds exist. Live Prices is a create-then-poll API that powers their own flight search. Indicative Prices is cached: "The prices shown are cached and can be up to 4 days old, therefore they may differ from live prices." Every FlightPowers search is fetched live when you call it.',
  },
  {
    q: 'What is the alternative to the Skyscanner API for a small project?',
    a: `An API you can subscribe to without an application. FlightPowers returns live Google Flights fares with Google's price band; BASIC is 10 free requests a month and PRO is $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}. You give up Skyscanner's commission and its car hire and hotel content; you gain a key the same day.`,
  },
];

export default function CompareSkyscannerPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: TITLE,
          url: `${SITE.url}/compare/skyscanner`,
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
            { '@type': 'ListItem', position: 3, name: 'Skyscanner', item: `${SITE.url}/compare/skyscanner` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/skyscanner', label: 'Skyscanner' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · Skyscanner pages read {READ}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            A <span className="text-signal-500">Skyscanner API</span> alternative when you are not a partner yet
          </h1>
          <Quotable>
            FlightPowers is a Skyscanner API alternative for developers without partner status: Skyscanner reviews every application
            and asks for an established business with a large audience, while our key works the day you subscribe:{' '}
            {`$${PRO.priceMonthly}`} for {PRO.quota.toLocaleString('en-US')} live Google Flights searches with Google&apos;s price
            band.
            Best for side projects, fare trackers and AI agents; Skyscanner if you qualify and want commission.
          </Quotable>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead
          eyebrow="How you get in"
          title="An application, a review, an account manager"
          lede="Skyscanner's Travel API is a partnership, not a product with a checkout. Their own pages say so plainly."
        />
        <div className="mt-8 max-w-3xl space-y-6">
          <blockquote className="border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
            “If you’re an established business with a large audience, you can apply for our Travel API. Our team reviews each
            application and will get back to you within two weeks.”
            <footer className="mt-2 font-mono text-[11px] text-ink-500">partners.skyscanner.net/product/travel-api · read {READ}</footer>
          </blockquote>
          <blockquote className="border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
            “If you&apos;re successful, your dedicated Skyscanner Account Manager will reach out to get you started on building your
            desired integration.” Then: “You’re then ready to help travellers find the best flight deals and earn commission.”
            <footer className="mt-2 font-mono text-[11px] text-ink-500">same page</footer>
          </blockquote>
          <p className="text-[15px] text-ink-300 leading-relaxed">
            That model has a real upside: Skyscanner pays you, we charge you. If your product sends travellers to book and you have
            the audience, apply to them first. If you are one developer with an idea, the shortest path to working code is a key you
            can subscribe to this afternoon.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Side by side" title="What each one gives you" />
        <div className="mt-8">
          <CompareTable
            caption={`Skyscanner cells: partners.skyscanner.net and developers.skyscanner.net, read ${READ}. FlightPowers cells: src/lib/pricing.ts and the run below.`}
            head={['', 'Skyscanner Travel API', 'FlightPowers']}
            rows={[
              ['Access', 'Apply; reviewed within two weeks; for established businesses with a large audience.', 'Subscribe on RapidAPI; the key works on the next request.'],
              ['Money', 'You earn commission on the traffic you send.', `You pay: BASIC 10 requests free, PRO $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}.`],
              ['Where fares come from', '“a network of 1,200+ partners and a blend of realtime and cached data”', 'Google Flights, fetched live at request time.'],
              ['Live search shape', 'Two endpoints: /create, then /poll for the rest of the results.', 'One request, one answer.'],
              ['Cached prices for exploring', 'Indicative Prices: “cached and can be up to 4 days old”.', 'None. Every search is live.'],
              ['Price verdict', 'We did not find a low / typical / high field in the docs we read.', 'Google\'s range for the route and a low / typical / high verdict on every result.'],
              ['Round trip', '“flexible dates, multi-leg journeys and advanced search filtering”, per their partner page.', 'One POST to /v1/flights/roundtrip, both legs, one total, one booking link.'],
              ['Hotels and cars', 'Hotels (rates, content, reviews) and Car Hire APIs.', `Booking.com hotel rates on their own plan, $${HOTEL_PRO.priceMonthly} for ${HOTEL_PRO.quota.toLocaleString('en-US')}. No car hire.`],
              ['MCP', 'We did not find a first-party MCP server on their developer portal.', 'Hosted MCP servers for flights and hotels on your own key.'],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="A real run"
          title="Edinburgh to Barcelona, one call, today"
          lede="No application, no account manager: a round trip six weeks out, with the verdict Google gives it."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Code label="request">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "EDI",
    "to_airport": "BCN",
    "departure_date": "2026-11-17",
    "return_date": "2026-11-24",
    "currency": "USD",
    "limit": 3
  }'`}</Code>
            <p className="text-[14.5px] text-ink-400 leading-relaxed">
              The cheapest of three itineraries was $226 on Lufthansa through Frankfurt. Google&apos;s usual range for this trip is
              $80 to $195, so the verdict is “high”: a fare alert would stay quiet, and a traveller might try other dates. That
              judgement is in the response, not something you compute.
            </p>
          </div>
          <Code label={`response · cheapest of 3 rows · captured ${CAPTURED}`}>{`{
  "price_range_in_relation_to_other_periods": "high",
  "price_insights_low": 80,
  "price_insights_high": 195,
  "from_airport": "Edinburgh (EDI)",
  "to_airport": "Barcelona (BCN)",
  "departure_date": "2026-11-17",
  "return_date": "2026-11-24",
  "total_price": "$226",
  "total_price_as_number": 226,
  "total_stops": 2,
  "departure_flight_airline": "Lufthansa",
  "departure_flight_duration": "5 hr 15 min",
  "departure_flight_stops": 1,
  "departure_stops_info": [
    { "stop_airport": "FRA", "stop_duration_seconds": 4800 }
  ],
  "return_flight_airline": "Lufthansa",
  "return_flight_duration": "14 hr 25 min",
  "return_flight_stops": 1,
  "return_stops_info": [
    { "stop_airport": "FRA", "stop_duration_seconds": 36900 }
  ],
  "buy_link": "https://www.google.com/travel/flights?tfs=..."
}`}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which one to go for" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Apply to Skyscanner when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You run an established travel product with real traffic.</li>
              <li>You want to earn commission rather than pay per search.</li>
              <li>You need car hire, hotel content and reviews from one partner.</li>
              <li>Cached prices are fine for an explore-anywhere page.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Use FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You want to ship this week, not after a review.</li>
              <li>Your product is a tracker, a research tool or an AI agent, not a booking funnel.</li>
              <li>You want Google&apos;s verdict on each fare.</li>
              <li>You need live prices on every call.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          Both is a fine answer: build on a key now, apply to Skyscanner when the audience is there. Our{' '}
          <Link href="/flights-api" className="text-signal-400 underline underline-offset-4">
            Flights API
          </Link>{' '}
          page has the full parameter list.
        </p>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <OtherAlternatives current="/compare/skyscanner" />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="compare"
          title="A key today, not in two weeks"
          body="Live Google Flights fares with Google's price band on every result. Free tier on RapidAPI, no card."
        />
      </Section>
    </>
  );
}
