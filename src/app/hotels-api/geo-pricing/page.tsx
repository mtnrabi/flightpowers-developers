import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CodeTabs } from '@/components/CodeTabs';
import { PricingTable } from '@/components/PricingTable';
import { HotelMarketsTable } from '@/components/results';
import {
  Breadcrumbs,
  CapturedBadge,
  CheckBullets,
  Container,
  Cta,
  FaqSection,
  Feature,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { HOTEL_PLANS } from '@/lib/pricing';
import { hotelGeoSnippets } from '@/lib/snippets';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Hotel Geo-Pricing API — rate parity by market with proxy_country',
  description:
    'Rate-parity and geo-pricing monitoring from a single API. proxy_country prices the same room through a residential proxy in any market — this page shows a real captured $195 spread on one room, and a real capture where parity held.',
  alternates: { canonical: '/hotels-api/geo-pricing' },
};

export const dynamic = 'force-static';

const MARKETS = ['us', 'de', 'il'] as const;

const faq: Faq[] = [
  {
    q: 'Why do hotel rates differ by country at all?',
    a: 'Booking.com shows different rates depending on where the visitor is browsing from. The API does not create that difference — it routes your request through a residential proxy in the market you name, so you can observe what each market is actually quoted.',
  },
  {
    q: 'How does proxy_country work?',
    a: 'It is a two-letter lowercase country code ("us", "de", "il") accepted by every hotels endpoint. The request exits through a residential proxy in that country. Leave the field out and the request goes through the global residential pool instead.',
  },
  {
    q: 'Could the captured spread just be currency conversion?',
    a: 'No — all three captured requests asked for USD explicitly, so the $195 difference on the Rixos Sungate room is market pricing, not exchange rates.',
  },
  {
    q: 'What does a three-market check cost?',
    a: 'Three requests against your plan quota — one per market. proxy_country is an ordinary request field on every plan, including the free tier.',
  },
  {
    q: 'What if every market comes back the same?',
    a: 'Then parity is holding, and that is also an answer — the Kremlin Palace capture on this page priced within a dollar across three markets. Monitoring means confirming parity most days and catching the exceptions the day they appear.',
  },
  {
    q: 'Which endpoints accept proxy_country?',
    a: 'All of them: /search, /hotel_by_name, /hotel and /resolve. A parity check usually runs on /hotel_by_name (headline rate) or /hotel (room-by-room).',
  },
];

export default function GeoPricingPage() {
  const rx = FIXTURES.hotelGeoRixos;
  const kx = FIXTURES.hotelGeoKremlin;
  const spread = rx.data.de.price! - rx.data.us.price!;
  const snippets = hotelGeoSnippets({
    hotel: 'Rixos Sungate',
    area: 'Antalya',
    checkin: '2026-10-05',
    checkout: '2026-10-10',
    countries: [...MARKETS],
  });

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Hotels API', item: `${SITE.url}/hotels-api` },
            { '@type': 'ListItem', position: 3, name: 'Geo-Pricing', item: `${SITE.url}/hotels-api/geo-pricing` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Hotel Geo-Pricing API',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/hotels-api/geo-pricing`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/hotels-api', label: 'Hotels API' },
            { href: '/hotels-api/geo-pricing', label: 'Geo-Pricing' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Rate Parity &amp; Geo-Pricing API</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                See the rate <span className="text-signal-500">every market</span> is quoted
              </h1>
              <p className="lede mt-5">
                Rate-parity and geo-pricing monitoring from a single API: one parameter prices the same room through a residential
                proxy in any market.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      A real captured spread: {rx.data.us.price_string} from the US for the room Germany and Israel saw at $
                      {rx.data.de.price!.toLocaleString('en-US')} — same dates, same currency
                    </>,
                    <>
                      One request per market — vary only{' '}
                      <code className="font-mono text-[13px] text-signal-400">proxy_country</code>, on any hotels endpoint
                    </>,
                    <>Honest by design: when parity holds, the API shows you that too (captured counter-example below)</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('hotels', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/tools/hotel-price-by-country" variant="ghost">
                  Try the free tool
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <div className="rounded-2xl border rule bg-ink-900/60 p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
                  POST /hotel_by_name · 3 requests, only proxy_country varied
                </p>
                <CapturedBadge date={rx.captured_at} />
              </div>
              <HotelMarketsTable markets={MARKETS.map((c) => ({ country: c, result: rx.data[c] }))} />
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The mechanism, honestly"
          title="One field, one proxy exit per market"
          lede="proxy_country takes a two-letter code and routes that single request through a residential proxy in that country, so the rates returned are the rates Booking.com quotes that market. Leave it out and the request uses the global residential pool. Each market is one request against your quota — a three-market check costs three requests."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">The exact check behind the capture above</h3>
            <CodeTabs snippets={snippets} tool="hotel-geo-snippets" />
          </div>
          <div className="text-[15px] text-ink-300 leading-relaxed space-y-4">
            <p>
              The hero table is not an illustration — it is three real requests from {rx.captured_at}, identical except for{' '}
              <code className="field">proxy_country</code>. The US market was quoted {rx.data.us.price_string} for the{' '}
              {rx.data.us.room_type} the German and Israeli markets were quoted US${rx.data.de.price!.toLocaleString('en-US')} for:
              a ${spread} spread on one room, one stay.
            </p>
            <p>
              The check itself becomes the trivial part: no per-market scraping infrastructure to run — your BI stack calls the API
              from wherever it already runs and compares numbers.
            </p>
            <p>
              This is what makes rate-parity monitoring possible from a single API — which general-purpose hotel scrapers can&apos;t
              do: a request without market routing only ever shows you one market&apos;s rate.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The counter-example"
          title="When parity holds, you see that too"
          lede="A monitoring tool that only ever finds discrepancies is a tool you cannot trust. Here is a capture from the same day where the three markets priced within a dollar of each other."
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
                POST /hotel_by_name · same three markets
              </p>
              <CapturedBadge date={kx.captured_at} />
            </div>
            <HotelMarketsTable markets={MARKETS.map((c) => ({ country: c, result: kx.data[c] }))} />
          </div>
          <div className="text-[15px] text-ink-300 leading-relaxed space-y-4">
            <p>
              Kremlin Palace, Antalya — the same five-night stay, the same three markets, captured the same day as the Rixos run. The
              quotes came back within a dollar of each other.
            </p>
            <p>
              For a revenue manager this is the point: most checks should confirm parity. The value of the monitor is that the day a
              market drifts — like the ${spread} Rixos spread — the number is in your data, not in a guest&apos;s screenshot.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Use cases"
          title="What teams build on this field"
          lede="Each of these is the same three-line loop over markets, pointed at different properties."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Feature title="Rate-parity enforcement">
            Price your own properties from the markets you sell in, on a schedule, and flag any market where the OTA quote drifts
            from your contracted rate — with the exact figure and a link to the live page.
          </Feature>
          <Feature title="OTA vs direct monitoring">
            Compare what Booking.com quotes each market against your direct-booking price for the same room and dates, so
            &ldquo;book direct and save&rdquo; stays a checkable claim per market rather than a hope.
          </Feature>
          <Feature title="Market-entry pricing research">
            Before pricing a new market, sweep your competitive set from that market&apos;s point of view — the quotes its residents
            actually see, not the ones your office IP sees.
          </Feature>
        </div>
        <p className="mt-8 text-[15px] text-ink-300">
          Want to see it without writing code? The free{' '}
          <Link href="/tools/hotel-price-by-country" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            hotel price by country tool
          </Link>{' '}
          runs this comparison in the browser.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="proxy_country is on every plan" />
        <div className="mt-8">
          <PricingTable api="hotels" plans={HOTEL_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Hotels API" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/hotels-api/bulk', label: 'Competitive-set tracking', sub: 'Room-level, on a schedule' },
            { href: '/hotels-api/by-name', label: 'Hotel by name', sub: 'The endpoint behind these captures' },
            { href: '/hotels-api/search', label: 'Destination search', sub: 'Ranked properties + 24 filters' },
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
          title="Put a number on rate parity"
          body="One parameter, one request per market, and the spread is in your data instead of somebody’s anecdote."
        />
      </Section>
    </>
  );
}
