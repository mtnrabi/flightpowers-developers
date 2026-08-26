import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  CheckBullets,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { HOTEL_PLANS } from '@/lib/pricing';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Booking.com Hotels API — live rates, priced from any market',
  description:
    'A REST API for live Booking.com hotel prices. Search a destination or look up a hotel by name; every endpoint accepts proxy_country, so the same room can be priced from any market — the basis for rate-parity and geo-pricing monitoring.',
  alternates: { canonical: '/hotels-api' },
};

export const dynamic = 'force-static';

const ENDPOINTS = [
  {
    href: '/hotels-api/search',
    method: 'POST /search',
    label: 'Destination search',
    sub: 'Free-text destination and dates in; ranked properties with live prices, review scores, room types and booking links out.',
  },
  {
    href: '/hotels-api/by-name',
    method: 'POST /hotel_by_name',
    label: 'Hotel by name',
    sub: 'The name a human would type. Name resolution included — no property-ID step before you can ask anything.',
  },
  {
    href: '/hotels-api/geo-pricing',
    method: 'proxy_country · every endpoint',
    label: 'Geo-pricing & rate parity',
    sub: 'Price the same room from any market through a residential proxy. The page for revenue managers and BI teams.',
  },
  {
    href: '/hotels-api/bulk',
    method: 'POST /hotel + /resolve',
    label: 'Competitive-set tracking',
    sub: 'Resolve a name to its Booking.com ID once, then pull the full room-by-room list on a schedule.',
  },
];

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

const GAPS: { problem: string; answer: string }[] = [
  {
    problem: 'You need an internal property ID before you can ask anything',
    answer: '/hotel_by_name accepts the name a human would type',
  },
  {
    problem: 'One price per hotel, no room breakdown',
    answer: '/hotel returns every room with its type, meal plan, capacity and price',
  },
  {
    problem: 'Prices are cached and drift from what the guest sees',
    answer: 'Every request is live against Booking.com',
  },
  {
    problem: 'No way to see market-specific pricing',
    answer: 'proxy_country routes through a residential proxy in any country',
  },
  {
    problem: 'A thin slice of the site’s filters',
    answer: `${COUNTS.hotelFilters} filters plus budget_per_night, matching the Booking.com UI`,
  },
  {
    problem: 'Errors and sold-out come back in different shapes',
    answer: 'Consistent available: false plus nulls, so parsing never branches',
  },
];

const faq: Faq[] = [
  {
    q: 'Are prices cached?',
    a: 'No. Every query hits Booking.com live at request time, so the rate that comes back is the rate a guest would be quoted at that moment. The honest trade-off: response time tracks how much work Booking.com has to do for the query.',
  },
  {
    q: 'What does proxy_country do?',
    a: 'Every endpoint accepts proxy_country, a two-letter lowercase country code ("us", "de", "il"). The request routes through a residential proxy in that country, so you see the rates Booking.com quotes that market. Leave it out and the request goes through the global residential pool.',
  },
  {
    q: 'Which endpoint do I start with?',
    a: 'POST /search for a destination, POST /hotel_by_name for one property by its name (resolution included), and POST /resolve followed by POST /hotel when you want the full room-by-room list for a property you check repeatedly.',
  },
  {
    q: 'What fields does /search require?',
    a: 'destination (free text — "Paris", "Tokyo Shibuya"), checkin_date, and checkout_date in YYYY-MM-DD. Note the field is destination, not location — sending location returns a 400 with a clear message naming the fields it needs.',
  },
  {
    q: 'How do sold-out and not-found come back?',
    a: 'As the same response shape with "available": false and nulls in the price fields, so your parser never has to branch on an error format.',
  },
  {
    q: 'What does the free tier include?',
    a: `Every endpoint, ${HOTEL_PLANS[0]!.quota} requests per month, hard cap. That verifies your key and your integration — it is not enough volume to evaluate data quality. Paid plans start at $${HOTEL_PLANS[1]!.priceMonthly}/month on RapidAPI.`,
  },
];

export default function HotelsApiHubPage() {
  const fx = FIXTURES.hotelSearchLisbon;
  const preview = { ...fx.data, properties: fx.data.properties.slice(0, 2) };

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Hotels API', item: `${SITE.url}/hotels-api` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Booking.com Hotels API',
          description:
            'Live Booking.com hotel prices over REST: destination search, name-based lookup, room-level pricing, and per-market pricing via proxy_country.',
          url: `${SITE.url}/hotels-api`,
          hasPart: ENDPOINTS.map((e) => ({
            '@type': 'WebPage',
            name: e.label,
            url: `${SITE.url}${e.href}`,
          })),
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/hotels-api', label: 'Hotels API' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Booking.com Hotels API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Live hotel rates, priced from <span className="text-signal-500">any market</span>
              </h1>
              <p className="lede mt-5">
                Search a destination or name a hotel; get Booking.com&apos;s live rates, review scores, room types and booking links
                as flat JSON.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>Live at request time — nothing is served from a cache, so the rate returned is the rate the guest would be quoted</>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">proxy_country</code> — price the same room from any
                      market through a residential proxy
                    </>,
                    <>
                      Name-based lookup — <code className="font-mono text-[13px] text-signal-400">/hotel_by_name</code> takes the name
                      a human would type, no property IDs first
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('hotels', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/hotels-api/geo-pricing" variant="ghost">
                  See geo-pricing
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <ExecuteWidget
              title="POST /search · booking-live-api"
              tool="hotels-hub-execute"
              capturedAt={fx.captured_at}
              requestText={JSON.stringify(fx.request.body, null, 2)}
              responseText={JSON.stringify(preview, null, 2)}
              headers={fx.headers}
            />
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="Endpoints"
          title="Four ways in, one subscription"
          lede="Every plan includes every endpoint — you only choose volume and rate limit. Each page below shows a real captured request and what came back."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {ENDPOINTS.map((e) => (
            <Link key={e.href} href={e.href} className="rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-500 transition-colors">
              <p className="font-mono text-[11px] text-signal-400">{e.method}</p>
              <p className="mt-2 text-[17px] font-semibold text-ink-100">{e.label}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{e.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="filters"
          title={`${COUNTS.hotelFilters} filters, matching the Booking.com UI`}
          lede="Pass any of these as a filters array on /search — the same facets Booking.com shows its own users — plus budget_per_night in whatever currency you set."
        />
        <div className="mt-8 overflow-x-auto rounded-2xl border rule">
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
      </Section>

      <Section>
        <SectionHead
          eyebrow="Why this one"
          title="Common gaps in other hotel APIs"
          lede="The problems developers hit with general-purpose hotel data sources, and what this API does about each."
        />
        <div className="mt-8 overflow-x-auto rounded-2xl border rule">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                <th className="px-4 py-3 font-normal">The problem</th>
                <th className="px-4 py-3 font-normal">How this API handles it</th>
              </tr>
            </thead>
            <tbody>
              {GAPS.map((g) => (
                <tr key={g.problem} className="border-t rule">
                  <td className="px-4 py-3.5 align-top text-ink-400">{g.problem}</td>
                  <td className="px-4 py-3.5 align-top text-ink-200">{g.answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Every plan carries every endpoint" />
        <div className="mt-8">
          <PricingTable api="hotels" plans={HOTEL_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="Where to next" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api', label: 'Flights API', sub: 'Google Flights fares with a price verdict' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel price by country', sub: 'Free tool — proxy_country in action' },
            { href: '/mcp', label: 'MCP servers', sub: 'The same data for your agent' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans, quotas, rate limits' },
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
          title="Live Booking.com rates, one key away"
          body="Destination search, name lookup, room-level pricing and per-market rates — one subscription covers every endpoint."
        />
      </Section>
    </>
  );
}
