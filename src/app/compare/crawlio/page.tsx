import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CtaBand } from '@/components/bands';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  Code,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FLIGHT_PLANS, perThousand } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'FlightPowers vs Crawlio Google Flights API on RapidAPI',
  description:
    'An honest comparison of Crawlio google-flights8 API and FlightPowers on RapidAPI: round-trip architecture, endpoint coverage, and where each product fits. Competitor features documented from Crawlio RapidAPI listing, retrieved 2026-09-01.',
  alternates: { canonical: '/compare/crawlio' },
});

export const dynamic = 'force-static';

/** Competitor figures below are sourced from rapidapi.com/Crawlio/api/google-flights8, retrieved 2026-09-01. Do not edit without re-verifying. */
const RETRIEVED = '2026-09-01';

const faq: Faq[] = [
  {
    q: 'How does Crawlio handle round-trip searches?',
    a: `Crawlio round-trip flow is a two-stage process: GET /api/v1/roundtrip searches outbound flights, you pick one, then POST /api/v1/roundtrip/returning-flights with a token from the chosen outbound to fetch matching returns. Two requests, two billable calls. FlightPowers POST /v1/flights/roundtrip returns both legs in one paired object with a combined total, so a round-trip costs one request instead of two.`,
  },
  {
    q: 'Does Crawlio support date grids and price graphs?',
    a: 'Yes. They offer dedicated endpoints: /api/v1/flights/date-grid/one-way and /round-trip for cheapest fare per day, and /api/v1/flights/price-graph/one-way and /round-trip for price trends over a date range. If your UI renders a calendar heatmap or a line chart, those endpoints deliver the data structure ready-made. FlightPowers has no dedicated calendar or graph endpoints; you loop dates in parallel.',
  },
  {
    q: 'Where is Crawlio pricing published?',
    a: `Crawlio pricing is on their RapidAPI listing at rapidapi.com/Crawlio/api/google-flights8. We attempted to retrieve it on ${RETRIEVED} but the pricing detail was not accessible in our fetch. Check the live listing Pricing tab for current plans and rates before subscribing.`,
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

export default function CompareCrawlioPage() {
  const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const ultra = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
  const perSearch = (p: typeof pro) => `$${(p.priceMonthly / p.quota).toFixed(4)}`;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers vs Crawlio Google Flights API',
          url: `${SITE.url}/compare/crawlio`,
          dateModified: RETRIEVED,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/crawlio', label: 'Crawlio' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">Crawlio</span> Google Flights API
          </h1>
          <p className="lede mt-5 max-w-3xl">
            Crawlio google-flights8 API on RapidAPI offers structured flight data with dedicated date-grid and price-graph endpoints. Both APIs live on RapidAPI, both target developers building fare comparison or monitoring tools, and both handle round-trips — but the round-trip flow is structurally different.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The one-paragraph version" title="Two-stage round-trips vs paired-leg requests" />
        <p className="mt-6 max-w-3xl text-[15.5px] text-ink-300 leading-relaxed">
          Crawlio round-trip flow mirrors how Google Flights own UI works: search outbound flights, the user picks one, then a second request fetches returns priced against that specific outbound. <strong className="text-ink-100">If you are building an interactive booking interface where users choose leg by leg</strong>, that flow fits. FlightPowers round-trip endpoint returns both legs paired in one request with a combined total, which fits the <strong className="text-ink-100">"price this trip"</strong> question and costs one call instead of two.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Pricing: check the live listing" lede="Crawlio pricing is published on their RapidAPI listing. We could not retrieve the detail on the date stamped here, so we show ours for reference and direct you to their Pricing tab." />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">Crawlio Google Flights API (google-flights8)</h3>
            <div className="rounded-2xl border rule bg-ink-900/60 p-6 max-w-2xl">
              <p className="text-[14.5px] text-ink-300 leading-relaxed">
                Crawlio pricing is available on their RapidAPI listing at{' '}
                <a href="https://rapidapi.com/Crawlio/api/google-flights8" rel="noopener" className="text-signal-400 underline underline-offset-4">
                  rapidapi.com/Crawlio/api/google-flights8
                </a>. We attempted to retrieve it on {RETRIEVED} but the pricing table was not accessible in our fetch. Visit the Pricing tab on the listing for current plans, included volume, and overage rates before subscribing.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers (Google Flights Live API)</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed max-w-2xl">
              Our unit cost: PRO at $10 for 2,500 requests is {perSearch(pro)} per search; ULTRA at $25 for 10,000 is {perSearch(ultra)}. Compare these figures to Crawlio published rates on their listing to determine which fits your volume.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Capabilities" title="Feature by feature, in prose" lede="No tick marks: each cell says what is actually documented, and by whom." />
        <div className="mt-8">
          <CompareTable
            caption={`Crawlio cells quote or summarise their RapidAPI docs retrieved ${RETRIEVED}; FlightPowers cells are traceable to the live listing.`}
            head={['', 'Crawlio', 'FlightPowers']}
            rows={[
              [
                'Round-trip',
                'Two-stage: GET /roundtrip searches outbound; POST /roundtrip/returning-flights fetches returns for a chosen outbound. Two calls, models Google Flights own leg-by-leg selection UI.',
                <>
                  One-stage: POST /v1/flights/roundtrip returns paired legs with a combined total and per-leg filters in one call. Built for "price this trip" queries and date-range scanning.{' '}
                  <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">Round-trip API →</Link>
                </>,
              ],
              [
                'Date grids and price graphs',
                'First-class endpoints for both one-way and round-trip: /date-grid returns cheapest fare per day; /price-graph returns price trends over a date range. If your UI is a heatmap or chart, these deliver the structure ready-made.',
                <>
                  No dedicated calendar or graph endpoints. To scan 30 dates, loop 30 requests in parallel at the published rate limits (150/min on PRO, 250/min on ULTRA, 500/min on MEGA).{' '}
                  <Link href="/flights-api/parallel-date-scan" className="text-signal-400 underline underline-offset-4">Parallel scans →</Link>
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
            <h3 className="text-[16px] font-semibold text-ink-100">Choose Crawlio when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You are building a user-facing booking flow where users pick the outbound leg first, then see priced returns: the two-stage round-trip flow models that interaction.</li>
              <li>Your UI renders date-grid heatmaps or price-trend line charts: their dedicated endpoints return those shapes.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>Round-trips are a large share of your searches and unit economics matter: one request instead of two.</li>
              <li>You scan date ranges in bursts and want published per-minute rate limits.</li>
              <li>You need Google price verdict (price context) on every result for fare-alert logic.</li>
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
            { href: '/compare/datacrawler', label: 'vs DataCrawler', sub: 'Comprehensive platform vs specialist' },
            { href: '/compare/serpapi', label: 'vs SerpApi', sub: 'Platform vs specialist' },
            { href: '/guides/best-flight-data-apis-2026', label: 'Best flight data APIs 2026', sub: 'The full field, disclosed bias' },
            { href: '/flights-api/round-trip', label: 'Round-Trip API', sub: 'Paired legs, one request' },
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
          medium="compare"
          title="One round-trip request, not two"
          body="Paired legs with a combined total and per-leg filters in a single call, built for scanning and monitoring."
        />
      </Section>
    </>
  );
}
