import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { KeyVerifyBox } from '@/components/KeyVerifyBox';
import { PricingTable } from '@/components/PricingTable';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { APIFY, FLIGHT_PLANS, HOTEL_PLANS, READ_ON } from '@/lib/pricing';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Pricing: Google Flights & Booking.com API Plans - From $0 to $50/month | FlightPowers',
  description:
    'Transparent API pricing. Flights: $0, $10, $25, $50/month for 10 to 50,000 requests. Hotels: $0, $10, $20, $50/month for 10 to 25,000 requests. Free tier available with no credit card. Billed on RapidAPI. Compare $ per 1,000 requests. No feature gates.',
  alternates: { canonical: '/pricing' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Do flights and hotels share one plan?',
    a: 'No. They are two listings on RapidAPI with different plans: flights runs $0 / $10 / $25 / $50 at 150 to 500 requests/minute, hotels $0 / $10 / $20 / $50 at 25 to 50. Subscribe to each API you use; the same account key then works for both.',
  },
  {
    q: 'Where does billing actually happen?',
    a: 'On RapidAPI. You subscribe to a plan on the listing’s pricing tab, RapidAPI issues the key and meters usage, and their invoice is your invoice. We never see your card. If your company already uses RapidAPI, there is no new vendor to onboard.',
  },
  {
    q: 'Is the free tier enough to evaluate the API?',
    a: 'Honestly, no. It is 10 requests per month, hard-capped: enough to verify your key. Evaluate with the live demo on the homepage and the free tools here; they run real requests on our key.',
  },
  {
    q: 'What counts as a request?',
    a: 'A call to any endpoint is one request. The listings state this per plan. A round-trip search is one request. A 30-day flexible-date scan over REST is 30 requests (one per date), which is why the rate limits are sized the way they are.',
  },
  {
    q: 'Do the plans differ in features?',
    a: 'No. Within each API, every plan includes every endpoint. Plans differ only on monthly volume, overage price, and requests per minute. There is no feature gate to hit later.',
  },
  {
    q: 'What happens when I exceed my quota?',
    a: 'On paid plans the quota is soft: extra requests bill at the plan’s overage rate ($0.003/request on flights Pro and Ultra, $0.001 on Mega; $0.006 / $0.003 / $0.002 on hotels). The free tier is a hard cap: requests beyond 10 are rejected, not billed.',
  },
  {
    q: 'What if I need more than 50,000 requests a month?',
    a: 'Message through the RapidAPI listing. Custom volume plans are a normal thing there and the developer answers.',
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers pricing',
          url: `${SITE.url}/pricing`,
        }}
      />

      <Container className="pt-14 sm:pt-20 pb-4">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          Simple pricing: <span className="text-signal-500">pay for what you use</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          Free tier to start, paid plans from $10/month. No hidden fees, no feature gates. Flights and hotels are separate APIs with separate plans. One RapidAPI account key works for both once you subscribe to each.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Cta href={rapidApiPricingUrl('flights', 'pricing')} external variant="primary">
            Start with free tier →
          </Cta>
          <Cta href="/#demo" variant="ghost">
            Try live demo
          </Cta>
        </div>
      </Container>

      <Section bordered={false} className="!pt-10">
        <div className="space-y-12">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h2 className="text-2xl font-semibold">Google Flights Live API</h2>
              <a href={rapidApiPricingUrl('flights', 'pricing')} rel="noopener" className="text-sm text-signal-400 underline underline-offset-4">
                Open the live pricing tab →
              </a>
            </div>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="pricing" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h2 className="text-2xl font-semibold">Booking.com Live API</h2>
              <a href={rapidApiPricingUrl('hotels', 'pricing')} rel="noopener" className="text-sm text-signal-400 underline underline-offset-4">
                Open the live pricing tab →
              </a>
            </div>
            <PricingTable api="hotels" plans={HOTEL_PLANS} medium="pricing" />
          </div>
        </div>
        <div className="mt-8 max-w-4xl rounded-xl border rule bg-ink-900/40 px-5 py-3.5">
          <p className="text-[13px] text-ink-300 leading-relaxed">
            <strong className="text-ink-100">Live on RapidAPI:</strong> Google Flights Live API — 9.9 popularity, 100% service level, ~1144ms latency · Booking Live API — 9.6 popularity, 98% service level, ~12475ms latency
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-500">Metrics retrieved from rapidapi.com/mtnrabi listings on 2026-09-01</p>
        </div>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Honest note on the free tier: it is 10 requests/month, hard-capped. Enough to verify your key, not to evaluate. Evaluate
          with the <a href="/#demo" className="text-signal-400 underline underline-offset-4">live demo</a> and the{' '}
          <a href="/tools" className="text-signal-400 underline underline-offset-4">free tools</a> on this site; they run real
          requests on our key so your 10 stay yours.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Which flights plan for which job"
          title="Price the job, not the tier"
          lede="One search is one request; a flexible-date scan is one request per date. Flight plans shown; the same logic sizes a hotels plan."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">PRO · $10</p>
            <h3 className="mt-2 text-[16px] font-semibold text-ink-100">Alerts &amp; agents</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              2,500 requests ≈ a fare-watch checking 5 routes every morning with room to spare, or an MCP-connected agent used
              daily. 150 req/min means even a month-long scan is a single burst.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">ULTRA · $25 · recommended</p>
            <h3 className="mt-2 text-[16px] font-semibold text-ink-100">Products &amp; dashboards</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              10,000 requests ≈ 300+ searches a day: a fare-calendar feature, a route-monitoring dashboard, a bot with real users.
              $2.50 per 1k requests, 250 req/min.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-signal-400">MEGA · $50</p>
            <h3 className="mt-2 text-[16px] font-semibold text-ink-100">Scans at scale</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              50,000 requests at $1.00 per 1k (the cheapest unit price) with 500 req/min and the lowest overage ($0.001). Built
              for heatmaps over many routes and market analysis.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="From click to working key"
          title="Six steps, honestly counted"
          lede={
            <>
              Two of them are RapidAPI's walls, not ours, but none needs approval and the free tier needs no card. Full guides:{' '}
              <Link href="/guides/google-flights-api-key" className="text-signal-400 underline underline-offset-4">
                How to get a Google Flights API key
              </Link>{' '}
              and{' '}
              <Link href="/guides/booking-com-api-key" className="text-signal-400 underline underline-offset-4">
                How to get a Booking.com API key
              </Link>
              .
            </>
          }
        />
        <ol className="mt-10 max-w-3xl space-y-4">
          {[
            ['Open the pricing tab', 'The buttons on this site land you there directly.'],
            ['Create a RapidAPI account (or log in)', 'The wall. Standard signup; RapidAPI runs accounts and billing.'],
            ['Pick a plan', 'BASIC is free, no card, no approval. Access is immediate.'],
            ['Hit "Test Endpoint" on the Endpoints tab', 'Your key is bound automatically; the response renders in the browser.'],
            ['Copy a code snippet', 'The Code Snippets tab emits your language with the key in place.'],
            ['Verify the key below', 'Confirm it authenticates against the live API, the step RapidAPI leaves out.'],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-5">
              <span className="font-mono text-[15px] text-signal-500 tabular-nums">{i + 1}</span>
              <div>
                <p className="text-[15.5px] font-semibold text-ink-100">{title}</p>
                <p className="mt-1 text-[14px] text-ink-400 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 max-w-3xl">
          <KeyVerifyBox />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Prefer pay-per-use?"
          title="The same data as Apify actors"
          lede="No subscription: you pay per event, metered by Apify. One click adds the actor to your Apify console."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Google Flights Scraper</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              One-way and round-trip fares with airlines, layovers, Google price insights and a booking link on every result,
              packaged as an actor. Pay-per-event; see the event table on the listing for current rates.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Cta href={LINKS.apifyFlightsConsole} external variant="ghost">
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
              Live rates, availability and review scores. By the actor&apos;s own event table ({APIFY.hotelsSearchEvent},{' '}
              {APIFY.hotelsResultEvent}), a 25-property search costs about $0.004, roughly{' '}
              <strong className="text-ink-100">{APIFY.hotelsPer1kSearches}</strong>. Priced per <em>search</em>, not per result row.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Cta href={LINKS.apifyHotelsConsole} external variant="ghost">
                Try on Apify →
              </Cta>
              <a href={LINKS.apifyHotels} rel="noopener" className="text-sm text-ink-400 underline underline-offset-4 self-center">
                View the listing
              </a>
            </div>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Rule of thumb: steady monthly volume is cheaper on RapidAPI ({COUNTS.flightsRateLimits} req/min and a fixed bill);
          occasional batch jobs with zero baseline fit Apify&apos;s pay-per-event model.
        </p>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="pricing"
          title="Pick a plan, get a key, make your first call"
          body="The free tier verifies your key in a minute. The Pro tier is $10, less than the hour you'd spend fighting a scraper."
        />
      </Section>
    </>
  );
}
