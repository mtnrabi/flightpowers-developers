import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CodeTabs } from '@/components/CodeTabs';
import { PricingTable } from '@/components/PricingTable';
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
import { HOTEL_PLANS } from '@/lib/pricing';
import { hotelSearchSnippets } from '@/lib/snippets';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Hotel Search API: free-text destination, live Booking.com rates',
  description:
    'POST /search takes a free-text destination and dates and returns ranked properties with live Booking.com prices, review scores, room types and booking links. 24 filters matching the Booking.com UI. The required field is destination, not location.',
  alternates: { canonical: '/hotels-api/search' },
});

export const dynamic = 'force-static';

const FILTER_CATEGORIES: { category: string; filters: string[] }[] = [
  { category: 'Cancellation', filters: ['free_cancellation'] },
  {
    category: 'Meals',
    filters: ['breakfast_included', 'breakfast_and_lunch', 'breakfast_and_dinner', 'all_meals_included', 'all_inclusive'],
  },
  { category: 'Facilities', filters: ['free_wifi', 'swimming_pool', 'gym', 'parking', 'front_desk_24h'] },
  { category: 'Review score', filters: ['review_score_7', 'review_score_8', 'review_score_9'] },
  { category: 'Room facilities', filters: ['private_bathroom', 'air_conditioning'] },
  { category: 'Property rating', filters: ['stars_3', 'stars_4', 'stars_5'] },
  { category: 'Travel group', filters: ['pets_allowed', 'adults_only'] },
  { category: 'Activities', filters: ['sauna'] },
  { category: 'Guest reviews', filters: ['very_good_breakfast'] },
  { category: 'Payment', filters: ['accepts_online_payment'] },
];

const faq: Faq[] = [
  {
    q: 'Why did I get a 400 about missing fields?',
    a: 'The usual cause: the request sent location instead of destination. The three required fields are destination, checkin_date and checkout_date. The 400 body names them plainly. destination appears in the request; a location string can appear per property in the response. They are different fields.',
  },
  {
    q: 'What can destination be?',
    a: 'Free text, the way a person would type it: a city ("Paris"), a neighbourhood ("Tokyo Shibuya"), even a hotel name ("Hilton NYC"). No destination IDs to look up first.',
  },
  {
    q: 'Is price per night or for the stay?',
    a: 'The price on each property is the total for the stay: the response carries nights, so a nightly rate is one division away. budget_per_night, by contrast, is per night, in whatever currency you set: 300 with "currency": "EUR" means 300 EUR per night.',
  },
  {
    q: 'How do the filters work?',
    a: `Pass a filters array with any of the ${COUNTS.hotelFilters} documented values. They match the facets Booking.com shows its own users, from free_cancellation to all_inclusive to stars_5. The full list is on this page.`,
  },
  {
    q: 'Can I price a destination from another country?',
    a: 'Yes. /search accepts proxy_country like every other endpoint. A two-letter code routes the request through a residential proxy in that market; leave it out and the request uses the global pool. The geo-pricing page shows a real captured spread.',
  },
  {
    q: 'How fresh are the prices?',
    a: 'Every search runs against Booking.com at request time: nothing is cached. That is also why response time tracks how much work Booking.com has to do for the query.',
  },
];

export default function HotelSearchPage() {
  const fx = FIXTURES.hotelSearchLisbon;
  const p0 = fx.data.properties[0]!;
  const snippets = hotelSearchSnippets({ destination: 'Lisbon', checkin: '2026-10-09', checkout: '2026-10-12' });

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Hotels API', item: `${SITE.url}/hotels-api` },
            { '@type': 'ListItem', position: 3, name: 'Search', item: `${SITE.url}/hotels-api/search` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Hotel Search API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/hotels-api/search`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/hotels-api', label: 'Hotels API' },
            { href: '/hotels-api/search', label: 'Search' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Hotel Search API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                One destination in, ranked <span className="text-signal-500">live rates</span> out
              </h1>
              <p className="lede mt-5">
                <code className="font-mono text-[0.85em] text-signal-400">POST /search</code> takes a free-text destination and
                dates; returns properties with live prices, review scores, room types and booking links.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      Free-text <code className="font-mono text-[13px] text-signal-400">destination</code>: &ldquo;Paris&rdquo;,
                      &ldquo;Tokyo Shibuya&rdquo;, even a hotel name
                    </>,
                    <>
                      {COUNTS.hotelFilters} filters plus <code className="font-mono text-[13px] text-signal-400">budget_per_night</code>,
                      matching the Booking.com UI
                    </>,
                    <>Every property ships with a working booking link, image, review score and review count</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('hotels', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/hotels-api" variant="ghost">
                  All hotel endpoints
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <div>
              <Code label="POST /search · the captured request">{JSON.stringify(fx.request.body, null, 2)}</Code>
              <p className="mt-3 font-mono text-[11px] text-ink-500">
                The response this exact request produced is rendered below, labelled as a captured run.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead
            eyebrow="The response, rendered"
            title="What came back for Lisbon"
            lede="Six of the properties returned by the request above, filtered to review score 8+ with free cancellation, priced in EUR for a 3-night stay."
          />
          <CapturedBadge date={fx.captured_at} />
        </div>
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                <th className="px-4 py-3 font-normal">Property</th>
                <th className="px-4 py-3 font-normal">Room</th>
                <th className="px-4 py-3 font-normal text-right">Score</th>
                <th className="px-4 py-3 font-normal text-right">Reviews</th>
                <th className="px-4 py-3 font-normal text-right">Total, 3 nights</th>
                <th className="px-4 py-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              {fx.data.properties.map((p) => (
                <tr key={p.name} className="border-t rule">
                  <td className="px-4 py-3 font-medium text-ink-100">{p.name}</td>
                  <td className="px-4 py-3 text-ink-400">{p.room_type}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-200">{p.review_score}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-400">{p.review_count.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-100">{p.price_string}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={p.link}
                      rel="noopener nofollow"
                      target="_blank"
                      className="font-mono text-[12px] text-signal-400 hover:text-signal-500 underline underline-offset-4"
                    >
                      link →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed max-w-3xl">
          Each row is one object in the <code className="field">properties</code> array. Every field of that object, with the
          values this exact capture returned, is documented below.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Request fields"
          title="The field is destination, not location"
          lede="The one trap on this endpoint, stated up front: the required search field is named destination. Send location instead and the API returns a 400 with a clear message naming the fields it needs."
        />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Required</p>
            <div className="mt-3">
              <FieldRow name="destination" type="string">
                Free text, the way a person would type it: &ldquo;Paris&rdquo;, &ldquo;Tokyo Shibuya&rdquo;, &ldquo;Hilton
                NYC&rdquo;. Not <code className="field">location</code> (that name 400s).
              </FieldRow>
              <FieldRow name="checkin_date / checkout_date" type="string">
                <code className="field">YYYY-MM-DD</code>.
              </FieldRow>
            </div>
            <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Optional</p>
            <div className="mt-3">
              <FieldRow name="adults" type="int">
                Defaults to <code className="field">2</code>.
              </FieldRow>
              <FieldRow name="children" type="int">
                Defaults to <code className="field">0</code>.
              </FieldRow>
              <FieldRow name="currency" type="string">
                Defaults to <code className="field">USD</code>.
              </FieldRow>
              <FieldRow name="budget_per_night" type="number">
                Max price per night, in the currency you set: <code className="field">300</code> with{' '}
                <code className="field">&quot;currency&quot;: &quot;EUR&quot;</code> means 300 EUR per night.
              </FieldRow>
              <FieldRow name="proxy_country" type="string">
                Two-letter code: price the search from that market. See{' '}
                <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                  geo-pricing
                </Link>
                .
              </FieldRow>
              <FieldRow name="filters" type="string[]">
                Any of the {COUNTS.hotelFilters} values below.
              </FieldRow>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">Call it from your stack</h3>
            <CodeTabs snippets={snippets} tool="hotels-search-snippets" />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="filters"
          title={`All ${COUNTS.hotelFilters} filters, by category`}
          lede="The same facets Booking.com shows its own users. Pass any combination as a filters array."
        />
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                <th className="px-4 py-3 font-normal">Category</th>
                <th className="px-4 py-3 font-normal">Filters</th>
              </tr>
            </thead>
            <tbody>
              {FILTER_CATEGORIES.map((c) => (
                <tr key={c.category} className="border-t rule">
                  <td className="px-4 py-3 whitespace-nowrap align-top text-ink-200">{c.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.filters.map((f) => (
                        <code key={f} className="rounded border rule bg-ink-900 px-2 py-0.5 font-mono text-[12px] text-signal-400">
                          {f}
                        </code>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Response"
          title="Every response field"
          lede="Values in brackets are from the captured Lisbon run above. Real output, not invented examples. The top level echoes the search; properties carries one flat object per result."
        />
        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-signal-500">Top level</p>
          <div className="mt-2">
            <FieldRow name="destination" type="string">
              Echo of the destination searched: <code className="field">&quot;{fx.data.destination}&quot;</code>.
            </FieldRow>
            <FieldRow name="checkin_date / checkout_date" type="string">
              Echo of the stay, <code className="field">YYYY-MM-DD</code>: {fx.data.checkin_date} to {fx.data.checkout_date} in
              the capture.
            </FieldRow>
            <FieldRow name="applied_filters" type="string[]">
              The filters the search ran with: <code className="field">{JSON.stringify(fx.data.applied_filters)}</code> in the
              capture, matching the request. Confirm here that the facets you asked for were used.
            </FieldRow>
            <FieldRow name="budget_per_night" type="number | null">
              <code className="field">null</code> when the request set no per-night cap, as in the capture.
            </FieldRow>
            <FieldRow name="properties" type="object[]">
              The results, ranked as Booking.com ranks them. One flat object per property; its fields are below.
            </FieldRow>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-wider text-signal-500">Per property</p>
          <div className="mt-2">
            <FieldRow name="name" type="string">
              The property name as listed: <code className="field">&quot;{p0.name}&quot;</code> in the capture.
            </FieldRow>
            <FieldRow name="price / price_string" type="number · string">
              The stay total, twice: a number ({p0.price}) to sort and compare on, and the formatted version (
              <code className="field">{p0.price_string}</code>), both in the currency you set. It is the total for all{' '}
              {p0.nights} nights, not a nightly rate: divide by <code className="field">nights</code> for that.
            </FieldRow>
            <FieldRow name="review_score / review_count" type="number · number">
              Booking.com&apos;s guest score and how many reviews it rests on: {p0.review_score} from{' '}
              {p0.review_count.toLocaleString('en-US')} reviews in the capture.
            </FieldRow>
            <FieldRow name="room_type" type="string">
              The room the price is for: <code className="field">&quot;{p0.room_type}&quot;</code> in the capture.
            </FieldRow>
            <FieldRow name="location" type="string | null">
              A location string when Booking.com surfaces one on the result; <code className="field">null</code> otherwise (all
              six captured properties returned null).
            </FieldRow>
            <FieldRow name="image_url" type="string | null">
              A property thumbnail hosted by Booking.com, ready for an {'<img>'} tag.
            </FieldRow>
            <FieldRow name="link" type="string">
              A working Booking.com URL for exactly this room, these dates, and this party: hand it to a user and the page shows
              what the API priced.
            </FieldRow>
            <FieldRow name="nights / adults / children" type="number · number · number | null">
              The stay as priced: nights computed from the dates ({p0.nights} in the capture), adults as applied ({p0.adults}),
              and children, <code className="field">null</code> when the request did not send any.
            </FieldRow>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Every plan carries this endpoint" />
        <div className="mt-8">
          <PricingTable api="hotels" plans={HOTEL_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Hotels API" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/hotels-api/by-name', label: 'Hotel by name', sub: 'No property-ID step' },
            { href: '/hotels-api/geo-pricing', label: 'Geo-pricing', sub: 'proxy_country, captured spread' },
            { href: '/hotels-api/bulk', label: 'Competitive-set tracking', sub: 'Room-level, on a schedule' },
            { href: '/hotels-api', label: 'Hotels API hub', sub: 'All four endpoints' },
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
          api="hotels"
          title="Start with one destination"
          body="Live Booking.com rates with review scores, room types and booking links, as flat JSON your code or your agent can use directly."
        />
      </Section>
    </>
  );
}
