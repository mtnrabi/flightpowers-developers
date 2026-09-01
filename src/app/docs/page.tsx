import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Breadcrumbs,
  Code,
  Container,
  Cta,
  JsonLd,
  Section,
  SectionHead,
} from '@/components/ui';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'API docs: flights and hotels, endpoint by endpoint',
  description:
    'Documentation for both FlightPowers APIs: the Google Flights API (one-way, round-trip, price insights, search status) and the Booking.com Hotels API (destination search, name lookup, room-level pricing, geo-pricing). Auth, hosts, and the OpenAPI spec.',
  alternates: { canonical: '/docs' },
});

export const dynamic = 'force-static';

/** The captured JFK→CUN request from the fixtures, as a copy-pasteable curl. */
const AUTH_EXAMPLE = `curl -X POST "https://google-flights-live-api.p.rapidapi.com/api/google_flights/oneway/v1" \\
  -H "Content-Type: application/json" \\
  -H "x-rapidapi-host: google-flights-live-api.p.rapidapi.com" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -d '{
    "from_airport": "JFK",
    "to_airport": "CUN",
    "departure_date": "2027-01-01",
    "limit": 5,
    "currency": "usd"
  }'`;

const FLIGHTS_PAGES = [
  {
    href: '/flights-api/one-way',
    method: 'POST /oneway',
    label: 'One-way search',
    sub: 'A route and a date in, every live flight price out: full request and response reference.',
  },
  {
    href: '/flights-api/round-trip',
    method: 'POST /roundtrip',
    label: 'Round-trip search',
    sub: 'Paired-leg itineraries with combined totals; every one-way filter, per leg.',
  },
  {
    href: '/flights-api/price-insights',
    method: 'response fields',
    label: 'Price insights',
    sub: 'Price context from Google Flights on every result.',
  },
  {
    href: '/flights-api/search-status',
    method: 'response headers',
    label: 'Search status',
    sub: 'The X-Search-* headers: telling a real empty apart from a failed search.',
  },
  {
    href: '/flights-api/parallel-date-scan',
    method: 'rate limits',
    label: 'Parallel date scans',
    sub: `${COUNTS.flightsRateLimits} req/min by plan: flexible dates as one burst.`,
  },
] as const;

const HOTELS_PAGES = [
  {
    href: '/hotels-api/search',
    method: 'POST /search',
    label: 'Destination search',
    sub: 'Free-text destination and dates in; ranked properties with live prices out.',
  },
  {
    href: '/hotels-api/by-name',
    method: 'POST /hotel_by_name',
    label: 'Hotel by name',
    sub: 'The name a human would type; availability, price and a booking link back.',
  },
  {
    href: '/hotels-api/geo-pricing',
    method: 'proxy_country',
    label: 'Geo-pricing & rate parity',
    sub: 'Price the same room from any market through a residential proxy.',
  },
  {
    href: '/hotels-api/bulk',
    method: 'POST /resolve + /hotel',
    label: 'Competitive-set tracking',
    sub: 'Resolve a name to its Booking.com ID once, then pull room-by-room prices.',
  },
] as const;

function EndpointGrid({ pages }: { pages: readonly { href: string; method: string; label: string; sub: string }[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pages.map((p) => (
        <Link key={p.href} href={p.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
          <p className="font-mono text-[11px] text-signal-500">{p.method}</p>
          <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{p.label}</p>
          <p className="mt-1.5 text-[13.5px] text-ink-400 leading-relaxed">{p.sub}</p>
        </Link>
      ))}
    </div>
  );
}

export default function DocsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'FlightPowers API Documentation',
          url: `${SITE.url}/docs`,
          description:
            'Documentation for the Google Flights API and the Booking.com Hotels API: endpoints, parameters, response fields, auth, and the OpenAPI spec.',
          hasPart: [
            { '@type': 'WebPage', name: 'Google Flights API', url: `${SITE.url}/flights-api` },
            { '@type': 'WebPage', name: 'Booking.com Hotels API', url: `${SITE.url}/hotels-api` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE.url}/docs` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/docs', label: 'Docs' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-12">
          <p className="eyebrow">Documentation</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            Two APIs, documented <span className="text-signal-500">endpoint by endpoint</span>
          </h1>
          <p className="lede mt-5 max-w-2xl">
            Live Google Flights prices and live Booking.com hotel rates, each with full request and response references, captured
            example runs, and code you can paste. Start with either hub, or jump straight to an endpoint.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Cta href="/flights-api" variant="primary">
              Flights API docs
            </Cta>
            <Cta href="/hotels-api" variant="primary">
              Hotels API docs
            </Cta>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="Google Flights API"
          title="Flights: live prices with price context"
          lede="Two endpoints over live Google Flights results. Round-trips come back as paired itineraries, and every result carries price context from Google Flights and a booking link."
        />
        <EndpointGrid pages={FLIGHTS_PAGES} />
        <p className="mt-5 text-[14px] text-ink-400">
          Full request tables for both endpoints live on the{' '}
          <Link href="/flights-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            Flights API hub
          </Link>
          .
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Booking.com Hotels API"
          title="Hotels: live rates, priced from any market"
          lede="Search a destination or name a hotel and get Booking.com's live rates, review scores, room types and booking links. Every endpoint accepts proxy_country, the field behind rate-parity and geo-pricing monitoring."
        />
        <EndpointGrid pages={HOTELS_PAGES} />
        <p className="mt-5 text-[14px] text-ink-400">
          The request surface and all {COUNTS.hotelFilters} search filters live on the{' '}
          <Link href="/hotels-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            Hotels API hub
          </Link>
          .
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Auth"
          title="One key scheme for both APIs"
          lede="Each API is a RapidAPI listing with a $0 tier (10 requests/month, hard cap) to verify your integration. Subscribe, then send your key on every request:"
        />
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <Code label="curl · the captured JFK→CUN request from the one-way page">{AUTH_EXAMPLE}</Code>
          </div>
          <div className="text-[15px] text-ink-300 leading-relaxed space-y-4">
            <p>
              Two headers do all the work: <code className="field">x-rapidapi-key</code> carries your key and{' '}
              <code className="field">x-rapidapi-host</code> names the listing. The hosts are{' '}
              <code className="field">google-flights-live-api.p.rapidapi.com</code> for flights and{' '}
              <code className="field">booking-live-api.p.rapidapi.com</code> for hotels; subscriptions are per API.
            </p>
            <div className="flex flex-wrap gap-3">
              <Cta href={rapidApiPricingUrl('flights', 'docs')} external variant="ghost">
                Flights key on RapidAPI →
              </Cta>
              <Cta href={rapidApiPricingUrl('hotels', 'docs')} external variant="ghost">
                Hotels key on RapidAPI →
              </Cta>
            </div>
            <p className="text-[14px] text-ink-400">
              Plan quotas and rate limits are on{' '}
              <Link href="/pricing" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                the pricing page
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="OpenAPI"
          title="The spec, and the own-domain front"
          lede="Both APIs also run under one roof at api.flightpowers.com, with the same RapidAPI key. That front is where the machine-readable spec lives."
        />
        <div className="mt-8 max-w-3xl text-[15px] text-ink-300 leading-relaxed space-y-4">
          <p>
            The paths mirror the marketplace endpoints: <code className="field">/v1/flights/oneway</code>,{' '}
            <code className="field">/v1/flights/roundtrip</code>, <code className="field">/v1/hotels/search</code>,{' '}
            <code className="field">/v1/hotels/by-name</code>, <code className="field">/v1/hotels/rooms</code> and{' '}
            <code className="field">/v1/hotels/resolve</code>, plus <code className="field">GET /v1/verify</code> for the
            cheapest possible &ldquo;does my key work&rdquo; check. The key goes in{' '}
            <code className="field">x-rapidapi-key</code>, <code className="field">x-api-key</code>, or{' '}
            <code className="field">Authorization: Bearer</code>, whichever your client makes easiest.
          </p>
          <ul className="space-y-1.5 font-mono text-[13px]">
            <li>
              <span className="text-ink-500">spec · </span>
              <a href={LINKS.openapi} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                api.flightpowers.com/openapi.json
              </a>
            </li>
            <li>
              <span className="text-ink-500">interactive reference · </span>
              <a href={LINKS.apiDocs} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                api.flightpowers.com/docs
              </a>
            </li>
          </ul>
          <p className="text-[14px] text-ink-400">
            The{' '}
            <Link href="/integrations/api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              direct-API integration page
            </Link>{' '}
            covers the front in detail, error shapes included.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Beyond REST" title="The same data, other surfaces" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/mcp', label: 'MCP servers', sub: 'One URL for Claude, Cursor, or any MCP client' },
            { href: '/integrations', label: 'Integrations', sub: 'n8n, Zapier, Make, LangChain and more' },
            { href: '/tools', label: 'Free tools', sub: 'Try both APIs in the browser, no key' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans, quotas and rate limits for both APIs' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
