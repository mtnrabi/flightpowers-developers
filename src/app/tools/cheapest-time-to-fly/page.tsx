import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheapestTimeTool } from '@/components/tools/CheapestTimeTool';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Cheapest Time to Fly: a year of fares as one chart',
  description:
    'Pick a route and see the cheapest month to fly it: one real Google Flights search per coming month, charted side by side with Google’s own low | typical | high verdict on each fare. Free, no signup; live scans are rate-limited.',
  alternates: { canonical: '/tools/cheapest-time-to-fly' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Is this scanner really free?',
    a: 'Yes: no account, no email. Each live scan fires about 10 real searches against live Google Flights data on our own API key, one per coming month, which is why runs are capped per visitor per day. The page shows a captured scan until you run one.',
  },
  {
    q: 'Why only one date per month?',
    a: 'Cost, plainly: every date is a real search on our key. One mid-month fare per month (the 15th) is enough to see the shape of the year and pick the month to zoom into. A cheap sampled month is a place to look closer, not a guarantee that every day in it is cheap. On your own key you choose the sample: three dates per month, a weekend and a midweek, or every single day.',
  },
  {
    q: 'What does Google’s verdict add to the chart?',
    a: 'Each month’s fare carries price_range_in_relation_to_other_periods, Google’s own low | typical | high call against the route’s history, where Google publishes it. The chart tells you which month is cheapest this year; the verdict tells you whether that fare is actually cheap for the route. A cheapest month whose verdict is still "typical" means the route just does not dip much, and that is worth knowing before you wait three months to book.',
  },
  {
    q: 'Why do some months show "no fares" or "search failed"?',
    a: 'The API reports search outcome in an X-Search-Status header. "empty" is a real answer: Google returned no itineraries for that date. "degraded" means that one search did not complete and would simply be retried. The chart shows the status per month instead of inventing a price.',
  },
  {
    q: 'How is this different from the Cheapest Month to Fly grid?',
    a: 'This tool answers "which month?"; the month grid answers "which day inside that month?". Chain them: scan the year here, then run the month that wins through the month grid, then check the winning day’s live fare in the price checker before booking.',
  },
  {
    q: 'Can my AI assistant run this scan for me?',
    a: 'Yes. The same flight search is exposed on a free MCP server at ' + LINKS.mcpFree.replace('https://', '') + ', with no key and no signup, so you can paste the address into Claude, Cursor or any MCP client and just ask which month is cheapest. It is ad-supported: every result carries one labelled sponsored card, and capacity is shared with everyone using it. Connect it from the free tools page. For an ad-free server on your own key, see the MCP page.',
  },
  {
    q: 'How would I run this scan from my own code?',
    a: `One request per departure date, fired in parallel. The flights API allows ${COUNTS.flightsRateLimits} requests per minute by tier (Pro / Ultra / Mega), so a 12-month scan with several dates per month still finishes in one burst. The code card under the chart is pre-filled with your route.`,
  },
];

export default function CheapestTimePage() {
  const fx = FIXTURES.yearscanLisJfk;
  const captured = {
    months: fx.data,
    capturedAt: fx.captured_at,
    note: 'A REAL year scan: one live search per month, departing the 15th, captured on ' + fx.captured_at + '. A live run re-scans your route at request time.',
    query: { from: 'LIS', to: 'JFK' },
  };

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Cheapest Time to Fly',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/cheapest-time-to-fly`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'The coming months priced as one chart, live from Google Flights',
            'One real mid-month search per month',
            'Google’s low | typical | high verdict on each month’s fare',
            'A booking link on every priced month',
            'Per-month empty-vs-failed search signalling',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool · live demo, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Cheapest <span className="text-signal-500">Time to Fly</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Which month is actually cheapest for your route? One real search per coming month, priced side by side, with
          Google&apos;s own verdict on every fare. The cheap months jump out.
        </p>
      </Container>

      <Container className="pb-16">
        <CheapestTimeTool captured={captured} />
      </Container>

      <Section>
        <SectionHead eyebrow="How it works" title="A year of fares, one chart, one obvious answer" />
        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            ['Pick a route', 'Two airport codes. The scan prices every coming month it can reach, usually 10 of them.'],
            ['We scan live, in parallel', 'One real Google Flights search per month, departing the 15th, on our key at request time. A sample, and the page says so.'],
            ['Read the chart', 'Each bar is that month’s cheapest sampled fare. The cheapest month is called out, and every fare carries Google’s low | typical | high verdict where published.'],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-mono text-[13px] text-signal-500">{i + 1}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{title}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHead eyebrow="Then zoom in" title="Month found. Now find the day, then the fare" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="font-mono text-[13px] text-signal-500">year → month</p>
            <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">This scanner</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              One fare per coming month answers the only question a year view can: where are the cheap pockets?
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="font-mono text-[13px] text-signal-500">month → day</p>
            <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">
              <Link href="/tools/cheapest-month-to-fly" className="underline underline-offset-4 hover:text-signal-400">
                Cheapest Month to Fly
              </Link>
            </p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              Run the winning month through the day-by-day heat grid and the cheap day jumps out the same way.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="font-mono text-[13px] text-signal-500">day → fare</p>
            <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">
              <Link href="/tools/flight-price-checker" className="underline underline-offset-4 hover:text-signal-400">
                Flight Price Checker
              </Link>
            </p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              Check the winning day live: the fare, Google&apos;s price band, and the verdict on whether to book it now.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="Free vs your own key"
            title="What this page does, and what it deliberately does not"
            lede="Honest scope: the free scan is a sample on our key. The full-resolution version is the same one-request-per-date pattern on yours."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Free here: 1 date per month</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                About 10 real searches per scan, roughly one live scan per visitor per day, results cached for a day. Enough to
                see the shape of the year.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Your key: any resolution</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                Weekends vs midweek, three dates per month, or all ~365 days. {COUNTS.flightsRateLimits} req/min by tier means
                even the full-year scan is a burst, not a loop.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">Same data, either way</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                Every fare carries price_insights_low/high and the verdict, plus a bookable buy_link. What you see here is the
                API response, not a mock.
              </p>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15px] font-semibold text-ink-100">Or let your assistant run it</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              The same flight search is on a free MCP server at{' '}
              <code className="font-mono text-[13px] text-ink-200">{LINKS.mcpFree.replace('https://', '')}</code>. No key, no
              signup: paste the address into Claude, Cursor or any MCP client and ask it which month is cheapest for your route.
              It is ad-supported, so every result carries one labelled sponsored card, and capacity is shared with everyone
              using it.{' '}
              <Link href="/tools#free-mcp" className="underline underline-offset-4 hover:text-signal-400">
                Connect it here
              </Link>
              .
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/flights-api/parallel-date-scan" variant="ghost">
              View documentation
            </Cta>
            <Cta href="/tools#free-mcp" variant="ghost">
              Connect the free MCP server
            </Cta>
            <Cta href={rapidApiPricingUrl('flights', 'tool')} external variant="primary">
              See pricing on RapidAPI →
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related tools" title="Keep going" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'Day-by-day heat grid for one month' },
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'Live fare + Google’s verdict' },
            { href: '/tools#free-mcp', label: 'Free MCP Server', sub: 'Ask your assistant instead. No key, ad-supported' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel Date Scan', sub: 'The full every-day scan on your own key' },
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
