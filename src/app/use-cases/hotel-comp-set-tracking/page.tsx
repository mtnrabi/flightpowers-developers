import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';

export const metadata: Metadata = withOg({
  title: 'Hotel Comp-Set Tracking: your competitive set by name, on a schedule',
  description:
    'Track a competitive set of hotels on live Booking.com data: query by the names a revenue manager actually uses, get rate, review score, and room type per property, and let sold-out nights come back as data instead of errors.',
  alternates: { canonical: '/use-cases/hotel-comp-set-tracking' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Do I need to map my comp set to internal property IDs first?',
    a: 'No. /hotel_by_name takes the hotel name a human would type (with an optional area field like “Antalya” to disambiguate) and resolves it for you. If you want stable references for a long-running tracker, call /resolve once per property to get its Booking.com ID, cache it, and hit /hotel directly on every check after that.',
  },
  {
    q: 'What does each check return?',
    a: 'The headline rate for your dates as both a string and a number, plus review_score, review_count, and room_type, and a booking link. Sold out or not found returns the same shape with available: false and nulls, so a scheduled tracker never branches on error formats.',
  },
  {
    q: 'How many requests does daily comp-set tracking cost?',
    a: 'One request per property per stay-date you track. A 5-property set checked daily for one target date is ~150 requests a month, inside the hotels Pro plan ($10/month, 2,000 requests). Tracking several stay dates or adding per-market checks with proxy_country scales the count linearly, which is what the larger tiers are for.',
  },
];

export default function CompSetTrackingPage() {
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
          Your comp set, checked <span className="text-signal-500">every morning</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">Live rates for the properties you price against, queried by name, returned as data.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          Every revenue manager has a competitive set, and most still check it by opening Booking.com in five tabs. The manual
          check doesn&apos;t keep history, doesn&apos;t run on weekends, and doesn&apos;t scale past a handful of properties or
          dates. Automating it usually stalls on plumbing: hotel APIs want internal property IDs before they answer anything,
          and a sold-out competitor (the most interesting data point of all) comes back as an error instead of an answer.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="A tracker that starts from names" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Feature title="By-name lookup, no ID table">
            /hotel_by_name resolves the names your comp set is already written in. One optional area field handles the
            ambiguous ones, and /resolve gives you a cacheable Booking.com ID when you want permanence.
          </Feature>
          <Feature title="The fields a rate report needs">
            Price as a number, review_score, review_count, and room_type per property: enough to see who undercut
            you, with what room, and at what reputation.
          </Feature>
          <Feature title="Sold out is data, not an exception">
            Unavailable comes back as available: false with nulls in the same shape as a priced result. A competitor selling
            out is a row in the report, often the row that matters most.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="The daily comp-set run" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">List the set.</strong> Property names plus the stay dates you price against:
                tonight, the weekend, the event window.
              </>,
              <>
                <strong className="text-ink-100">Resolve once, then track by ID.</strong>{' '}
                <code className="font-mono text-[13px] text-signal-400">/resolve</code> turns each name into its Booking.com ID;
                cache it and hit <code className="font-mono text-[13px] text-signal-400">/hotel</code> directly for room-level
                detail on every later check.
              </>,
              <>
                <strong className="text-ink-100">Normalise the currency.</strong> One{' '}
                <code className="font-mono text-[13px] text-signal-400">currency</code> value across the set makes the morning
                report a sorted column, not a conversion exercise.
              </>,
              <>
                <strong className="text-ink-100">Diff against yesterday.</strong> Store each run and alert on moves: a
                competitor dropping 15% for the weekend is a signal you want the same morning, not at month end.
              </>,
              <>
                <strong className="text-ink-100">Add the market view.</strong>{' '}
                <code className="font-mono text-[13px] text-signal-400">proxy_country</code> shows what each source market is
                quoted for the same set: the comp-set report and the parity report from one pipeline.
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: '/hotels-api/by-name', label: 'Hotel by Name', sub: 'The lookup the tracker is built on' },
            { href: '/hotels-api/bulk', label: 'Competitive Sets', sub: 'Checking a set of properties together' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'One property, several markets, free' },
            { href: '/guides/monitor-hotel-rate-parity', label: 'Rate-parity guide', sub: 'The per-market half of the job' },
            { href: '/use-cases/rate-parity-monitoring', label: 'Rate-parity monitoring', sub: 'Same pipeline, different question' },
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
          api="hotels"
          title="Stop checking your comp set in browser tabs"
          body="Live Booking.com rates for the properties you price against, by name, on a schedule, as data you can keep."
        />
      </Section>
    </>
  );
}
