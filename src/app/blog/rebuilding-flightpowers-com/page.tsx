import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { FloatingCta } from '@/components/FloatingCta';
import { Container, JsonLd, Section } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Rebuilding flightpowers.com',
  description:
    'The old site described the product; the new one shows it. Why 13 indexable URLs across two domains had to go, how the new site runs real searches in its hero, and the honesty rules it commits to.',
  alternates: { canonical: '/blog/rebuilding-flightpowers-com' },
};

export const dynamic = 'force-static';

export default function RebuildingPost() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'Rebuilding flightpowers.com',
          datePublished: '2026-09',
          author: { '@type': 'Person', name: 'Matan Rabi', url: `${SITE.url}/about` },
          url: `${SITE.url}/blog/rebuilding-flightpowers-com`,
          description:
            'Why the old FlightPowers site failed, what the new one does differently, and the honesty rules it commits to.',
        }}
      />
      <FloatingCta />

      <Container className="pt-10 sm:pt-14">
        <Link href="/blog" className="font-mono text-[12px] text-ink-500 hover:text-ink-300 transition-colors">
          ← Blog
        </Link>
      </Container>

      <Container className="pt-6 sm:pt-8 pb-16">
        <article className="prose-fp max-w-3xl">
          <p className="font-mono text-[11px] text-ink-500">September 2026 · Matan Rabi</p>
          <h1 className="mt-3 text-3xl sm:text-[2.75rem] sm:leading-[1.1] font-semibold text-ink-100">
            Rebuilding flightpowers.com
          </h1>

          <p className="mt-6">
            This site is new. The APIs behind it aren&apos;t: they&apos;ve been live on RapidAPI, serving real traffic, while
            their own website did almost nothing for them. This post is the honest version of why I rebuilt it and what the
            new site actually does.
          </p>

          <h2>Why the old site failed</h2>
          <p>
            Two numbers tell most of the story. Across two domains (the consumer site and the developer site) I had{' '}
            <strong>13 indexable URLs</strong>. Companies whose playbooks I studied while planning this rebuild ship hundreds
            to thousands of pages; I was trying to be found with thirteen.
          </p>
          <p>
            The deeper problem was what those pages did: they <em>described</em> the product. Paragraphs about live data,
            about price insights, about round-trip search, and no way to see any of it without leaving for a marketplace
            listing and signing up. For an API, description is the weakest possible pitch. The response shape is the product.
            If a visitor can&apos;t see JSON, they haven&apos;t seen anything.
          </p>

          <h2>What the new site does instead</h2>
          <p>
            <strong>The hero runs real searches.</strong> The demo on the homepage sends actual requests to the live API (the
            same one customers call) behind per-visitor limits and a daily budget cap. When the day&apos;s budget runs out,
            the demo says so and switches to a labelled captured run. It never fakes a spinner into a canned answer.
          </p>
          <p>
            <strong>Every canned example carries its capture date.</strong> Anything pre-recorded on this site (fixture
            responses, example runs, sample outputs) is a real response from a live request, stamped with the date it was
            captured. If a badge says &ldquo;captured run · 2026-08-26&rdquo;, that&apos;s a real API response from that day.
            If there&apos;s no badge, it ran live.
          </p>
          <p>
            <strong>Pricing renders from verified listing data.</strong> The plans, quotas, rate limits, and overage prices on{' '}
            <Link href="/pricing">the pricing page</Link> are parsed from the live RapidAPI listings on a stated date and
            rendered from one config file. There is no number on that page I typed from memory, and a check script fails the
            build if the listings drift from what the site claims.
          </p>
          <p>
            <strong>llms.txt comes from the same config.</strong> The machine-readable summary of the site is generated from
            the same data that renders the pages, so an AI assistant reading it gets the same facts a human gets, and both
            get corrected in the same commit.
          </p>

          <h2>The rules this site commits to</h2>
          <ul>
            <li>
              <strong>No invented metrics.</strong> No uptime percentages, no latency claims, no customer counts, no
              testimonials it doesn&apos;t have. Every number traces to the live listings or to the code.
            </li>
            <li>
              <strong>Labelled captures.</strong> Canned output is always marked as a captured run, with a date. Live output
              is the only unlabelled output.
            </li>
            <li>
              <strong>Scoped claims.</strong> Statements about competitors say what their documentation shows, dated: never
              &ldquo;they can&apos;t.&rdquo; Statements about this API say what the code does. Where something has a known
              limitation, the page says it before you find it.
            </li>
          </ul>
          <p>
            These aren&apos;t virtues I&apos;m claiming; they&apos;re constraints I&apos;m publishing so you can hold the site
            to them. If you catch a page breaking one, <Link href="/contact">tell me</Link> and I&apos;ll fix the page.
          </p>

          <h2>What&apos;s next</h2>
          <p>
            Intentions, not promises: I want to add per-route pages generated from the API&apos;s own data (the one kind of
            programmatic page only a data API can honestly build), and grow the comparison pages as I collect properly dated
            sourcing on more competitors. If those ship, they&apos;ll show up in{' '}
            <Link href="/changelog">the changelog</Link> with a date; if they don&apos;t, this paragraph stays here as a
            record of what I thought would happen.
          </p>
        </article>
      </Container>

      <Section>
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
            {[
              { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The field the whole site is built around' },
              { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'Run a live search right now, free' },
              { href: '/changelog', label: 'Changelog', sub: 'Dated notes on what ships' },
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
          medium="blog"
          title="See the API the way this site shows it"
          body="Live searches, labelled captures, and pricing read from the listings. Judge the data before you spend a request on it."
        />
      </Section>
    </>
  );
}
