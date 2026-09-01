import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Container, JsonLd, Section } from '@/components/ui';
import { LINKS, SITE } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Blog: build-in-public notes from the developer',
  description:
    'The FlightPowers developer blog: build-in-public notes, teardowns, and changelog stories from the person who runs the APIs. Written when there is something to say, not on a schedule.',
  alternates: { canonical: '/blog' },
});

export const dynamic = 'force-static';

const posts = [
  {
    slug: 'chatgpt-flight-api',
    title: 'ChatGPT flight API: connect live Google Flights data via MCP',
    date: 'September 2026',
    excerpt:
      'How to connect ChatGPT to live Google Flights data through MCP developer-mode connectors: one URL, your RapidAPI key, and Google's price verdict on every result. Pro and Business plans only.',
  },
  {
    slug: 'cheapest-month-to-fly-api',
    title: 'Cheapest month to fly API: scan a whole month in one parallel burst',
    date: 'September 2026',
    excerpt:
      'How to scan a month of flight dates as a price grid using the Google Flights API: one request per date, fired in parallel, with rate limits sized for bursts. Free demo tool and full code included.',
  },
  {
    slug: 'datacrawler-google-flights-alternative',
    title: 'DataCrawler Google Flights API alternative: free tier vs unit price',
    date: 'September 2026',
    excerpt:
      'Honest comparison of DataCrawler and FlightPowers Google Flights APIs on RapidAPI: which has the better free tier, which is cheaper per search at volume, and when to pick each one.',
  },
  {
    slug: 'serpapi-google-flights-alternative',
    title: 'SerpApi Google Flights alternative: specialist vs platform pricing',
    date: 'September 2026',
    excerpt:
      'An honest comparison of SerpApi and FlightPowers for Google Flights data: when to pick the platform, when to pick the specialist, and what each does better.',
  },
  {
    slug: 'rebuilding-flightpowers-com',
    title: 'Rebuilding flightpowers.com',
    date: 'September 2026',
    excerpt:
      'The old site was 13 indexable URLs that described the product instead of showing it. The new one runs real searches in the hero, labels every canned example with its capture date, and renders pricing from the live listings. Here is what changed and the rules the site now holds itself to.',
  },
];

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'FlightPowers developer blog',
          url: `${SITE.url}/blog`,
          author: { '@type': 'Person', name: 'Matan Rabi', url: `${SITE.url}/about` },
          blogPost: posts.map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${SITE.url}/blog/${p.slug}`,
          })),
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-4">
        <p className="eyebrow">Blog</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          Build-in-public <span className="text-signal-500">notes</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          The developer blog: build-in-public notes, teardowns, and changelog stories, written by the person who runs the
          APIs, when there&apos;s something worth writing down.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="max-w-3xl space-y-4">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="block rounded-2xl border rule bg-ink-900/50 p-6 hover:border-ink-500 transition-colors">
              <p className="font-mono text-[11px] text-ink-500">{p.date}</p>
              <h2 className="mt-2 text-xl font-semibold text-ink-100">{p.title}</h2>
              <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">{p.excerpt}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[14px] text-ink-500 leading-relaxed">
          Looking for the older consumer travel posts (flexible-date tricks, scraping war stories)? They moved with the
          consumer product to{' '}
          <a href={`${LINKS.demoProduct}/blog`} rel="noopener" className="text-signal-400 underline underline-offset-4">
            demo.flightpowers.com/blog
          </a>
          , where they belong. This blog is for the API side of the house.
        </p>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
          {[
            { href: '/changelog', label: 'Changelog', sub: 'The terse, dated version of the same story' },
            { href: '/about', label: 'About', sub: 'Who writes this, and the rules the site runs by' },
            { href: '/use-cases', label: 'Use cases', sub: 'What people build on the data' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand medium="blog" />
      </Section>
    </>
  );
}
