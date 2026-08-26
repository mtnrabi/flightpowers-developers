import type { Metadata } from 'next';
import { CtaBand } from '@/components/bands';
import { KeyVerifyBox } from '@/components/KeyVerifyBox';
import { PricingTable } from '@/components/PricingTable';
import { Container, Cta, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { APIFY, FLIGHT_PLANS, HOTEL_PLANS, READ_ON } from '@/lib/pricing';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Pricing: plans from $0, billed on RapidAPI',
  description:
    'Flights: free tier, then $10 / $25 / $50 per month with 150–500 requests/minute. Hotels: free tier, then $10 / $20 / $50. Every plan includes every endpoint; compare $ per 1,000 requests. Billing is on RapidAPI, so there is no new vendor to onboard.',
  alternates: { canonical: '/pricing' },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Where does billing actually happen?',
    a: 'On RapidAPI. You subscribe to a plan on the listing’s pricing tab, RapidAPI issues the key and meters usage, and their invoice is your invoice. We never see your card. If your company already uses RapidAPI, there is no new vendor to onboard.',
  },
  {
    q: 'Is the free tier enough to evaluate the API?',
    a: 'Honestly, no. BASIC is 10 requests per month with a hard cap: enough to verify your key works and see the response shape. Evaluate with the live demo on the homepage and the free tools on this site: they run real requests against the live API on our own key.',
  },
  {
    q: 'What counts as a request?',
    a: 'A call to any endpoint is one request. The listings state this per plan. A round-trip search is one request. A 30-day flexible-date scan over REST is 30 requests (one per date), which is why the rate limits are sized the way they are.',
  },
  {
    q: 'Do the plans differ in features?',
    a: 'No. Every plan includes every endpoint on its API. Plans differ only on monthly volume, overage price, and requests-per-minute. There is no feature gate to hit later.',
  },
  {
    q: 'What happens when I exceed my quota?',
    a: 'On paid plans the quota is soft: extra requests bill at the plan’s overage rate ($0.003/request on flights Pro and Ultra, $0.001 on Mega; $0.006 / $0.003 / $0.002 on hotels). The free tier is a hard cap: requests beyond 10 are rejected, not billed.',
  },
  {
    q: 'Is there an approval step before I can subscribe?',
    a: 'No. All public plans on both listings have request-approval disabled, so subscribing is immediate and the free tier needs no card.',
  },
  {
    q: 'Can I pay per use instead of a subscription?',
    a: 'Yes. The Apify actors are pay-per-event with no monthly fee. The hotels actor works out to roughly $4 per 1,000 searches by its own event table. Note Apify prices per SEARCH (plus a tiny per-result event), so compare against searches, not result rows.',
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
          Simple tiers, billed on <span className="text-signal-500">RapidAPI</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          This page is for deciding; the checkout is the listing&apos;s pricing tab. Every plan includes every endpoint. You only
          choose volume and rate limit. Prices below were read from the live listings on {READ_ON}; the listing is authoritative.
        </p>
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
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Honest note on the free tier: it is 10 requests/month, hard-capped. Enough to verify your key, not to evaluate. Evaluate
          with the <a href="/#demo" className="text-signal-400 underline underline-offset-4">live demo</a> and the{' '}
          <a href="/tools" className="text-signal-400 underline underline-offset-4">free tools</a> on this site; they run real
          requests on our key so your 10 stay yours.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Which plan for which job"
          title="Price the job, not the tier"
          lede="Requests map directly onto work: one search is one request, and a flexible-date scan is one request per date."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
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
          lede="Two of them are RapidAPI's walls, not ours, but none needs approval and the free tier needs no card."
        />
        <ol className="mt-10 max-w-3xl space-y-4">
          {[
            ['Open the pricing tab', 'The buttons on this site land you there directly. One step saved.'],
            ['Create a RapidAPI account (or log in)', 'The wall. It is a standard signup, off our domain; RapidAPI runs the accounts and billing.'],
            ['Pick a plan', 'BASIC is free with no card. Paid plans take a card. No approval step on any public plan. Access is immediate.'],
            ['Hit "Test Endpoint" on the Endpoints tab', 'Your key is bound automatically and the response renders in the browser.'],
            ['Copy a code snippet', 'The Code Snippets tab emits your language of choice with the key already in place.'],
            ['Verify the key below', 'Paste it into the checker and confirm it authenticates against the live API, the step RapidAPI leaves out.'],
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
        <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-4xl">
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
