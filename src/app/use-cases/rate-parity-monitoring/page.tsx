import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Rate-Parity Monitoring: see your hotel rates the way each market sees them',
  description:
    'Booking.com shows different rates depending on where the visitor browses from. proxy_country routes each request through a residential proxy in the market you choose, so parity checks across countries come from one API, by hotel name, on a schedule.',
  alternates: { canonical: '/use-cases/rate-parity-monitoring' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'How does per-country pricing actually work?',
    a: 'Every hotels endpoint accepts proxy_country, a two-letter code like "us", "de", or "il". The request is routed through a residential proxy in that country, so Booking.com responds exactly as it would to a local visitor. Ask for the same room from three markets and compare what comes back: that is the parity check.',
  },
  {
    q: 'Do I need Booking.com property IDs to monitor my hotels?',
    a: 'No. /hotel_by_name takes the name a human would type and resolves it for you, with an optional area field to disambiguate generic names. If you prefer stable IDs, /resolve turns a name into the Booking.com path ID once, and you cache it.',
  },
  {
    q: 'What happens when a property is sold out?',
    a: 'Sold out or not found returns the same response shape with available: false and null prices, so your monitoring never has to branch on an error format. A sold-out night is a data point in a parity report, not an exception to handle.',
  },
];

export default function RateParityPage() {
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
          Rate parity, checked from <span className="text-signal-500">inside each market</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">The same room, priced as a visitor from the US, Germany, or Israel would see it, from one API.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          Booking.com shows different rates depending on where the visitor is browsing from, which means a hotel&apos;s
          published rate and the rate a given market actually sees can quietly diverge. Checking that by hand means VPNs,
          browser profiles, and screenshots, and it still doesn&apos;t scale past a handful of spot checks. A parity
          programme needs the market-specific view as structured data, on a schedule, for every property that matters.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="The parity check as three parameters" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Feature title="proxy_country is the whole trick">
            A two-letter code routes the request through a residential proxy in that country. Same hotel, same dates,{' '}
            proxy_country varied: the response is what a local guest would be quoted, as JSON you can diff.
          </Feature>
          <Feature title="Query by name, not internal ID">
            /hotel_by_name resolves the hotel name a revenue manager would actually type. No ID-mapping table to build before
            the first check runs; an area field disambiguates the generic names.
          </Feature>
          <Feature title="One shape, even when sold out">
            Unavailable properties come back as available: false with nulls, the same shape as a priced result. Scheduled
            jobs keep running instead of crashing on the exceptional case.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="A parity programme, end to end" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Define the watchlist.</strong> Properties by name, the markets that matter
                (say <code className="font-mono text-[13px] text-signal-400">us</code>,{' '}
                <code className="font-mono text-[13px] text-signal-400">de</code>,{' '}
                <code className="font-mono text-[13px] text-signal-400">il</code>), and the stay dates you track.
              </>,
              <>
                <strong className="text-ink-100">Loop the markets.</strong> One{' '}
                <code className="font-mono text-[13px] text-signal-400">/hotel_by_name</code> call per country per property:
                three markets is three requests.
              </>,
              <>
                <strong className="text-ink-100">Normalise the currency.</strong> Set{' '}
                <code className="font-mono text-[13px] text-signal-400">currency</code> once so every market answers in the same
                unit and the comparison is a subtraction.
              </>,
              <>
                <strong className="text-ink-100">Flag the deltas.</strong> Alert when the spread between markets crosses your
                threshold: that spread is the parity violation, timestamped.
              </>,
              <>
                <strong className="text-ink-100">Go room-level when it matters.</strong> <code className="font-mono text-[13px] text-signal-400">/hotel</code>{' '}
                returns every room with its type, meal plan, and price, for the cases where the headline rate isn&apos;t the
                one that&apos;s off.
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
            { href: '/hotels-api/geo-pricing', label: 'Geo-Pricing API', sub: 'proxy_country, documented end to end' },
            { href: '/hotels-api/by-name', label: 'Hotel by Name', sub: 'Name in, availability and price out' },
            { href: '/tools/hotel-price-by-country', label: 'Hotel Price by Country', sub: 'Run a parity check free, right now' },
            { href: '/guides/monitor-hotel-rate-parity', label: 'Rate-parity guide', sub: 'The full monitoring recipe' },
            { href: '/use-cases/hotel-comp-set-tracking', label: 'Comp-set tracking', sub: 'The competitor side of the same job' },
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
          title="See what each market is really being quoted"
          body="Live Booking.com rates through a residential proxy in the country you choose, by hotel name, on your schedule."
        />
      </Section>
    </>
  );
}
