import type { Metadata } from 'next';
import Link from 'next/link';
import { RoundTripTool } from '@/components/tools/RoundTripTool';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { withOg } from '@/lib/meta';
import { ROUTES, routeArrow } from '@/lib/grid';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Round-Trip Planner: out and back priced as one itinerary',
  description:
    'Price a return trip the way a booking engine does: paired legs, one total, each side with its own airline, stops and duration. Live Google Flights data, free, no signup.',
  alternates: { canonical: '/tools/round-trip-planner' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Why not just add two one-way searches together?',
    a: 'Because the answer is usually wrong. Airlines price a return as a product, not as two halves, so the total of two one-ways is often higher than the return fare and sometimes lower than anything you can actually buy. This tool calls the round-trip endpoint, which returns paired legs and one real total for the pair.',
  },
  {
    q: 'What comes back for each itinerary?',
    a: 'The total price and total price as a number, then each leg separately: departure and arrival descriptions, airline, stops and duration for the outbound, and the same four for the return. That is what lets you tell a cheap total with a 14-hour layover apart from a cheap total without one.',
  },
  {
    q: 'Is it free, and is it live?',
    a: 'Both. No account and no email, and every run is a real search against live Google Flights on our key, which is why runs are capped per visitor per day.',
  },
  {
    q: 'Why did a search return nothing?',
    a: 'Round trips fail differently from one-ways: a return date that nothing serves, or a turnaround too short to fly, gives a genuinely empty result. The API reports that in an X-Search-Status header as "empty", and reports a search that did not finish as "degraded", so you can tell the two apart instead of guessing.',
  },
  {
    q: 'Can I compare trip lengths?',
    a: 'Change the return date and run it again. Each run is one request. Doing that across five or ten trip lengths at once is exactly the sort of thing to do on your own key, in parallel, rather than one click at a time here.',
  },
];

export default function Page() {
  const featured = ROUTES.slice(0, 12);
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Round-Trip Planner',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/round-trip-planner`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'Out and back priced as one paired itinerary',
            'Per-leg airline, stops and duration',
            'Live Google Flights data, no signup',
            'Honest empty against degraded search reporting',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool · live search, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Round-Trip <span className="text-signal-500">Planner</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Out and back, priced as one itinerary rather than two searches stapled together. Each row shows both legs with their
          own airlines, stops and durations, and one total for the pair.
        </p>
      </Container>

      <Container className="pb-16">
        <RoundTripTool />
      </Container>

      <Section>
        <SectionHead
          eyebrow="Why a round-trip endpoint exists"
          title="Two one-ways is a different question, and usually a different price"
          lede="This is the part of the flights API that most alternatives do not model at all."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            [
              'Paired legs, one total',
              'The endpoint returns itineraries, not fares. total_price is the price of the pair, which is the number a booking engine would charge you.',
            ],
            [
              'Both sides described',
              'departure_flight_airline, stops and duration, and the same three for the return leg. A cheap total with an overnight connection is visibly different from a cheap total without one.',
            ],
            [
              'One request',
              'Trip length is just the return date. Sweep it across a range on your own key and you have a trip-length comparison, still one request per candidate.',
            ],
          ].map(([heading, body]) => (
            <div key={heading} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="text-[15.5px] font-semibold text-ink-100">{heading}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="routes">
        <SectionHead
          eyebrow="Routes with their own page"
          title="Start from a route instead of an empty form"
          lede="Each of these pages is the same planner, pre-filled, with the facts of that route alongside it."
        />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((r) => (
            <Link
              key={r.slug}
              href={`/tools/round-trip-planner/${r.slug}`}
              className="rounded-2xl border rule bg-ink-900/50 p-4 transition-colors hover:border-ink-500"
            >
              <p className="font-mono text-[13px] text-signal-500">{routeArrow(r)}</p>
              <p className="mt-1 text-[13.5px] text-ink-300">
                {r.from.city} to {r.to.city}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-[14px]">
          <Link href="/tools#grid" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            All {ROUTES.length} routes
          </Link>
          <span className="text-ink-400"> are listed on the tools index.</span>
        </p>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="On your own key"
            title="One trip here. Every trip length, every week, on your key"
            lede="The same request, fired in parallel across return dates, is a trip-length sweep. It is one line of code and a loop."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/flights-api/round-trip" variant="ghost">
              Round-trip docs
            </Cta>
            <Cta href="/docs/quickstart" variant="ghost">
              Five-minute quickstart
            </Cta>
            <Cta href={rapidApiPricingUrl('flights', 'tool')} external variant="primary">
              See pricing on RapidAPI →
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related tools" title="Keep going" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/tools/cheapest-time-to-fly', label: 'Cheapest Time to Fly', sub: 'Which month, a year at a glance' },
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'One date, live fare and verdict' },
            { href: '/tools/hotel-price-check', label: 'Hotel Price Check', sub: 'Live Booking.com rates for a destination' },
            { href: '/flights-api/round-trip', label: 'Round-trip endpoint', sub: 'Field names and response shape' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 transition-colors hover:border-ink-500">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
