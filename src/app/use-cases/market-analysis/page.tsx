import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';
import { COUNTS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Market Analysis: track fare movement with Google’s own baseline attached',
  description:
    'Sweep routes and dates on a schedule and chart price_as_number over time, with price_insights_low/high giving every observation a route-level baseline from day one. Rate limits of 150–500 req/min make wide sweeps practical.',
  alternates: { canonical: '/use-cases/market-analysis' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'How is this better than collecting prices and computing my own baseline?',
    a: 'You still collect the time series. But every observation already carries price_insights_low and price_insights_high, Google’s historical band for that route and date window. Your dataset is normalisable from the first day of collection instead of after months of warm-up, and “fare vs. its own route’s usual range” is a column, not a model.',
  },
  {
    q: 'How wide a sweep can one plan sustain?',
    a: 'One route-date is one request, so a daily sweep of 100 route-dates is ~3,000 requests a month, inside the Ultra plan (10,000/month at 250 req/min). Mega (50,000/month at 500 req/min, the lowest per-1k price) fits daily sweeps in the low thousands of route-dates. The per-minute limits mean a sweep is a burst, not an hours-long crawl.',
  },
  {
    q: 'Can I do the same for hotels?',
    a: 'Yes: the Booking.com API sweeps a destination across dates for rate movement, and proxy_country adds a per-market dimension flight data doesn’t have: the same property tracked as seen from different countries. The rate-parity and comp-set use cases cover those patterns.',
  },
];

export default function MarketAnalysisPage() {
  return (
    <>
      <Container className="pt-10 sm:pt-14">
        <Link href="/use-cases" className="font-mono text-[12px] text-ink-500 hover:text-ink-300 transition-colors">
          ← All use cases
        </Link>
      </Container>

      <Container className="pt-6 sm:pt-8 pb-4">
        <p className="eyebrow">Use case</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          Fare analysis with a <span className="text-signal-500">baseline included</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">Track routes over time and judge every observation against Google&apos;s own price band, from day one.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          Fare and rate analysis has a cold-start problem: a price observation means little until you have enough history to
          say what normal looks like, and building that history takes months of collection before the first useful chart.
          Wide sweeps make it worse: hundreds of route-dates per day strain both rate limits and budgets. And any gap or
          failed scrape in the series silently skews the trend it was supposed to reveal.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="Analysis-grade fields, sweep-grade limits" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Feature title="Google's band on every observation">
            price_insights_low/high is a per-route, per-window baseline computed by Google, attached to each result. Your
            first day of data already knows whether each fare was low, typical, or high for its route.
          </Feature>
          <Feature title="Rate limits that fit sweeps">
            {COUNTS.flightsRateLimits} requests/minute across the paid tiers. A daily sweep of hundreds of route-dates runs as
            a short burst, and the Mega tier&apos;s pricing is built for exactly this volume.
          </Feature>
          <Feature title="X-Search-Status protects the series">
            Every response states whether it completed. Store the status with the observation and your pipeline can exclude
            degraded reads instead of letting failed scans masquerade as price drops.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="From sweep to signal" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Define the panel.</strong> The route-date pairs you care about: a
                competitor&apos;s network, a hub&apos;s top markets, a season&apos;s inventory.
              </>,
              <>
                <strong className="text-ink-100">Sweep on a schedule.</strong> One request per route-date, fired in parallel
                batches inside your plan&apos;s per-minute limit.
              </>,
              <>
                <strong className="text-ink-100">Store number, band, and status.</strong>{' '}
                <code className="font-mono text-[13px] text-signal-400">price_as_number</code>, the two band fields, the
                verdict, and <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code>: five columns that
                make the series analysable and auditable.
              </>,
              <>
                <strong className="text-ink-100">Chart fare vs. band.</strong> Movement inside the band is noise; movement
                relative to the band is the signal a bare price series can&apos;t show.
              </>,
              <>
                <strong className="text-ink-100">Add the hotel dimension.</strong> Sweep destinations on the Booking.com API,
                and vary <code className="font-mono text-[13px] text-signal-400">proxy_country</code> to add per-market rates to
                the model.
              </>,
            ]}
          />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related resources" title="Keep going" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: '/flights-api/parallel-date-scan', label: 'Parallel Date Scans', sub: 'The sweep pattern and rate limits' },
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The baseline fields, documented' },
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'A one-month sweep, running free' },
            { href: '/guides/best-flight-data-apis-2026', label: 'Flight data APIs, compared', sub: 'Where this fits in the landscape' },
            { href: '/use-cases/rate-parity-monitoring', label: 'Rate-parity monitoring', sub: 'The per-market hotel dimension' },
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
          medium="use-case"
          api="flights"
          title="Start the series with the baseline built in"
          body="Live fares, Google’s band on every row, and volume tiers priced for daily sweeps."
        />
      </Section>
    </>
  );
}
