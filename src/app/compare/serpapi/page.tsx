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
import { FLIGHT_PLANS, perThousand } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'FlightPowers vs SerpApi for Google Flights data',
  description:
    'An honest, sourced comparison of SerpApi’s Google Flights API and FlightPowers: pricing per search, how each handles round-trips, and what SerpApi does better. Competitor figures quoted from SerpApi’s own pages, retrieved 2026-08-24.',
  alternates: { canonical: '/compare/serpapi' },
};

export const dynamic = 'force-static';

/** Competitor figures below are QUOTES from serpapi.com, retrieved 2026-08-24. Do not edit without re-verifying. */
const RETRIEVED = '2026-08-24';

const ULTRA = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
const ULTRA_PER_SEARCH = `$${(ULTRA.priceMonthly / ULTRA.quota).toFixed(4)}`;

const faq: Faq[] = [
  {
    q: 'Is FlightPowers cheaper than SerpApi?',
    a: `On published list prices, per flight search, yes at every tier: ${ULTRA_PER_SEARCH} per search on our $${ULTRA.priceMonthly} plan against $0.015 on SerpApi’s $75 plan (their figures retrieved 2026-08-24). Two honest caveats in SerpApi’s favour: their credits are fungible across all their Google engines, so a flights-only comparison understates what the credit buys, and they only count successful searches toward quota.`,
  },
  {
    q: 'Does FlightPowers return price history like SerpApi?',
    a: 'No. SerpApi’s price_insights object includes a price_history array of [timestamp, price] pairs; we return the band (price_insights_low / price_insights_high) and Google’s low | typical | high verdict, but no history series. If you want to chart a fare’s past without accumulating it yourself, SerpApi hands it to you and we do not.',
  },
  {
    q: 'Why are round-trips cheaper on FlightPowers?',
    a: 'SerpApi’s own documentation describes round-trip as a two-request flow: search the outbound, then use a departure_token to fetch matching returns. Our POST /v1/flights/roundtrip returns paired legs and a combined total in a single call, so a round-trip costs one request instead of two.',
  },
  {
    q: 'Can I use both APIs together?',
    a: 'Plenty of teams do: SerpApi for general Google surfaces (Search, Maps, Shopping), a flights specialist for the flight path that carries the volume. Nothing about either product prevents it.',
  },
  {
    q: 'Where do the SerpApi numbers on this page come from?',
    a: 'From serpapi.com/pricing and serpapi.com/google-flights-api, read on 2026-08-24 and quoted rather than paraphrased. If a number here disagrees with their site today, believe their site.',
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
      <div className="overflow-x-auto rounded-2xl border rule">
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
                  <td key={j} className={`px-4 py-3.5 ${j === 0 ? 'font-semibold text-ink-100 whitespace-nowrap' : 'text-ink-300'} text-[13.5px] leading-relaxed`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <figcaption className="mt-2 font-mono text-[11px] text-ink-500">{caption}</figcaption> : null}
    </figure>
  );
}

export default function CompareSerpApiPage() {
  const pro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const ultra = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
  const mega = FLIGHT_PLANS.find((p) => p.name === 'MEGA')!;
  const perSearch = (p: typeof pro) => `$${(p.priceMonthly / p.quota).toFixed(4)}`;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'FlightPowers vs SerpApi for Google Flights data',
          url: `${SITE.url}/compare/serpapi`,
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
            { '@type': 'ListItem', position: 3, name: 'SerpApi', item: `${SITE.url}/compare/serpapi` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/serpapi', label: 'SerpApi' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">SerpApi</span> for Google Flights data
          </h1>
          <p className="lede mt-5 max-w-3xl">
            SerpApi is the default answer when someone asks “how do I get Google Flights data.” It is a good product, it is well
            documented, and for a lot of teams it is the right choice. This page is about the cases where it is not.
          </p>
          <p className="mt-5 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            All competitor figures below were read from SerpApi’s own live pages on <strong className="text-ink-200">{RETRIEVED}</strong>{' '}
            and are quoted rather than paraphrased. If a number here disagrees with their site today, believe their site.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The one-paragraph version" title="A platform and a specialist" />
        <p className="mt-6 max-w-3xl text-[15.5px] text-ink-300 leading-relaxed">
          SerpApi is a <strong className="text-ink-100">general-purpose Google scraping platform</strong>: Google Flights is one of
          several dozen engines on the same subscription and the same credit pool. FlightPowers is a{' '}
          <strong className="text-ink-100">flights-and-hotels specialist</strong>. If you need Google Search, Maps, Shopping{' '}
          <em>and</em> Flights, SerpApi is one vendor and one bill, and that convenience is worth real money. If flights are the
          product, you are paying general-purpose prices for a specialist job, and round-trips cost you double.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Pricing, side by side"
          lede="Their table quoted from their pricing page; ours rendered from the same data that drives our /pricing page."
        />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">SerpApi</h3>
            <CompareTable
              caption={`Quoted from serpapi.com/pricing · retrieved ${RETRIEVED}`}
              head={['Plan', 'Price', 'Searches / month', 'Throughput']}
              rows={[
                ['Free', '$0 / month', '250 searches per month', '50 / hour'],
                ['Starter', '$25 / month', '1,000 searches per month', '200 / hour'],
                ['Developer', '$75 / month', '5,000 searches per month', '1,000 / hour'],
                ['Production', '$150 / month', '15,000 searches per month', '3,000 / hour'],
                ['Big Data', '$275 / month', '30,000 searches per month', '6,000 / hour'],
                ['Enterprise', 'Contact sales', 'Custom', 'Custom'],
              ]}
            />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers (Google Flights Live API)</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
          </div>
          <div className="max-w-2xl">
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">Cost per search, on published list prices</h3>
            <CompareTable
              caption={`List price ÷ included volume: arithmetic on both vendors’ published numbers (theirs retrieved ${RETRIEVED})`}
              head={['Plan', 'Cost per search']}
              rows={[
                ['SerpApi Starter', '$0.025'],
                ['SerpApi Developer', '$0.015'],
                ['SerpApi Production', '$0.010'],
                ['SerpApi Big Data', '$0.0092'],
                [`FlightPowers ${pro.name}`, perSearch(pro)],
                [`FlightPowers ${ultra.name}`, perSearch(ultra)],
                [`FlightPowers ${mega.name}`, perSearch(mega)],
              ]}
            />
          </div>
        </div>
        <div className="mt-8 max-w-3xl rounded-2xl border rule bg-ink-900/50 p-6">
          <p className="text-[14.5px] text-ink-300 leading-relaxed">Two caveats, in SerpApi’s favour and worth stating plainly:</p>
          <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
            <li>
              SerpApi’s credits are fungible across all their engines. A comparison of flights-only cost against a general-purpose
              credit understates what the credit buys.
            </li>
            <li>
              SerpApi counts only successful searches. Their FAQ: <em>“Only successful searches are counted toward your monthly
              searches. Cached, errored, and failed searches are not.”</em> That is a genuinely customer-friendly billing policy.
            </li>
          </ul>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The largest practical gap"
          title="Round-trips: one request or two"
          lede="Not a matter of opinion. It is in SerpApi’s own parameter documentation."
        />
        <div className="mt-8 max-w-3xl">
          <blockquote className="border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
            “To obtain the returning flight information for Round Trip (1), you need to make another request using a{' '}
            <code className="font-mono text-[13px]">departure_token</code>.”
            <footer className="mt-2 font-mono text-[11px] text-ink-500">serpapi.com/google-flights-api · retrieved {RETRIEVED}</footer>
          </blockquote>
          <p className="mt-6 text-[15px] text-ink-300 leading-relaxed">
            So a round-trip search on SerpApi is a <strong className="text-ink-100">two-request flow</strong>: search the outbound,
            take a <code className="font-mono text-[13px]">departure_token</code> off a chosen result, search again for the matching
            returns. Two requests, two credits, two round-trips of latency, and state to carry in between. On FlightPowers,{' '}
            <code className="font-mono text-[13px]">POST /v1/flights/roundtrip</code> is a single call that returns paired legs and a
            combined total in one object:
          </p>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
          <Code label="one result object, both legs: documented response shape">{`{
  "total_price": "$119",
  "total_price_as_number": 119,
  "total_duration_seconds": 12900,
  "total_stops": 0,
  "buy_link": "https://www.google.com/travel/flights?tfs=...",
  "departure_flight_airline": "easyJet",
  "departure_flight_duration": "1 hr 50 min",
  "return_flight_airline": "easyJet",
  "return_flight_duration": "1 hr 45 min"
}`}</Code>
          <div>
            <CompareTable
              caption="Restated as cost per round-trip search, on published list prices"
              head={['', 'Per round-trip search']}
              rows={[
                ['SerpApi Developer (2 credits)', '$0.030'],
                [`FlightPowers ${ultra.name} (1 credit)`, perSearch(ultra)],
              ]}
            />
            <p className="mt-5 text-[14.5px] text-ink-400 leading-relaxed">
              There is a real trade here, though. SerpApi’s two-step flow lets a user <strong className="text-ink-200">pick a
              specific outbound</strong> and then see returns priced against <em>that</em> choice, exactly how Google Flights’ own UI
              behaves. If you are building an interactive booking flow with that interaction model, their design fits it and ours
              does not. Ours is built for the “price this trip” question, not the “let me choose leg by leg” question.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Capabilities"
          title="Feature by feature, in prose"
          lede="No tick marks: each cell says what is actually documented, and by whom."
        />
        <div className="mt-8">
          <CompareTable
            caption={`SerpApi cells quote or summarise serpapi.com pages retrieved ${RETRIEVED}; FlightPowers cells are traceable to the live listing.`}
            head={['', 'SerpApi', 'FlightPowers']}
            rows={[
              [
                'Scope',
                'Google Search, Maps, Shopping, Hotels, Images, Scholar and more on one key and one credit pool. If flights are one feature of a bigger product, consolidating on one vendor is worth paying for.',
                'Flights and hotels only. Nothing else: that is the trade this whole page is about.',
              ],
              [
                'Price context',
                <>
                  Richer history: their <code className="font-mono text-[12px]">price_insights</code> object carries{' '}
                  <code className="font-mono text-[12px]">lowest_price</code>, <code className="font-mono text-[12px]">price_level</code>,{' '}
                  <code className="font-mono text-[12px]">typical_price_range</code> and{' '}
                  <code className="font-mono text-[12px]">price_history</code>, an array of [timestamp, price] pairs you can chart
                  directly.
                </>,
                <>
                  The band and the verdict: <code className="font-mono text-[12px]">price_insights_low/high</code> plus Google’s{' '}
                  low | typical | high call on every result (the alerting trigger), but no history series.{' '}
                  <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">See it proven →</Link>
                </>,
              ],
              [
                'Round-trip',
                'A two-request flow via departure_token, per their own docs, which also enables a pick-your-outbound interaction model ours cannot express.',
                <>
                  One paired-leg request with a combined total and per-leg filters.{' '}
                  <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">Round-trip API →</Link>
                </>,
              ],
              [
                'Empty results',
                'Handled at the billing layer: only successful searches count toward quota (their FAQ, quoted above). We have not evaluated how their responses distinguish “no flights” from a search that failed.',
                <>
                  Handled at the response layer: every search reports <code className="font-mono text-[12px]">X-Search-Status</code>{' '}
                  (ok | empty | partial | degraded), and an empty array is only reported as the answer when the page it came from
                  positively said so. Opt-in <code className="font-mono text-[12px]">strict: true</code> turns a degraded search into
                  an HTTP 503. <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">Search status →</Link>
                </>,
              ],
              [
                'Throughput',
                'Published hourly, described as guaranteed: 1,000/hour on Developer up to 6,000/hour on Big Data. A guarantee is a stronger form of commitment than a rate limit.',
                <>
                  Published per minute: 150/min on the $10 plan up to 500/min on the $50 plan. For bursty workloads like scanning a
                  31-date month the moment a user asks, a per-minute ceiling in the hundreds is the shape you want. We publish a
                  limit, not a guarantee. <Link href="/flights-api/parallel-date-scan" className="text-signal-400 underline underline-offset-4">Parallel scans →</Link>
                </>,
              ],
              [
                'Itinerary breadth',
                'Multi-city via type=3 with multi_city_json; travel_class covers Economy, Premium economy, Business and First; a carbon_emissions object per itinerary.',
                'One-way and round-trip only: no multi-city or open-jaw. seat_type documents Economy and Business only. No emissions data at all; for anything with a sustainability angle that is close to disqualifying for us.',
              ],
              [
                'Legal',
                'They advertise a “U.S. Legal Shield [that] provides up to $2 million in coverage for the scraping and parsing of search engine data, as long as your use … is not illegal.” For a company whose legal team asks about scraping exposure, that clause may end the evaluation on its own, reasonably.',
                'No equivalent indemnity.',
              ],
              [
                'AI agents',
                'We are not aware of a comparable first-party MCP endpoint from SerpApi (a statement about what we found, not proof of absence).',
                <>
                  First-party hosted MCP servers for flights and hotels: point an MCP-capable host at{' '}
                  <code className="font-mono text-[12px]">{LINKS.mcpFlights}</code> with your key and search becomes a native tool.{' '}
                  <Link href="/mcp" className="text-signal-400 underline underline-offset-4">MCP setup →</Link>
                </>,
              ],
              [
                'Hotels by market',
                'SerpApi has a Google Hotels engine; we did not find a per-country residential-proxy equivalent in their documentation, but we have not verified its absence. Treat this as “ours has it,” not “theirs does not.”',
                <>
                  The companion Booking.com API accepts <code className="font-mono text-[12px]">proxy_country</code>: the same room
                  priced as a US, German or Israeli visitor sees it, for rate-parity monitoring.{' '}
                  <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4">Geo-pricing →</Link>
                </>,
              ],
            ]}
          />
        </div>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          One more FlightPowers-side note that is not a feature row: the own-domain front (<code className="font-mono text-[12px]">api.flightpowers.com</code>)
          holds no server-side API key: it forwards yours upstream and returns the response unchanged. It is a pass-through, not a
          shared gateway reselling one pooled key, so no other customer’s traffic can exhaust your limit.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which should you pick" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose SerpApi when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You need more Google surfaces than flights: one vendor, one bill.</li>
              <li>You want price history charted without building it.</li>
              <li>Multi-city itineraries or carbon emissions matter to your product.</li>
              <li>Premium economy or first class must be searchable.</li>
              <li>Your legal team wants the indemnity clause.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>Flights (and hotels) are the product and unit economics care about cost per search.</li>
              <li>Round-trips are a large share of your searches: one request, not two.</li>
              <li>You scan date ranges in bursts and want per-minute headroom.</li>
              <li>You are wiring the data into an AI agent over MCP.</li>
              <li>You need per-country hotel rate comparison.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          Plenty of teams run both: SerpApi for general Google surfaces, a specialist for the flight path that carries the volume.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Try it" title="One command, no token dance" />
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
            There is a free tier (10 requests/month, hard cap: enough to verify your key, not to evaluate). The full walkthrough is
            in{' '}
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/compare/duffel', label: 'vs Duffel', sub: 'Data API vs booking platform' },
            { href: '/compare/amadeus', label: 'vs Amadeus Self-Service', sub: 'And when to migrate' },
            { href: '/guides/best-flight-data-apis-2026', label: 'Best flight data APIs 2026', sub: 'The full field, disclosed bias' },
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The verdict field, proven' },
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
          title="Specialist prices for a specialist job"
          body="Live Google Flights data with the price band and verdict on every result, and round-trips that cost one request, not two."
        />
      </Section>
    </>
  );
}
