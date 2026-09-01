import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { FloatingCta } from '@/components/FloatingCta';
import { Code, Container, Cta, JsonLd, Section } from '@/components/ui';
import { SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'SerpApi Google Flights alternative: specialist vs platform pricing',
  description:
    'An honest comparison of SerpApi and FlightPowers for Google Flights data: when to pick the platform, when to pick the specialist, and what each does better. Includes cost-per-search math on published list prices.',
  alternates: { canonical: '/blog/serpapi-google-flights-alternative' },
});

export const dynamic = 'force-static';

export default function SerpApiAlternativePost() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: 'SerpApi Google Flights alternative: specialist vs platform pricing',
          datePublished: '2026-09-01',
          dateModified: '2026-09-01',
          author: { '@type': 'Person', name: 'Matan Rabi', url: `${SITE.url}/about` },
          publisher: { '@id': `${SITE.url}/#organization` },
          image: `${SITE.url}/og?title=${encodeURIComponent('SerpApi Google Flights alternative')}`,
          url: `${SITE.url}/blog/serpapi-google-flights-alternative`,
          description:
            'When to choose SerpApi for Google Flights data, when to choose a specialist API, and the cost-per-search math that matters.',
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
            SerpApi Google Flights alternative: specialist vs platform pricing
          </h1>

          <p className="mt-6">
            SerpApi is the first answer when someone asks "how do I get Google Flights data." It is a well-documented,
            reliable product with broad coverage across Google&apos;s surfaces. But for teams where flights are the product,
            not one feature among many, the math changes.
          </p>

          <h2>The platform: SerpApi</h2>
          <p>
            SerpApi covers dozens of Google engines: Search, Maps, Shopping, Hotels, Scholar, and more, all on one subscription
            and one shared credit pool. If you need multiple surfaces, that consolidation is genuinely valuable. One vendor, one
            bill, one integration to maintain.
          </p>
          <p>
            For Google Flights specifically, their pricing on the Developer plan (as of their site, retrieved 2026-08-24) is
            $75/month for 5,000 searches, which works out to $0.015 per search. Round-trips are a two-request flow via{' '}
            <code className="font-mono text-[13px]">departure_token</code>, so a round-trip search costs two credits.
          </p>

          <h2>The specialist alternative</h2>
          <p>
            FlightPowers does flights and hotels only. No Google Search, no Maps, no other surfaces. That narrowness is the
            trade: you pay specialist prices for specialist data, but you cannot consolidate other Google surfaces onto the same
            key.
          </p>
          <p>
            The cost-per-search comparison on published list prices:{' '}
            <strong className="text-ink-100">$0.0025 per search</strong> on the $25 ULTRA plan (10,000 requests), against
            SerpApi&apos;s $0.015 on Developer. Round-trips are a single <code className="font-mono text-[13px]">POST /roundtrip</code>{' '}
            request that returns paired legs and a combined total, so a round-trip costs one request instead of two.
          </p>

          <h2>When to choose SerpApi</h2>
          <ul>
            <li>
              <strong>You need more than flights.</strong> If your product also uses Google Search, Maps, Shopping, or other
              engines, paying for one platform instead of multiple specialist APIs is the right economic decision.
            </li>
            <li>
              <strong>You want price history charted for you.</strong> SerpApi&apos;s <code className="font-mono text-[13px]">price_insights</code>{' '}
              includes a <code className="font-mono text-[13px]">price_history</code> array of [timestamp, price] pairs. If you
              need that time series without building it yourself, they hand it to you.
            </li>
            <li>
              <strong>Multi-city itineraries matter.</strong> SerpApi documents multi-city search. FlightPowers supports one-way
              and round-trip only.
            </li>
            <li>
              <strong>Your legal team values the indemnity clause.</strong> SerpApi advertises a U.S. Legal Shield with $2
              million in coverage for scraping-related exposure. For some companies that clause ends the evaluation on its own.
            </li>
          </ul>

          <h2>When to choose a specialist</h2>
          <ul>
            <li>
              <strong>Flights are the product and unit economics matter.</strong> If you are running thousands of flight
              searches per month and no other Google surfaces, specialist pricing is 6× cheaper per search on comparable tiers.
            </li>
            <li>
              <strong>Round-trips are a large share of your searches.</strong> One request for a paired result versus two
              requests with state to carry in between: the cost difference compounds with volume.
            </li>
            <li>
              <strong>You scan date ranges in bursts.</strong> Per-minute rate limits (150 to 500 requests/min by tier) are
              sized for parallel date scans: a 30-date month in one burst, not a serial loop.
            </li>
            <li>
              <strong>You are wiring data into an AI agent.</strong> First-party MCP servers for flights and hotels: point an
              MCP host at the server URL with your RapidAPI key and search becomes a native tool.
            </li>
          </ul>

          <h2>Cost comparison example</h2>
          <p>
            Suppose your product runs 8,000 flight searches per month, split evenly between one-way and round-trip. On SerpApi
            Developer: 4,000 one-way (4,000 credits) + 4,000 round-trip (8,000 credits, two per trip) ={' '}
            <strong className="text-ink-100">12,000 credits required</strong>. Their Developer plan includes 5,000, so you are
            into overage or the next tier up.
          </p>
          <p>
            On FlightPowers ULTRA ($25/month, 10,000 requests): 4,000 one-way + 4,000 round-trip ={' '}
            <strong className="text-ink-100">8,000 requests</strong>, comfortably inside the plan. Total cost: $25. The unit
            price advantage is real.
          </p>

          <h2>Honest caveats</h2>
          <p>Two points in SerpApi&apos;s favour, worth stating plainly:</p>
          <ul>
            <li>
              <strong>Their credits are fungible.</strong> A cost-per-search comparison understates what a SerpApi credit buys,
              because it works across all their engines. If you use those other engines, the comparison is incomplete.
            </li>
            <li>
              <strong>They only count successful searches.</strong> From their FAQ: "Only successful searches are counted toward
              your monthly searches. Cached, errored, and failed searches are not." That is a customer-friendly billing policy.
            </li>
          </ul>

          <h2>The full breakdown</h2>
          <p>
            The comparison page goes deeper: feature-by-feature tables, round-trip mechanics, throughput guarantees versus rate
            limits, and more. If you are evaluating both, start there.
          </p>
          <div className="mt-6">
            <Cta href="/compare/serpapi" variant="ghost">
              Read the full comparison →
            </Cta>
          </div>

          <h2>Try it</h2>
          <p>
            The free tier on RapidAPI is 10 requests/month with no card required: enough to verify the key and see a response.
            For evaluation, the $10 PRO plan (2,500 requests) is the realistic floor.
          </p>
          <Code label="curl · round-trip in one request">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "JFK",
    "to_airport": "LHR",
    "departure_date": "2026-10-15",
    "return_date": "2026-10-22"
  }'`}</Code>
        </article>
      </Container>

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
          {[
            { href: '/compare/serpapi', label: 'Full SerpApi comparison', sub: 'Feature tables, sourced figures, FAQ' },
            { href: '/flights-api', label: 'Flights API', sub: 'Endpoints, filters, response shape' },
            { href: '/tools/flight-price-checker', label: 'Free flight checker', sub: 'Try the API, no signup' },
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
          title="Specialist prices for flight data"
          body="Live Google Flights data with paired round-trips, price insights on every result, and unit economics built for volume."
        />
      </Section>
    </>
  );
}
