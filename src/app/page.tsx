import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { AgentBand, CtaBand, SurfaceStrip } from '@/components/bands';
import { AgentDemo } from '@/components/AgentDemo';
import { HeroDoors } from '@/components/HeroDoors';
import { ExecuteWidget } from '@/components/ExecuteWidget';
import { PricingTable } from '@/components/PricingTable';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { FIXTURES } from '@/lib/fixtures';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';
import { DIFFERENTIATORS } from '@/lib/diff';

export const metadata: Metadata = {
  title: 'FlightPowers — live flight & hotel pricing APIs with a price verdict',
  description:
    'Real-time Google Flights and Booking.com data as clean JSON. Google’s own price band and a low | typical | high verdict on every fare — for AI travel agents, developers, and automation teams.',
  alternates: { canonical: '/' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'What does the Google Flights API return?',
    a: 'Flat JSON per itinerary: price as a string and a number, airline, duration, stops with layover details, local departure and arrival times, a working buy_link into Google Flights, plus Google’s own price_insights_low/high band and a low | typical | high verdict for the route and dates.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Yes — the BASIC plan on RapidAPI is $0 and needs no card. It is 10 requests per month with a hard cap: enough to verify your key and see the response shape, not enough to evaluate. Evaluate with the live demo and free tools on this site instead; they run real requests on our key.',
  },
  {
    q: 'How is this different from scraping Google Flights myself?',
    a: 'A scraper you maintain breaks on every markup change and cannot tell “no flights” from “my scrape failed.” This API retries unreadable pages automatically, reports the outcome in an X-Search-Status header (ok, empty, partial, degraded), and returns Google’s price band with every fare — a field most scrapers never see.',
  },
  {
    q: 'Does round-trip really return paired legs?',
    a: 'Yes. POST /roundtrip returns one object per itinerary with total_price, total_duration_seconds, total_stops, and the outbound and return legs already paired — not two one-way results you have to combine yourself.',
  },
  {
    q: 'How do I know whether a fare is a good deal?',
    a: 'Every result carries price_insights_low and price_insights_high — Google’s historical band for that route and date — and price_range_in_relation_to_other_periods, Google’s own low | typical | high verdict. Compare the fare to the band, or just branch on the verdict.',
  },
  {
    q: 'Can I get hotel prices as seen from another country?',
    a: 'Yes. Every hotels endpoint accepts proxy_country, a two-letter code that routes the request through a residential proxy in that market. Ask for the same room from us, de, and il and compare — that is rate-parity monitoring in three requests.',
  },
  {
    q: 'What are the rate limits?',
    a: 'Flights: 150 requests/minute on Pro ($10/mo, 2,500 requests), 250/min on Ultra ($25/mo, 10,000), 500/min on Mega ($50/mo, 50,000). Hotels: 25/min on Pro and Ultra, 50/min on Mega. The limits are sized for parallel date scans — a whole month in one burst.',
  },
  {
    q: 'Can my AI agent use this without me writing HTTP code?',
    a: 'Yes — three ways: hosted MCP servers (a URL, no install) for Claude, Cursor, and any MCP client; open-source agent skills for Claude Code and OpenClaw; and an n8n community node. All first-party, all on the same live data.',
  },
];

export default function HomePage() {
  const oneway = FIXTURES.onewayTlvJfk;
  const berCdg = FIXTURES.roundtripBerCdg;
  const degraded = FIXTURES.degradedExample;
  const geo = FIXTURES.hotelGeoRixos;
  const hunt = FIXTURES.dealHuntSun;

  // First-paint payload for the agent demo: the captured 30-search deal hunt.
  const initialChipPayload = {
    mode: 'canned',
    capturedAt: hunt.captured_at,
    question: 'Find me a cheap warm getaway from TLV in January',
    kind: 'deal-hunt',
    request: hunt.request,
    rows: hunt.data,
  } as Record<string, unknown>;

  const onewayRecord = oneway.data[0]!;
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
        <Container className="relative pt-14 sm:pt-20 pb-16 sm:pb-24">
          <HeroDoors
            doorALabel="I’m building an AI travel agent"
            doorBLabel="I need a flight & hotel data API"
            doorA={
              <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
                <div className="pt-2">
                  <p className="eyebrow">Real-time travel data for AI agents</p>
                  <h1 className="mt-4 text-hero font-semibold">
                    A travel agent that <span className="text-signal-500">never sleeps</span>
                  </h1>
                  <p className="lede mt-5">
                    Talk to it in plain language. It scans live Google Flights and Booking.com data and tells you whether a fare is
                    low, typical, or high — using Google&apos;s own numbers.
                  </p>
                  <div className="mt-7">
                    <CheckBullets
                      items={[
                        <>
                          Google&apos;s price band + a <strong className="text-ink-100">low | typical | high verdict</strong> on every fare
                        </>,
                        <>Round-trip as one paired-leg search, not two one-ways stapled together</>,
                        <>
                          Tells you <em>&quot;no flights&quot;</em> apart from <em>&quot;the search failed&quot;</em>
                        </>,
                      ]}
                    />
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Cta href="#demo" variant="primary">
                      Try the live demo ↓
                    </Cta>
                    <Cta href="/mcp" variant="ghost">
                      Connect the MCP →
                    </Cta>
                  </div>
                  <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
                </div>
                <div id="demo" className="scroll-mt-24">
                  <AgentDemo initialChipPayload={initialChipPayload} />
                </div>
              </div>
            }
            doorB={
              <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
                <div className="pt-2">
                  <p className="eyebrow">Flight &amp; hotel data API</p>
                  <h1 className="mt-4 text-hero font-semibold">
                    Live fares, and the <span className="text-signal-500">context to judge them</span>
                  </h1>
                  <p className="lede mt-5">
                    One-way, round-trip, and hotel pricing as clean JSON — with Google&apos;s own price insights attached to every
                    result.
                  </p>
                  <div className="mt-7">
                    <CheckBullets
                      items={[
                        <>
                          {COUNTS.restEndpoints} endpoints, flat JSON, a working <code className="font-mono text-[13px] text-signal-400">buy_link</code> on
                          every itinerary
                        </>,
                        <>
                          {COUNTS.flightsRateLimits} req/min by tier — a whole month scanned in one parallel burst
                        </>,
                        <>
                          <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> headers: empty, partial, and degraded are
                          different answers
                        </>,
                      ]}
                    />
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Cta href={rapidApiPricingUrl('flights', 'hero')} external variant="primary">
                      Get a key on RapidAPI →
                    </Cta>
                    <Cta href={SITE.docsUrl} external variant="ghost">
                      Read the docs
                    </Cta>
                  </div>
                  <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
                </div>
                <ExecuteWidget
                  title="POST /v1/flights/oneway"
                  tool="home-execute"
                  capturedAt={oneway.captured_at}
                  requestText={JSON.stringify(oneway.request.body, null, 2)}
                  responseText={JSON.stringify(oneway.data.slice(0, 2), null, 2)}
                  headers={oneway.headers}
                />
              </div>
            }
          />
        </Container>
      </div>

      {/* ========================= SURFACE STRIP ========================= */}
      <Section className="!py-10">
        <SurfaceStrip />
      </Section>

      {/* ========================= WHO IS IT FOR ========================= */}
      <Section>
        <SectionHead
          eyebrow="Who is it for"
          title="Three kinds of builders, one data layer"
          lede="The same six endpoints and the same live data, packaged for the way you work."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[17px] font-semibold text-ink-100">Agent builders</h3>
            <p className="mt-2.5 text-[15px] text-ink-400 leading-relaxed">
              Hosted MCP servers and open-source skills. Your agent asks in plain language; the response is small, flat JSON that
              drops straight into a tool call — with a verdict it can reason about.
            </p>
            <Link href="/ai-agents" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4">
              Agent recipes →
            </Link>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[17px] font-semibold text-ink-100">Developers</h3>
            <p className="mt-2.5 text-[15px] text-ink-400 leading-relaxed">
              A REST API that behaves: consistent shapes, honest error semantics, filters matching the real Google Flights and
              Booking.com UIs, and rate limits sized for parallel scans.
            </p>
            <Link href="/flights-api" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4">
              Endpoint reference →
            </Link>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[17px] font-semibold text-ink-100">Automation &amp; BI teams</h3>
            <p className="mt-2.5 text-[15px] text-ink-400 leading-relaxed">
              Fare-watch crons in n8n, rate-parity monitoring with per-country hotel pricing, competitive-set tracking — no code
              beyond a workflow node if you don&apos;t want it.
            </p>
            <Link href="/integrations/n8n" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4">
              n8n node →
            </Link>
          </div>
        </div>
      </Section>

      {/* ===================== FEATURE: PRICE INSIGHTS ==================== */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHead
              eyebrow="The flagship field"
              title="Every fare comes with a verdict"
              accent="verdict"
              lede="Most flight APIs give you a price. This one gives you Google's own historical band for the route and dates — and Google's call on whether today's fare is low, typical, or high."
            />
            <p className="mt-5 text-[15px] text-ink-400 leading-relaxed">
              That one field turns a fare feed into a buying signal: price alerts that fire on{' '}
              <code className="font-mono text-[13px] text-signal-400">&quot;low&quot;</code>, agents that can say &quot;book it&quot; with a reason,
              dashboards that show value instead of noise.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Cta href="/flights-api/price-insights" variant="ghost">
                The price-insights endpoint →
              </Cta>
              <Cta href="/tools/flight-price-checker" variant="ghost">
                Check a live fare free →
              </Cta>
            </div>
          </div>
          <Code label={`captured ${berCdg.captured_at} · POST /v1/flights/roundtrip`}>{JSON.stringify(
            {
              price_range_in_relation_to_other_periods: berRecord.price_range_in_relation_to_other_periods,
              price_insights_low: berRecord.price_insights_low,
              price_insights_high: berRecord.price_insights_high,
              total_price: berRecord.total_price,
              from_airport: berRecord.from_airport,
              to_airport: berRecord.to_airport,
              buy_link: berRecord.buy_link.slice(0, 60) + '…',
            },
            null,
            2
          )}</Code>
        </div>
      </Section>

      {/* ===================== FEATURE: SEARCH STATUS ===================== */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="lg:order-2">
            <SectionHead
              eyebrow="Failure-mode honesty"
              title='An empty response now means something'
              lede='Every scraper gets handed pages it cannot read. Most return an empty list anyway — and your product tells a user something false. This API separates "no flights" from "the search failed", on every response.'
            />
            <p className="mt-5 text-[15px] text-ink-400 leading-relaxed">
              <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> reports{' '}
              <span className="text-verdict-low font-mono text-[13px]">ok</span> ·{' '}
              <span className="font-mono text-[13px]">empty</span> ·{' '}
              <span className="text-verdict-typical font-mono text-[13px]">partial</span> ·{' '}
              <span className="text-verdict-high font-mono text-[13px]">degraded</span>, and opt-in{' '}
              <code className="font-mono text-[13px] text-signal-400">strict</code> mode turns a degraded search into an HTTP 503.
              The capture on the right is a real degraded search — and its immediate retry succeeding.
            </p>
            <div className="mt-6">
              <Cta href="/flights-api/search-status" variant="ghost">
                How the status headers work →
              </Cta>
            </div>
          </div>
          <div className="lg:order-1 space-y-4">
            <Code label={`captured ${degraded.captured_at} · a real degraded search`}>{`HTTP/2 200
x-search-status: degraded
x-search-reason: blocked_page
x-search-attempts: 3
x-search-results: 0

[]   ← says NOTHING about availability. Retry it.`}</Code>
            <Code label="the same request, retried seconds later">{`HTTP/2 200
x-search-status: ok
x-search-retries: 1
x-search-results: 5

[ { "total_price": "$823", ... } ]`}</Code>
          </div>
        </div>
      </Section>

      {/* ====================== FEATURE: GEO PRICING ====================== */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHead
              eyebrow="Hotels · proxy_country"
              title="The same room does not cost the same everywhere"
              lede="Booking.com quotes different rates depending on where the visitor browses from. Every hotels endpoint accepts proxy_country — a residential proxy in that market — so rate-parity and geo-pricing monitoring is three requests, not an infrastructure project."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Cta href="/hotels-api/geo-pricing" variant="ghost">
                The geo-pricing endpoint →
              </Cta>
              <Cta href="/tools/hotel-price-by-country" variant="ghost">
                Try it on a real hotel →
              </Cta>
            </div>
          </div>
          <Code label={`captured ${geo.captured_at} · same room, three markets`}>{`POST /hotel_by_name   { "proxy_country": "us" | "de" | "il" }

  us → ${geo.data.us.price_string}   ← the US market's quote
  de → ${geo.data.de.price_string}
  il → ${geo.data.il.price_string}

same hotel, same room, same dates.`}</Code>
        </div>
      </Section>

      {/* ====================== REMAINING DIFFS ROW ====================== */}
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {DIFFERENTIATORS.filter((d) => ['paired-round-trip', 'buy-link', 'parallel-scans'].includes(d.id)).map((d) => (
            <div key={d.id} className="rounded-2xl border rule bg-ink-900/60 p-6">
              <h3 className="text-[16px] font-semibold text-ink-100">{d.title}</h3>
              <p className="mt-2.5 text-[14.5px] text-ink-400 leading-relaxed">{d.short}</p>
              <Link href={d.provenBy.href} className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4">
                {d.provenBy.label} →
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================ THE APIS =========================== */}
      <Section id="apis">
        <SectionHead
          eyebrow="The APIs"
          title="Six endpoints. Every plan gets all of them."
          lede="You choose volume and rate limit; no feature is ever withheld."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-ink-100">Google Flights Live API</h3>
            <p className="mt-2 text-[15px] text-ink-400">
              Live fares with the price band, verdict, and booking link on every result.
            </p>
            <ul className="mt-5 space-y-2 font-mono text-[13px] text-ink-300">
              <li>
                <Link href="/flights-api/one-way" className="hover:text-signal-400">
                  POST /oneway <span className="text-ink-500">— one-way search</span>
                </Link>
              </li>
              <li>
                <Link href="/flights-api/round-trip" className="hover:text-signal-400">
                  POST /roundtrip <span className="text-ink-500">— paired itineraries</span>
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <Cta href="/flights-api" variant="ghost">
                Flights API →
              </Cta>
            </div>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-ink-100">Booking.com Live API</h3>
            <p className="mt-2 text-[15px] text-ink-400">
              Live rates, review scores, room-level pricing, and per-country quotes with proxy_country.
            </p>
            <ul className="mt-5 space-y-2 font-mono text-[13px] text-ink-300">
              <li>
                <Link href="/hotels-api/search" className="hover:text-signal-400">
                  POST /search <span className="text-ink-500">— destination search, {COUNTS.hotelFilters} filters</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels-api/by-name" className="hover:text-signal-400">
                  POST /hotel_by_name <span className="text-ink-500">— no property IDs needed</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels-api/bulk" className="hover:text-signal-400">
                  POST /hotel <span className="text-ink-500">— every room in one property</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels-api/geo-pricing" className="hover:text-signal-400">
                  proxy_country <span className="text-ink-500">— on every endpoint</span>
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <Cta href="/hotels-api" variant="ghost">
                Hotels API →
              </Cta>
            </div>
          </div>
        </div>
      </Section>

      {/* ========================== AGENT BAND =========================== */}
      <Section>
        <AgentBand />
      </Section>

      {/* ============================ PRICING ============================ */}
      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Simple tiers, billed on RapidAPI"
          lede="Every plan includes every endpoint. The free tier (10 requests, hard cap) verifies your key; the demo above is how you evaluate."
        />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="mb-4 text-[16px] font-semibold text-ink-100">Flights</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="pricing" />
          </div>
          <div>
            <h3 className="mb-4 text-[16px] font-semibold text-ink-100">Hotels</h3>
            <PricingTable api="hotels" plans={HOTEL_PLANS} medium="pricing" />
          </div>
        </div>
        <div className="mt-8">
          <Cta href="/pricing" variant="ghost">
            Full pricing, Apify option &amp; key check →
          </Cta>
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
