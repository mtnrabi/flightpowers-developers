import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { FloatingCta } from '@/components/FloatingCta';
import { Code, Container, Cta, JsonLd, Section } from '@/components/ui';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Cheapest month to fly API: scan a whole month in one parallel burst',
  description:
    'How to scan a month of flight dates as a price grid using the Google Flights API: one request per date, fired in parallel, with rate limits sized for bursts. Free demo tool and full code included.',
  alternates: { canonical: '/blog/cheapest-month-to-fly-api' },
});

export const dynamic = 'force-static';

export default function CheapestMonthApiPost() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: 'Cheapest month to fly API: scan a whole month in one parallel burst',
          datePublished: '2026-09-01',
          dateModified: '2026-09-01',
          author: { '@type': 'Person', name: 'Matan Rabi', url: `${SITE.url}/about` },
          publisher: { '@id': `${SITE.url}/#organization` },
          image: `${SITE.url}/og?title=${encodeURIComponent('Cheapest month to fly API')}`,
          url: `${SITE.url}/blog/cheapest-month-to-fly-api`,
          description:
            'How to scan a month of flight dates in parallel with the Google Flights API and turn it into a price grid.',
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
            Cheapest month to fly API: scan a whole month in one parallel burst
          </h1>

          <p className="mt-6">
            Flexible travellers want to see a month of fares at once: every departure date priced side by side, with the cheapest
            day highlighted. Serial loops at one request per second turn that into a coffee break. Parallel bursts at 150 to 500
            requests per minute turn it into one rate-limit window.
          </p>

          <h2>The pattern: one date, one request</h2>
          <p>
            There is no special "scan a month" endpoint. You fire one one-way search per departure date, in parallel, using your
            language&apos;s standard concurrency primitives. Each request is identical except for{' '}
            <code className="font-mono text-[13px]">departure_date</code>. The rate limits are what make the pattern viable.
          </p>
          <Code label="POST /v1/flights/oneway per date">{`// Pick your month
const dates = [
  "2026-11-01", "2026-11-02", "2026-11-03", 
  // ... all 30 days
];

// Fire all requests in parallel
const results = await Promise.all(
  dates.map(date => 
    fetch("https://api.flightpowers.com/v1/flights/oneway", {
      method: "POST",
      headers: {
        "x-api-key": process.env.FLIGHTPOWERS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from_airport: "LIS",
        to_airport: "JFK",
        departure_date: date,
        limit: 5
      })
    }).then(r => r.json())
  )
);

// Extract cheapest per day
const grid = results.map((res, i) => ({
  date: dates[i],
  price: res[0]?.price_as_number || null,
  verdict: res[0]?.price_insights_verdict || null
}));`}</Code>

          <h2>Rate limits sized for bursts</h2>
          <p>
            The flights API publishes per-minute rate limits: <strong className="text-ink-100">{COUNTS.flightsRateLimits} requests
            per minute</strong> by tier (Pro / Ultra / Mega). A 30-date month fits inside one minute on every paid plan. A 31-date
            month plus a few retries fits inside two minutes on the lowest tier.
          </p>
          <p>
            This is the opposite of a serial loop at 1 req/sec. A 30-date scan serially is 30 seconds of wall time minimum;
            in parallel it is one burst.
          </p>

          <h2>The free demo tool</h2>
          <p>
            The site has a live demo that scans ~10 sampled dates across a month and renders them as a heat grid. Green cells
            sit near the month&apos;s cheapest day, red cells near its most expensive. The grid is relative to the scanned month
            only, separate from Google&apos;s own low | typical | high verdict.
          </p>
          <p>
            The demo samples instead of scanning every day because cost: each date is a real search on our own key. The full
            every-day grid is what the API is for. Try the demo first to see the shape of the data.
          </p>
          <div className="mt-6">
            <Cta href="/tools/cheapest-month-to-fly" variant="ghost">
              Try the free demo →
            </Cta>
          </div>

          <h2>Why per-minute matters</h2>
          <p>
            Hourly guarantees like "1,000 requests per hour" are the wrong shape for a date-scan workload. You want the answer
            in seconds, not distributed across an hour. A per-minute ceiling in the hundreds means the moment a user asks "what
            is the cheapest week this winter," you scan the dates and answer, not queue them.
          </p>
          <p>
            The trade is that a per-minute limit is a limit, not a guarantee. If you need a contract-backed throughput number
            for enterprise planning, read the listing terms. For bursty workloads, the per-minute rate is the useful number.
          </p>

          <h2>What the response includes</h2>
          <p>Each date&apos;s search returns flat JSON per itinerary:</p>
          <ul>
            <li>
              <code className="font-mono text-[13px]">price</code> (display string) and{' '}
              <code className="font-mono text-[13px]">price_as_number</code> (sortable, comparable)
            </li>
            <li>
              <code className="font-mono text-[13px]">price_insights_low / price_insights_high</code>: Google&apos;s historical
              band for the route
            </li>
            <li>
              <code className="font-mono text-[13px]">price_insights_verdict</code>: low | typical | high, the alerting trigger
            </li>
            <li>
              <code className="font-mono text-[13px]">airline</code>, <code className="font-mono text-[13px]">duration</code>,{' '}
              <code className="font-mono text-[13px]">stops</code>, local times, and a{' '}
              <code className="font-mono text-[13px]">buy_link</code> to reopen the exact itinerary on Google Flights
            </li>
          </ul>
          <p>
            You sort by <code className="font-mono text-[13px]">price_as_number</code> to find the cheapest day. You filter by{' '}
            <code className="font-mono text-[13px]">price_insights_verdict: &quot;low&quot;</code> to find the days Google
            calls cheap for the route, not just cheap for the month.
          </p>

          <h2>Empty results versus failed searches</h2>
          <p>
            Every response carries an <code className="font-mono text-[13px]">X-Search-Status</code> header: ok | empty |
            partial | degraded. An empty array with <code className="font-mono text-[13px]">X-Search-Status: empty</code> means
            Google genuinely has no itineraries for that date. An empty array with{' '}
            <code className="font-mono text-[13px]">X-Search-Status: degraded</code> means the search did not complete and the
            empty array says nothing about availability.
          </p>
          <p>
            When scanning a month, you render the status per day: show the price when the search succeeded, show a dash or "no
            flights" when it came back empty, and show "search failed" when it degraded. The free tool does this.
          </p>

          <h2>Extending the pattern</h2>
          <p>The same burst pattern scales to more dimensions:</p>
          <ul>
            <li>
              <strong>Multiple routes:</strong> 3 destinations × 30 dates = 90 requests. Still fits inside one minute on ULTRA
              or MEGA.
            </li>
            <li>
              <strong>Duration flexibility:</strong> 3-night, 4-night, 5-night stays = 3 return dates per departure. 30 departure
              dates × 3 durations = 90 round-trip requests.
            </li>
            <li>
              <strong>Nearby airports:</strong> 2 origins × 2 destinations × 30 dates = 120 requests. The rate limit is the
              constraint; the pattern is the same.
            </li>
          </ul>

          <h2>Who uses this</h2>
          <ul>
            <li>
              <strong>Deal sites and newsletters:</strong> Regenerate monthly grids on a schedule, flag the days whose verdict
              flips to low, publish.
            </li>
            <li>
              <strong>AI travel agents:</strong> "Cheapest week to fly this winter" decomposes into exactly this: parallel date
              searches, compare, answer.
            </li>
            <li>
              <strong>Flexible travellers:</strong> "Sometime in November" is a scan, not thirty manual searches. Find the cheap
              pocket, then check that day&apos;s live fare before booking.
            </li>
          </ul>

          <h2>Try it</h2>
          <p>
            The free demo on the site scans ~10 sampled dates live. For the full every-day scan, the $10 PRO plan (2,500
            requests/month, 150 req/min) is the entry point. A 30-date month costs 30 requests.
          </p>
          <div className="mt-6">
            <Cta href={rapidApiPricingUrl('flights', 'blog')} external variant="primary">
              Get a key on RapidAPI →
            </Cta>
          </div>
        </article>
      </Container>

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
          {[
            { href: '/tools/cheapest-month-to-fly', label: 'Free demo tool', sub: 'Live sampled scan, no signup' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel scan docs', sub: 'Full technical walkthrough' },
            { href: '/flights-api', label: 'Flights API', sub: 'Endpoints, filters, response shape' },
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
          title="The full grid, every day, on your own key"
          body="One request per date in one parallel burst, with the price band and verdict judging each fare. Free tier on RapidAPI, no card to try."
        />
      </Section>
    </>
  );
}
