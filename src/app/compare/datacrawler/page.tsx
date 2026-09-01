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
import { FLIGHT_PLANS, perThousand } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'FlightPowers vs DataCrawler Google Flights API on RapidAPI',
  description:
    'An honest comparison of DataCrawler Google Flights API and FlightPowers on RapidAPI: cost per search, free tier generosity, round-trip handling, and what each does better. Competitor figures quoted from APIHiver and DataCrawler RapidAPI listing, retrieved 2026-09-01.',
  alternates: { canonical: '/compare/datacrawler' },
});

export const dynamic = 'force-static';

/** Competitor figures below are QUOTES from rapidapi.com/DataCrawler and apihiver.com, retrieved 2026-09-01. Do not edit without re-verifying. */
const RETRIEVED = '2026-09-01';

const ULTRA = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
const ULTRA_PER_SEARCH = `$${(ULTRA.priceMonthly / ULTRA.quota).toFixed(4)}`;

const faq: Faq[] = [
  {
    q: 'Is DataCrawler free tier more generous than FlightPowers?',
    a: `Yes, honestly: DataCrawler BASIC plan offers 150 requests per month at $0, against our 10 requests per month. If you need a free tier large enough to validate an integration or run light monitoring, their 150-request cap is genuinely more useful than ours. Our free tier is sized to verify your key; theirs is sized to prototype.`,
  },
  {
    q: 'Which API is cheaper per search at paid tiers?',
    a: `FlightPowers is cheaper per search on published list prices. DataCrawler PRO is $12.99 for 40,000 requests ($0.000325 per search); our PRO is $10 for 2,500 requests ($0.004 per search), but our ULTRA at $25 for 10,000 ($0.0025) still beats DataCrawler PRO on cost per request. Their MEGA at $125 for 600,000 requests is $0.000208 per search, a genuinely competitive unit price at high volume.`,
  },
  {
    q: 'Does DataCrawler support multi-city itineraries?',
    a: 'Yes. Their /api/v1/searchMultiCityFlights endpoint handles 3+ leg journeys via a POST request with a legs array. We support one-way and round-trip only: no multi-city or open-jaw. If you need to price a New York → London → Paris → New York trip in one call, DataCrawler handles it and we do not.',
  },
  {
    q: 'Can both APIs return round-trips in one request?',
    a: `Both can. DataCrawler /api/v1/searchFlights accepts both outbound_date and return_date for round-trip searches. Our dedicated /v1/flights/roundtrip endpoint returns paired legs with a combined total. The structural difference is that theirs is one general search endpoint with optional return_date; ours is a separate round-trip resource with per-leg filters.`,
  },
  {
    q: 'Where do the DataCrawler numbers on this page come from?',
    a: `From apihiver.com/blog/google-flights-api and the RapidAPI DataCrawler listing page, read on 2026-09-01 and quoted rather than paraphrased. If a number here disagrees with their listing today, believe their listing.`,
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
                  <td key={j} className={`px-4 py-3.5 ${j === 0 ? 'font-semibold text-ink-100 whitespace-nowrap' : 'text-ink-300'} text-[13.5px] leading-relaxed`}>
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

export default function CompareDataCrawlerPage() {
  const basic = FLIGHT_PLANS.find((p) => p.name === 'BASIC')!;
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
          name: 'FlightPowers vs DataCrawler Google Flights API',
          url: `${SITE.url}/compare/datacrawler`,
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
            { '@type': 'ListItem', position: 3, name: 'DataCrawler', item: `${SITE.url}/compare/datacrawler` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/datacrawler', label: 'DataCrawler' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · competitor data retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            FlightPowers vs <span className="text-signal-500">DataCrawler</span> Google Flights API
          </h1>
          <p className="lede mt-5 max-w-3xl">
            DataCrawler Google Flights API on RapidAPI is a well-documented, feature-complete product with a genuinely useful free tier and 12 endpoints covering every surface of Google Flights. This page is about where FlightPowers offers better unit economics and where DataCrawler wins on breadth.
          </p>
          <p className="mt-5 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            All competitor figures below were read from DataCrawler RapidAPI listing and APIHiver review on <strong className="text-ink-200">{RETRIEVED}</strong>{' '}
            and are quoted rather than paraphrased. If a number here disagrees with their listing today, believe their listing.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead eyebrow="The one-paragraph version" title="Comprehensive platform vs specialist pricing" />
        <p className="mt-6 max-w-3xl text-[15.5px] text-ink-300 leading-relaxed">
          DataCrawler exposes <strong className="text-ink-100">12 endpoints</strong> that mirror every Google Flights surface: search, multi-city, pagination, calendar pickers, 2-D grids, price graphs, booking details, partner redirect URLs, airport autocomplete, and metadata lookups for countries, currencies, and languages. If your product needs that full toolkit, it is a comprehensive answer. FlightPowers is a <strong className="text-ink-100">narrower, cheaper-per-search specialist</strong>: flights and hotels only, with unit economics built for high-volume monitoring and scanning. Their free tier (150 requests) is more generous than ours (10 requests), and that generosity is worth stating plainly.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Free tier honesty, then cost per search"
          lede="Their pricing table quoted from APIHiver and the RapidAPI listing; ours rendered from the same data that drives our /pricing page."
        />
        <div className="mt-10 space-y-10">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">DataCrawler Google Flights API</h3>
            <CompareTable
              caption={`Quoted from apihiver.com/blog/google-flights-api and rapidapi.com/DataCrawler/api/google-flights2 · retrieved ${RETRIEVED}`}
              head={['Plan', 'Price', 'Searches / month']}
              rows={[
                ['BASIC', '$0 / month', '150 requests'],
                ['PRO', '$12.99 / month', '40,000 requests'],
                ['ULTRA', '$35.00 / month', '(volume not published in source)'],
                ['MEGA', '$125.00 / month', '600,000 requests'],
              ]}
            />
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed max-w-2xl">
              <strong className="text-ink-200">Their free tier is more generous than ours.</strong> 150 requests per month is enough to prototype a working integration or run light monitoring. Our BASIC plan offers 10 requests: enough to verify your key, not to evaluate the data. If free-tier volume matters to your proof-of-concept, DataCrawler wins this row, honestly.
            </p>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">FlightPowers (Google Flights Live API)</h3>
            <PricingTable api="flights" plans={FLIGHT_PLANS} medium="compare" compact />
          </div>
          <div className="max-w-2xl">
            <h3 className="text-[16px] font-semibold text-ink-100 mb-3">Cost per search, on published list prices</h3>
            <CompareTable
              caption={`List price ÷ included volume: arithmetic on both vendors' published numbers (theirs retrieved ${RETRIEVED})`}
              head={['Plan', 'Cost per search']}
              rows={[
                ['DataCrawler PRO', '$0.000325'],
                ['DataCrawler MEGA', '$0.000208'],
                [`FlightPowers ${pro.name}`, perSearch(pro)],
                [`FlightPowers ${ultra.name}`, perSearch(ultra)],
                [`FlightPowers ${mega.name}`, perSearch(mega)],
              ]}
            />
            <p className="mt-4 text-[14.5px] text-ink-400 leading-relaxed">
              At face value, DataCrawler PRO and MEGA plans show a significantly lower per-request cost. The trade is volume commitment: their PRO starts at 40,000 requests for $12.99; ours starts at 2,500 for $10. If your workload genuinely needs tens of thousands of searches per month, their unit price is competitive. If you are running 3,000 searches a month, our $10 PRO plan covers it; their equivalent would bill at $12.99 plus potential overage.
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
            caption={`DataCrawler cells quote or summarise their RapidAPI docs and APIHiver retrieved ${RETRIEVED}; FlightPowers cells are traceable to the live listing.`}
            head={['', 'DataCrawler', 'FlightPowers']}
            rows={[
              [
                'Endpoint coverage',
                '12 endpoints: /searchFlights (one-way and round-trip), /searchMultiCityFlights, /getNextFlights (pagination), /getCalendarPicker, /getCalendarGrid (2-D outbound × return grid), /getPriceGraph, /getBookingDetails, /getBookingURL, /searchAirport (autocomplete), /getLocations, /getCurrency, /getLanguages. Comprehensive.',
                <>
                  4 core endpoints: <code className="font-mono text-[12px]">/v1/flights/oneway</code>, <code className="font-mono text-[12px]">/v1/flights/roundtrip</code>, <code className="font-mono text-[12px]">/v1/flights/parallel-date-scan</code> (via our guidance, not a dedicated endpoint), and <code className="font-mono text-[12px]">/v1/verify</code>. Hotels are a separate API. No multi-city, no metadata lookups.
                </>,
              ],
              [
                'Multi-city itineraries',
                'Yes, via /searchMultiCityFlights with a legs array. You can price New York → London → Paris → New York in one POST.',
                'No. One-way and round-trip only. Multi-city and open-jaw journeys are not supported.',
              ],
              [
                'Round-trip',
                <>
                  One endpoint (<code className="font-mono text-[12px]">/searchFlights</code>) handles both one-way (outbound_date only) and round-trip (outbound_date + return_date). Returns paired results when both dates are supplied.
                </>,
                <>
                  Dedicated <code className="font-mono text-[12px]">/v1/flights/roundtrip</code> endpoint with a single paired-leg response object and per-leg filters (e.g. <code className="font-mono text-[12px]">departure_max_stops</code>, <code className="font-mono text-[12px]">return_min_departure_time</code>).{' '}
                  <Link href="/flights-api/round-trip" className="text-signal-400 underline underline-offset-4">Round-trip API →</Link>
                </>,
              ],
              [
                'Price context',
                <>
                  Their documentation and APIHiver mention returning Google Flights data, but we have not verified whether their response includes Google <code className="font-mono text-[12px]">price_insights</code> band or the price context field. Treat this as "we do not know," not "they lack it."
                </>,
                <>
                  Every result carries <code className="font-mono text-[12px]">price_insights_low/high</code> (the historical band Google shows) plus <code className="font-mono text-[12px]">price_insights_verdict</code> (price context: low, typical, or high), which is the fare-alert trigger condition.{' '}
                  <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">Proven here →</Link>
                </>,
              ],
              [
                'Calendar and price-graph endpoints',
                'First-class: /getCalendarPicker returns cheapest fare per date; /getCalendarGrid returns a 2-D outbound × return matrix; /getPriceGraph returns price-over-time trends. If your UI is a heatmap or a trend chart, these are ready-made.',
                <>
                  No dedicated calendar or price-graph endpoints. You loop dates in parallel at the published per-minute rate limits (150/min on PRO, 250/min on ULTRA, 500/min on MEGA) to build your own grid.{' '}
                  <Link href="/flights-api/parallel-date-scan" className="text-signal-400 underline underline-offset-4">Parallel scans →</Link>
                </>,
              ],
              [
                'Pagination',
                'Explicit: /getNextFlights accepts a next_token from a prior search to fetch additional results. If you need more than the initial batch, the mechanism is documented.',
                <>No pagination endpoint. Each search returns up to the <code className="font-mono text-[12px]">limit</code> (default 10, adjustable per request). To get more, adjust the filter and search again.</>,
              ],
              [
                'Empty results',
                'We have not evaluated how their responses distinguish "no flights" from a degraded search, so we state no claim.',
                <>
                  Handled at the response layer: <code className="font-mono text-[12px]">X-Search-Status</code> (ok | empty | partial | degraded) distinguishes "no itineraries" from "search failed," and opt-in <code className="font-mono text-[12px]">strict: true</code> turns a degraded search into HTTP 503.{' '}
                  <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">Search status →</Link>
                </>,
              ],
              [
                'AI agents',
                'We are not aware of a first-party MCP server or tool schema from DataCrawler (a statement about what we found, not proof of absence).',
                <>
                  First-party hosted MCP servers for flights and hotels: point an MCP-capable host at <code className="font-mono text-[12px]">{LINKS.mcpFlights}</code> with your key and search becomes a native tool.{' '}
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
            <h3 className="text-[16px] font-semibold text-ink-100">Choose DataCrawler when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>You need multi-city itineraries: their /searchMultiCityFlights handles 3+ legs and we do not.</li>
              <li>Your UI renders price calendars, 2-D grids, or trend graphs: their dedicated endpoints return those shapes.</li>
              <li>You want a generous free tier to prototype (150 requests vs our 10).</li>
              <li>You need airport autocomplete, currency lists, or language metadata from the same API.</li>
              <li>You are comfortable committing to 40,000 requests/month to access their PRO unit price.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Choose FlightPowers when</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] text-ink-400 leading-relaxed list-disc pl-5">
              <li>One-way and round-trip cover your use case and you do not need multi-city.</li>
              <li>You are running 2,500–10,000 searches/month and unit economics matter: our $10 or $25 plans beat theirs on total cost.</li>
              <li>You scan date ranges in bursts and want published per-minute rate limits (150 to 500/min).</li>
              <li>You need Google price verdict (price context) on every result for alerting logic.</li>
              <li>You are wiring the data into an AI agent over MCP.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          Nothing about running both prevents it: use DataCrawler for the surfaces they cover better, and a specialist for the high-volume one-way and round-trip path.
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
            The free tier verifies your key in a minute. The full walkthrough is in{' '}
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
            { href: '/compare/duffel', label: 'vs Duffel', sub: 'Data API vs booking platform' },
            { href: '/guides/best-flight-data-apis-2026', label: 'Best flight data APIs 2026', sub: 'The full field, disclosed bias' },
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The price_range_in_relation_to_other_periods field, proven' },
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
          title="Specialist unit economics for the high-volume path"
          body="Live Google Flights data with the price band and verdict on every result, built for scanning and monitoring."
        />
      </Section>
    </>
  );
}
