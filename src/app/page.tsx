import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckBullets, Cta, Container, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { CtaBand } from '@/components/bands';
import { Playground, type PlaygroundInitial } from '@/components/Playground';
import { IntegrationGrid } from '@/components/IntegrationLogos';
import { HOME_INTEGRATIONS } from '@/lib/integrations';
import { FLIGHT_PLANS, HOTEL_PLANS, fmtRate, type Plan } from '@/lib/pricing';
import { FIXTURES } from '@/lib/fixtures';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'FlightPowers: live flight & hotel pricing APIs with a price verdict',
  description:
    'Real-time Google Flights and Booking.com data as clean JSON. Google’s own price band and a low | typical | high verdict on every fare. For AI travel agents, developers, and automation teams.',
  alternates: { canonical: '/' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Is there a free tier?',
    a: 'Yes. BASIC is $0 on RapidAPI, no card, 10 requests per month with a hard cap. Enough to verify your key and see the response shape. Evaluate with the live demo above instead; it runs real requests on our key. If you want your own assistant to try it, the free ad-supported MCP server needs no key and no signup at all.',
  },
  {
    q: 'Do flights and hotels share one plan?',
    a: 'No. They are separate APIs on RapidAPI with separate plans, prices, and rate limits. One RapidAPI account key works for both once you subscribe to each listing.',
  },
  {
    q: 'How is this different from scraping Google Flights myself?',
    a: 'A scraper you maintain breaks on markup changes and cannot tell "no flights" from "my scrape failed". This API retries unreadable pages, reports the outcome in an X-Search-Status header, and attaches Google’s own price band to every fare.',
  },
  {
    q: 'Can my AI agent use this without me writing HTTP code?',
    a: 'Yes. Hosted MCP servers for Claude, Cursor, and any MCP client; open-source skills for Claude Code and OpenClaw; and an n8n community node. All first-party, all on the same live data.',
  },
];

function PlanMiniRows({ plans }: { plans: Plan[] }) {
  return (
    <ul className="mt-4 space-y-1.5 font-mono text-[12.5px] text-ink-300">
      {plans.map((p) => (
        <li key={p.name} className="flex items-baseline justify-between gap-3 tabular-nums">
          <span className={p.recommended ? 'text-signal-400' : ''}>{p.name}</span>
          <span className="flex-1 border-b border-dotted border-ink-700" aria-hidden="true" />
          <span>{p.priceMonthly === 0 ? '$0' : `$${p.priceMonthly}/mo`}</span>
          <span className="text-ink-500">{p.quota.toLocaleString('en-US')} req</span>
          <span className="text-ink-500 hidden sm:inline">{fmtRate(p)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  const oneway = FIXTURES.onewayJfkCun;
  const berCdg = FIXTURES.roundtripBerCdg;
  const geo = FIXTURES.hotelGeoRixos;

  // First paint for the playground: captured runs, labelled as such.
  const playgroundInitial: PlaygroundInitial = {
    flights: {
      capturedAt: oneway.captured_at,
      request: {
        from: oneway.request.body.from_airport as string,
        to: oneway.request.body.to_airport as string,
        date: oneway.request.body.departure_date as string,
      },
      flights: oneway.data.slice(0, 2),
      headers: oneway.headers ?? {},
    },
    hotels: {
      capturedAt: geo.captured_at,
      query: { hotel: 'Rixos Sungate', area: 'Antalya', checkin: '2026-10-05', checkout: '2026-10-10', countries: ['us', 'de', 'il'] },
      markets: (['us', 'de', 'il'] as const).map((c) => ({ country: c, result: geo.data[c] })),
    },
  };

  const berRecord = berCdg.data[0]!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE.name,
          url: SITE.url,
          publisher: {
            '@type': 'Person',
            name: 'Matan Rabi',
            url: `${SITE.url}/about`,
          },
        }}
      />

      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-12 sm:pt-20 pb-14 sm:pb-24">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div className="pt-2">
              <p className="eyebrow">Live flight &amp; hotel pricing APIs</p>
              <h1 className="mt-4 text-hero font-semibold">
                Your own travel agent, scan deals <span className="text-signal-500">24/7</span>
              </h1>
              <p className="lede mt-5">
                The APIs to build it: real-time Google Flights and Booking.com data as clean JSON, with Google&apos;s own low,
                typical, or high verdict on every fare.
              </p>
              <div className="mt-6 hidden sm:block">
                <CheckBullets
                  items={[
                    <>
                      Google&apos;s price band + a <strong className="text-ink-100">verdict</strong> on every fare
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code>: &quot;no flights&quot; and
                      &quot;search failed&quot; are different answers
                    </>,
                    <>
                      <code className="font-mono text-[13px] text-signal-400">proxy_country</code>: any hotel, priced from any
                      market
                    </>,
                  ]}
                />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Cta href="#demo" variant="primary">
                  Try it for free ↓
                </Cta>
                <Cta href={rapidApiPricingUrl('flights', 'hero')} external variant="ghost">
                  Get a key on RapidAPI →
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">
                Free tier on RapidAPI. No card to try. Built for AI agents too:{' '}
                <Link href="/mcp" className="text-signal-400 hover:text-signal-500">
                  hosted MCP servers →
                </Link>
              </p>
              <p className="mt-2 font-mono text-[12px] text-ink-500">
                No key at all:{' '}
                <Link href="/tools#free-mcp" className="text-signal-400 hover:text-signal-500">
                  the free, ad-supported MCP server →
                </Link>
              </p>
              <p className="mt-2 font-mono text-[12px] text-ink-500">
                New guide:{' '}
                <Link href="/guides/ai-travel-agent" className="text-signal-400 hover:text-signal-500">
                  Create your 24/7 AI travel agent →
                </Link>
              </p>
            </div>
            <div className="scroll-mt-24">
              <Playground initial={playgroundInitial} />
            </div>
          </div>
        </Container>
      </div>

      {/* ========================= DATA SOURCES ========================= */}
      <Section className="!py-8">
        {/* Wordmarks are deliberately plain text: neither mark is licensed for third-party
            logo use without permission. See public/logos/SOURCES.md. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <p className="w-full sm:w-auto font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">Live data from</p>
          <span className="rounded-lg border rule bg-ink-900/60 px-3.5 py-1.5 font-display text-[17px] font-semibold text-ink-100">
            Google Flights
          </span>
          <span className="rounded-lg border rule bg-ink-900/60 px-3.5 py-1.5 font-display text-[17px] font-semibold text-ink-100">
            Booking.com
          </span>
          <span className="w-full sm:w-auto text-[13px] text-ink-500">queried in real time on every request.</span>
        </div>
      </Section>

      {/* ========================= INTEGRATIONS ========================= */}
      <Section id="integrations">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead
            eyebrow="Integrations"
            title="Works where you already build"
            lede="One key, the same live data, twelve doors."
          />
          <Cta href="/integrations" variant="ghost">
            All integrations →
          </Cta>
        </div>
        <div className="mt-8">
          <IntegrationGrid items={HOME_INTEGRATIONS} />
        </div>
      </Section>

      {/* ====================== THE THREE ANSWERS ======================= */}
      <Section>
        <SectionHead
          eyebrow="Why this one"
          title="Three answers most travel APIs cannot give"
          lede="Every fare feed has prices. These are the fields that turn prices into decisions."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
            <h3 className="text-[17px] font-semibold text-ink-100">&quot;Is this fare a deal?&quot;</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Google&apos;s own price band for the route and dates, and its low | typical | high verdict, on every result.
            </p>
            <p className="mt-4 rounded-lg bg-ink-950/70 border rule px-3 py-2 font-mono text-[12px] text-ink-300 overflow-x-auto whitespace-nowrap">
              verdict: <span className="text-verdict-low">&quot;{berRecord.price_range_in_relation_to_other_periods}&quot;</span>{' '}
              · band ${berRecord.price_insights_low} to ${berRecord.price_insights_high}
            </p>
            <Link href="/flights-api/price-insights" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4">
              Price insights →
            </Link>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
            <h3 className="text-[17px] font-semibold text-ink-100">&quot;Did the search fail?&quot;</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              An empty list is not an answer. <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> says
              ok, empty, partial, or degraded on every response.
            </p>
            <p className="mt-4 rounded-lg bg-ink-950/70 border rule px-3 py-2 font-mono text-[12px] text-ink-300 overflow-x-auto whitespace-nowrap">
              x-search-status: <span className="text-verdict-high">degraded</span> → retry →{' '}
              <span className="text-verdict-low">ok</span>
            </p>
            <Link href="/flights-api/search-status" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4">
              Status headers →
            </Link>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
            <h3 className="text-[17px] font-semibold text-ink-100">&quot;What does this room cost from Germany?&quot;</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              <code className="font-mono text-[13px] text-signal-400">proxy_country</code> quotes any hotel from any market.
              Rate-parity monitoring in three requests.
            </p>
            <p className="mt-4 rounded-lg bg-ink-950/70 border rule px-3 py-2 font-mono text-[12px] text-ink-300 overflow-x-auto whitespace-nowrap">
              us {geo.data.us.price_string} · de {geo.data.de.price_string} · il {geo.data.il.price_string}
            </p>
            <Link href="/hotels-api/geo-pricing" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4">
              Geo-pricing →
            </Link>
          </div>
        </div>
        <p className="mt-5 font-mono text-[11px] text-ink-500">
          The mono lines are captured runs: {berCdg.captured_at} (flights), {geo.captured_at} (hotels).
        </p>
      </Section>

      {/* ================== THE APIS + PRICING, TOGETHER ================== */}
      <Section id="apis">
        <SectionHead
          eyebrow="The APIs"
          title="Two APIs, priced separately"
          lede="Flights and hotels are separate products with separate plans. Within each, every plan gets every endpoint; you only choose volume and rate limit."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-8 flex flex-col">
            <h3 className="text-xl font-semibold text-ink-100">Google Flights Live API</h3>
            <p className="mt-2 text-[15px] text-ink-400">Live fares with the band, verdict, and booking link on every result.</p>
            <ul className="mt-4 space-y-1.5 font-mono text-[13px] text-ink-300">
              <li>
                <Link href="/flights-api/one-way" className="hover:text-signal-400">
                  POST /oneway <span className="text-ink-500">· one-way search</span>
                </Link>
              </li>
              <li>
                <Link href="/flights-api/round-trip" className="hover:text-signal-400">
                  POST /roundtrip <span className="text-ink-500">· paired itineraries</span>
                </Link>
              </li>
            </ul>
            <PlanMiniRows plans={FLIGHT_PLANS} />
            <div className="mt-6 flex flex-wrap gap-3">
              <Cta href={rapidApiPricingUrl('flights', 'pricing')} external variant="primary">
                Get a flights key →
              </Cta>
              <Cta href="/flights-api" variant="ghost">
                Docs
              </Cta>
            </div>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-8 flex flex-col">
            <h3 className="text-xl font-semibold text-ink-100">Booking.com Live API</h3>
            <p className="mt-2 text-[15px] text-ink-400">Live rates, room-level pricing, and per-country quotes.</p>
            <ul className="mt-4 space-y-1.5 font-mono text-[13px] text-ink-300">
              <li>
                <Link href="/hotels-api/search" className="hover:text-signal-400">
                  POST /search <span className="text-ink-500">· {COUNTS.hotelFilters} filters</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels-api/by-name" className="hover:text-signal-400">
                  POST /hotel_by_name <span className="text-ink-500">· no property IDs</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels-api/bulk" className="hover:text-signal-400">
                  POST /hotel <span className="text-ink-500">· every room in one property</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels-api/geo-pricing" className="hover:text-signal-400">
                  proxy_country <span className="text-ink-500">· on every endpoint</span>
                </Link>
              </li>
            </ul>
            <PlanMiniRows plans={HOTEL_PLANS} />
            <div className="mt-6 flex flex-wrap gap-3">
              <Cta href={rapidApiPricingUrl('hotels', 'pricing')} external variant="primary">
                Get a hotels key →
              </Cta>
              <Cta href="/hotels-api" variant="ghost">
                Docs
              </Cta>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Cta href="/pricing" variant="ghost">
            Full pricing: overage, $ per 1k, Apify option →
          </Cta>
          <p className="font-mono text-[11px] text-ink-500">Plans read from the live listings; the listing is authoritative.</p>
        </div>
      </Section>

      {/* ============================== FAQ ============================== */}
      <Section>
        <FaqSection items={faq} />
      </Section>

      {/* =========================== CLOSING CTA ========================= */}
      <Section bordered={false} className="!pt-4">
        <CtaBand medium="hero" />
      </Section>
    </>
  );
}
