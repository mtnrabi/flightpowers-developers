import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CodeTabs } from '@/components/CodeTabs';
import { Mono, ResponseChunk } from '@/components/ResponseChunk';
import { PricingTable } from '@/components/PricingTable';
import { HotelMarketsTable, HotelRepeatSamplesTable } from '@/components/results';
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

export const metadata: Metadata = withOg({
  title: 'Hotel Geo-Pricing API: rate parity by market with proxy_country',
  description:
    'Rate-parity and geo-pricing monitoring from a single API. proxy_country prices the same room through a residential proxy in any market. This page shows a repeat-sampled run across three markets, and what it takes before a difference counts as a finding.',
  alternates: { canonical: '/hotels-api/geo-pricing' },
});

export const dynamic = 'force-static';

const MARKETS = ['us', 'de', 'il'] as const;

const faq: Faq[] = [
  {
    q: 'Why do hotel rates differ by country at all?',
    a: 'Booking.com shows different rates depending on where the visitor is browsing from. The API does not create that difference: it routes your request through a residential proxy in the market you name, so you can observe what each market is actually quoted.',
  },
  {
    q: 'How does proxy_country work?',
    a: 'It is a two-letter lowercase country code ("us", "de", "il") accepted by every hotels endpoint. The request exits through a residential proxy in that country. Leave the field out and the request goes through the global residential pool instead.',
  },
  {
    q: 'How many times should I ask each market?',
    a: 'More than once. In a controlled run on 2026-08-28 the German and Japanese markets returned the same number on every request, while the US market moved between identical requests by more than the Germany–Japan gap. Three samples per market is enough to tell a steady quote from a moving one; a single reading per market cannot.',
  },
  {
    q: 'When is a difference between markets real?',
    a: 'When one market’s whole sampled range sits below the other’s. Overlapping ranges mean the rate is moving, not that a market is being quoted differently. Set currency explicitly on every request so the comparison is a subtraction and not an exchange-rate question.',
  },
  {
    q: 'What does a check cost?',
    a: 'One request per market per sample: two markets sampled three times each is six requests against your plan quota. proxy_country is an ordinary request field on every plan, including the free tier.',
  },
  {
    q: 'What if every market comes back the same?',
    a: 'Then nothing is drifting, and that is also an answer: the Kremlin Palace capture on this page priced within a dollar across three markets, and a separate held-constant run on a chain hotel on 2026-08-28 returned the identical price from every market we tried. Chain properties under parity contracts often show no gap at all. Monitoring means confirming that most days and catching the exceptions the day they appear.',
  },
  {
    q: 'Which endpoints accept proxy_country?',
    a: 'All of them: /search, /hotel_by_name, /hotel and /resolve. A parity check usually runs on /hotel_by_name (headline rate) or /hotel (room-by-room).',
  },
];

/**
 * The captured Rixos Sungate run: three requests, identical except
 * proxy_country, each trimmed to the fields the table below documents.
 * Built from the fixture so it cannot drift from the capture.
 */
const GEO_EXCERPT = (() => {
  const d = FIXTURES.hotelGeoRixos.data;
  const row = (h: typeof d.us) => ({
    room_type: h.room_type,
    price_string: h.price_string,
    price: h.price,
    nights: h.nights,
  });
  return JSON.stringify({ us: row(d.us), de: row(d.de), il: row(d.il) }, null, 2);
})();

export default function GeoPricingPage() {
  const rx = FIXTURES.hotelGeoRixos;
  const kx = FIXTURES.hotelGeoKremlin;
  const rep = FIXTURES.hotelGeoRepeatRome;
  const snippets = hotelGeoSnippets({
    hotel: 'Rixos Sungate',
    area: 'Antalya',
    checkin: '2026-10-05',
    checkout: '2026-10-10',
    countries: ['de', 'jp'],
    samples: rep.data.samples_per_market,
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
          dateModified: '2026-09-07',
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
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
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
                      Check the same room as a resident of another country: vary only{' '}
                      <code className="font-mono text-[13px] text-signal-400">proxy_country</code>, on any hotels endpoint
                    </>,
                    <>
                      A repeat-sampled run, not one reading: {rep.data.samples_per_market} identical requests per market, so the
                      movement inside a market is visible next to the difference between markets
                    </>,
                    <>Honest by design: when the markets agree, the API shows you that too (captured counter-example below)</>,
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
                  3 properties × 3 markets × {rep.data.samples_per_market} identical requests
                </p>
                <CapturedBadge date={rep.captured_at} />
              </div>
              <HotelRepeatSamplesTable run={rep.data} />
            </div>
          </div>
        </Container>
      </div>

      <ResponseChunk
        title="What proxy_country does to a hotel response"
        answer={
          <>
            Every hotels endpoint on <Mono>api.flightpowers.com</Mono> and on{' '}
            <Mono>booking-live-api.p.rapidapi.com</Mono> takes <code className="field">proxy_country</code>, a two-letter
            code that routes that single request through a residential proxy in that market. The response shape does not
            change; the rate does, when the property prices differently for that market. Vary only that field, hold the
            property, dates and currency fixed, and you have rate-parity and geo-pricing monitoring from one API.
          </>
        }
        excerptLabel={`“Rixos Sungate”, Antalya · 3 requests, identical except proxy_country · captured ${rx.captured_at}`}
        excerpt={GEO_EXCERPT}
        valueHeading="Captured run"
        fields={[
          {
            name: 'proxy_country',
            type: 'string (request)',
            meaning: (
              <>
                Two-letter country code. Accepted by <code className="field">/search</code>,{' '}
                <code className="field">/hotel_by_name</code>, <code className="field">/hotel</code> and{' '}
                <code className="field">/resolve</code>. Leave it out and the request uses the global residential pool.
              </>
            ),
            value: 'us · de · il',
          },
          {
            name: 'price / price_string',
            type: 'number · string',
            meaning: 'The same room, as each market was quoted it, total for the stay. This is the only field a parity check is really watching.',
            value: `${rx.data.us.price} · ${rx.data.de.price} · ${rx.data.il.price}`,
          },
          {
            name: 'room_type',
            type: 'string | null',
            meaning: 'Must be identical across the markets you compare. If it moves, the markets were quoted different products and the price gap means nothing.',
            value: rx.data.us.room_type ?? 'null',
          },
          {
            name: 'currency',
            type: 'string (request)',
            meaning: 'Hold it fixed across the markets or you are measuring exchange rates instead of pricing.',
            value: String(rx.request.body.currency),
          },
          {
            name: 'nights',
            type: 'number | null',
            meaning: 'The stay each quote covers, echoed back. Same dates in, same nights out, on every market.',
            value: String(rx.data.us.nights),
          },
          {
            name: 'available',
            type: 'boolean',
            meaning: 'A market that cannot book the room at all returns false rather than a price. Check it before comparing anything.',
            value: String(rx.data.us.available),
          },
        ]}
        notes={[
          <>
            One request per country is not a measurement. In the repeat-sampled run above,{' '}
            {rep.data.samples_per_market} identical requests went to each of {rep.data.markets.length} markets for each
            of {rep.data.properties.length} properties, and the US market moved between identical requests by more than
            the gap between the other two. Sample each market several times against a fixed property, and treat a gap as
            real only when one market&apos;s whole range sits below the other&apos;s.
          </>,
          <>
            Parity holding is a result too. The{' '}
            <Link href="/hotels-api/by-name" className="text-signal-400 hover:text-signal-300">
              Kremlin Palace capture
            </Link>{' '}
            priced within a dollar across the same three markets on the same dates. Most days a monitor confirms
            nothing moved; its value is the day something does.
          </>,
        ]}
      />

      <Section>
        <SectionHead
          eyebrow="The mechanism, honestly"
          title="One field, one proxy exit per market"
          lede="proxy_country takes a two-letter code and routes that single request through a residential proxy in that country, so the rates returned are the rates Booking.com quotes that market. Leave it out and the request uses the global residential pool. Every request counts against your quota, and a check worth trusting repeats each market a few times: two markets sampled three times each is six requests."
        />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">The exact check behind the run above</h3>
            <CodeTabs snippets={snippets} tool="hotel-geo-snippets" />
          </div>
          <div className="text-[15px] text-ink-300 leading-relaxed space-y-4">
            <p>
              The hero table is not an illustration: it is {rep.data.properties.length * rep.data.markets.length * rep.data.samples_per_market}{' '}
              real requests from {rep.captured_at}, one property at a time, identical except for{' '}
              <code className="field">proxy_country</code>. Japan came in under Germany on all three properties, and both markets
              answered with the same number every time they were asked. The US market did not: it moved between identical
              requests, by more than the Germany–Japan gap.
            </p>
            <p>
              That is the whole method. Hold the property and the dates fixed, ask each market more than once, and treat a gap as
              real when one market&apos;s whole range sits below the other&apos;s. Rates move, so sample each country a few times
              before you call a gap real.
            </p>
            <p>
              The infrastructure is the trivial part: no per-market scraping to run. Your BI stack calls the API from wherever it
              already runs and compares ranges. That is what makes rate-parity monitoring possible from a single API, which
              general-purpose hotel scrapers can&apos;t do: a request without market routing only ever shows you one
              market&apos;s rate.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Two earlier readings"
          title="What one request per market can and cannot tell you"
          lede="Both captures below are real, taken on 2026-08-26, and both are a single request per market. That makes them readings rather than measured gaps: useful as the start of a check, not as its conclusion."
        />
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
                POST /hotel_by_name · one request per market
              </p>
              <CapturedBadge date={kx.captured_at} />
            </div>
            <HotelMarketsTable markets={MARKETS.map((c) => ({ country: c, result: kx.data[c] }))} />
            <div className="mt-6 border-t rule pt-6">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-ink-500">
                Rixos Sungate, Antalya · one request per market
              </p>
              <HotelMarketsTable markets={MARKETS.map((c) => ({ country: c, result: rx.data[c] }))} />
            </div>
          </div>
          <div className="text-[15px] text-ink-300 leading-relaxed space-y-4">
            <p>
              Kremlin Palace, Antalya: a five-night stay quoted within a dollar of itself from all three markets. Nothing to
              chase, and that is a real answer. Chain properties under parity contracts often look exactly like this.
            </p>
            <p>
              Rixos Sungate, same day and same markets, came back further apart. But that is one reading from each market, and the
              repeat runs above show a market moving on its own by a comparable amount. So the honest call is &ldquo;re-sample
              this one&rdquo;, not &ldquo;parity is broken&rdquo;.
            </p>
            <p>
              For a revenue manager that distinction is the job. Most checks should come back quiet. The value of the monitor is
              the morning one doesn&apos;t, with enough samples behind it that you can act on the number instead of arguing about
              it.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Use cases"
          title="What teams build on this field"
          lede="Each of these is the same loop: hold the property fixed, sample each market a few times, compare the ranges."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Feature title="Rate-parity enforcement">
            Price your own properties from the markets you sell in, on a schedule, and flag a market only when its whole sampled
            range drifts from your contracted rate, with the figures and a link to the live page.
          </Feature>
          <Feature title="OTA vs direct monitoring">
            Compare what Booking.com quotes each market against your direct-booking price for the same room and dates, so
            &ldquo;book direct and save&rdquo; stays a checkable claim per market rather than a hope.
          </Feature>
          <Feature title="Market-entry pricing research">
            Before pricing a new market, sweep your competitive set from that market&apos;s point of view: the quotes its residents
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          body="One parameter, a few samples per market, and the answer is in your data instead of somebody’s anecdote."
        />
      </Section>
    </>
  );
}
