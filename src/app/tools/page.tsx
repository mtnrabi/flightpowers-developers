import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Cta, JsonLd, Section, SectionHead } from '@/components/ui';
import { Mark } from '@/components/IntegrationLogos';
import { McpFreeConnect } from '@/components/McpFreeConnect';
import { LINKS, SITE } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Free travel-data tools',
  description:
    'Two free flagships on the same live API we sell: a full flight search engine, and an MCP server your assistant can use with no key and no signup. Plus live fare checks, month scans, and per-country hotel pricing.',
  alternates: { canonical: '/tools' },
});

export const dynamic = 'force-static';

const TOOLS: {
  href: string;
  name: string;
  tier: string;
  body: string;
  output: string;
}[] = [
  {
    href: '/tools/flight-price-checker',
    name: 'Flight Price Checker',
    tier: 'live demo, rate-limited',
    body: 'Route + date → the live fare with Google’s own price band and a low | typical | high verdict. The one answer a bare price is missing: should you book it now?',
    output: 'live fare + verdict gauge',
  },
  {
    href: '/tools/cheapest-month-to-fly',
    name: 'Cheapest Month to Fly',
    tier: 'live demo, rate-limited',
    body: 'Route + month → sampled departure dates priced as a heat grid, live. The cheapest day jumps out, and the full every-day scan is a parallel burst on your own key.',
    output: 'month heat grid',
  },
  {
    href: '/tools/hotel-price-by-country',
    name: 'Hotel Price by Country',
    tier: 'live demo, rate-limited',
    body: 'One hotel, one date range, priced from 2–3 countries side by side via per-country residential proxies. Rate-parity and geo-pricing monitoring, demoed free.',
    output: 'per-market price table',
  },
];

/** The two things we give away whole. Equal billing, deliberately. */
const FLAGSHIPS = [
  {
    key: 'engine',
    href: 'https://demo.flightpowers.com',
    external: true,
    name: 'FlightPowers Search',
    tier: 'flagship · the full product, free',
    tagline: 'A more powerful flight search engine',
    body: 'The consumer flight search engine we built on the exact API sold here. Search a route like a traveler and you are watching the API work end to end, live, with no signup.',
    foot: 'demo.flightpowers.com',
    cta: 'open the engine →',
  },
  {
    key: 'mcp',
    href: '#free-mcp',
    external: false,
    name: 'Free MCP Server',
    tier: 'flagship · no key, no signup',
    tagline: 'Live fares inside your own assistant',
    body: 'Paste one URL into Claude or ChatGPT and it can search live Google Flights fares and Booking.com room rates for you, in the chat you are already in. Free because it is ad-supported.',
    foot: 'four tools, no API key',
    cta: 'connect it below ↓',
  },
] as const;

/** The clients the free server is worth naming. Marks are self-hosted vendor assets. */
const CLIENT_MARKS = [
  { slug: 'claude', name: 'Claude' },
  { slug: 'openai', name: 'ChatGPT' },
  { slug: 'cursor', name: 'Cursor' },
  { slug: 'mcp', name: 'MCP' },
];

const FREE_TOOLS_LIST = [
  {
    name: 'search_oneway_flights',
    body: 'Live one-way fares with Google’s price band and a low | typical | high verdict, plus a bookable buy_link. Takes a date range and a list of destination airports in one call.',
  },
  {
    name: 'search_roundtrip_flights',
    body: 'Round trips priced as paired legs, not two stapled one-ways. Takes a departure range and a nights value to compare trip lengths in one call.',
  },
  {
    name: 'search_hotels',
    body: 'Live Booking.com results for a destination and a stay: price, review score, room type, and a working booking link. One stay per call.',
  },
  {
    name: 'find_hotel_by_name',
    body: 'Availability and price for one named property. Takes the name a person would type; no internal property ID needed.',
  },
];

export default function ToolsIndexPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Free travel-data tools',
          url: `${SITE.url}/tools`,
          description:
            'Free flight and hotel data tools running on the FlightPowers APIs: a consumer search engine, a no-key ad-supported MCP server, live price checks, month scans, and per-country hotel pricing.',
          hasPart: [
            { name: 'FlightPowers Search', href: LINKS.demoProduct },
            { name: 'Free MCP Server', href: `${SITE.url}/tools#free-mcp` },
            ...TOOLS,
          ].map((t) => ({
            '@type': 'WebApplication',
            name: t.name,
            url: t.href.startsWith('http') ? t.href : `${SITE.url}${t.href}`,
            applicationCategory: 'TravelApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          })),
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-6">
        <p className="eyebrow">Free tools</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Free <span className="text-signal-500">travel-data tools</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Real results before we ask you for anything. Two of these we give away whole: the search engine, and an MCP server your
          assistant can use with no key at all.
        </p>
      </Container>

      {/* ===================== THE TWO FLAGSHIPS ===================== */}
      <Container className="pb-4 pt-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {FLAGSHIPS.map((f) => {
            const inner = (
              <>
                <div className="h-36 sm:h-40 shrink-0 overflow-hidden rounded-xl border rule bg-ink-950/60">
                  {f.key === 'engine' ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/tools/demo-engine.jpg"
                      alt="The FlightPowers search engine mascot: a blue robot with a glowing plane emblem"
                      width={1024}
                      height={1024}
                      loading="lazy"
                      className="mx-auto h-full w-auto max-w-full object-contain py-2"
                    />
                  ) : (
                    <div className="flex h-full flex-wrap items-center justify-center gap-x-7 gap-y-3 px-5">
                      {CLIENT_MARKS.map((m) => (
                        <span key={m.slug} className="opacity-80">
                          <Mark slug={m.slug} name={m.name} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex min-w-0 flex-1 flex-col">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-signal-400">{f.tier}</p>
                  <h2 className="mt-2 text-[22px] font-semibold text-ink-100">{f.name}</h2>
                  <p className="mt-1 text-[14px] text-ink-300 italic">“{f.tagline}”</p>
                  <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">{f.body}</p>
                  <p className="mt-4 flex flex-wrap items-baseline gap-x-2 pt-1 font-mono text-[11.5px] text-ink-400">
                    <span>{f.foot}</span>
                    <span className="text-signal-400 group-hover:text-signal-500">{f.cta}</span>
                  </p>
                </div>
              </>
            );
            const cls =
              'group flex flex-col rounded-2xl border border-signal-600/40 bg-ink-900/60 p-6 hover:border-signal-500 transition-colors';
            return f.external ? (
              <a key={f.key} href={f.href} rel="noopener" className={cls}>
                {inner}
              </a>
            ) : (
              <a key={f.key} href={f.href} className={cls}>
                {inner}
              </a>
            );
          })}
        </div>
      </Container>

      {/* ===================== CONNECT THE FREE SERVER ===================== */}
      <Section id="free-mcp" className="scroll-mt-24">
        <SectionHead
          eyebrow="No key, no signup"
          title="Connect the free MCP server in one step"
          lede="It takes no API key, so there is nothing to configure except the address. Paste it once and your assistant gets four live travel tools."
        />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
          <McpFreeConnect url={LINKS.mcpFree} />

          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.05] p-6">
            <p className="eyebrow">How it stays free</p>
            <h3 className="mt-3 text-[18px] font-semibold text-ink-100">It is ad-supported. Plainly.</h3>
            <p className="mt-3 text-[14.5px] text-ink-300 leading-relaxed">
              You do not pay for this server, so an advertiser does. Every successful result comes back with one sponsored card,
              always labelled Sponsored, served through our ad partner Lulu. It renders as a card in clients that support MCP UI
              panels and as a plain bordered block in terminal clients, so you will see it either way. We would rather you read
              that here than discover it in your chat window.
            </p>
            <p className="mt-3 text-[14.5px] text-ink-300 leading-relaxed">
              Two things it never does: attach an ad to an error or to a search that found nothing, and pass Lulu your identity.
            </p>
            <p className="mt-3 text-[14.5px] text-ink-300 leading-relaxed">
              The keyed servers at{' '}
              <Link href="/mcp" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                /mcp
              </Link>{' '}
              carry no ads at all. Same data, your own RapidAPI key, billed to your own plan.
            </p>
          </div>
        </div>

        {/* ---------- the four tools ---------- */}
        <div className="mt-14">
          <h3 className="text-[17px] font-semibold text-ink-100">The four tools you get</h3>
          <p className="mt-2 text-[14.5px] text-ink-400 max-w-3xl leading-relaxed">
            Flights and hotels, both, on the free server. These names and shapes were read from a live{' '}
            <code className="field">tools/list</code> against the address above.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FREE_TOOLS_LIST.map((t) => (
              <div key={t.name} className="rounded-2xl border rule bg-ink-900/50 p-5">
                <code className="field">{t.name}</code>
                <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- the limits ---------- */}
        <div className="mt-12 rounded-2xl border rule bg-ink-950/60 p-6 sm:p-8">
          <h3 className="text-[17px] font-semibold text-ink-100">What the free server will not do</h3>
          <p className="mt-2 text-[14.5px] text-ink-400 max-w-3xl leading-relaxed">
            Worth knowing before you point anything at it. These are the free server&apos;s own limits, not the API&apos;s.
          </p>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-[15px] font-semibold text-ink-100">
                One call searches at most 15 date × destination combinations
              </dt>
              <dd className="mt-1.5 text-[14.5px] text-ink-400 leading-relaxed">
                Ask for a wider range and the request is not rejected: the server samples the range evenly, returns{' '}
                <code className="field">truncated: true</code>, and lists exactly which dates it searched in{' '}
                <code className="field">search_coverage.departure_dates_searched</code>. A date missing from that list was never
                searched, which is not the same as having no flights. The keyed servers go to 30 combinations per call, with a{' '}
                <code className="field">max_searches</code> argument to cap the spend, and each combination is one billed request
                on your own plan.
              </dd>
            </div>
            <div>
              <dt className="text-[15px] font-semibold text-ink-100">Shared capacity, with nothing reserved for you</dt>
              <dd className="mt-1.5 text-[14.5px] text-ink-400 leading-relaxed">
                There is no per-user quota on the free server. Everyone connected to it draws on the same pool, and when that
                pool runs low the server narrows its search rather than failing, and can stop serving hotel searches entirely.
                Nothing is held back for you and a busy day is not your day, which is why this is for trying it and for personal
                use rather than for anything you ship.
              </dd>
            </div>
            <div>
              <dt className="text-[15px] font-semibold text-ink-100">The hotel tools take one stay per call</dt>
              <dd className="mt-1.5 text-[14.5px] text-ink-400 leading-relaxed">
                No date range and no destination list on <code className="field">search_hotels</code> or{' '}
                <code className="field">find_hotel_by_name</code>: price several dates or properties with one call each. Two
                controls are keyed-server only, and the free server does not expose them at all: the per-country pricing that
                rate-parity monitoring is built on (<code className="field">price_as_seen_from</code>) and the documented
                Booking.com <code className="field">filters</code>.
              </dd>
            </div>
          </dl>
        </div>
      </Section>

      {/* ===================== THE THREE BROWSER TOOLS ===================== */}
      <Section>
        <SectionHead
          eyebrow="Also free"
          title="Three tools that run in the browser"
          lede="No connection to set up: open the page and it runs a real search on our key."
        />
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-400 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-[17px] font-semibold text-ink-100">{t.name}</h3>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-signal-400">{t.tier}</p>
              <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">{t.body}</p>
              <p className="mt-4 flex items-center justify-between border-t rule pt-3 font-mono text-[11.5px] text-ink-400">
                <span>{t.output}</span>
                <span className="text-signal-400 group-hover:text-signal-500">open →</span>
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-6 font-mono text-[12px] text-ink-400">
          These three run real searches on our key, so they&apos;re capped per visitor per day; the pages say exactly how.
        </p>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10 text-center">
          <p className="eyebrow">Need more power?</p>
          <h2 className="mt-3 text-[1.75rem] sm:text-4xl font-semibold">These tools are the API, on our key</h2>
          <p className="lede mx-auto mt-4 max-w-2xl">
            Same endpoints, same fields, demo-sized caps. Your own key removes the caps and the ads: full month scans, any market,
            hundreds of routes in parallel.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta href="/pricing" variant="primary">
              See pricing
            </Cta>
            <Cta href="/mcp" variant="ghost">
              The keyed MCP servers
            </Cta>
          </div>
        </div>
      </Section>
    </>
  );
}
