import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Container, JsonLd, Section, SectionHead } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Use cases: 8 things built on live travel data',
  description:
    'Eight jobs, sorted into the three things people do with live flight and hotel prices: scan for deals, put live search in their own app, or hand the data to an LLM and let it run a travel agent around the clock.',
  alternates: { canonical: '/use-cases' },
});

export const dynamic = 'force-static';

type Play = 'scan' | 'app' | 'agent';

/**
 * The three plays (Matan, 2026-09-09): scan deals, live search inside your own app, an
 * LLM running the whole thing. Every use case below is one of the three. Wording matches
 * the homepage hero on purpose.
 */
const PLAYS: { key: Play; title: string; lede: string }[] = [
  {
    key: 'scan',
    title: 'Scan for deals',
    lede: 'Run the search on a schedule, over a range of dates, and only look when the number moves.',
  },
  {
    key: 'app',
    title: 'Put live search in your app',
    lede: 'Your users ask, the API answers with what Google Flights and Booking.com are showing right now.',
  },
  {
    key: 'agent',
    title: 'Run a 24/7 AI travel agent',
    lede: 'Hand the same tools to an LLM and let it do the looking, on a schedule, without you writing the loop.',
  },
];

const useCases: { slug: string; play: Play; title: string; sub: string }[] = [
  {
    slug: 'fare-alerts',
    play: 'scan',
    title: 'Fare alerts',
    sub: 'Price alerts backed by real-time flight data: no price-history database to build.',
  },
  {
    slug: 'ai-travel-agents',
    play: 'agent',
    title: 'AI travel agents',
    sub: 'Flat JSON tool calls, hosted MCP servers, and price context your agent can reason with.',
  },
  {
    slug: 'rate-parity-monitoring',
    play: 'app',
    title: 'Rate-parity monitoring',
    sub: 'The same room priced from different countries with proxy_country, sampled per market: parity checks from one API.',
  },
  {
    slug: 'fare-calendars',
    play: 'scan',
    title: 'Fare calendars & heatmaps',
    sub: 'Scan a whole month of dates in one burst with rate limits sized for parallel scans.',
  },
  {
    slug: 'metasearch',
    play: 'app',
    title: 'Metasearch & comparison sites',
    sub: 'Live flight prices with a working buy_link on every result: no booking URL to reconstruct.',
  },
  {
    slug: 'market-analysis',
    play: 'scan',
    title: 'Market analysis',
    sub: 'Track price movement with real-time data instead of a homegrown baseline.',
  },
  {
    slug: 'hotel-comp-set-tracking',
    play: 'app',
    title: 'Hotel comp-set tracking',
    sub: 'Your competitive set by hotel name, on a schedule: no internal property IDs required.',
  },
  {
    slug: 'trip-planning-bots',
    play: 'agent',
    title: 'Trip-planning bots',
    sub: 'Chatbots that answer with paired round-trips and can honestly say “no flights that day.”',
  },
];

export default function UseCasesPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'FlightPowers use cases',
          url: `${SITE.url}/use-cases`,
          hasPart: useCases.map((u) => ({
            '@type': 'WebPage',
            name: u.title,
            url: `${SITE.url}/use-cases/${u.slug}`,
          })),
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-4">
        <p className="eyebrow">Use cases</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          What people <span className="text-signal-500">build</span> on this data
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Eight jobs the APIs are actually used for, sorted into the three things people do with live flight and hotel
          prices. Each page names the specific capability that makes the job workable (a field, a header, an endpoint, a
          rate limit), not a generic promise.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="space-y-12">
          {PLAYS.map((play) => (
            <div key={play.key}>
              <h2 className="text-xl sm:text-2xl font-semibold text-ink-100">{play.title}</h2>
              <p className="mt-2 max-w-2xl text-[15px] text-ink-400 leading-relaxed">{play.lede}</p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {useCases
                  .filter((u) => u.play === play.key)
                  .map((u) => (
                    <Link key={u.slug} href={`/use-cases/${u.slug}`} className="rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-500 transition-colors">
                      <p className="text-[16px] font-semibold text-ink-100">{u.title}</p>
                      <p className="mt-2 text-[14px] text-ink-400 leading-relaxed">{u.sub}</p>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Not sure where to start?" title="Two pages that answer most questions" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl">
          {[
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'Price context from Google Flights' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans, quotas, rate limits, and the key checker' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="use-case" />
      </Section>
    </>
  );
}
