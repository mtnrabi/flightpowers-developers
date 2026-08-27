import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import {
  Breadcrumbs,
  Code,
  Container,
  Cta,
  FaqSection,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'REST API direct: api.flightpowers.com',
  description:
    'Call the FlightPowers travel-data API directly at api.flightpowers.com: six endpoints for flights and hotels plus GET /v1/verify. Auth via x-rapidapi-key, x-api-key, or Bearer, the same key from RapidAPI.',
  alternates: { canonical: '/integrations/api' },
});

const CURL = `curl -X POST "https://api.flightpowers.com/v1/flights/oneway" \\
  -H "x-api-key: $RAPIDAPI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"from_airport":"LHR","to_airport":"JFK","departure_date":"2026-10-13"}'`;

const CURL_HOTELS = `curl -X POST "https://api.flightpowers.com/v1/hotels/search" \\
  -H "x-api-key: $RAPIDAPI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destination":"Lisbon","checkin_date":"2026-10-09","checkout_date":"2026-10-12"}'`;

/** Verbatim 401 body from a keyless POST, captured 2026-08-26. */
const MISSING_KEY_401 = `{
  "error": {
    "type": "missing_api_key",
    "message": "No API key was supplied. Send your RapidAPI key
      as an \`x-api-key\` header (or \`x-rapidapi-key\`, or
      \`Authorization: Bearer <key>\`). Get a key by subscribing
      at https://rapidapi.com/mtnrabi -- a free tier is
      available. Passing the key as \`?api_key=\` also works but
      is discouraged: keys in URLs end up in server logs and
      browser history."
  }
}`;

const faq: Faq[] = [
  {
    q: 'Do I need a different key for this host?',
    a: 'No. The same RapidAPI key you get from either listing authenticates here, and usage meters against the same subscription. api.flightpowers.com is a front on our own domain, not a separate product.',
  },
  {
    q: 'Which auth header should I use?',
    a: 'Any of the three: x-rapidapi-key, x-api-key, or Authorization: Bearer <key>. They are equivalent. A key in the query string (?api_key=) works too but is discouraged: keys in URLs end up in server logs and browser history, as the API’s own 401 message puts it.',
  },
  {
    q: 'Why call this host instead of the RapidAPI host?',
    a: 'A stable own-domain base URL with an OpenAPI spec at a fixed path, and no x-rapidapi-host header to set. The RapidAPI host works exactly as documented on the listings; this one is the same API surface addressed directly. Pick one and stay consistent.',
  },
  {
    q: 'What does GET /v1/verify do?',
    a: 'It checks the key you send and answers with which header it found the key in and your plan’s request quota and remainder. Its 401s are specific (a placeholder like YOUR_API_KEY is called out by name), which makes it the endpoint to smoke-test your setup against. The key checker on the pricing page uses it.',
  },
  {
    q: 'Where is the full parameter reference?',
    a: 'The interactive docs at api.flightpowers.com/docs and the machine-readable spec at /openapi.json, both generated from the same API. The listing READMEs on RapidAPI carry the same reference with response examples.',
  },
];

export default function RestApiIntegrationPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'REST API', item: `${SITE.url}/integrations/api` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/integrations', label: 'Integrations' }, { href: '/integrations/api', label: 'REST API' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
            <div>
              <p className="eyebrow">Integrations · REST</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
                One POST, flat JSON, <span className="text-signal-500">no SDK</span>
              </h1>
              <p className="lede mt-5">
                api.flightpowers.com is the API on our own domain: {COUNTS.restEndpoints} endpoints for flights and hotels,
                a verify endpoint for your key, and an OpenAPI spec. The key from RapidAPI works here unchanged.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'integration')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <a href={LINKS.apiDocs} rel="noopener" className="btn btn-ghost">
                  Interactive docs
                </a>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>
            <div>
              <Code label="your first call · flights">{CURL}</Code>
              <div className="mt-4">
                <Code label="the same call · hotels">{CURL_HOTELS}</Code>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The surface"
          title={`${COUNTS.restEndpoints} endpoints, plus one to check your key`}
          lede="All POST with a JSON body, except the verify endpoint. Full parameters in the docs and openapi.json."
        />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="POST /v1/flights/oneway" type="flights">
            One-way fares with Google&apos;s price band, the low | typical | high verdict, and a buy_link on every result.
          </FieldRow>
          <FieldRow name="POST /v1/flights/roundtrip" type="flights">
            Paired-leg round-trip itineraries: one object per option with both legs matched and a combined total_price.
          </FieldRow>
          <FieldRow name="POST /v1/hotels/search" type="hotels">
            Destination search over live Booking.com rates. The destination field is required: it takes free text like
            &ldquo;Paris&rdquo; or &ldquo;Tokyo Shibuya&rdquo;.
          </FieldRow>
          <FieldRow name="POST /v1/hotels/by-name" type="hotels">
            Availability and price for one property by the name a human would type, resolution included. proxy_country
            prices it from any market.
          </FieldRow>
          <FieldRow name="POST /v1/hotels/rooms" type="hotels">
            The full room list for one property: room type, meal plan, guest capacity, and price per room.
          </FieldRow>
          <FieldRow name="POST /v1/hotels/resolve" type="hotels">
            Turns a hotel name into its Booking.com ID. Cache the ID and hit the rooms endpoint directly on every later check.
          </FieldRow>
          <FieldRow name="GET /v1/verify" type="utility">
            Checks the key you send and reports which header carried it plus your plan&apos;s quota and remainder. The
            smoke-test for a fresh integration.
          </FieldRow>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a href={LINKS.apiDocs} rel="noopener" className="chip">
            api.flightpowers.com/docs
          </a>
          <a href={LINKS.openapi} rel="noopener" className="chip">
            openapi.json
          </a>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Auth"
          title="Three headers, one key"
          lede="Send your RapidAPI key as x-rapidapi-key, x-api-key, or Authorization: Bearer, whichever your HTTP client makes easiest. Get it wrong and the API tells you exactly what to fix:"
        />
        <div className="mt-8 max-w-3xl">
          <Code label="keyless request → HTTP 401, verbatim">{MISSING_KEY_401}</Code>
          <p className="mt-4 text-[14px] text-ink-400 leading-relaxed">
            The 401s stay this specific: send a placeholder like{' '}
            <code className="font-mono text-[12.5px]">YOUR_API_KEY</code> and the response says so by name instead of a bare
            &ldquo;unauthorized&rdquo;. Debugging auth here is reading, not guessing.
          </p>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Keep exploring" title="Related pages" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api', label: 'Flights API', sub: 'Endpoints & fields in depth' },
            { href: '/hotels-api', label: 'Hotels API', sub: 'Search, by-name, geo-pricing' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans + the key checker' },
            { href: '/integrations', label: 'All integrations', sub: 'MCP, n8n, Apify & agents' },
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
          medium="integration"
          title="The first call is a curl paste away"
          body="Get a key, paste the one-liner above, and read a real fare with Google's own verdict attached, before you write a line of application code."
        />
      </Section>
    </>
  );
}
