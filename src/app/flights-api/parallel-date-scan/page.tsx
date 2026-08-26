import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CodeTabs } from '@/components/CodeTabs';
import { PricingTable } from '@/components/PricingTable';
import { HeatGrid } from '@/components/results';
import {
  Breadcrumbs,
  CapturedBadge,
  CheckBullets,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';
import { monthScanSnippets } from '@/lib/snippets';

export const metadata: Metadata = {
  title: 'Parallel Date Scans — a month of flight prices in one burst',
  description:
    'Each date is one request, and the per-minute rate limits (150 on Pro, 250 on Ultra, 500 on Mega) are sized for firing them in parallel. Cheapest-month calendars, fare heatmaps, and flexible-date search become practical to build.',
  alternates: { canonical: '/flights-api/parallel-date-scan' },
};

export const dynamic = 'force-static';

const PAID_PLANS = FLIGHT_PLANS.filter((p) => p.priceMonthly > 0);
const SCAN_DAYS = 30;
/** The listing's worked example: 3–5 nights, TLV to Paris or Prague, anywhere in May. */
const EXAMPLE_REQUESTS = 31 * 3 * 2;

function scansPerMonth(quota: number): number {
  return Math.floor(quota / SCAN_DAYS);
}
function minutesForExample(rate: number | null): string {
  if (rate == null) return '—';
  const m = Math.ceil(EXAMPLE_REQUESTS / rate);
  return m <= 1 ? 'one burst' : `~${m} min`;
}
function scanQuotaCost(price: number, quota: number): string {
  return `$${((price / quota) * SCAN_DAYS).toFixed(2)}`;
}

const faq: Faq[] = [
  {
    q: 'How do I scan a whole month of flight prices?',
    a: 'One request per departure date, fired in parallel, then merge on price_as_number. The November scan on this page is exactly that: 30 requests, LIS→JFK, one per date, run in parallel batches — the heat grid is the merged result.',
  },
  {
    q: 'How many requests does a flexible-date search use?',
    a: `One per date-and-duration combination. The listing's own worked example — "3 to 5 nights, TLV to Paris or Prague, anywhere in May" — is 31 dates × 3 durations × 2 destinations = ${EXAMPLE_REQUESTS} requests. Fire them in batches sized to your plan's per-minute limit and merge the results.`,
  },
  {
    q: 'Will parallel requests get me blocked by Google?',
    a: 'The API absorbs that concern rather than passing it to you: requests route through a residential proxy by default (use_ext_proxy, switchable per request), unreadable pages are retried automatically, and any search that still could not complete says so in its X-Search-Status header instead of returning a silent empty array.',
  },
  {
    q: 'How many full-month scans does each plan cover?',
    a: `Straight division of quota by ${SCAN_DAYS} requests per scan: Pro's ${PAID_PLANS[0]!.quota.toLocaleString('en-US')} requests/month is ${scansPerMonth(PAID_PLANS[0]!.quota)} full-month scans, Ultra's ${PAID_PLANS[1]!.quota.toLocaleString('en-US')} is ${scansPerMonth(PAID_PLANS[1]!.quota)}, and Mega's ${PAID_PLANS[2]!.quota.toLocaleString('en-US')} is ${scansPerMonth(PAID_PLANS[2]!.quota)} — before overage, which stays available on every paid plan.`,
  },
  {
    q: 'Is there a bulk calendar endpoint that returns a month in one call?',
    a: 'No — and that is a deliberate honesty about how the data is gathered: every date is a live scan of its own Google Flights page. Each date is one request; the rate limits are sized so the whole month still finishes in about a minute. The free cheapest-month tool on this site runs the same pattern.',
  },
  {
    q: 'What concurrency should my client use?',
    a: `Keep in-flight requests under your plan's per-minute figure — ${PAID_PLANS.map((p) => `${p.ratePerMinute} on ${p.name[0] + p.name.slice(1).toLowerCase()}`).join(', ')}. A ${SCAN_DAYS}-date month fits inside a single burst on every paid plan; the ${EXAMPLE_REQUESTS}-request example needs ${minutesForExample(PAID_PLANS[0]!.ratePerMinute)} on Pro and ${minutesForExample(PAID_PLANS[1]!.ratePerMinute)} on Ultra.`,
  },
  {
    q: 'What does a month scan cost?',
    a: `Derived from the plan prices: ${SCAN_DAYS} requests is ${scanQuotaCost(PAID_PLANS[0]!.priceMonthly, PAID_PLANS[0]!.quota)} of Pro's quota, ${scanQuotaCost(PAID_PLANS[1]!.priceMonthly, PAID_PLANS[1]!.quota)} of Ultra's, and ${scanQuotaCost(PAID_PLANS[2]!.priceMonthly, PAID_PLANS[2]!.quota)} of Mega's. A daily cheapest-month product on one route runs about ${SCAN_DAYS * 30} requests a month — it fits inside even Pro's quota.`,
  },
];

export default function ParallelDateScanPage() {
  const scan = FIXTURES.novscanLisJfk;
  const priced = scan.data.filter((d) => d.price != null);
  const cheapest = priced.reduce((a, b) => (a.price! <= b.price! ? a : b));
  const snippets = monthScanSnippets({ from: 'LIS', to: 'JFK', month: '2026-11', days: SCAN_DAYS });

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Flights API', item: `${SITE.url}/flights-api` },
            { '@type': 'ListItem', position: 3, name: 'Parallel Date Scans', item: `${SITE.url}/flights-api/parallel-date-scan` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Parallel Date Scans',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/flights-api/parallel-date-scan`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/flights-api', label: 'Flights API' }, { href: '/flights-api/parallel-date-scan', label: 'Parallel Date Scans' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Parallel Date Scans</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                A month of fares in <span className="text-signal-500">one burst</span>
              </h1>
              <p className="lede mt-5">
                Each date is one request, and the rate limits are sized for exactly that — fire a whole month in parallel and
                merge the results.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      {COUNTS.flightsRateLimits} requests/min on{' '}
                      {PAID_PLANS.map((p) => p.name[0] + p.name.slice(1).toLowerCase()).join(' / ')}
                    </>,
                    <>A {SCAN_DAYS}-date month scan fits inside a single burst on every paid plan</>,
                    <>The heat grid on the right is real: {scan.data.length} live requests, LIS→JFK, all of November</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/tools/cheapest-month-to-fly" variant="ghost">
                  Try it as a free tool
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <div className="terminal">
              <div className="terminal-bar justify-between">
                <span className="uppercase tracking-wider">{scan.data.length} × POST /api/google_flights/oneway/v1</span>
                <CapturedBadge date={scan.captured_at} />
              </div>
              <div className="border-b rule px-4 py-2.5 font-mono text-[11.5px] text-ink-400">
                LIS→JFK · one request per date, 2026-11-01 → 2026-11-30 · fired in parallel batches
              </div>
              <div className="p-4">
                <HeatGrid
                  days={scan.data}
                  note={`Cheapest day: $${cheapest.price} on ${cheapest.date}. Every cell is one billed request; the whole month cost ${scan.data.length}.`}
                />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The worked example"
          title="What a flexible-date search really costs"
          lede="From the listing itself: “3 to 5 nights, TLV to Paris or Prague, anywhere in May.” Requests are the unit, so the math is public."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[13px] text-ink-300 leading-loose">
              31 dates in May
              <br />× 3 trip lengths (3–5 nights)
              <br />× 2 destinations (CDG, PRG)
              <br />
              <span className="text-signal-400">= {EXAMPLE_REQUESTS} requests</span>
            </p>
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed">
              Fired in batches sized to your plan&apos;s per-minute limit and merged on{' '}
              <code className="field">price_as_number</code>. This is what makes cheapest-month calendars, fare heatmaps, and
              &quot;surprise me&quot; search practical to build.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border rule">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Plan</th>
                  <th className="px-4 py-3 font-normal text-right">Rate limit</th>
                  <th className="px-4 py-3 font-normal text-right">Quota / mo</th>
                  <th className="px-4 py-3 font-normal text-right">{SCAN_DAYS}-date scans / mo</th>
                  <th className="px-4 py-3 font-normal text-right">The {EXAMPLE_REQUESTS}-req example</th>
                  <th className="px-4 py-3 font-normal text-right">One scan costs</th>
                </tr>
              </thead>
              <tbody>
                {PAID_PLANS.map((p) => (
                  <tr key={p.name} className={`border-t rule ${p.recommended ? 'bg-signal-600/[0.06]' : ''}`}>
                    <td className="px-4 py-3.5 font-semibold text-ink-100">{p.name}</td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">{p.ratePerMinute} / min</td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">{p.quota.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-signal-400">{scansPerMonth(p.quota)}</td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">{minutesForExample(p.ratePerMinute)}</td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-ink-400">
                      {scanQuotaCost(p.priceMonthly, p.quota)} of quota
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 max-w-3xl font-mono text-[11px] text-ink-500">
          Scans-per-month and per-scan cost are straight arithmetic on the live listing&apos;s quotas and prices — nothing
          estimated. Overage stays available on every paid plan if a scan lands past the quota.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="In code"
          title="The scan that produced the heat grid"
          lede="Reproduce the November capture above: one request per date, parallel workers, merge the cheapest fares."
        />
        <div className="mt-8 max-w-3xl">
          <CodeTabs snippets={snippets} tool="parallel-date-scan" />
          <p className="mt-4 text-[14px] text-ink-400 leading-relaxed">
            Every response in the scan still carries the full result shape — the{' '}
            <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">
              price band and verdict
            </Link>{' '}
            per fare, and an{' '}
            <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">
              X-Search-Status header
            </Link>{' '}
            per date, so a day that failed to scan is never mistaken for a day with no flights.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Pick a plan by scans, not abstractions" />
        <div className="mt-8">
          <PricingTable api="flights" plans={FLIGHT_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Flights API" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/one-way', label: 'One-way search', sub: 'The base endpoint' },
            { href: '/flights-api/round-trip', label: 'Round-trip search', sub: 'Paired-leg itineraries' },
            { href: '/flights-api/price-insights', label: 'Price insights', sub: 'The band & the verdict' },
            { href: '/flights-api/search-status', label: 'Search status', sub: '"empty" vs "failed"' },
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
          title="Scan the month, find the day"
          body="Rate limits sized for parallel date scans, with a price verdict on every fare that comes back."
        />
      </Section>
    </>
  );
}
