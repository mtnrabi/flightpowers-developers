import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Cta, JsonLd, Section } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free travel-data tools',
  description:
    'Four free tools on the same live API we sell: decode Google Flights URLs, check a fare against Google’s price band, scan a month for the cheapest day, and price one hotel from several countries. No signup.',
  alternates: { canonical: '/tools' },
};

export const dynamic = 'force-static';

const TOOLS: {
  href: string;
  name: string;
  tier: string;
  body: string;
  output: string;
}[] = [
  {
    href: '/tools/google-flights-url-parser',
    name: 'Google Flights URL Parser & Builder',
    tier: 'ungated, 100% client-side',
    body: 'Paste a Google Flights URL and decode its tfs= parameter into a readable tree: route, dates, and the equivalent API request. Or build a shareable search link from a route. Runs entirely in your browser.',
    output: 'decoded tree → API request',
  },
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
            'Free flight and hotel data tools running on the FlightPowers APIs: URL parsing, live price checks, month scans, and per-country hotel pricing.',
          hasPart: TOOLS.map((t) => ({
            '@type': 'WebApplication',
            name: t.name,
            url: `${SITE.url}${t.href}`,
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
          Real results before we ask you for anything: every tool runs on the same live API we sell.
        </p>
      </Container>

      <Container className="pb-16 pt-6">
        <div className="grid gap-5 md:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-500 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[17px] font-semibold text-ink-100">{t.name}</h2>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-signal-400">{t.tier}</p>
              <p className="mt-3 text-[14.5px] text-ink-400 leading-relaxed">{t.body}</p>
              <p className="mt-4 flex items-center justify-between border-t rule pt-3 font-mono text-[11.5px] text-ink-500">
                <span>{t.output}</span>
                <span className="text-signal-400 group-hover:text-signal-500">open →</span>
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-6 font-mono text-[12px] text-ink-500">
          The URL parser runs entirely in your browser, no cap. The three live tools run real searches on our key, so they&apos;re
          capped per visitor per day; the pages say exactly how.
        </p>
      </Container>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10 text-center">
          <p className="eyebrow">Need more power?</p>
          <h2 className="mt-3 text-[1.75rem] sm:text-4xl font-semibold">These tools are the API, on our key</h2>
          <p className="lede mx-auto mt-4 max-w-2xl">
            Same endpoints, same fields, demo-sized caps. Your own key removes the caps: full month scans, any market, hundreds of
            routes in parallel.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta href="/pricing" variant="primary">
              See pricing
            </Cta>
            <Cta href="/flights-api" variant="ghost">
              Explore the flights API
            </Cta>
          </div>
        </div>
      </Section>
    </>
  );
}
