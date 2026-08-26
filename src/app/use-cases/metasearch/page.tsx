import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Metasearch — live fares with a booking link on every result',
  description:
    'Build flight metasearch and comparison features on live Google Flights data: every itinerary ships with a working buy_link, filters that match the Google Flights UI, and an X-Search-Status header so an empty result page is never a silent failure.',
  alternates: { canonical: '/use-cases/metasearch' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'How do users book a flight my site found?',
    a: 'Every result carries buy_link — a deep link straight into Google Flights for that exact itinerary. You never reconstruct a booking URL or maintain airline-site integrations; the handoff is a link click, and the fare the user lands on is the fare you showed.',
  },
  {
    q: 'Are the prices cached or live?',
    a: 'Live. Every query is scanned against Google Flights at request time — nothing is served from a cache on the API side — so the price you display is the price the traveller will see on click-through. The trade-off is honest: response time tracks route complexity, because a real scan is happening.',
  },
  {
    q: 'Can I offer the same filters Google Flights has?',
    a: 'The main ones, yes: max stops, airline include/exclude lists, departure and arrival time-of-day windows, cabin class, passenger mix, max price, and currency — on round-trips, controllable per leg. Your filter UI maps to request parameters instead of post-filtering a too-small result set.',
  },
];

export default function MetasearchPage() {
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
          Metasearch with a <span className="text-signal-500">bookable</span> result on every row
        </h1>
        <p className="lede mt-5 max-w-2xl">Live fares in, ranked results out — and a working Google Flights link on each one.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          A comparison site lives or dies on two things: whether the price shown matches the price on click-through, and
          whether the result actually leads somewhere bookable. Stale caches break the first; scraped results with no booking
          path break the second. And when a route genuinely has nothing, most data sources hand you the same empty array they
          produce when their scrape failed — so your &ldquo;no results&rdquo; page can&apos;t be trusted either.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="The three properties a results page needs" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Feature title="buy_link closes the loop">
            Every itinerary ships with a deep link into Google Flights for that exact flight combination. Click-through lands
            on the fare you displayed — no URL reconstruction, no affiliate-feed drift.
          </Feature>
          <Feature title="Filters match the search UI">
            Stops, airline include/exclude, time-of-day windows per leg, cabin, passenger mix, max price, currency. Your
            filter panel translates to request parameters, so filtered searches return full result sets.
          </Feature>
          <Feature title="X-Search-Status backs the empty page">
            &ldquo;No flights found&rdquo; renders only when the header says empty. A degraded search shows a retry state
            instead — your results page never presents a failure as an answer.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="The request-to-results pipeline" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Translate the search form.</strong> Route, dates, and every user-facing filter
                map onto the one-way or round-trip request body directly.
              </>,
              <>
                <strong className="text-ink-100">Sort locally on price_as_number.</strong> Google&apos;s own ordering is not a
                strict price sort — the listing says so — so exact price order is one local sort on the numeric field.
              </>,
              <>
                <strong className="text-ink-100">Show the verdict as a badge.</strong> Google&apos;s low | typical | high call
                per fare gives your ranking a value signal competitors&apos; bare price lists don&apos;t carry.
              </>,
              <>
                <strong className="text-ink-100">Render round-trips as itineraries.</strong> The round-trip endpoint returns
                paired legs with a combined total — one result card per itinerary, no leg-matching logic.
              </>,
              <>
                <strong className="text-ink-100">Hand off through buy_link.</strong> The book button is the link the API
                already gave you.
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
            { href: '/flights-api/one-way', label: 'One-Way API', sub: 'The base search, field by field' },
            { href: '/flights-api/round-trip', label: 'Round-Trip API', sub: 'Paired itineraries with one total price' },
            { href: '/tools/google-flights-url-parser', label: 'URL Parser', sub: 'Turn a Google Flights URL into the API call' },
            { href: '/guides/google-flights-url-parameters', label: 'URL parameters guide', sub: 'How Google encodes a search' },
            { href: '/use-cases/market-analysis', label: 'Market analysis', sub: 'The same data as a time series' },
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
          title="Show a price a click-through will confirm"
          body="Live scans at request time, a booking link on every row, and a verdict badge your competitors’ lists don’t have."
        />
      </Section>
    </>
  );
}
