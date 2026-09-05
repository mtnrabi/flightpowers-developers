import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CtaBand } from '@/components/bands';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  Container,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FLIGHT_PLANS, perThousand } from '@/lib/pricing';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'FlightPowers vs flight-mcp.com',
  description:
    'flight-mcp.com bills cache misses rather than calls, and supports bringing your own upstream key. Their plan figures quoted from flight-mcp.com, retrieved 2026-09-05. What "cache hits are free" means for a poller, and what it means for a fare you are about to alert on.',
  alternates: { canonical: '/compare/flight-mcp' },
});

export const dynamic = 'force-static';

/**
 * Competitor figures below are sourced from flight-mcp.com and its official MCP
 * registry entry (published 2026-08-25), retrieved 2026-09-05. Do not edit any
 * flight-mcp.com figure without re-reading those pages.
 */
const RETRIEVED = '2026-09-05';

const faq: Faq[] = [
  {
    q: 'What does flight-mcp.com actually bill for?',
    a: 'Cache misses. Their published plans are a free tier of 300 monthly cache misses, Lite at $19 for 10,000 and Pro at $49 for 30,000, and their page states that cached responses do not consume plan calls. So the meter runs on how novel your queries are rather than on how many you make. Figures read from flight-mcp.com on 2026-09-05.',
  },
  {
    q: 'When does cache-based pricing beat per-call pricing?',
    a: 'When many callers ask the same question. A public route page, a popular city pair, a chatbot that everyone asks about the same three destinations: those repeat, so most requests are hits and cost nothing. A tracker sweeping 300 unique date pairs a day repeats almost nothing, so nearly every request is a miss and the pricing behaves like per-call pricing with a smaller allowance.',
  },
  {
    q: 'Does a cached fare matter for alerting?',
    a: 'It is the thing to check before you build. A fare alert is only as good as the freshness of the number behind it, so if you are going to wake someone up over a price you need to know how old that price is allowed to be. Their page is where that answer lives; read their cache policy directly rather than trusting a summary of it here. Every one of our calls is scanned live against Google Flights at request time, which is why our prices cost what they cost.',
  },
  {
    q: 'Do both offer MCP?',
    a: 'Yes, and both are in the official MCP registry. Theirs was published there on 2026-08-25 and ships REST alongside it. We publish a paid bring-your-own-key MCP server, a free ad-supported one, and the same data as a plain REST API. That row is close to a tie.',
  },
];

function CompareTable({
  caption,
  head,
  rows,
}: {
  caption?: string;
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <figure>
      <div className="scroll-x rounded-2xl border rule">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                {head.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, i) => (
                <tr key={i} className="border-t rule align-top">
                  {cells.map((cell, j) => (
                    <td key={j} className={`px-4 py-3.5 ${j === 0 ? 'font-semibold text-ink-100 whitespace-nowrap' : 'text-ink-300'} text-[13.5px] leading-relaxed`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {caption ? <figcaption className="mt-2 font-mono text-[11px] text-ink-500">{caption}</figcaption> : null}
    </figure>
  );
}

export default function CompareFlightMcpPage() {
  const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const ultra = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers vs flight-mcp.com',
          url: `${SITE.url}/compare/flight-mcp`,
          dateModified: RETRIEVED,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/compare', label: 'Compare' },
            { href: '/compare/flight-mcp', label: 'flight-mcp.com' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">flight-mcp.com</span>
          </h1>
          <p className="lede mt-5 max-w-3xl">
            flight-mcp.com prices the cache rather than the call: their published plans meter cache misses and their page says cached
            responses do not consume plan calls. It is a genuinely different pricing idea, and whether it saves you money depends
            entirely on how much your queries repeat.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The one-paragraph version" title="Repetition is the whole variable" />
        <p className="mt-6 max-w-3xl text-[15.5px] text-ink-300 leading-relaxed">
          Their meter counts the questions nobody has asked recently.{' '}
          <strong className="text-ink-100">If your traffic asks the same handful of questions over and over</strong>, most of it is
          free and that is hard to beat. If your traffic is a sweep, unique date pairs across a range, a comp set, a monitor that by
          definition wants a number nobody has fetched yet, then almost everything is a miss and their allowance is the real
          quota. Work out your own hit rate before you compare any price, because without it neither plan means anything.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Both sides, from the published pages"
          lede="flight-mcp.com figures read from their own site on the stamped date. Ours render from the same file as /pricing, parsed from the live listing."
        />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">flight-mcp.com</h3>
            <div className="rounded-2xl border rule bg-ink-900/60 p-6 max-w-2xl">
              <ul className="space-y-2 text-[14.5px] text-ink-300 leading-relaxed list-disc pl-5">
                <li>Free: 300 cache misses per month.</li>
                <li>Lite: $19 per month for 10,000 cache misses.</li>
                <li>Pro: $49 per month for 30,000 cache misses.</li>
                <li>Cached responses are free and do not consume plan calls.</li>
                <li>Normalized flight offers over REST and MCP, with bringing your own upstream key supported.</li>
                <li>Published to the official MCP registry on 2026-08-25.</li>
              </ul>
              <p className="mt-4 text-[13.5px] text-ink-400 leading-relaxed">
                Source:{' '}
                <a href="https://flight-mcp.com" rel="noopener" className="text-signal-400 underline underline-offset-4">
                  flight-mcp.com
                </a>
                , read {RETRIEVED}. Their cache policy, including how long a response stays a hit, is on their site and is the
                number that decides everything below. If their page disagrees with this one today, believe their page.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers (Google Flights Live API)</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed max-w-2xl">
              Every request is metered, hit or miss, because there are no hits: each one is scanned live against Google Flights at
              request time. Per thousand requests, PRO is {perThousand(pro)} and ULTRA is {perThousand(ultra)}.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Capabilities" title="Feature by feature, in prose" lede="No tick marks. Each cell says what is documented, and by whom." />
        <div className="mt-8">
          <CompareTable
            caption={`flight-mcp.com cells quote or summarise their own live pages and registry entry, read ${RETRIEVED}; FlightPowers cells are traceable to the live listing and the pages linked from each row.`}
            head={['', 'flight-mcp.com', 'FlightPowers']}
            rows={[
              [
                'What is billed',
                'Cache misses. Cached responses are free and do not consume plan calls. Free 300 a month, Lite $19 for 10,000, Pro $49 for 30,000.',
                <>Requests. Every call is a live scan, so there is no cheaper class of call to route into.</>,
              ],
              [
                'Freshness',
                'Depends on their cache policy, which is published on their site. Read it against your own alerting tolerance.',
                <>
                  Live at request time, nothing served from a cache, which is the reason the price you get is the price the traveller
                  sees.{' '}
                  <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">Price Insights →</Link>
                </>,
              ],
              [
                'Bring your own upstream key',
                'Supported, per their page.',
                <>
                  Not on the REST API. Our paid MCP server is bring-your-own-key by design, which is the same idea in the agent lane.{' '}
                  <Link href="/mcp" className="text-signal-400 underline underline-offset-4">MCP servers →</Link>
                </>,
              ],
              [
                'Scope',
                'Flights, normalized offers over REST and MCP.',
                <>
                  Flights and Booking.com hotels on one key, including per-market pricing.{' '}
                  <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4">Geo-pricing →</Link>
                </>,
              ],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which should you pick" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose flight-mcp.com when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>Your queries repeat heavily, so most of your traffic is cache hits and costs nothing.</li>
              <li>You are serving a public surface where many users ask the same route.</li>
              <li>You want to bring your own upstream key on the REST side.</li>
              <li>A response that is minutes old is fine for what you are showing.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You are alerting on prices and a stale fare is worse than no fare.</li>
              <li>Your workload is a sweep of unique date pairs, where a cache gives you nothing.</li>
              <li>You want Google&apos;s price band and verdict on every result rather than a normalized offer alone.</li>
              <li>You want hotels on the same key.</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep comparing" title="Related pages" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/compare/hasdata', label: 'vs HasData', sub: 'Bigger free tier, dearer entry plan' },
            { href: '/compare/serpapi', label: 'vs SerpApi', sub: 'Platform vs specialist' },
            { href: '/mcp', label: 'Our MCP servers', sub: 'Paid BYO key, and a free one' },
            { href: '/guides/build-a-flight-price-alert', label: 'Build a price alert', sub: 'Where freshness stops being academic' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          A key is on{' '}
          <a href={rapidApiPricingUrl('flights', 'compare')} rel="noopener" className="text-signal-400 underline underline-offset-4">
            the RapidAPI listing
          </a>
          , free plan included, if you would rather test than read.
        </p>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="compare"
          title="No cache to explain to your users"
          body="Every call is scanned live against Google Flights at request time, with Google's own price band on every result."
        />
      </Section>
    </>
  );
}
