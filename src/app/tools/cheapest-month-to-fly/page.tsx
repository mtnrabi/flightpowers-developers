import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheapestMonthTool } from '@/components/tools/CheapestMonthTool';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Cheapest Month to Fly: a whole month of fares as one price grid',
  description:
    'Pick a route and a month and see every sampled departure date priced side by side, live from Google Flights. Free, no signup; live scans are rate-limited and sample ~10 dates; the full every-day scan is what the API is for.',
  alternates: { canonical: '/tools/cheapest-month-to-fly' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Is there a free Google Flights API?',
    a: 'Yes, with limits. The FlightPowers Google Flights API on RapidAPI has a BASIC plan with 10 requests per month at $0, no card required. That is enough to verify your key and see the response shape, not to evaluate or use day-to-day. Google's own QPX Express API was retired in 2018 and is no longer available. The RapidAPI free tier is not affiliated with or endorsed by Google; it is an independent API that reads the public Google Flights site live at request time. Retrieved 2026-09-01: 368 subscribers, 4.2/5 rating on the RapidAPI listing.',
  },
  {
    q: 'Is this scanner really free?',
    a: 'Yes: no account, no email. Each live scan fires ~10 real searches against live Google Flights data on our own API key, which is why it samples the month instead of pricing all 30 days, and why runs are capped per visitor per day. The page shows a captured full-month scan until you run one.',
  },
  {
    q: 'Why does the live scan only sample ~10 dates?',
    a: 'Cost, plainly: every date is a real search on our key. Sampling every ~3 days is enough to see the shape of the month; the full every-day grid is one request per date on your own key. That is what the API is for, and the card under the results shows the exact code.',
  },
  {
    q: 'What do the colors in the grid mean?',
    a: 'They are relative to the scanned month only: green sits near the month’s cheapest day, red near its most expensive. It is a within-month comparison, separate from Google’s own low | typical | high verdict, which each day’s cheapest fare also carries when Google publishes it.',
  },
  {
    q: 'Why do some days show a dash?',
    a: 'Either Google genuinely returned no itineraries for that date (X-Search-Status: empty, a real answer) or that one search didn’t complete (degraded). The tool shows the status per day instead of inventing a price.',
  },
  {
    q: 'How would I scan a whole month from my own code?',
    a: `One request per departure date, fired in parallel. The flights API allows ${COUNTS.flightsRateLimits} requests per minute by tier (Pro / Ultra / Mega), so a 30-date month finishes in a single burst instead of a serial loop. The code card under the grid is pre-filled with your route.`,
  },
  {
    q: 'Can I scan arrival cities or nearby airports too?',
    a: 'This tool scans one origin, one destination, one month. From code you can fan out across airports the same way you fan out across dates. It is the same one-request-per-query pattern, just a bigger burst.',
  },
];

export default function CheapestMonthPage() {
  const fx = FIXTURES.novscanLisJfk;
  const captured = {
    days: fx.data,
    capturedAt: fx.captured_at,
    note: 'A REAL full 30-day scan: one live request per November departure date, captured on ' + fx.captured_at + '. Live demo runs sample ~10 dates; this is what a full scan on your own key looks like.',
    query: { from: 'LIS', to: 'JFK', month: '2026-11' },
  };

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Cheapest Month to Fly',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/tools/cheapest-month-to-fly`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'A month of departure dates priced as a heat grid',
            'Live Google Flights fares, sampled across the month',
            'Per-day empty-vs-failed search signalling',
            'Parallel-scan code pre-filled with your route',
          ],
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-10">
        <p className="eyebrow">Free tool · live demo, rate-limited</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Cheapest <span className="text-signal-500">Month to Fly</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Flexible on dates? Stop checking them one by one. Pick a route and a month and see the sampled dates priced side by
          side. The cheapest day jumps out.
        </p>
      </Container>

      <Container className="pb-16">
        <CheapestMonthTool captured={captured} />
      </Container>

      <Section>
        <SectionHead eyebrow="How it works" title="One month, one grid, one obvious answer" />
        <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            ['Pick a route and a month', 'Airport codes and a month. The scan turns each sampled date into one real search.'],
            ['We scan live, in parallel', 'Around 10 dates spread across the month, each a real Google Flights search on our key at request time. The demo samples; the API does every day.'],
            ['Read the grid', 'Each cell is that day’s cheapest live fare. Green is the month’s low end, red its high end, and the cheapest day is called out under the grid.'],
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
        <SectionHead eyebrow="Who uses it" title="Anyone whose dates are softer than their route" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Flexible travellers</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              “Sometime in November” is a scan, not thirty searches. Find the cheap pocket of the month, then check that day&apos;s
              live fare and verdict before booking.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Deal sites and newsletters</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              A monthly grid per route is a publishable artifact. From code, regenerate it on a schedule and flag the days whose
              verdict flips to low.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/50 p-5">
            <p className="text-[15.5px] font-semibold text-ink-100">Agents and assistants</p>
            <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
              “Cheapest week to fly this winter” decomposes into exactly this: parallel date searches, compare, answer. The rate
              limit is what makes the question answerable in seconds.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10 text-center">
          <h2 className="text-[1.75rem] sm:text-4xl font-semibold">Found the day? Check the live fare</h2>
          <p className="lede mx-auto mt-4 max-w-2xl">
            The grid finds the cheap day; the Flight Price Checker runs that exact date live and shows Google&apos;s price band and
            verdict on the fare.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta href="/tools/flight-price-checker" variant="accent">
              Try it for free
            </Cta>
            <Cta href="/tools" variant="ghost">
              See all free tools
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-signal-600/30 bg-signal-600/[0.04] px-6 py-10 sm:px-10">
          <SectionHead
            eyebrow="Scale it"
            title="Scanning hundreds of routes? That's what the API is for"
            lede="A date scan is a burst, not a loop. Serially at one request a second a month is a coffee break; in parallel it is one rate-limit window."
          />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-[15px] font-semibold text-ink-100">{COUNTS.flightsRateLimits} req/min</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                By tier (Pro / Ultra / Mega) on the flights API. A 30-date month fits inside one minute on every paid plan.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">1 date = 1 request</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                The same one-way search, fanned out across departure dates with your language&apos;s standard parallelism. No special
                endpoint to learn.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink-100">A verdict on every day</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">
                Each fare carries Google&apos;s price band and low | typical | high verdict where published. Cheap for the month
                <em> and</em> cheap for the route are different questions, and a scan answers both.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/flights-api/parallel-date-scan" variant="ghost">
              View documentation
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'Live fare + Google’s verdict' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel Date Scan', sub: 'The full every-day scan on your own key' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'The same room, priced from 3 markets' },
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
          medium="tool"
          title="The full grid, every day, on your own key"
          body="One request per date in one parallel burst, with the price band and verdict judging each fare for you. Free tier on RapidAPI, no card to try."
        />
      </Section>
    </>
  );
}
