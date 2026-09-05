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
  title: 'FlightPowers vs HasData Google Flights API',
  description:
    'HasData ships a Google Flights API and a hosted MCP endpoint with 1,000 free credits a month. Their plan figures quoted from hasdata.com, retrieved 2026-09-05: the free tier is far bigger than ours and the entry price per search is higher. Which side that favours depends on your volume.',
  alternates: { canonical: '/compare/hasdata' },
});

export const dynamic = 'force-static';

/**
 * Competitor figures below are sourced from hasdata.com/apis/google-flights-api and
 * hasdata.com pricing, plus the official MCP registry entry for mcp.hasdata.com,
 * retrieved 2026-09-05. Do not edit any HasData figure without re-reading those pages.
 */
const RETRIEVED = '2026-09-05';

const faq: Faq[] = [
  {
    q: 'How big is the HasData free tier compared to this one?',
    a: 'Bigger, and it is not close. HasData publishes 1,000 credits a month with no card, and their own page calls that "66 free flight searches", which works out at roughly 15 credits per search. Our free BASIC plan is 10 requests a month. If your question is "how much can I try before paying", HasData wins that row outright. Figures read from their pages on 2026-09-05.',
  },
  {
    q: 'Which is cheaper per search once you are paying?',
    a: 'On the entry plan, ours. HasData Startup is $59 a month for 200,000 credits, which their own credits-per-search figure makes about 13,300 flight searches, or roughly $4.4 per 1,000. Our PRO is $10 for 2,500 requests. Their larger plans (Basic $119 for 1M credits, Growth $249 for 3M) bring the unit price down, so at high volume the comparison flips. Do the arithmetic on your own monthly count rather than on a tier name.',
  },
  {
    q: 'Do both ship an MCP server?',
    a: 'Yes. HasData publishes a hosted MCP endpoint at mcp.hasdata.com, listed in the official MCP registry on 2026-08-24. We publish a paid bring-your-own-key MCP server and a separate free ad-supported one. If you are wiring flight data into an agent rather than into a backend, that row is a tie and you should pick on data and price instead.',
  },
  {
    q: 'What does HasData return that is listed on their page and not on ours?',
    a: 'Their Google Flights API page advertises price history and carbon data alongside fares and legs. We return Google’s own price band and a low, typical or high verdict on every result, which is a different shape of the same idea: their history is a series, ours is Google’s conclusion. Neither replaces the other exactly. Read both pages before deciding which one your product needs.',
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

export default function CompareHasDataPage() {
  const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const mega = FLIGHT_PLANS.find((p) => p.name === 'MEGA')!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers vs HasData Google Flights API',
          url: `${SITE.url}/compare/hasdata`,
          dateModified: RETRIEVED,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/compare', label: 'Compare' },
            { href: '/compare/hasdata', label: 'HasData' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">HasData</span> Google Flights API
          </h1>
          <p className="lede mt-5 max-w-3xl">
            HasData is an established scraping vendor that ships a Google Flights API and a hosted MCP endpoint. Their free tier is
            several times the size of ours, and their entry plan costs more per search than ours. Both of those are their published
            numbers, and both are stated here because a comparison that only reports the flattering half is not one.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The one-paragraph version" title="They win the trial, we win the entry unit price" />
        <p className="mt-6 max-w-3xl text-[15.5px] text-ink-300 leading-relaxed">
          If you have not decided yet and you want to test properly before paying anyone,{' '}
          <strong className="text-ink-100">start on HasData</strong>: 1,000 free credits a month, which their page calls 66 flight
          searches, is a real evaluation and our 10 requests is not. If you already know the workload and you are pricing a
          production line item at the entry tier, run the arithmetic below, because their Startup plan works out dearer per search
          than our PRO. At their larger plans the unit price falls and that advantage goes away.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Both sides, from the published pages"
          lede="HasData figures read from their own pricing and Google Flights API pages on the stamped date. Ours render from the same file as /pricing, parsed from the live listing."
        />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">HasData</h3>
            <div className="rounded-2xl border rule bg-ink-900/60 p-6 max-w-2xl">
              <ul className="space-y-2 text-[14.5px] text-ink-300 leading-relaxed list-disc pl-5">
                <li>Free: 1,000 credits per month, no card. Their page describes that as "66 free flight searches", so a flight search costs roughly 15 credits.</li>
                <li>Startup: $59 per month for 200,000 credits. At their own credits-per-search figure that is about 13,300 searches, roughly $4.4 per 1,000.</li>
                <li>Basic: $119 for 1,000,000 credits. Growth: $249 for 3,000,000 credits.</li>
                <li>Annual billing pays ten months out of twelve.</li>
                <li>A hosted MCP endpoint at mcp.hasdata.com, published to the official MCP registry on 2026-08-24.</li>
              </ul>
              <p className="mt-4 text-[13.5px] text-ink-400 leading-relaxed">
                Source:{' '}
                <a href="https://hasdata.com/apis/google-flights-api" rel="noopener" className="text-signal-400 underline underline-offset-4">
                  hasdata.com/apis/google-flights-api
                </a>{' '}
                and their pricing page, read {RETRIEVED}. Credits per search is their number, not our estimate. If their page
                disagrees with this one today, believe their page.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers (Google Flights Live API)</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed max-w-2xl">
              Per thousand requests: PRO is {perThousand(pro)}, MEGA is {perThousand(mega)}. Our free plan is 10 requests a month and
              is a hard cap, so request 11 is refused rather than billed.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Capabilities" title="Feature by feature, in prose" lede="No tick marks. Each cell says what is documented, and by whom." />
        <div className="mt-8">
          <CompareTable
            caption={`HasData cells quote or summarise their own live pages, read ${RETRIEVED}; FlightPowers cells are traceable to the live listing and the pages linked from each row.`}
            head={['', 'HasData', 'FlightPowers']}
            rows={[
              [
                'Free tier',
                '1,000 credits a month, no card. Their page calls that 66 flight searches. This row is theirs.',
                <>10 requests a month, hard cap, every endpoint and every field included. Smaller by design, and smaller than most of the field.</>,
              ],
              [
                'Price context',
                'Their Google Flights API page advertises price history alongside fares, legs and carbon data.',
                <>
                  Google&apos;s own band plus a low, typical or high verdict on every result, no history to build first.{' '}
                  <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">Price Insights →</Link>
                </>,
              ],
              [
                'MCP',
                'Hosted endpoint at mcp.hasdata.com, in the official MCP registry since 2026-08-24.',
                <>
                  A paid bring-your-own-key server and a separate free ad-supported one, both in the official registry.{' '}
                  <Link href="/mcp" className="text-signal-400 underline underline-offset-4">MCP servers →</Link>
                </>,
              ],
              [
                'Round trips',
                'Not separately documented on the page read on the stamped date, so no claim is made here either way.',
                <>
                  One paired-leg request with a combined total and one booking link.{' '}
                  <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">Round-Trip API →</Link>
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
            <h3 className="text-[16px] font-semibold text-ink-100">Choose HasData when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You want a proper unpaid evaluation before committing. Sixty-six searches is one, ten is not.</li>
              <li>You need a price history series rather than a verdict on today&apos;s fare.</li>
              <li>Carbon data is on your requirements list.</li>
              <li>Your volume is high enough to reach their larger plans, where the unit price drops.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You are pricing an entry-tier production workload and the per-search cost decides it.</li>
              <li>You want a fare judged on the first call, without building a history table.</li>
              <li>Round trips are a real share of your searches and you want them priced as one itinerary.</li>
              <li>You want flights and hotels from one vendor on one key.</li>
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
            { href: '/compare/flight-mcp', label: 'vs flight-mcp.com', sub: 'Pricing the cache, not the call' },
            { href: '/compare/serpapi', label: 'vs SerpApi', sub: 'Platform vs specialist' },
            { href: '/guides/best-flight-data-apis-2026', label: 'Best flight data APIs 2026', sub: 'The full field, disclosed bias' },
            { href: '/guides/google-flights-prices-python', label: 'Prices with Python', sub: 'Twelve lines and a real response' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Want to skip all of this and judge the data? A key is on{' '}
          <a href={rapidApiPricingUrl('flights', 'compare')} rel="noopener" className="text-signal-400 underline underline-offset-4">
            the RapidAPI listing
          </a>
          , free plan included.
        </p>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="compare"
          title="Judge the data, not the comparison"
          body="Live Google Flights fares with Google's own price band and a low, typical or high verdict on every result."
        />
      </Section>
    </>
  );
}
