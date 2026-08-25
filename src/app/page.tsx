import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  Section,
  SectionHead,
  Cta,
  Code,
  Feature,
  FaqSection,
  JsonLd,
  type Faq,
} from '@/components/ui';
import { PricingTable } from '@/components/PricingTable';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { LINKS, SITE } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'FlightPowers — real-time flight and hotel pricing APIs',
  description:
    'REST APIs for live Google Flights and Booking.com prices. Google price-insights bands with a ' +
    'low/typical/high verdict, paired-leg round-trip search, per-country hotel pricing, and a ' +
    'Google Flights deep link on every itinerary.',
  alternates: { canonical: '/' },
};

const REQUEST = `curl -X POST https://api.flightpowers.com/v1/flights/oneway \\
  -H "x-api-key: $RAPIDAPI_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "from_airport": "JFK",
    "to_airport": "LHR",
    "departure_date": "2026-09-22",
    "limit": 3
  }'`;

const RESPONSE = `[
  {
    "price_insights_low": 65,
    "price_insights_high": 135,
    "price_range_in_relation_to_other_periods": "low",
    "from_airport": "New York (JFK)",
    "to_airport": "London (LHR)",
    "departure_date": "2026-09-22",
    "price": "$56",
    "price_as_number": 56,
    "duration": "6 hr 55 min",
    "duration_seconds": 24900,
    "airline": "Norse Atlantic UK",
    "stops": 0,
    "stops_info": [],
    "departure_description": "8:35 PM on Tue, Sep 22",
    "arrival_description": "8:30 AM on Wed, Sep 23",
    "buy_link": "https://www.google.com/travel/flights?tfs=...&curr=usd"
  }
]`;

const faqs: Faq[] = [
  {
    q: 'What exactly does price_insights_low and price_insights_high mean?',
    a:
      'They are the low and high ends of the historical price band Google Flights itself shows for ' +
      'that route and date, read from the Google Flights page the search loads. They come back as ' +
      'integers in the requested currency, and they are null when Google does not publish a band ' +
      'for that search. Alongside them, price_range_in_relation_to_other_periods carries Google’s ' +
      'own verdict on the current fare: "low", "typical" or "high".',
  },
  {
    q: 'How is your round trip different from calling a one-way endpoint twice?',
    a:
      'POST /v1/flights/roundtrip is a single paired-leg search. The outbound leg selected drives a ' +
      'filtered return-leg query, so the outbound and return you get back are an itinerary that can ' +
      'actually be bought together, at a combined price, with one buy_link. Two independent one-way ' +
      'searches give you two fares that may not be sellable as one ticket. It also lets you filter ' +
      'each leg separately — max_departure_stops and max_return_stops, departure_airline_codes and ' +
      'return_airline_codes, and independent time windows on each leg.',
  },
  {
    q: 'What is proxy_country for?',
    a:
      'Every hotels endpoint accepts an optional proxy_country. It routes that single request through ' +
      'a residential proxy exiting in that country, so the prices you get back are the prices a ' +
      'resident of that country sees. Send the same hotel and the same dates several times with ' +
      'different values and you have a rate-parity or geo-pricing comparison. Omit it and the request ' +
      'uses a global rotating pool.',
  },
  {
    q: 'Do I need an account with you?',
    a:
      'No. Both APIs are sold through RapidAPI and you use your RapidAPI key. api.flightpowers.com is ' +
      'a pass-through front for the same APIs under one host and one credential — it holds no key ' +
      'of its own, and your calls are billed to your own RapidAPI subscription either way.',
  },
  {
    q: 'Which authentication headers does api.flightpowers.com accept?',
    a:
      'x-api-key, x-rapidapi-key, x-rapidapi-token, or Authorization with a Bearer, ApiKey or Token ' +
      'prefix. Headers take precedence over the query string, where api_key, apikey, rapidapi_key and ' +
      'key are also accepted.',
  },
  {
    q: 'What happens when a plan’s rate limit is hit?',
    a:
      'A 429 from upstream is returned to you as-is and is never retried, so an exhausted plan cannot ' +
      'be double-billed by a retry. Server errors (500, 502, 503, 504) are retried once.',
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE.name,
          url: SITE.url,
          description:
            'REST APIs for real-time flight and hotel pricing, with Google price-insights bands and per-country hotel rates.',
        }}
      />

      {/* ---------- Hero ---------- */}
      <div className="board-grid border-b rule">
        <Container className="py-20 sm:py-28">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
            <div>
              <p className="eyebrow">Flight &amp; hotel pricing &middot; REST &amp; MCP</p>
              <h1 className="mt-5 text-[length:var(--text-hero)] leading-[var(--text-hero--line-height)] tracking-[var(--text-hero--letter-spacing)] font-semibold">
                Live fares, and the context to judge them.
              </h1>
              <p className="lede mt-6 max-w-xl">
                Two REST APIs that return what a traveller sees right now on Google Flights and
                Booking.com &mdash; plus the fields that tell you whether a price is any good:
                Google&rsquo;s own historical price band, its low / typical / high verdict, and a
                deep link straight to the itinerary.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Cta href={LINKS.rapidapiFlights} external>
                  Get a flights key
                </Cta>
                <Cta href="/flights-api" variant="ghost">
                  Read the flights reference
                </Cta>
              </div>
              <p className="mt-5 font-mono text-[11px] text-ink-600">
                Free tier: 10 requests / month, no card. Paid plans from $10 / month.
              </p>
            </div>

            <div className="space-y-4 min-w-0">
              <Code label="request">{REQUEST}</Code>
              <Code label="200 &mdash; response">{RESPONSE}</Code>
            </div>
          </div>
        </Container>
      </div>

      {/* ---------- Differentiators ---------- */}
      <Section bordered={false}>
        <SectionHead
          eyebrow="What the response carries"
          title="Three fields that decide whether you have to build the hard part yourself."
          lede="Anyone can hand you a price. These are the parts that usually cost you a second data source, a pricing model, or a support ticket."
        />

        <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-3">
          <div>
            <p className="field">price_insights_low / _high</p>
            <h3 className="mt-3 text-lg font-semibold">Google&rsquo;s own price band</h3>
            <p className="mt-2.5 text-sm text-ink-400 leading-relaxed">
              The low and high ends of the historical fare range Google Flights displays for that
              route and date, as integers, plus{' '}
              <code className="field">price_range_in_relation_to_other_periods</code> &mdash; Google&rsquo;s
              verdict on today&rsquo;s fare, <code className="field">&quot;low&quot;</code>,{' '}
              <code className="field">&quot;typical&quot;</code> or{' '}
              <code className="field">&quot;high&quot;</code>. You get &ldquo;is this a good price?&rdquo;
              without modelling it yourself.
            </p>
          </div>

          <div>
            <p className="field">POST /v1/flights/roundtrip</p>
            <h3 className="mt-3 text-lg font-semibold">A real paired-leg round trip</h3>
            <p className="mt-2.5 text-sm text-ink-400 leading-relaxed">
              One request, one billed call, one sellable itinerary: the chosen outbound drives a
              filtered return-leg search, and you get a combined price and a single{' '}
              <code className="field">buy_link</code>. Each leg takes its own stop limit, airline
              filter and time window.
            </p>
          </div>

          <div>
            <p className="field">proxy_country</p>
            <h3 className="mt-3 text-lg font-semibold">Hotel prices from a chosen country</h3>
            <p className="mt-2.5 text-sm text-ink-400 leading-relaxed">
              Every hotels endpoint takes an optional country code and routes that request through a
              residential proxy exiting there. The same room, priced from five markets, is five
              calls &mdash; which is what rate-parity and geo-pricing monitoring actually require.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Honest empty results ---------- */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-start">
          <div>
            <p className="eyebrow">Search outcome headers</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">
              An empty array is not an answer.
            </h2>
            <p className="lede mt-4">
              A bare <code className="field">200 []</code> is ambiguous: it can mean Google returned
              no itineraries, or it can mean the search did not complete. Those are opposite facts
              and a fare-alert app that confuses them sends the wrong alert.
            </p>
            <p className="mt-4 text-sm text-ink-400 leading-relaxed">
              Flight searches served from the RapidAPI host carry the outcome in response headers.{' '}
              <code className="field">x-search-status</code> is one of{' '}
              <code className="field">ok</code>, <code className="field">partial</code>,{' '}
              <code className="field">degraded</code> or <code className="field">empty</code> &mdash;{' '}
              <code className="field">empty</code> means Google genuinely had nothing,{' '}
              <code className="field">degraded</code> means the search failed and the response says
              nothing about availability. <code className="field">x-search-reason</code> names the
              cause. Send <code className="field">&quot;strict&quot;: true</code> and a degraded
              search returns <code className="field">503</code> instead of a misleading empty array.
            </p>
            <p className="mt-5 rounded border rule bg-ink-900 px-4 py-3 text-[13px] text-ink-400 leading-relaxed">
              <span className="font-mono text-[11px] uppercase tracking-wider text-signal-500">
                Scope
              </span>
              <br />
              Verified on the RapidAPI host on 2026-08-25 by making a real call and reading the
              headers. The same call through <code className="field">api.flightpowers.com</code>{' '}
              returns only quota headers today &mdash; that front does not yet forward the search
              headers. Use the RapidAPI host if your application depends on them.
            </p>
          </div>

          <Code label="response headers &middot; RapidAPI host">{`x-search-status: ok
x-search-results: 3
x-search-combinations: 1
x-search-attempts: 2
x-search-retries: 1
x-search-unreadable-pages: 1
x-search-reason: blocked_page`}</Code>
        </div>
      </Section>

      {/* ---------- Endpoints ---------- */}
      <Section>
        <SectionHead
          eyebrow="Surface"
          title="Six endpoints, one host, one credential."
          lede="api.flightpowers.com fronts both APIs. It stores no key of its own — it forwards yours, so calls are billed to your own subscription."
        />
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-400">Flights</p>
            <ul className="mt-4 space-y-3">
              {[
                ['POST /v1/flights/oneway', 'One-way search'],
                ['POST /v1/flights/roundtrip', 'Paired-leg round trip'],
              ].map(([path, desc]) => (
                <li key={path} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <code className="field">{path}</code>
                  <span className="text-sm text-ink-400">{desc}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/flights-api"
              className="mt-5 inline-block text-sm text-signal-400 hover:text-signal-500"
            >
              Flights API reference &rarr;
            </Link>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-400">Hotels</p>
            <ul className="mt-4 space-y-3">
              {[
                ['POST /v1/hotels/search', 'Search a destination'],
                ['POST /v1/hotels/by-name', 'Price one named property'],
                ['POST /v1/hotels/rooms', 'Room-by-room breakdown'],
                ['POST /v1/hotels/resolve', 'Resolve a name to a property'],
              ].map(([path, desc]) => (
                <li key={path} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <code className="field">{path}</code>
                  <span className="text-sm text-ink-400">{desc}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/hotels-api"
              className="mt-5 inline-block text-sm text-signal-400 hover:text-signal-500"
            >
              Hotels API reference &rarr;
            </Link>
          </div>
        </div>
      </Section>

      {/* ---------- Agents / integrations ---------- */}
      <Section>
        <SectionHead
          eyebrow="Beyond REST"
          title="Already packaged for the tools you use."
        />
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <Feature title="MCP server">
            A bring-your-own-key, ad-free MCP server for flight search, listed on Smithery.{' '}
            <a href={LINKS.smithery} rel="noopener" className="text-signal-400 hover:text-signal-500">
              View it &rarr;
            </a>
          </Feature>
          <Feature title="n8n community node">
            <code className="field">n8n-nodes-flight-hotel-data</code> on npm &mdash; one-way and
            round-trip flight search, hotel search and lookup.{' '}
            <a href={LINKS.npmNode} rel="noopener" className="text-signal-400 hover:text-signal-500">
              View it &rarr;
            </a>
          </Feature>
          <Feature title="Agent skills">
            Eight MIT-licensed skills for cheapest dates, fare watch, trip planning, hotel search and
            rate-parity monitoring.{' '}
            <a href={LINKS.skills} rel="noopener" className="text-signal-400 hover:text-signal-500">
              GitHub &rarr;
            </a>
          </Feature>
          <Feature title="Apify actors">
            Both APIs are also published as Apify actors if that is where your pipeline already
            lives.{' '}
            <a href={LINKS.apifyFlights} rel="noopener" className="text-signal-400 hover:text-signal-500">
              Flights &rarr;
            </a>
          </Feature>
        </div>
      </Section>

      {/* ---------- Pricing ---------- */}
      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Subscribe on RapidAPI. Both APIs start free."
          lede="Billing, keys and quota are RapidAPI's. There is no separate account here."
        />
        <div className="mt-10 grid gap-14 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Google Flights Live API</h3>
            <div className="mt-5">
              <PricingTable
                plans={FLIGHT_PLANS}
                href={LINKS.rapidapiFlights}
                label="Subscribe to the flights API"
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Booking Live API</h3>
            <div className="mt-5">
              <PricingTable
                plans={HOTEL_PLANS}
                href={LINKS.rapidapiHotels}
                label="Subscribe to the hotels API"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section>
        <FaqSection items={faqs} />
      </Section>
    </>
  );
}
