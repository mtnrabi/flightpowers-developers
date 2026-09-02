import type { Metadata } from 'next';
import Link from 'next/link';
import { withOg } from '@/lib/meta';
import { SITE, LINKS, rapidApiPricingUrl } from '@/lib/site';
import { onewaySnippets } from '@/lib/snippets';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { FIXTURES, capturedLabel } from '@/lib/fixtures';
import { Breadcrumbs, Code, Container, JsonLd, Section, SectionHead } from '@/components/ui';
import { EmailCapture } from '@/components/EmailCapture';

/**
 * The quickstart the capture form promises. It exists first, and it is free:
 * nothing on this page is behind the email field. If the promise on the form
 * ever changes, this page changes with it.
 *
 * Every number here is read from src/lib/pricing.ts (parsed from the live
 * listings, drift-checked by scripts/check-pricing.mjs) or from
 * public/openapi.json. Nothing is estimated.
 */

const FLIGHTS_FREE = FLIGHT_PLANS.find((p) => p.priceMonthly === 0)!;
const HOTELS_FREE = HOTEL_PLANS.find((p) => p.priceMonthly === 0)!;

export const metadata: Metadata = withOg({
  title: 'Five-minute quickstart: your first flight and hotel price call',
  description:
    'From zero to a live Google Flights price in five minutes: get a key, verify it, run a one-way search, and read the price verdict. Includes the two field-name mistakes that cost most people their first calls.',
  alternates: { canonical: '/docs/quickstart' },
});

export const dynamic = 'force-static';

const VERIFY = `curl -sS "https://api.flightpowers.com/v1/verify" \\
  -H "x-api-key: $RAPIDAPI_KEY"`;

/**
 * Request AND response below are the captured JFK->CUN run in
 * src/lib/fixtures/oneway-jfk-cun.json - a real response from a live
 * request, not a hand-written example. Nothing on this page is invented.
 */
const ONEWAY = FIXTURES.onewayJfkCun;

const FIRST_CALL = `curl -sS -X POST "https://api.flightpowers.com${ONEWAY.request.endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $RAPIDAPI_KEY" \\
  -d '${JSON.stringify(ONEWAY.request.body, null, 2).replace(/\n/g, '\n  ')}'`;

const CHEAPEST = [...ONEWAY.data].sort((a, b) => a.price_as_number - b.price_as_number)[0]!;

const READ_IT = `// the cheapest row of that captured response, trimmed
${JSON.stringify(
  {
    price: CHEAPEST.price,
    price_as_number: CHEAPEST.price_as_number,
    price_range_in_relation_to_other_periods: CHEAPEST.price_range_in_relation_to_other_periods,
    price_insights_low: CHEAPEST.price_insights_low,
    price_insights_high: CHEAPEST.price_insights_high,
    airline: CHEAPEST.airline,
    duration: CHEAPEST.duration,
  },
  null,
  2
)}`;

/** Same rule for hotels: the captured Lisbon run, plus proxy_country. */
const HOTELS = FIXTURES.hotelSearchLisbon;

const HOTEL_CALL = `curl -sS -X POST "https://api.flightpowers.com${HOTELS.request.endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $RAPIDAPI_KEY" \\
  -d '${JSON.stringify({ ...HOTELS.request.body, proxy_country: 'de' }, null, 2).replace(/\n/g, '\n  ')}'`;

const RAPIDAPI_HOST_CALL = onewaySnippets(
  {
    from: String(ONEWAY.request.body.from_airport),
    to: String(ONEWAY.request.body.to_airport),
    date: String(ONEWAY.request.body.departure_date),
  },
  'rapidapi'
).curl;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:gap-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-signal-600/40 bg-signal-600/10 font-mono text-[13px] text-signal-400">
        {n}
      </div>
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold text-ink-100">{title}</h3>
        <div className="mt-2 space-y-4 text-[15px] text-ink-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function QuickstartPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'Five-minute quickstart for the FlightPowers flight and hotel price APIs',
          description:
            'Get a key, verify it, run a live one-way flight search and a live hotel rate search, and read the price context in the response.',
          totalTime: 'PT5M',
          step: [
            { '@type': 'HowToStep', name: 'Get a key', url: `${SITE.url}/docs/quickstart#key` },
            { '@type': 'HowToStep', name: 'Check the key works', url: `${SITE.url}/docs/quickstart#verify` },
            { '@type': 'HowToStep', name: 'Run your first search', url: `${SITE.url}/docs/quickstart#first-call` },
            { '@type': 'HowToStep', name: 'Read the answer', url: `${SITE.url}/docs/quickstart#read` },
            { '@type': 'HowToStep', name: 'Search hotels', url: `${SITE.url}/docs/quickstart#hotels` },
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
            { '@type': 'ListItem', position: 3, name: 'Quickstart', item: `${SITE.url}/docs/quickstart` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/docs', label: 'Docs' },
            { href: '/docs/quickstart', label: 'Quickstart' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-12">
          <p className="eyebrow">Quickstart</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            Five minutes to your <span className="text-signal-500">first live price</span>
          </h1>
          <p className="lede mt-5 max-w-2xl">
            Five steps, all of them a paste. No SDK, no account on this site, nothing to install. The free tier is{' '}
            {FLIGHTS_FREE.quota} requests a month on flights and {HOTELS_FREE.quota} on hotels, so the steps below are
            ordered to spend as few of them as possible.
          </p>
        </Container>
      </div>

      <Section>
        <div className="space-y-12">
          <div id="key" className="scroll-mt-24">
            <Step n={1} title="Get a key">
              <p>
                Both APIs are listed on RapidAPI, and one key works for both the marketplace hosts and{' '}
                <code className="field">api.flightpowers.com</code>. Subscribe to the free tier. It takes about a minute
                and asks for no card, then copy the key from RapidAPI&apos;s <em>Apps</em> page.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={rapidApiPricingUrl('flights', 'docs')} rel="noopener" className="btn btn-accent !py-2 text-sm">
                  Flights key →
                </a>
                <a href={rapidApiPricingUrl('hotels', 'docs')} rel="noopener" className="btn btn-ghost !py-2 text-sm">
                  Hotels key →
                </a>
              </div>
              <p className="text-[14px] text-ink-400">
                Put it in your shell so nothing below contains a real key:{' '}
                <code className="field">export RAPIDAPI_KEY=&quot;…&quot;</code>
              </p>
            </Step>
          </div>

          <div id="verify" className="scroll-mt-24">
            <Step n={2} title="Check the key works, before you spend a search on finding out">
              <Code label="curl">{VERIFY}</Code>
              <p>
                A <code className="field">200</code> means the key authenticates. Anything else is worth fixing before
                step 3: <code className="field">401</code> is a key the gateway does not recognise,{' '}
                <code className="field">403</code> is a real key that is not subscribed to that listing.
              </p>
              <p className="text-[14px] text-ink-400">
                Honest note: <code className="field">/v1/verify</code> performs a real upstream check, so it costs one
                request against the hotels plan. On a {HOTELS_FREE.quota}-request free tier that is worth knowing before
                you run it in a loop.
              </p>
            </Step>
          </div>

          <div id="first-call" className="scroll-mt-24">
            <Step n={3} title="Run your first search">
              <Code label="curl · one-way, live Google Flights prices">{FIRST_CALL}</Code>
              <p>
                Three fields are required: <code className="field">from_airport</code>,{' '}
                <code className="field">to_airport</code>, <code className="field">departure_date</code>. Airports are
                IATA codes, the date is <code className="field">YYYY-MM-DD</code>. A round trip is its own endpoint,{' '}
                <code className="field">/v1/flights/roundtrip</code>, which takes a{' '}
                <code className="field">return_date</code> and prices the legs as one itinerary. It is not two one-ways
                stapled together, and calling it that way gives you a different, usually worse answer.
              </p>
            </Step>
          </div>

          <div id="read" className="scroll-mt-24">
            <Step n={4} title="Read the answer">
              <Code label={`response · ${capturedLabel(ONEWAY)}`}>{READ_IT}</Code>
              <p>
                <code className="field">price_range_in_relation_to_other_periods</code> is Google&apos;s own verdict on
                this fare: <code className="field">low</code>, <code className="field">typical</code> or{' '}
                <code className="field">high</code>. And{' '}
                <code className="field">price_insights_low</code>/<code className="field">high</code> are the band it
                judged against. That is the field most competitors do not return, and it is what lets you say &ldquo;book
                now&rdquo; instead of just showing a number.
              </p>
              <p>
                Check the <code className="field">x-search-status</code> response header too. It is one of{' '}
                <code className="field">ok</code>, <code className="field">empty</code>,{' '}
                <code className="field">partial</code> or <code className="field">degraded</code>.{' '}
                <code className="field">empty</code> means the route genuinely has no fares;{' '}
                <code className="field">degraded</code> means the search did not complete, so an empty array from it says
                nothing about availability. Branch on the header, not on the array length.
              </p>
            </Step>
          </div>

          <div id="hotels" className="scroll-mt-24">
            <Step n={5} title="Search hotels, from any market you like">
              <Code label="curl · live Booking.com rates, priced as a German visitor">{HOTEL_CALL}</Code>
              <p>
                The field is <code className="field">destination</code>. A <code className="field">location</code> key is
                rejected with a 400, and it is the single most common first-call mistake, because{' '}
                <code className="field">location</code> is a field in the <em>response</em>.
              </p>
              <p>
                <code className="field">proxy_country</code> routes the request through a residential proxy in that
                country. Booking.com quotes different markets differently; this is how you observe that, and it is the
                basis of rate-parity and geo-pricing monitoring. Omit it and you get the global pool.
              </p>
            </Step>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Same key, two hosts"
          title="If you would rather not depend on a marketplace"
          lede="Every call above works just as well against the RapidAPI host you subscribed on. The paths differ; the key, the request bodies and the responses do not."
        />
        <div className="mt-8 max-w-3xl space-y-4">
          <Code label="curl · the same search on the RapidAPI host">{RAPIDAPI_HOST_CALL}</Code>
          <p className="text-[15px] text-ink-300 leading-relaxed">
            <code className="field">api.flightpowers.com</code> is our own domain and carries the machine-readable spec
            at{' '}
            <a href={LINKS.openapi} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              /openapi.json
            </a>
            . The key goes in <code className="field">x-api-key</code>,{' '}
            <code className="field">x-rapidapi-key</code>, or <code className="field">Authorization: Bearer</code>,
            whichever your client makes easiest.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Next" title="Where to go from here" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/parallel-date-scan', label: 'Scan a whole month', sub: 'One request per date, fired in parallel' },
            { href: '/hotels-api/geo-pricing', label: 'Rate parity', sub: 'proxy_country, and how to read a gap honestly' },
            { href: '/mcp', label: 'MCP servers', sub: 'One URL for Claude, Cursor, or any MCP client' },
            { href: '/tools', label: 'Free tools', sub: 'Try both APIs in the browser, no key' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors"
            >
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 max-w-2xl">
          <EmailCapture tool="quickstart" source="page:quickstart" />
        </div>
      </Section>
    </>
  );
}
