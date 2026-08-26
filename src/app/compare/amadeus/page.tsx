import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CtaBand } from '@/components/bands';
import {
  Breadcrumbs,
  Code,
  Container,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Amadeus Self-Service vs FlightPowers, and when to migrate',
  description:
    'The Amadeus for Developers Self-Service portal and sandbox are no longer reachable, verifiable with four commands, all shown here. What FlightPowers replaces for Self-Service users, the parameter mapping, and (honestly) what it does not replace. Observed state retrieved 2026-08-24.',
  alternates: { canonical: '/compare/amadeus' },
};

export const dynamic = 'force-static';

/** Observed Amadeus state below was retrieved 2026-08-24. Do not edit without re-verifying. */
const RETRIEVED = '2026-08-24';

const faq: Faq[] = [
  {
    q: 'Did Amadeus Self-Service shut down?',
    a: 'We are not going to assert a shutdown date, because we could not find one on an Amadeus page. What is observable as of 2026-08-24: the Self-Service portal and pricing pages 301-redirect to the Amadeus homepage, the test sandbox host no longer resolves, all 20 repositories in the amadeus4dev GitHub organisation are archived, and their developer-guides README opens with “The Amadeus for Developers Self-Service offer has been deprecated.” The commands to check each of these yourself are on this page.',
  },
  {
    q: 'Should I move to Amadeus Enterprise instead?',
    a: 'If you are an accredited travel business (you hold IATA or ARC accreditation, or work through a consolidator), yes, Enterprise is the appropriate path and it is a serious platform. This page is for the people Enterprise is not designed to serve: indie developers, early-stage startups, internal tooling teams, researchers and AI-agent builders who chose Self-Service precisely because it was self-serve.',
  },
  {
    q: 'Does FlightPowers replace Flight Create Orders or the Hotel Booking API?',
    a: 'No. Nothing on our side issues tickets, creates PNRs, or confirms reservations. If the purchase happened inside your product, we are the wrong answer. Go to Amadeus Enterprise or a booking platform like Duffel. We replace the shopping endpoints: Flight Offers Search and Hotel List + Hotel Search.',
  },
  {
    q: 'Is the data the same as what Amadeus served?',
    a: 'No, and pretending otherwise would waste your afternoon. Amadeus served GDS-sourced content; we return live Google Flights consumer pricing and live Booking.com hotel rates. These are genuinely different datasets with different carrier coverage, and neither is a superset of the other. Run your three hardest routes on both before you cut over.',
  },
  {
    q: 'How does authentication change?',
    a: 'Amadeus used OAuth2 client credentials: fetch a token, watch it expire, refresh it. Here there is no token step: one static x-api-key header, with the key issued by RapidAPI when you subscribe. You can delete your token-refresh code and its cache.',
  },
];

function MapTable({
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
                  <td key={j} className={`px-4 py-3 ${j === 0 ? 'text-ink-100' : 'text-ink-300'} text-[13.5px] leading-relaxed`}>
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

const code = (s: string) => <code className="font-mono text-[12px]">{s}</code>;

export default function CompareAmadeusPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Amadeus Self-Service vs FlightPowers, and when to migrate',
          url: `${SITE.url}/compare/amadeus`,
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
            { '@type': 'ListItem', position: 3, name: 'Amadeus Self-Service', item: `${SITE.url}/compare/amadeus` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/amadeus', label: 'Amadeus Self-Service' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · observed state retrieved {RETRIEVED}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            <span className="text-signal-500">Amadeus Self-Service</span> vs FlightPowers, and when to migrate
          </h1>
          <p className="lede mt-5 max-w-3xl">
            If your Amadeus Self-Service integration stopped working, this page is a migration path. It shows you how to verify the
            situation yourself, maps the calls you were making to their equivalents, and is explicit about the things we do{' '}
            <strong className="text-ink-100">not</strong> replace.
          </p>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead
          eyebrow="The observable state"
          title="Check it yourself, don’t take our word"
          lede={`We are not going to assert a shutdown date, because we could not find one on an Amadeus page. Here is what was observable on ${RETRIEVED}, with the commands.`}
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-[14.5px] text-ink-300 mb-2 font-semibold">The Self-Service portal and pricing pages redirect to the homepage.</p>
            <Code label="curl">{`curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}\\n" \\
  https://developers.amadeus.com/self-service
# 301 -> https://developers.amadeus.com/

curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}\\n" \\
  https://developers.amadeus.com/pricing
# 301 -> https://developers.amadeus.com/`}</Code>
          </div>
          <div>
            <p className="text-[14.5px] text-ink-300 mb-2 font-semibold">The Enterprise portal is still live.</p>
            <Code label="curl">{`curl -sS -o /dev/null -w "%{http_code}\\n" \\
  https://developers.amadeus.com/enterprise
# 200`}</Code>
          </div>
          <div>
            <p className="text-[14.5px] text-ink-300 mb-2 font-semibold">The Self-Service sandbox host no longer resolves.</p>
            <Code label="curl">{`curl -sS -m 15 \\
  https://test.api.amadeus.com/v1/security/oauth2/token
# curl: (6) Could not resolve host: test.api.amadeus.com`}</Code>
          </div>
          <div>
            <p className="text-[14.5px] text-ink-300 mb-2 font-semibold">Every Amadeus developer SDK repository is archived.</p>
            <Code label="gh">{`gh api "orgs/amadeus4dev/repos?per_page=100" \\
  --jq '"archived \\([.[]|select(.archived)]|length) of \\(length)"'
# archived 20 of 20`}</Code>
          </div>
        </div>
        <p className="mt-8 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          That includes <code className="font-mono text-[13px]">amadeus-node</code>,{' '}
          <code className="font-mono text-[13px]">amadeus-python</code> and <code className="font-mono text-[13px]">amadeus-java</code>.
          The <code className="font-mono text-[13px]">developer-guides</code> repository README now opens with:
        </p>
        <blockquote className="mt-4 max-w-3xl border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
          “# [DEPRECATED] Developer Guides”. <strong className="text-ink-100">“The Amadeus for Developers Self-Service offer has been
          deprecated.”</strong>
          <footer className="mt-2 font-mono text-[11px] text-ink-500">github.com/amadeus4dev · retrieved {RETRIEVED}</footer>
        </blockquote>
      </Section>

      <Section>
        <SectionHead eyebrow="Honesty first" title="First: you may not want us" />
        <div className="mt-6 max-w-3xl space-y-5 text-[15.5px] text-ink-300 leading-relaxed">
          <p>
            <strong className="text-ink-100">Amadeus Enterprise still exists and is fully available.</strong> If you are an
            accredited travel business (you hold IATA or ARC accreditation, or you work through a consolidator), Enterprise is the
            appropriate path and it is a serious platform. Nothing on this page argues otherwise, and no data API is a substitute for
            a GDS if a GDS is what you need.
          </p>
          <p>
            This guide is for the people Enterprise is not designed to serve: the indie developers, early-stage startups, internal
            tooling teams, researchers and AI-agent builders who chose Self-Service precisely <em>because</em> it was self-serve. If
            your blocker is that the remaining route requires accreditation and an account manager, read on.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Scope, honestly"
          title="What we do not replace"
          lede="Being clear about this up front saves you an afternoon."
        />
        <div className="mt-8">
          <MapTable
            head={['What you may have been using', 'Do we replace it?', 'Go here instead']}
            rows={[
              ['Flight Create Orders: issuing a ticket, PNR creation', <strong key="a" className="text-verdict-high">No</strong>, <>Amadeus Enterprise, or <Link href="/compare/duffel" className="text-signal-400 underline underline-offset-4">Duffel</Link></>],
              ['Hotel Booking API: confirmed reservations', <strong key="a" className="text-verdict-high">No</strong>, 'Amadeus Enterprise, or Duffel Stays'],
              ['Flight Offers Price: confirming an offer is bookable', <strong key="a" className="text-verdict-high">No</strong>, 'A booking platform'],
              ['Seat maps, baggage, airline ancillaries', <strong key="a" className="text-verdict-high">No</strong>, 'A booking platform'],
              ['GDS content, published/negotiated fares, corporate contracts', <strong key="a" className="text-verdict-high">No</strong>, 'Amadeus Enterprise'],
              ['Post-booking lifecycle: changes, cancellations, refunds', <strong key="a" className="text-verdict-high">No</strong>, 'A booking platform'],
              ['Multi-city / open-jaw itineraries', <strong key="a" className="text-verdict-high">No</strong>, 'We support one-way and round-trip only'],
              ['Reference data: airports, airlines, cities, POI, transfers, activities', <strong key="a" className="text-verdict-high">No</strong>, 'Not part of our product'],
              ['Flight Offers Search: shopping for prices', <strong key="a" className="text-verdict-low">Yes</strong>, <>{code('/v1/flights/oneway')}, {code('/v1/flights/roundtrip')}</>],
              ['Hotel List + Hotel Search: shopping for room rates', <strong key="a" className="text-verdict-low">Yes</strong>, <>{code('/v1/hotels/search')}, {code('/v1/hotels/by-name')}</>],
            ]}
          />
        </div>
        <div className="mt-8 max-w-3xl space-y-5 text-[15px] text-ink-300 leading-relaxed">
          <p>
            Short version: <strong className="text-ink-100">if the purchase happened inside your product, we are the wrong
            answer.</strong> We return prices and a deep link; the booking happens elsewhere. If you were using Self-Service to{' '}
            <em>shop, monitor, compare or analyse</em> prices (which is what most Self-Service projects did), keep reading.
          </p>
          <p>
            One more honest note on data: Amadeus served GDS-sourced content. We return live Google Flights consumer pricing. These
            are genuinely different datasets with different carrier coverage, and neither is a superset of the other. Test your own
            routes before you commit.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="The migration"
          title="Auth: delete the token dance"
          lede="Amadeus used OAuth2 client credentials: fetch a token, watch it expire, refresh it. Here it is one static header."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Code label="before · from Amadeus's archived amadeus-code-examples">{`ACCESS_TOKEN=$(curl -H "Content-Type: application/x-www-form-urlencoded" \\
  https://test.api.amadeus.com/v1/security/oauth2/token \\
  -d "grant_type=client_credentials&client_id=$AMADEUS_CLIENT_ID\\
&client_secret=$AMADEUS_CLIENT_SECRET" \\
  | grep access_token | sed 's/"access_token": "\\(.*\\)"\\,/\\1/' \\
  | tr -d '[:space:]')`}</Code>
          <div>
            <Code label="after · the whole thing">{`-H "x-api-key: $FLIGHTPOWERS_API_KEY"`}</Code>
            <p className="mt-4 text-[14.5px] text-ink-400 leading-relaxed">
              Get the key by subscribing on{' '}
              <a href={rapidApiPricingUrl('flights', 'compare')} rel="noopener" className="text-signal-400 underline underline-offset-4">
                RapidAPI
              </a>. There is a free tier (10 requests/month, hard cap). You can delete your token-refresh code and its cache. Confirm a
              key authenticates with <code className="font-mono text-[13px]">GET /v1/verify</code> before running real searches.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The migration" title="Flight Offers Search → /v1/flights" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Code label="before · GET /v2/shopping/flight-offers (their archived example)">{`curl -X GET "https://test.api.amadeus.com/v2/shopping/flight-offers?\\
originLocationCode=SYD&destinationLocationCode=BKK&\\
departureDate=2022-08-01&returnDate=2022-08-05&\\
adults=2&includedAirlineCodes=TG&max=3" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</Code>
          <Code label="after · round-trip, one call">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "SYD",
    "to_airport": "BKK",
    "departure_date": "2026-08-01",
    "return_date": "2026-08-05",
    "passengers": [1, 1],
    "departure_airline_codes": ["TG"],
    "limit": 3
  }'`}</Code>
        </div>
        <div className="mt-10">
          <h3 className="text-[16px] font-semibold text-ink-100 mb-3">Parameter mapping</h3>
          <MapTable
            head={['Amadeus Flight Offers Search', 'FlightPowers']}
            rows={[
              [code('originLocationCode'), code('from_airport')],
              [code('destinationLocationCode'), code('to_airport')],
              [code('departureDate'), code('departure_date')],
              [code('returnDate'), <>{code('return_date')}, and use {code('/v1/flights/roundtrip')}</>],
              [code('adults'), <>{code('passengers')}, one entry per traveller: {code('1')} adult, {code('2')} child, {code('3')} infant on lap, {code('4')} infant in seat. Two adults is {code('[1, 1]')}</>],
              [code('includedAirlineCodes'), <>{code('airline_codes')} (round-trip: {code('departure_airline_codes')} / {code('return_airline_codes')})</>],
              [code('excludedAirlineCodes'), code('exclude_airline_codes')],
              [code('max'), <>{code('limit')} (default {code('10')})</>],
              [code('currencyCode'), <>{code('currency')} (default {code('usd')})</>],
              [code('maxPrice'), code('max_price')],
              [code('nonStop=true'), code('max_stops: 0')],
              [code('travelClass'), <>{code('seat_type')}: <strong className="text-ink-100">only {code('1')} Economy and {code('3')} Business.</strong> Premium economy and first are not supported</>],
            ]}
          />
        </div>
        <p className="mt-8 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          Both APIs handle round-trip in a single request, so there is no gain to claim there. The difference is that ours is a
          dedicated endpoint that returns paired legs with a combined total ({code('total_price_as_number')},{' '}
          {code('total_duration_seconds')}, {code('total_stops')}) plus separate {code('departure_flight_*')} and{' '}
          {code('return_flight_*')} blocks, and it accepts <strong className="text-ink-100">per-leg filters</strong>. “Leave after 6pm
          Friday, return before noon Sunday” is one call.
        </p>
        <p className="mt-4 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          Self-Service had no cheapest-date search on Flight Offers Search: you looped. The REST API here works the same way, but
          the per-minute rate limits are published so you can parallelise deliberately: a 31-date scan is one burst, not a serial
          crawl (<Link href="/flights-api/parallel-date-scan" className="text-signal-400 underline underline-offset-4">how that works</Link>).
          If you are building an AI agent, the hosted MCP server at {code(LINKS.mcpFlights)} does the fan-out for you: its flight
          search accepts a date <em>range</em> and a <em>list</em> of destinations and expands the combinations server-side. That is
          an MCP-layer feature, not a REST parameter; on REST you loop. See{' '}
          <Link href="/mcp" className="text-signal-400 underline underline-offset-4">MCP setup</Link>.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="The migration" title="Hotel Search → /v1/hotels" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Code label="before · two calls plus the token">{`# 1. get hotelIds for a city
curl -X GET "https://test.api.amadeus.com/v1/reference-data/\\
locations/hotels/by-city?cityCode=PAR" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 2. price those specific hotels
curl -X GET "https://test.api.amadeus.com/v3/shopping/hotel-offers?\\
hotelIds=MCLONGHM&adults=2&checkInDate=2026-09-10\\
&checkOutDate=2026-09-14" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`}</Code>
          <Code label="after · free-text destination, one call, no ID resolution">{`curl -X POST https://api.flightpowers.com/v1/hotels/search \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination": "Paris",
    "checkin_date": "2026-09-10",
    "checkout_date": "2026-09-14",
    "adults": 2,
    "currency": "EUR"
  }'`}</Code>
        </div>
        <div className="mt-10">
          <MapTable
            head={['Amadeus Hotel Search v3', 'FlightPowers']}
            rows={[
              [<>{code('hotelIds')} (via Hotel List by-city/by-geocode)</>, <>not needed: {code('destination')} takes free text like “Paris” or “Tokyo Shibuya”</>],
              [code('checkInDate'), code('checkin_date')],
              [code('checkOutDate'), code('checkout_date')],
              [code('adults'), <>{code('adults')} (default {code('2')})</>],
              [code('roomQuantity'), 'not supported'],
              [code('currency'), <>{code('currency')} (default {code('usd')})</>],
              [code('priceRange'), <>{code('budget_per_night')}: max per night, in your {code('currency')}</>],
              [<>{code('boardType')}, {code('paymentPolicy')}, {code('bestRateOnly')}</>, <>partially covered by {code('filters')}; not a 1:1 mapping</>],
              [code('countryOfResidence'), <>{code('proxy_country')}: <strong className="text-ink-100">related in intent, different mechanism.</strong> Amadeus’s field is a <em>declared</em> attribute passed to the supplier; ours routes the request through a residential proxy in that country, so you see the rates a real visitor from that market sees. <Link href="/hotels-api/geo-pricing" className="text-signal-400 underline underline-offset-4">Geo-pricing →</Link></>],
            ]}
          />
        </div>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          To look up one named property instead of searching a city, use {code('POST /v1/hotels/by-name')} with {code('hotel_name')},{' '}
          {code('checkin_date')}, {code('checkout_date')}, and optionally {code('area')} to disambiguate generic names.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="What you gain"
          title="What the move buys you"
          lede="Only claims we can point at. Each links to the page that proves it."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">A price verdict, not just a price</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Every flight result carries Google’s historical band ({code('price_insights_low')} / {code('price_insights_high')})
              plus a low | typical | high verdict. Rebuilding a fare-alert feature? That field <em>is</em> the trigger condition, and
              you don’t accumulate months of history first. It can be {code('null')} when Google shows no band. Handle that.{' '}
              <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">Proven here →</Link>
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">An honest empty result</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              {code('X-Search-Status')} separates “Google genuinely has no itineraries” from “the search did not complete,” and
              opt-in {code('strict: true')} turns a degraded search into an HTTP 503 instead of a misleading {code('[]')}.{' '}
              <Link href="/flights-api/search-status" className="text-signal-400 underline underline-offset-4">Search status →</Link>
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">A working buy_link on every result</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              Every itinerary deep-links into Google Flights, so a comparison or alert product can hand off to a bookable page
              without reconstructing URLs. <Link href="/flights-api/one-way" className="text-signal-400 underline underline-offset-4">One-way API →</Link>
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">No OAuth, published rate limits</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              One static header instead of a token lifecycle, and per-minute rate limits published per plan so parallel date scanning
              is a documented capability, not a guess.{' '}
              <Link href="/pricing" className="text-signal-400 underline underline-offset-4">Plans →</Link>
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Checklist" title="A migration checklist" />
        <ol className="mt-8 max-w-3xl space-y-3 list-decimal pl-5 text-[15px] text-ink-300 leading-relaxed">
          <li>Subscribe on RapidAPI (free tier) and confirm the key authenticates with {code('GET /v1/verify')}.</li>
          <li>Delete the OAuth token fetch, cache and refresh logic. Replace with one header.</li>
          <li>
            Rename request fields per the tables above. Watch {code('adults')} → {code('passengers')} (a list) and{' '}
            {code('travelClass')} → {code('seat_type')} (only two cabins).
          </li>
          <li>Rewrite response parsing: the shape is flat JSON, not Amadeus’s {code('data[]')} / {code('dictionaries')} envelope.</li>
          <li>Drop the hotel ID-resolution step; pass {code('destination')} as free text.</li>
          <li>Re-point anything that <em>booked</em> to a booking platform. That work does not migrate.</li>
          <li>Run your three hardest routes on both datasets before you cut over. GDS content and Google Flights content are not identical.</li>
        </ol>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep going" title="Related pages" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/guides/real-time-google-flights-data', label: 'The full API walkthrough', sub: 'Endpoints, fields, parallel scans' },
            { href: '/compare/duffel', label: 'vs Duffel', sub: 'If you need to actually sell tickets' },
            { href: '/compare/serpapi', label: 'vs SerpApi', sub: 'Platform vs specialist' },
            { href: '/guides/best-flight-data-apis-2026', label: 'Best flight data APIs 2026', sub: 'The full field, disclosed bias' },
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
          title="Self-serve, like Self-Service was"
          body="Subscribe, get a key, make a call. No account manager, no accreditation. Free tier: 10 requests/month, hard cap."
        />
      </Section>
    </>
  );
}
