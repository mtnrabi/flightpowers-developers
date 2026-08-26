import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import {
  Breadcrumbs,
  Container,
  Cta,
  FaqSection,
  Feature,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { APIFY } from '@/lib/pricing';
import { COUNTS, LINKS, SITE } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'Apify actors: the same data, pay-per-event',
  description:
    'Both FlightPowers APIs run as Apify actors: Google Flights fares and Booking.com hotel rates with no monthly fee: you pay per event, metered by Apify. The fit for batch jobs with zero baseline volume.',
  alternates: { canonical: '/integrations/apify' },
});

const faq: Faq[] = [
  {
    q: 'How does pay-per-event billing work?',
    a: 'Apify meters named events per run (a search performed, a result returned) and bills your Apify account for what actually happened. There is no monthly subscription for the actor itself; a month with no runs costs nothing.',
  },
  {
    q: 'What does the hotels actor cost in practice?',
    a: `By its own event table (${APIFY.hotelsSearchEvent} plus ${APIFY.hotelsResultEvent} and ${APIFY.hotelsStartEvent}), a search returning 25 properties costs about $0.004, roughly ${APIFY.hotelsPer1kSearches}. The unit is the search, not the result row; a listing badge that divides by result rows will look misleadingly cheap.`,
  },
  {
    q: 'What does the flights actor cost?',
    a: 'Its per-event rates are on the listing. Check the pricing table there before a large run. We don’t restate a number here that we haven’t verified against the actor’s own event table.',
  },
  {
    q: 'Do I need a RapidAPI key for the actors?',
    a: 'No. The actors run under your Apify account and bill through Apify: they are the one surface on this site that doesn’t use a RapidAPI key.',
  },
  {
    q: 'Is the data different from the API’s?',
    a: 'No. Same live scan, same fields: Google’s price band and low/typical/high verdict on flights, live Booking.com rates on hotels. What changes is the billing model and the runtime (an actor run instead of an HTTP request).',
  },
  {
    q: 'When is RapidAPI the better deal?',
    a: `At steady volume. A fixed monthly plan with ${COUNTS.flightsRateLimits} requests/minute on flights beats per-event billing once you are calling every day, and a synchronous HTTP request is simpler to build against than starting a run. Occasional batch jobs with idle months are where the actors win.`,
  },
];

export default function ApifyIntegrationPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'Apify', item: `${SITE.url}/integrations/apify` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/integrations', label: 'Integrations' }, { href: '/integrations/apify', label: 'Apify' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <p className="eyebrow">Integrations · Apify</p>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            The same data, <span className="text-signal-500">pay-per-event</span>
          </h1>
          <p className="lede mt-5 max-w-2xl">
            Both APIs run as Apify actors: no monthly fee, billed per event through your Apify account. If your workload is
            an occasional batch job rather than steady daily traffic, this is the cheaper door.
          </p>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The two actors"
          title="One click adds them to your console"
          lede="The links below pre-add the actor to your Apify console after signup, no searching the store."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Google Flights Scraper</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              One-way and round-trip fares with airlines, layovers, Google&apos;s price band and low | typical | high verdict,
              and a booking link on every result. Pay-per-event: the current rates are the event table on the listing.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Cta href={LINKS.apifyFlightsConsole} external variant="primary">
                Try on Apify →
              </Cta>
              <a href={LINKS.apifyFlights} rel="noopener" className="text-sm text-ink-400 underline underline-offset-4 self-center">
                View the listing
              </a>
            </div>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Booking.com Scraper</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Live rates, availability, review scores and room types. By the actor&apos;s own event table (
              {APIFY.hotelsSearchEvent}, {APIFY.hotelsResultEvent}), a 25-property search costs about $0.004, roughly{' '}
              <strong className="text-ink-100">{APIFY.hotelsPer1kSearches}</strong>. The unit is the <em>search</em>, not the
              result row.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Cta href={LINKS.apifyHotelsConsole} external variant="primary">
                Try on Apify →
              </Cta>
              <a href={LINKS.apifyHotels} rel="noopener" className="text-sm text-ink-400 underline underline-offset-4 self-center">
                View the listing
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Which door for which workload"
          title="Apify for bursts, RapidAPI for baseline"
          lede="Same data either way: the honest question is the shape of your usage."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          <Feature title="Pick the actors when…">
            Your jobs are occasional and bursty: a monthly market sweep, a one-off dataset, a research scrape. Zero baseline
            cost (idle months cost nothing) and runs, retries, and result storage live in Apify&apos;s console alongside
            your other actors.
          </Feature>
          <Feature title="Pick RapidAPI when…">
            You call every day: an app feature, an agent, a fare-watch cron. A fixed plan makes per-call cost predictable,
            requests are synchronous HTTP instead of actor runs, and the flights listing sustains {COUNTS.flightsRateLimits}{' '}
            requests/minute by tier for parallel date scans.
          </Feature>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep exploring" title="Related pages" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/integrations/rapidapi" className="chip">
            The RapidAPI plans
          </Link>
          <Link href="/pricing" className="chip">
            Full pricing comparison
          </Link>
          <Link href="/integrations/api" className="chip">
            REST API direct
          </Link>
          <Link href="/integrations" className="chip">
            All integrations
          </Link>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="integration"
          title="Steady volume? The subscription is the better unit price"
          body="The RapidAPI plans start free and scale to 50,000 requests a month: same data, synchronous HTTP, fixed bill."
        />
      </Section>
    </>
  );
}
