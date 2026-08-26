import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, JsonLd, Section, SectionHead } from '@/components/ui';
import { LINKS, SITE } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Contact: message the developer directly',
  description:
    'No support team, no ticket queue. Messages on the RapidAPI listings and issues on the GitHub skills repo land directly with the developer who runs FlightPowers, and get answered.',
  alternates: { canonical: '/contact' },
});

export const dynamic = 'force-static';

const channels: { label: string; sub: string; href: string; note: string }[] = [
  {
    label: 'Flights API: listing discussions',
    sub: 'rapidapi.com · google-flights-live-api',
    href: `${LINKS.rapidapiFlights}/discussions`,
    note: 'Questions, feature requests, and bug reports about the Google Flights Live API. Subscription and billing questions belong here too: billing runs on RapidAPI.',
  },
  {
    label: 'Hotels API: listing discussions',
    sub: 'rapidapi.com · booking-live-api',
    href: `${LINKS.rapidapiHotels}/discussions`,
    note: 'Everything about the Booking Live API: search, by-name lookups, proxy_country behaviour, filters.',
  },
  {
    label: 'GitHub issues: travel-agent-skills',
    sub: 'github.com/mtnrabi/travel-agent-skills',
    href: `${LINKS.skills}/issues`,
    note: 'For the open-source skills and anything MCP-related: setup problems, tool-call quirks, ideas for new skills.',
  },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact FlightPowers',
          url: `${SITE.url}/contact`,
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-4">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          Message the person who <span className="text-signal-500">runs the API</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          FlightPowers is run by one developer, so there&apos;s no routing to get through. Pick the channel that matches what
          you&apos;re writing about. Each one is an inbox I actually read, and the listings&apos; sign-off is a promise:
          &ldquo;Message me. I keep improving this API and I answer.&rdquo;
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {channels.map((c) => (
            <a key={c.label} href={c.href} rel="noopener" className="rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-500 transition-colors">
              <p className="text-[15.5px] font-semibold text-ink-100">{c.label}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-500">{c.sub}</p>
              <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">{c.note}</p>
            </a>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-8 sm:px-10 max-w-3xl">
          <h2 className="text-xl font-semibold">Found a data problem? Make it a one-reply fix</h2>
          <p className="mt-3 text-[15px] text-ink-300 leading-relaxed">
            Include three things: the <strong className="text-ink-100">route</strong>, the{' '}
            <strong className="text-ink-100">date</strong>, and the{' '}
            <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> value from the response. That header
            exists to make bug reports precise: it already says whether your search came back{' '}
            <span className="font-mono text-[13px]">ok</span>, <span className="font-mono text-[13px]">empty</span>,{' '}
            <span className="font-mono text-[13px]">partial</span>, or <span className="font-mono text-[13px]">degraded</span>,
            which is usually most of the diagnosis.
          </p>
          <p className="mt-3 text-[14px] text-ink-400">
            Not sure what the header means?{' '}
            <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">
              The search-status page explains every value
            </Link>
            .
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="While you're here" title="Nearby pages" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: '/about', label: 'About', sub: 'Who builds this, and the rules the site runs by' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans, quotas, and the key checker' },
            { href: '/changelog', label: 'Changelog', sub: 'Dated notes on what changed' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
