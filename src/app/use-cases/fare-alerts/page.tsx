import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Fare Alerts: flight price alerts without a price-history database',
  description:
    'Build fare alerts that fire on Google’s own low | typical | high verdict instead of a threshold you guessed. Poll a route on a schedule, branch on one field, and never alert on a failed search.',
  alternates: { canonical: '/use-cases/fare-alerts' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'How do I know a fare is “low” without collecting my own price history?',
    a: 'Every result carries price_insights_low and price_insights_high (Google’s historical price band for that route and date window), plus price_range_in_relation_to_other_periods, Google’s own low | typical | high verdict. Your alert branches on the verdict; Google’s band is the history you didn’t have to collect.',
  },
  {
    q: 'Will my alert misfire when a search fails?',
    a: 'Not if you read the X-Search-Status header. “empty” means Google genuinely has no itineraries, a real answer. “degraded” means the search did not complete and the empty array says nothing about availability: retry instead of alerting. Opt-in strict mode turns a degraded search into an HTTP 503 if you prefer an error.',
  },
  {
    q: 'How many routes can one plan watch?',
    a: 'One check is one request. A Pro plan ($10/month, 2,500 requests) checks 5 routes every morning with most of the quota left over; the 150 requests/minute rate limit means a batch of checks runs as one burst, not a slow loop. Larger watchlists fit Ultra or Mega.',
  },
];

export default function FareAlertsPage() {
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
          Fare alerts that fire on a <span className="text-signal-500">verdict</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">Alert when Google itself says the fare is low, not when it crosses a threshold you guessed.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          A fare alert is only useful if it knows what a good price is, and most alert systems answer that by collecting
          months of their own price history before the first useful notification. That is a database, a backfill job, and a
          statistical model, all to reconstruct something Google Flights already computes per route and date. And once the
          alert runs unattended, a failed scrape that returns an empty list quietly becomes a false &ldquo;no flights&rdquo;
          message to a real user.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="Three capabilities carry the whole job" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Feature title="The verdict field is the trigger">
            price_range_in_relation_to_other_periods returns Google&apos;s own low | typical | high call on every fare, next to
            the price_insights_low/high band it was judged against. Your alert logic is one comparison, not one model.
          </Feature>
          <Feature title="X-Search-Status keeps alerts honest">
            An unattended poller can&apos;t eyeball failures. The header separates a real &ldquo;empty&rdquo; from a
            &ldquo;degraded&rdquo; search that should be retried, so the alert never reports a scrape failure as a fare event.
          </Feature>
          <Feature title="buy_link makes the alert actionable">
            Every result carries a deep link into Google Flights for that exact itinerary. The notification can end with
            &ldquo;book it&rdquo; instead of &ldquo;go search for it again.&rdquo;
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="What an alert pipeline looks like" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Poll on a schedule.</strong> A cron job, an n8n workflow, or an agent checks each
                watched route once or twice a day: one request per route per check.
              </>,
              <>
                <strong className="text-ink-100">Branch on the verdict.</strong> Fire when{' '}
                <code className="font-mono text-[13px] text-signal-400">price_range_in_relation_to_other_periods</code> flips to{' '}
                <code className="font-mono text-[13px] text-signal-400">&quot;low&quot;</code>; stay silent on typical and high.
              </>,
              <>
                <strong className="text-ink-100">Guard with the header.</strong> Skip and retry any response whose{' '}
                <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> is degraded: never turn a failed
                search into a notification.
              </>,
              <>
                <strong className="text-ink-100">Send the band as context.</strong> &ldquo;$412: the usual range is
                $480–$620&rdquo; is a message a user can act on without opening a search page.
              </>,
              <>
                <strong className="text-ink-100">Attach the buy_link.</strong> One tap from the notification to the exact
                itinerary on Google Flights.
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
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The band and verdict fields, documented' },
            { href: '/flights-api/search-status', label: 'Search Status', sub: 'Why “empty” and “degraded” must differ' },
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'Run the exact check your alert would run' },
            { href: '/guides/real-time-google-flights-data', label: 'Real-time data guide', sub: 'How live scanning actually works' },
            { href: '/use-cases/fare-calendars', label: 'Fare calendars', sub: 'Scan a whole month, not one date' },
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
          title="Ship the alert, skip the database"
          body="Google’s price band rides on every result, on every plan, including the free tier you can verify a key with."
        />
      </Section>
    </>
  );
}
