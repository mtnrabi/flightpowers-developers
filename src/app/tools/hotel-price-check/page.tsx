import type { Metadata } from 'next';
import Link from 'next/link';
import { HotelSearchTool } from '@/components/tools/HotelSearchTool';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { withOg } from '@/lib/meta';
import { CITIES } from '@/lib/grid';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Hotel Price Check: live Booking.com rates for any destination',
  description:
    'Type a destination and two dates and see what Booking.com is quoting right now: property names, the total for the stay, review scores and a link that opens the same room. Free, no signup.',
  alternates: { canonical: '/tools/hotel-price-check' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Is this the average hotel price for a city?',
    a: 'No, and nothing on this page computes one. What you get is the properties one live Booking.com search returned for the dates you asked for, cheapest first, with the spread between the cheapest and the dearest of them. An average across a city would need a defined sample and repeat measurement, and we would rather show you the search than invent a statistic.',
  },
  {
    q: 'Why does the price change if I run it again?',
    a: 'Because it is live. Rates move, availability moves, and the set of properties a search returns moves with them. Anything printed as a fixed number would be wrong within minutes, so this tool keeps nothing.',
  },
  {
    q: 'What is in each row?',
    a: 'The property name, the total price for the whole stay in the currency you asked for, the review score and count where Booking has them, the room type, and a deep link that opens that property with your dates and occupancy already filled in.',
  },
  {
    q: 'Does this show prices as seen from different countries?',
    a: 'Not here. Booking.com does quote different markets differently, and the API exposes that through proxy_country, but a single reading per country is not a comparison: one market moves between identical requests by more than the gap you are trying to measure. That work needs repeat sampling, so it lives in its own tool.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. No account, no email, nothing gated. The search runs on our key, which is why it is capped per visitor per day.',
  },
  {
    q: 'What can I add on my own key?',
    a: `A per-night budget, the ${COUNTS.hotelFilters} Booking.com filters (free cancellation, breakfast, review score, star rating and the rest), a different occupancy, and proxy_country for market-specific pricing. Same endpoint, more arguments.`,
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Hotel Price Check',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/hotel-price-check`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'Live Booking.com search for any free-text destination',
            'Total price for the stay, cheapest first',
            'Review score and count where Booking publishes them',
            'A deep link that opens the same room with your dates',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool · live search, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Hotel <span className="text-signal-500">Price Check</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          A destination, two dates, and what Booking.com is quoting right now. Cheapest first, with the review score next to
          every price so a cheap room and a bad room are told apart.
        </p>
      </Container>

      <Container className="pb-16">
        <HotelSearchTool />
      </Container>

      <Section id="cities">
        <SectionHead
          eyebrow="Destinations with their own page"
          title="Start from a city instead of an empty form"
          lede="Thirty cities, taken in order from a published ranking of international visitor arrivals. Each page is this same search, pre-filled."
        />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/tools/hotel-price-check/${c.slug}`}
              className="rounded-2xl border rule bg-ink-900/50 p-4 transition-colors hover:border-ink-500"
            >
              <p className="text-[14.5px] font-semibold text-ink-100">{c.name}</p>
              <p className="mt-0.5 text-[13px] text-ink-400">{c.country}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="What this is not"
          title="One search is a search, not a market"
          lede="The honest limits of what a single live lookup can tell you, stated up front."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            [
              'Not an average',
              'The spread we print is the range inside one result set on your dates. It is not a city average, a nightly rate index or a seasonal figure, and calling it one would be making a number up.',
            ],
            [
              'Not a parity check',
              'Comparing what different countries are quoted needs the same question asked of each market several times. A single reading per market produces phantom gaps, so we do not build that here.',
            ],
            [
              'Not cached',
              'Hotel rates go stale within minutes. Nothing on this page is stored between runs, and there is no captured example sitting in the results panel pretending to be current.',
            ],
          ].map(([heading, body]) => (
            <div key={heading} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="text-[15.5px] font-semibold text-ink-100">{heading}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="On your own key"
            title="One search here. A comp set, a budget filter and a schedule on your key"
            lede={`Same endpoint, more arguments: a per-night budget, the ${COUNTS.hotelFilters} Booking.com filters, your own occupancy, and proxy_country when you are ready to sample markets properly.`}
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/hotels-api/search" variant="ghost">
              Hotels search docs
            </Cta>
            <Cta href="/docs/quickstart" variant="ghost">
              Five-minute quickstart
            </Cta>
            <Cta href={rapidApiPricingUrl('hotels', 'tool')} external variant="primary">
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
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'Repeat-sampled per-market pricing' },
            { href: '/tools/cheapest-time-to-fly', label: 'Cheapest Time to Fly', sub: 'Which month is cheapest to get there' },
            { href: '/hotels-api/bulk', label: 'Bulk hotel search', sub: 'Up to five properties in one request' },
            { href: '/use-cases/hotel-comp-set-tracking', label: 'Comp-set tracking', sub: 'What people build with this' },
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
