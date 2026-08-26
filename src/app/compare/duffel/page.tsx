import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CtaBand } from '@/components/bands';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  Code,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'FlightPowers vs Duffel: flight data API vs booking API',
  description:
    'Duffel sells flights; FlightPowers prices them. An honest, sourced comparison of Duffel’s per-order pricing and search allowance against a pure flight-data API. Duffel figures quoted from duffel.com/pricing, retrieved 2026-08-24.',
  alternates: { canonical: '/compare/duffel' },
});

export const dynamic = 'force-static';

/** Competitor figures below are QUOTES from duffel.com/pricing, retrieved 2026-08-24. Do not edit without re-verifying. */
const RETRIEVED = '2026-08-26';

const faq: Faq[] = [
  {
    q: 'Can FlightPowers book a flight?',
    a: 'No, and this page says so in its first paragraph. FlightPowers returns prices and a buy_link, a deep link that opens the exact itinerary on Google Flights, where the traveller completes the purchase somewhere else. If the transaction must happen inside your product, Duffel is the right kind of tool and we are not.',
  },
  {
    q: 'Is Duffel more expensive than FlightPowers?',
    a: 'For a travel seller, often not: Duffel’s search allowance (1500 free searches per confirmed order, per their pricing page retrieved 2026-08-24) means a well-converting seller pays little for search. For a non-booking workload the allowance is zero, every search is $0.005, and that is 2x our $25 tier and 5x our $50 tier on published list prices.',
  },
  {
    q: 'Do the two APIs return the same kind of data?',
    a: 'No. Booking APIs return bookable offers: what is purchasable right now through the platform’s contracted channels. FlightPowers returns what Google Flights shows: live consumer market pricing, with Google’s historical band and low | typical | high verdict attached. A checkout flow needs the first; research, alerting and comparison products usually need the second.',
  },
  {
    q: 'Can I use Duffel and FlightPowers together?',
    a: 'Yes, and it is a sensible split for an OTA that also wants market context: Duffel for what you can sell, a data API for what the market is charging. They answer different questions and neither degrades into the other.',
  },
  {
    q: 'Where do the Duffel numbers on this page come from?',
    a: 'From duffel.com/pricing, read on 2026-08-24 and quoted rather than paraphrased. If a number here disagrees with their site today, believe their site.',
  },
];

function CompareTable({
  caption,
  head,
  rows,
}: {
  caption?: string;
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <figure>
      <div className="scroll-x rounded-2xl border rule">
        <div className="overflow-x-auto rounded-2xl">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
              {head.map((h, i) => (
                <th key={i} className="px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i} className="border-t rule align-top">
                {cells.map((cell, j) => (
                  <td key={j} className={`px-4 py-3.5 ${j === 0 ? 'font-semibold text-ink-100' : 'text-ink-300'} text-[13.5px] leading-relaxed`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {caption ? <figcaption className="mt-2 font-mono text-[11px] text-ink-500">{caption}</figcaption> : null}
    </figure>
  );
}

export default function CompareDuffelPage() {
  const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const ultra = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
  const mega = FLIGHT_PLANS.find((p) => p.name === 'MEGA')!;
  const perSearch = (p: typeof ultra) => `$${(p.priceMonthly / p.quota).toFixed(4)}`;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers vs Duffel: flight data API vs booking API',
          url: `${SITE.url}/compare/duffel`,
          dateModified: RETRIEVED,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE.url}/compare` },
            { '@type': 'ListItem', position: 3, name: 'Duffel', item: `${SITE.url}/compare/duffel` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/duffel', label: 'Duffel' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">Duffel</span>
          </h1>
          <p className="lede mt-5 max-w-3xl">
            These two products get compared a lot and they should not be. Duffel is a <strong className="text-ink-100">booking
            platform</strong>: you can issue a real ticket through it. FlightPowers is a{' '}
            <strong className="text-ink-100">data API</strong>: you can find out what a trip costs. Which one you need comes down to
            one question: are you selling travel, or are you telling people about travel?
          </p>
          <p className="mt-5 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            All Duffel figures were read from duffel.com/pricing on <strong className="text-ink-200">{RETRIEVED}</strong> and are
            quoted rather than paraphrased. If a number here disagrees with their site today, believe their site.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The decisive difference" title="Duffel can sell a ticket. FlightPowers cannot." />
        <div className="mt-6 max-w-3xl space-y-5 text-[15.5px] text-ink-300 leading-relaxed">
          <p>
            Duffel gives you real bookable airline inventory, order creation, ancillaries, and their own IATA accreditation so you do
            not need your own. From their pricing page:
          </p>
          <blockquote className="border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300">
            “If you have your own accreditation and would like to use it please contact us to discuss pricing and next steps.
            Alternatively, you can use our accreditation through our Managed Content. This includes access to our 5 IATAs worldwide
            with no need for any additional forms or up-front capital.”
            <footer className="mt-2 font-mono text-[11px] text-ink-500">duffel.com/pricing · retrieved {RETRIEVED}</footer>
          </blockquote>
          <p>
            That is a genuinely hard problem solved, and nothing on our side substitutes for it. FlightPowers returns a{' '}
            <code className="font-mono text-[13px]">buy_link</code>, a deep link that opens the exact itinerary on Google Flights,
            where the traveller completes the purchase somewhere else. If you need the transaction to happen inside your product,
            stop reading and go to Duffel.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Their model"
          title="Duffel’s pricing: orders pay, search rides along"
          lede="Quoted from their pricing page. A well-designed model for a travel seller."
        />
        <div className="mt-8 max-w-3xl">
          <CompareTable
            caption={`Quoted from duffel.com/pricing · retrieved ${RETRIEVED}`}
            head={['Item', 'Charge']}
            rows={[
              ['Orders', '“This fee is charged monthly for every confirmed order. $3.00 per order”'],
              ['Managed Content', '“This fee is charged monthly for every confirmed order. 1% total order value”'],
              ['Excess search', '“$0.005 per excess search”, above “a search to book ratio of 1500:1”'],
              ['FX', '“We will charge 2% on the exchange rate.”'],
              ['Stays', '“Profit share on every completed stay.” (contact sales)'],
              ['Enterprise', '“Bespoke pricing”'],
            ]}
          />
          <blockquote className="mt-6 border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
            “If you make 10 orders in a month, then you’ll be allowed 10 * 1500 = 15000 searches free of charge. If you made 25,000
            searches, then you’d pay (25000 - 15000) * $0.005 = $50”
            <footer className="mt-2 font-mono text-[11px] text-ink-500">Their own worked example of the search allowance</footer>
          </blockquote>
          <p className="mt-6 text-[15px] text-ink-300 leading-relaxed">
            This is a well-designed model <strong className="text-ink-100">for a travel seller</strong>. Search is nearly free as
            long as you convert, and 1500:1 is a generous ratio.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Where it breaks"
          title="Read the allowance backwards"
          lede="The free search budget is a function of your order count. No orders, no free searches."
        />
        <div className="mt-8 max-w-3xl space-y-5 text-[15px] text-ink-300 leading-relaxed">
          <p>
            If you place <strong className="text-ink-100">no orders</strong>, you get <strong className="text-ink-100">no free
            searches</strong>, and every search is $0.005. For a non-booking workload that is{' '}
            <strong className="text-ink-100">2x</strong> our ${ultra.priceMonthly} tier ({perSearch(ultra)} per search) and{' '}
            <strong className="text-ink-100">5x</strong> our ${mega.priceMonthly} tier ({perSearch(mega)}). And that is before the
            practical problem, which is not price at all:
          </p>
          <p>
            <strong className="text-ink-100">You have to be a travel seller to be a Duffel customer.</strong> Their sign-up copy is{' '}
            <em>“Sign up and start selling flights in less than 1 minute.”</em> If you are building a price-tracking dashboard, a
            fare-alert bot, a market-research tool, an AI travel assistant that hands off to Google Flights, or an internal
            travel-budget tool, you are not selling flights and you never will be. The model has no lane for you.
          </p>
          <p>
            There is also a data-shape mismatch. Booking APIs return <strong className="text-ink-100">bookable offers</strong>: what
            is purchasable, right now, through the channels the platform has contracts with. That is the correct answer for a
            checkout flow and the wrong answer for “what does this route cost in the market,” which is what Google Flights shows and
            what most research, alerting and comparison products actually need.
          </p>
        </div>
        <div className="mt-10">
          <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers list pricing, for the same searches</h3>
          <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Capabilities"
          title="What each one is actually for"
          lede="Prose cells, not ticks, including the rows Duffel simply wins."
        />
        <div className="mt-8">
          <CompareTable
            caption={`Duffel cells quote or summarise duffel.com/pricing retrieved ${RETRIEVED}; FlightPowers cells are traceable to the live listing.`}
            head={['', 'Duffel', 'FlightPowers']}
            rows={[
              [
                'Selling a ticket',
                'The whole point: order creation, ancillaries, seat selection, changes and cancellations, on bookable contracted inventory. What you quote is what you can sell.',
                'Cannot sell anything. Every result carries a buy_link that hands the traveller to Google Flights to complete the purchase elsewhere.',
              ],
              [
                'Accreditation',
                'Access to their 5 IATAs worldwide through Managed Content, with no accreditation of your own. That alone removes months of work.',
                'Not applicable: no bookings, so no accreditation question ever arises.',
              ],
              [
                'Search pricing',
                'Search rides along with orders: 1,500 free searches per confirmed order, then $0.005 per excess search. A high-volume seller that converts well may pay less with Duffel than with any per-search vendor.',
                <>
                  Search is the product: flat monthly tiers from ${pro.priceMonthly}, down to {perSearch(mega)} per search on the top
                  tier. <Link href="/pricing" className="text-signal-400 underline underline-offset-4">Pricing →</Link>
                </>,
              ],
              [
                'Price context',
                'Returns offers: the price you can transact at through their channels.',
                <>
                  Returns the market: every result carries Google’s historical band (
                  <code className="font-mono text-[12px]">price_insights_low/high</code>) and a low | typical | high verdict, so a
                  fare-alert product knows whether $412 is a good price without accumulating its own history.{' '}
                  <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">Price insights →</Link>
                </>,
              ],
              [
                'Round-trip',
                'A booking flow concern; their model is built around offers and orders.',
                <>
                  A first-class data endpoint: <code className="font-mono text-[12px]">POST /v1/flights/roundtrip</code> returns both
                  legs and a combined total in a single object, priced as a pair the way airlines actually price them.{' '}
                  <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">Round-trip →</Link>
                </>,
              ],
              [
                'Failed vs empty search',
                'Not something we evaluated for a booking flow.',
                <>
                  Every flights response reports <code className="font-mono text-[12px]">X-Search-Status</code> (ok | empty | partial
                  | degraded), so “no flights” and “the search failed” are different answers; opt-in{' '}
                  <code className="font-mono text-[12px]">strict: true</code> turns a degraded search into an HTTP 503.{' '}
                  <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">Search status →</Link>
                </>,
              ],
              [
                'Hotels',
                'Duffel Stays is a booking product with profit-share pricing (“Profit share on every completed stay”), built for completing reservations.',
                <>
                  A data product: live Booking.com rates with <code className="font-mono text-[12px]">proxy_country</code>: the same
                  room priced as a visitor from different markets sees it, for rate-parity and geo-pricing monitoring.{' '}
                  <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4">Geo-pricing →</Link>
                </>,
              ],
              [
                'AI agents',
                'We did not evaluate Duffel’s agent tooling.',
                <>
                  First-party hosted MCP servers: point an MCP-capable host at{' '}
                  <code className="font-mono text-[12px]">{LINKS.mcpFlights}</code> and flight search becomes a native tool.{' '}
                  <Link href="/mcp" className="text-signal-400 underline underline-offset-4">MCP setup →</Link>
                </>,
              ],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which should you pick" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose Duffel when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>The purchase happens inside your product: you are an OTA, a corporate booking tool, an agency, or a marketplace taking payment for travel.</li>
              <li>You need bookable, contracted inventory rather than a public-facing price.</li>
              <li>You want their IATA accreditation instead of acquiring your own.</li>
              <li>You convert well: the 1500:1 search allowance makes search effectively free for a seller.</li>
              <li>You need the post-booking lifecycle: changes, cancellations, order management.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You need to know prices without selling them: fare alerts, price dashboards, cheapest-date calendars.</li>
              <li>You are doing market or competitor research on live consumer fares.</li>
              <li>You are building an AI travel assistant that hands off to a booking site.</li>
              <li>You run affiliate or comparison products where the buy_link is the handoff.</li>
              <li>You need internal travel-cost tooling with Google’s own price verdict attached.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          <strong className="text-ink-100">Use both if</strong> you are an OTA that also wants market context: Duffel for what you
          can sell, a data API for what the market is charging. They answer different questions and neither one degrades into the
          other.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Try it" title="Price a trip in one request" />
        <div className="mt-8 max-w-3xl">
          <Code label="curl · round-trip in one request">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "JFK",
    "to_airport": "LHR",
    "departure_date": "2026-10-15",
    "return_date": "2026-10-22"
  }'`}</Code>
          <p className="mt-4 text-[14px] text-ink-400 leading-relaxed">
            Free tier: 10 requests/month, hard cap. It verifies your key, doesn’t evaluate. The full walkthrough is in{' '}
            <Link href="/guides/real-time-google-flights-data" className="text-signal-400 underline underline-offset-4">
              How to get real-time Google Flights data
            </Link>
            .
          </p>
          <div className="mt-6">
            <Cta href={rapidApiPricingUrl('flights', 'compare')} external variant="primary">
              Get a key on RapidAPI →
            </Cta>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep comparing" title="Related pages" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/compare/serpapi', label: 'vs SerpApi', sub: 'Platform vs specialist' },
            { href: '/compare/amadeus', label: 'vs Amadeus Self-Service', sub: 'And when to migrate' },
            { href: '/guides/best-flight-data-apis-2026', label: 'Best flight data APIs 2026', sub: 'The full field, disclosed bias' },
            { href: '/flights-api/round-trip', label: 'Round-Trip API', sub: 'Paired-leg itineraries' },
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
          medium="compare"
          title="Telling people about travel, not selling it?"
          body="Live market prices with Google's band and verdict on every result: the answer a checkout API isn't built to give."
        />
      </Section>
    </>
  );
}
