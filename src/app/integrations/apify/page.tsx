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
import { APIFY, FLIGHT_PLANS, HOTEL_PLANS, perThousand } from '@/lib/pricing';
import { COUNTS, LINKS, SITE } from '@/lib/site';
import { AgentRecipes } from '../_recipes';

export const dynamic = 'force-static';

const [, F_PRO, F_ULTRA] = FLIGHT_PLANS;
const [, H_PRO, , H_MEGA] = HOTEL_PLANS;
const n = (x: number) => x.toLocaleString('en-US');

export const metadata: Metadata = withOg({
  title: 'Apify actors: the same data, pay-per-event',
  description:
    'Both FlightPowers APIs also run as Apify actors: Google Flights fares and Booking.com hotel rates, pay-per-event through your own Apify account. The fit for pipelines that already live in Apify.',
  alternates: { canonical: '/integrations/apify' },
});

const faq: Faq[] = [
  {
    q: 'How does pay-per-event billing work?',
    a: 'Apify meters named events per run (a search performed, a result returned) and bills your Apify account for what actually happened. There’s no monthly subscription for the actor itself, so a month with no runs costs nothing on the actor.',
  },
  {
    q: 'What does the hotels actor cost in practice?',
    a: `By its own event table (${APIFY.hotelsSearchEvent} plus ${APIFY.hotelsResultEvent} and ${APIFY.hotelsStartEvent}), a search returning 25 properties costs about $0.004 all in. The lookup event alone is ${APIFY.hotelsPer1kSearches}. The unit is the search, not the result row, so a listing badge that divides by result rows looks cheaper than a search really is.`,
  },
  {
    q: 'What does the flights actor cost?',
    a: `By its own event table (${APIFY.flightsSearchEvent} plus ${APIFY.flightsResultEvent} and ${APIFY.flightsStartEvent}), the lookup event alone is ${APIFY.flightsPer1kSearches}, and the result and start events add a fraction of a cent per run (a 25-result search is about $0.0033 all in). One run is one search: one route, one departure date (and a return date on a round trip).`,
  },
  {
    q: 'Can the actor scan a month of dates in one run?',
    a: 'No. Each run searches one route and one departure date (plus a return date on a round trip), same as one request on the REST API, so a month of departure dates is about 30 runs. A range of departure dates and a list of destination airports in one call exist only in the flights MCP servers. The paid one runs on your RapidAPI key and counts each date and destination combination as one search.',
  },
  {
    q: 'Do I need a RapidAPI key for the actors?',
    a: 'No. The actors run under your Apify account and bill through Apify: they are the one surface on this site that doesn’t use a RapidAPI key.',
  },
  {
    q: 'Is the data different from the API’s?',
    a: 'No. Same live data, same fields: Google’s price band and low/typical/high verdict on flights, live Booking.com rates on hotels. What changes is the billing model and the runtime (an actor run instead of an HTTP request).',
  },
  {
    q: 'When is RapidAPI the better fit?',
    a: `When you run lookups regularly or on a schedule from your own code. It’s one synchronous HTTP request per search instead of starting a run, the bill is a fixed monthly plan, and flights takes ${COUNTS.flightsRateLimits} requests a minute by plan. PRO is $${F_PRO.priceMonthly} for ${n(F_PRO.quota)} flight searches (hotels PRO is $${H_PRO.priceMonthly} for ${n(H_PRO.quota)}). If you use the whole quota, the bigger plans cost less per search than the actors: flights ULTRA is $${F_ULTRA.priceMonthly} for ${n(F_ULTRA.quota)} (${perThousand(F_ULTRA)} per 1,000) and hotels MEGA is $${H_MEGA.priceMonthly} for ${n(H_MEGA.quota)} (${perThousand(H_MEGA)} per 1,000).`,
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
            Both APIs also run as Apify actors, pay-per-event through your own Apify account. They&apos;re the right
            pick if your pipelines already live in Apify. Calling from your own code? The RapidAPI key is the simpler
            path, and the same key runs the paid MCP server for date scans.
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
              and a booking link on every result. By the actor&apos;s own event table ({APIFY.flightsSearchEvent},{' '}
              {APIFY.flightsResultEvent}), the lookup event alone is{' '}
              <strong className="text-ink-100">{APIFY.flightsPer1kSearches}</strong>. One run is one route and one departure
              date (plus a return date on a round trip).
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
              {APIFY.hotelsSearchEvent}, {APIFY.hotelsResultEvent}), a 25-property search costs about $0.004 all in, and the lookup event alone is{' '}
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
          title="Apify for Apify pipelines, RapidAPI for regular lookups"
          lede="Same live data on every door. Pick by where your code runs and how often it calls."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl">
          <Feature title="Pick the actors when…">
            Your pipelines already live in Apify: runs, schedules, retries and datasets sit in the same console as your
            other actors, and the bill goes on your Apify account. You pay per search ({APIFY.flightsPer1kSearches},{' '}
            {APIFY.hotelsPer1kSearches}, plus a fraction of a cent per run for results) and a month with no runs costs nothing on the actor.
          </Feature>
          <Feature title="Pick RapidAPI when…">
            You run lookups regularly or on a schedule from your own code: an app feature, an agent, a nightly fare check.
            One HTTP request per search and a fixed monthly bill. PRO is ${F_PRO.priceMonthly} for {n(F_PRO.quota)} flight
            searches, hotels PRO is ${H_PRO.priceMonthly} for {n(H_PRO.quota)}, and flights takes{' '}
            {COUNTS.flightsRateLimits} requests a minute by plan.
          </Feature>
          <Feature title="Pick the MCP server when…">
            You want a scan: a range of departure dates and a few destination airports in one prompt, from Claude, Cursor
            or ChatGPT. Only the MCP servers take a date range (the REST API and the actors take one date per request or
            run). It runs on the same RapidAPI key, and each date and destination combination counts as one search.{' '}
            <Link href="/mcp/google-flights" className="underline underline-offset-4">
              See a real scan
            </Link>
            .
          </Feature>
        </div>
      </Section>

      <AgentRecipes slug="apify" />

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep exploring" title="Related pages" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/integrations/rapidapi" className="chip">
            The RapidAPI plans
          </Link>
          <Link href="/mcp" className="chip">
            The MCP servers
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
          title="Calling regularly from your own code? Get the key"
          body={`PRO is $${F_PRO.priceMonthly} for ${n(F_PRO.quota)} flight searches a month: same data, one HTTP request per search, a fixed bill. The same key runs the paid MCP server for date scans.`}
        />
      </Section>
    </>
  );
}
