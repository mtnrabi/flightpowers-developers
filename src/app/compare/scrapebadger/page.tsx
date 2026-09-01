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
  title: 'FlightPowers vs ScrapeBadger Google Flights API',
  description:
    'An honest comparison of ScrapeBadger pay-per-use Google Flights API and FlightPowers subscription model on RapidAPI: billing models, round-trip costs, when pay-as-you-go wins, and when monthly plans win. Competitor figures quoted from scrapebadger.com, retrieved 2026-09-01.',
  alternates: { canonical: '/compare/scrapebadger' },
});

export const dynamic = 'force-static';

/** Competitor figures below are QUOTES from scrapebadger.com, retrieved 2026-09-01. Do not edit without re-verifying. */
const RETRIEVED = '2026-09-01';

const faq: Faq[] = [
  {
    q: 'When is ScrapeBadger pay-as-you-go model cheaper than FlightPowers?',
    a: `For occasional batch jobs with no baseline volume. If you run 500 searches once a quarter, ScrapeBadger PAYG at 7 credits per search (3,500 credits ≈ $0.53 at $0.15/1k credits) costs you $0.53 when you use it, $0 the rest of the time. A monthly subscription on FlightPowers bills $10 or $25 every month whether you use it or not. Conversely, if you run 2,500 searches every month, our $10 PRO plan is $10 flat; ScrapeBadger equivalent is 17,500 credits ≈ $2.63 PAYG or a $49+ subscription.`,
  },
  {
    q: 'How much does ScrapeBadger cost per search?',
    a: `7 credits per successful flight search (scrapebadger.com, retrieved ${RETRIEVED}). At PAYG rates ($0.15 per 1,000 credits), that is $0.00105 per search. At subscription rates (which are discounted but not published per-credit on their pricing page), the per-search cost is lower but requires committing to $49/month minimum. Compare that to our $10 PRO at $0.004 per search or $25 ULTRA at $0.0025 per search.`,
  },
  {
    q: 'Does ScrapeBadger charge for failed requests?',
    a: `No. Their pricing page explicitly states: "Failed requests (timeouts, blocked responses, empty results) are never charged. Credits are deducted only when the API returns a successful, data-containing response." That is a genuinely customer-friendly billing policy and worth acknowledging. We count every call toward quota regardless of outcome.`,
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

export default function CompareScrapeBadgerPage() {
  const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const ultra = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
  const perSearch = (p: typeof pro) => `$${(p.priceMonthly / p.quota).toFixed(4)}`;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers vs ScrapeBadger Google Flights API',
          url: `${SITE.url}/compare/scrapebadger`,
          dateModified: RETRIEVED,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/scrapebadger', label: 'ScrapeBadger' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">ScrapeBadger</span> Google Flights API
          </h1>
          <p className="lede mt-5 max-w-3xl">
            ScrapeBadger is a pay-per-use web scraping API covering 20+ Google surfaces (Flights, Maps, News, Shopping, Trends, Scholar, and more) under one account and one credit balance. FlightPowers is a monthly-subscription specialist on flights and hotels alone. This page is about when pay-as-you-go beats subscriptions, and when it does not.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The one-paragraph version" title="Pay-per-use vs monthly subscription" />
        <p className="mt-6 max-w-3xl text-[15.5px] text-ink-300 leading-relaxed">
          ScrapeBadger charges per successful request with <strong className="text-ink-100">credits that never expire</strong> (PAYG model) or discounted subscription plans from $49/month. FlightPowers charges a <strong className="text-ink-100">fixed monthly fee</strong> from $10, billed whether you use it or not. If your workload is occasional batch jobs with no baseline volume, pay-per-use wins: you pay $0.53 for 500 searches once a quarter, then nothing. If your workload is steady monthly volume, a subscription wins: 2,500 searches every month costs $10 flat on FlightPowers or $2.63 PAYG (but realistically a $49+ subscription) on ScrapeBadger.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="Credits that never expire vs monthly quotas" lede="Their model quoted from their pricing page; ours rendered from the same data that drives our /pricing page." />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">ScrapeBadger Google Flights API</h3>
            <CompareTable
              caption={`Quoted from scrapebadger.com/pricing and scrapebadger.com/google-flights-api · retrieved ${RETRIEVED}`}
              head={['Model', 'Price', 'Cost per search', 'Expiry']}
              rows={[
                ['Free trial', '1,000 credits (≈142 searches)', '$0', 'Never (no credit card required)'],
                ['Pay As You Go', 'From $10', '$0.00105 per search (7 credits @ $0.15/1k)', 'Never'],
                ['Subscription', 'From $49 / month', 'Lower per-credit rate (not published)', 'Monthly refresh (optional rollover)'],
              ]}
            />
            <div className="mt-6 max-w-2xl space-y-4">
              <p className="text-[14.5px] text-ink-400 leading-relaxed">
                <strong className="text-ink-200">Pay-per-use that actually works:</strong> ScrapeBadger PAYG credits do not expire. Buy $10 worth, use them over six months, top up when you run out. No "use it or lose it" pressure, no wasted quota at month-end.
              </p>
              <p className="text-[14.5px] text-ink-400 leading-relaxed">
                <strong className="text-ink-200">Only successful requests are charged:</strong> Failed requests (timeouts, blocks, empty results) cost zero credits. At scale, where failure rates affect effective cost per result, that policy matters. We count every call toward quota regardless of outcome; they bill only for data you received.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers (Google Flights Live API on RapidAPI)</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed max-w-2xl">
              Fixed monthly pricing: PRO at $10 for 2,500 requests is {perSearch(pro)} per search; ULTRA at $25 for 10,000 is {perSearch(ultra)}. Paid plans have soft quotas: overages bill at $0.003/req (PRO/ULTRA) or $0.001/req (MEGA). The free tier is 10 requests, hard cap.
            </p>
          </div>
          <div className="max-w-2xl">
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">When does each model win on cost?</h3>
            <CompareTable
              caption="Scenarios where one model clearly beats the other on total monthly cost"
              head={['Workload', 'ScrapeBadger cost', 'FlightPowers cost', 'Winner']}
              rows={[
                ['500 searches once a quarter', '$0.53 when used, $0 otherwise', '$10–$25 every month', 'ScrapeBadger (PAYG)'],
                ['2,500 searches every month', '$2.63 PAYG or $49+ subscription', '$10 / month (PRO plan)', 'FlightPowers'],
                ['10,000 searches every month', '$10.50 PAYG or $49+ subscription', '$25 / month (ULTRA plan)', 'FlightPowers'],
                ['100 searches sporadically', '$0.11 per use, $0 baseline', '$10 minimum (or 10-req free tier)', 'ScrapeBadger (PAYG)'],
              ]}
            />
            <p className="mt-4 text-[14.5px] text-ink-400 leading-relaxed">
              Rule of thumb: if your baseline is zero and you run batch jobs occasionally, PAYG wins because you pay nothing when idle. If your baseline is predictable monthly volume (fare monitoring, a live product, daily agent scans), a fixed subscription wins because the per-search cost is lower and you are billed that cost anyway.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which should you pick" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose ScrapeBadger when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>Your workload is occasional batch jobs with no baseline volume: pay-per-use beats a monthly subscription.</li>
              <li>You need Google Flights <em>and</em> Google Maps <em>and</em> Google News under one account and one credit balance.</li>
              <li>You want to scan 200 dates in one API call instead of looping 200 times.</li>
              <li>You want only successful requests to be charged (a genuinely better billing policy than ours).</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>Your workload is steady monthly volume (fare monitoring, a live product, daily agent scans): fixed subscriptions beat PAYG on total cost.</li>
              <li>You are running 2,500–10,000 searches/month and want a predictable bill ($10 or $25 flat).</li>
              <li>You need explicit search status (ok | empty | partial | degraded) to distinguish "no flights" from "search failed."</li>
              <li>You scan date ranges in bursts and want published per-minute rate limits (150 to 500/min).</li>
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
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The verdict field, proven' },
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
          title="Predictable monthly pricing for predictable volume"
          body="$10 gets you 2,500 searches, flat. No per-credit arithmetic, no expiry tracking, no topping up."
        />
      </Section>
    </>
  );
}
