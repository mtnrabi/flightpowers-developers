import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Container, JsonLd, Section, SectionHead } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Compare FlightPowers vs SerpApi, Duffel, Amadeus, HasData, DataCrawler and more',
  description:
    'Honest comparisons of FlightPowers Google Flights & Booking.com APIs against alternatives: SerpApi, Duffel, Amadeus Self-Service, HasData, flight-mcp.com, DataCrawler, Crawlio, ScrapeBadger. Competitor facts quoted from live pages with retrieval dates. Cost per search, round-trip flows, and feature comparison.',
  alternates: { canonical: '/compare' },
});

export const dynamic = 'force-static';

const PAGES = [
  {
    href: '/compare/serpapi',
    title: 'vs SerpApi',
    sub: 'The general-purpose Google scraping platform against a flights specialist. Cost per search at every tier, the two-request round-trip flow, and the rows SerpApi wins: price history, multi-city, the legal shield.',
    stamp: 'competitor data retrieved 2026-08-24',
  },
  {
    href: '/compare/duffel',
    title: 'vs Duffel',
    sub: 'A booking platform against a data API: they can issue a real ticket and we cannot. What their order-based pricing means for non-booking workloads, and when you should simply use Duffel.',
    stamp: 'competitor data retrieved 2026-08-24',
  },
  {
    href: '/compare/amadeus',
    title: 'vs Amadeus Self-Service',
    sub: 'The Self-Service portal and sandbox are no longer reachable, verifiable with four commands, all shown. What we replace for Self-Service users, the parameter mapping, and what we honestly do not replace.',
    stamp: 'observed state retrieved 2026-08-24',
  },
  {
    href: '/compare/datacrawler',
    title: 'vs DataCrawler on RapidAPI',
    sub: 'Comprehensive 12-endpoint platform with multi-city, calendar grids, price graphs, and a generous 150-request free tier against specialist unit economics. When endpoint breadth matters, and when cost per search decides it.',
    stamp: 'competitor data retrieved 2026-09-01',
  },
  {
    href: '/compare/crawlio',
    title: 'vs Crawlio on RapidAPI',
    sub: 'Two-stage round-trip flow (pick outbound, then fetch priced returns) against one paired-leg request. When the leg-by-leg UI interaction model fits, and when one-request round-trips win on unit cost.',
    stamp: 'competitor data retrieved 2026-09-01',
  },
  {
    href: '/compare/scrapebadger',
    title: 'vs ScrapeBadger',
    sub: 'Pay-per-use credits that never expire (across 20+ Google APIs) against fixed monthly subscriptions. When occasional batch jobs beat subscriptions, and when steady volume makes PAYG expensive.',
    stamp: 'competitor data retrieved 2026-09-01',
  },
  {
    href: '/compare/hasdata',
    title: 'vs HasData',
    sub: 'A Google Flights API from an established scraping vendor, with a hosted MCP endpoint and a free tier several times the size of ours. Their numbers, including the row they win, and the entry tier where the unit price flips.',
    stamp: 'competitor data retrieved 2026-09-05',
  },
  {
    href: '/compare/flight-mcp',
    title: 'vs flight-mcp.com',
    sub: 'They bill cache misses, not calls, and cached responses are free. Whether that saves you money is decided entirely by how much your queries repeat, which is a number only you have.',
    stamp: 'competitor data retrieved 2026-09-05',
  },
  {
    href: '/guides/best-flight-data-apis-2026',
    title: 'Best flight data APIs on RapidAPI, 2026',
    sub: 'The listicle, with disclosed bias: it starts with our own API and says so. Includes the finding that Air Scraper is cheaper per request than we are, and when that should decide it.',
    stamp: 'competitor data retrieved 2026-08-24',
  },
];

export default function CompareIndexPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'FlightPowers comparisons',
          url: `${SITE.url}/compare`,
          hasPart: PAGES.map((p) => ({
            '@type': 'WebPage',
            name: p.title,
            url: `${SITE.url}${p.href}`,
          })),
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }]} />
      </Container>

      <Container className="pt-8 sm:pt-12 pb-4">
        <p className="eyebrow">Compare</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          How FlightPowers compares to <span className="text-signal-500">alternatives</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Every competitor fact on these pages is quoted from the competitor's own live pages, with the retrieval date stamped on
          each comparison. Where the other product is better, we say so — because a comparison you can't trust downward you can't trust upward either.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PAGES.map((p) => (
            <Link key={p.href} href={p.href} className="group rounded-2xl border rule bg-ink-900/50 p-6 hover:border-signal-500 transition-all flex flex-col">
              <h2 className="text-[18px] font-semibold text-ink-100 group-hover:text-signal-400 transition-colors">{p.title}</h2>
              <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed flex-1">{p.sub}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-mono text-[11px] text-ink-500">{p.stamp}</p>
                <span className="text-signal-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          How these pages are made: we read the competitor’s live pricing and documentation pages on the stamped date and quote them
          rather than paraphrase. If a number here disagrees with their site today, believe their site. Our own numbers render from
          the same data file as <Link href="/pricing" className="text-signal-400 underline underline-offset-4">/pricing</Link>, read
          from our live listings.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="The evidence" title="The claims behind the claims" lede="Each differentiator these pages lean on has a page that proves it with a captured, dated run." />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/price-insights', label: 'Price Insights', sub: "Google's band + verdict" },
            { href: '/flights-api/round-trip', label: 'Round-Trip', sub: 'Paired legs, one request' },
            { href: '/flights-api/search-status', label: 'Search Status', sub: '"empty" vs "failed"' },
            { href: '/hotels-api/geo-pricing', label: 'Geo-Pricing', sub: 'proxy_country, per market' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Getting Started" title="Ready to build?" lede="Get your API key and make your first request in under 2 minutes. Free tier available, no credit card required." />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
          {[
            { href: '/guides/google-flights-api-key', label: 'Google Flights API Key', sub: 'Step-by-step guide with code examples' },
            { href: '/guides/booking-com-api-key', label: 'Booking.com API Key', sub: 'Get started with hotel data in minutes' },
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
          title="Or skip the comparison and run it"
          body="The free tools on this site run real requests against the live API. Judge the data, not the copy."
        />
      </Section>
    </>
  );
}
