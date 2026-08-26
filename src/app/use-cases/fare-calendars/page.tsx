import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';
import { COUNTS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Fare Calendars — price a whole month of dates in one burst',
  description:
    'Fare calendars and heatmaps need one search per date. Rate limits of 150–500 requests/minute make a 31-day scan a single parallel burst, price_as_number makes every cell sortable, and X-Search-Status keeps failed cells from rendering as “no flights.”',
  alternates: { canonical: '/use-cases/fare-calendars' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'How many requests does a fare calendar cost?',
    a: 'One search per date cell. A 31-day month for one route is 31 requests; “3 to 5 nights, two destinations, anywhere in May” is 31 dates × 3 durations × 2 destinations = 186 requests. The listing’s own guidance is to fire them in parallel batches and merge — that is what the per-minute rate limits are sized for.',
  },
  {
    q: 'Won’t a scan that big take minutes?',
    a: 'Serially, yes — which is why the plans carry 150 (Pro), 250 (Ultra), and 500 (Mega) requests per minute. A month scan completes as one burst of parallel requests rather than a slow loop. Each individual search is still a live scan, so per-request latency tracks route complexity.',
  },
  {
    q: 'What should an empty calendar cell mean?',
    a: 'Exactly what the X-Search-Status header says. “empty” means Google genuinely has no itineraries for that date — a real cell value. “degraded” means that request did not complete, and the honest render is “retry” rather than a blank that looks like no availability.',
  },
];

export default function FareCalendarsPage() {
  return (
    <>
      <Container className="pt-10 sm:pt-14">
        <Link href="/use-cases" className="font-mono text-[12px] text-ink-500 hover:text-ink-300 transition-colors">
          ← All use cases
        </Link>
      </Container>

      <Container className="pt-6 sm:pt-8 pb-4">
        <p className="eyebrow">Use case</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          A month of fares in <span className="text-signal-500">one burst</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">Fare calendars, flexible-date search, and price heatmaps — built from parallel per-date scans.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          &ldquo;When is it cheapest to fly?&rdquo; is the highest-volume question in travel, and answering it takes one
          search per candidate date — thirty-plus live queries for a single route-month. Run serially, that is minutes of
          wall-clock time per calendar, which is unusable in an interactive product. And every cell in the grid inherits the
          scraping problem: a date whose search silently failed looks identical to a date with no flights, and your calendar
          quietly lies.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="Built for the grid, not the single query" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Feature title="Rate limits sized for scans">
            {COUNTS.flightsRateLimits} requests/minute on Pro / Ultra / Mega. A 31-date month fires as one parallel batch and
            the grid fills in seconds of wall-clock, not minutes of loop.
          </Feature>
          <Feature title="A number, not a string, per cell">
            Every result carries price_as_number alongside the display price — cells sort, min(), and colour-scale without
            parsing currency strings.
          </Feature>
          <Feature title="X-Search-Status per cell">
            Each date&apos;s search reports its own outcome. Render &ldquo;empty&rdquo; as a real no-flights cell, retry
            &ldquo;degraded&rdquo; cells, and mark &ldquo;partial&rdquo; ones — the calendar stays honest at the cell level.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="From route to rendered calendar" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Enumerate the dates.</strong> One request body per candidate departure date —
                same route, same filters, only <code className="font-mono text-[13px] text-signal-400">departure_date</code>{' '}
                varies.
              </>,
              <>
                <strong className="text-ink-100">Fire in parallel batches.</strong> Batch to your plan&apos;s per-minute limit
                and merge as responses land; the listing&apos;s own example prices a 186-request flexible search this way.
              </>,
              <>
                <strong className="text-ink-100">Keep the cheapest per cell.</strong> min on{' '}
                <code className="font-mono text-[13px] text-signal-400">price_as_number</code>, with{' '}
                <code className="font-mono text-[13px] text-signal-400">limit</code> kept small since only the top results
                matter per date.
              </>,
              <>
                <strong className="text-ink-100">Colour by the verdict.</strong> Google&apos;s low | typical | high verdict per
                fare gives the heatmap a meaning beyond &ldquo;cheaper than the cell next to it.&rdquo;
              </>,
              <>
                <strong className="text-ink-100">Re-scan on a schedule.</strong> Refresh the grid daily and you have a
                cheapest-month product; diff it over time and you have fare-trend data.
              </>,
            ]}
          />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related resources" title="Keep going" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: '/flights-api/parallel-date-scan', label: 'Parallel Date Scans', sub: 'The rate limits and the batch pattern' },
            { href: '/flights-api/one-way', label: 'One-Way API', sub: 'The endpoint each cell calls' },
            { href: '/tools/cheapest-month-to-fly', label: 'Cheapest Month to Fly', sub: 'This exact use case, running free' },
            { href: '/guides/handle-empty-flight-search-results', label: 'Empty-results guide', sub: 'Keeping failed cells honest' },
            { href: '/use-cases/fare-alerts', label: 'Fare alerts', sub: 'Watch the cheapest cell over time' },
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
          medium="use-case"
          api="flights"
          title="Build the calendar users actually want"
          body="Live per-date fares, a sortable number per cell, and rate limits that let a month finish in one burst."
        />
      </Section>
    </>
  );
}
