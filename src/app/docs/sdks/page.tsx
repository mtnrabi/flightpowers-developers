import type { Metadata } from 'next';
import Link from 'next/link';
import { withOg } from '@/lib/meta';
import { LINKS, SITE } from '@/lib/site';
import { Breadcrumbs, Code, Container, JsonLd, Section, SectionHead } from '@/components/ui';

/**
 * The official client libraries (github.com/mtnrabi/flightpowers-sdk, MIT):
 * npm `flightpowers` and PyPI `flightpowers`, both 0.1.0 on 2026-11-08.
 *
 * Every snippet and method name below is copied from the SDK's own READMEs
 * (js/README.md, py/README.md). If the SDK renames a method, this page
 * changes with it. No prices here: the plans live on /pricing.
 */

export const metadata: Metadata = withOg({
  title: 'SDKs: the official JavaScript and Python clients',
  description:
    'npm install flightpowers or pip install flightpowers: one client for the Google Flights, Booking.com, Airbnb and Google Hotels APIs on your own RapidAPI key, with the X-Search-* headers read for you and one error type.',
  alternates: { canonical: '/docs/sdks' },
});

export const dynamic = 'force-static';

const JS_INSTALL = 'npm install flightpowers';
const PY_INSTALL = 'pip install flightpowers';

const JS_QUICKSTART = `import { FlightPowers } from "flightpowers";
const fp = new FlightPowers({ rapidApiKey: process.env.RAPIDAPI_KEY! });
const { data, meta } = await fp.flights.oneway({ from_airport: "JFK", to_airport: "LHR", departure_date: "2027-01-20" });
console.log(meta.searchStatus, data[0]?.price, data[0]?.price_range_in_relation_to_other_periods);
console.log(data[0]?.buy_link);`;

const PY_QUICKSTART = `import os
from flightpowers import FlightPowers
fp = FlightPowers(os.environ["RAPIDAPI_KEY"])
res = fp.flights.oneway(from_airport="JFK", to_airport="LHR", departure_date="2027-01-20")
print(res.meta.search_status)`;

/** Namespaces and methods, exactly as each SDK names them. */
const METHODS = [
  {
    api: 'Google Flights',
    href: '/flights-api',
    js: ['fp.flights.oneway', 'fp.flights.roundtrip', 'fp.flights.onewayMultiAirport', 'fp.flights.roundtripMultiAirport'],
    py: ['fp.flights.oneway', 'fp.flights.roundtrip', 'fp.flights.oneway_multi_airport', 'fp.flights.roundtrip_multi_airport'],
  },
  {
    api: 'Booking.com',
    href: '/hotels-api',
    js: ['fp.booking.search', 'fp.booking.hotelByName', 'fp.booking.resolve', 'fp.booking.rooms'],
    py: ['fp.booking.search', 'fp.booking.hotel_by_name', 'fp.booking.resolve', 'fp.booking.rooms'],
  },
  {
    api: 'Airbnb',
    href: '/hotels-api/airbnb',
    js: ['fp.airbnb.search', 'fp.airbnb.details'],
    py: ['fp.airbnb.search', 'fp.airbnb.details'],
  },
  {
    api: 'Google Hotels',
    href: '/hotels-api/google-hotels',
    js: ['fp.googleHotels.search', 'fp.googleHotels.rates'],
    py: ['fp.google_hotels.search', 'fp.google_hotels.rates'],
  },
] as const;

const linkClass = 'text-signal-400 underline underline-offset-4 hover:text-signal-500';

export default function SdksPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE.url}/docs` },
            { '@type': 'ListItem', position: 3, name: 'SDKs', item: `${SITE.url}/docs/sdks` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/docs', label: 'Docs' },
            { href: '/docs/sdks', label: 'SDKs' },
          ]}
        />
      </Container>

      <Container className="pt-8 sm:pt-12 pb-12">
        <p className="eyebrow">SDKs</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
          The official <span className="text-signal-500">JavaScript and Python</span> clients
        </h1>
        <p className="lede mt-5 max-w-2xl">
          One client for the Google Flights, Booking.com, Airbnb and Google Hotels APIs, on your own RapidAPI key. Four
          namespaces, one method per endpoint, the <code className="field">X-Search-*</code> headers read for you, and one
          error type that carries the HTTP status and the search status. Open source, MIT, on{' '}
          <a href={LINKS.sdkRepo} rel="noopener" className={linkClass}>
            GitHub
          </a>
          .
        </p>
      </Container>

      <Section>
        <SectionHead
          eyebrow="Install"
          title="One package per language"
          lede="Both packages have the same surface. Neither has runtime dependencies."
        />
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-3">
            <Code label="JavaScript / TypeScript · npm">{JS_INSTALL}</Code>
            <p className="text-[14px] text-ink-400 leading-relaxed">
              Uses the global <code className="field">fetch</code> (Node 18+, browsers, Deno, Bun). ESM and CommonJS
              builds, TypeScript types included.{' '}
              <a href={LINKS.npmSdk} rel="noopener" className={linkClass}>
                flightpowers on npm
              </a>
            </p>
          </div>
          <div className="space-y-3">
            <Code label="Python · PyPI">{PY_INSTALL}</Code>
            <p className="text-[14px] text-ink-400 leading-relaxed">
              Python 3.9+, standard library only, type hints included.{' '}
              <a href={LINKS.pypiSdk} rel="noopener" className={linkClass}>
                flightpowers on PyPI
              </a>
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Quickstart"
          title="A live one-way fare in five lines"
          lede="Subscribe to the listing you need on RapidAPI and put your key in RAPIDAPI_KEY. One key works on every listing you subscribe to."
        />
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <Code label="JavaScript / TypeScript">{JS_QUICKSTART}</Code>
          <Code label="Python">{PY_QUICKSTART}</Code>
        </div>
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          Every method takes the API&rsquo;s own field names and returns <code className="field">data</code>,{' '}
          <code className="field">status</code>, <code className="field">meta</code> and{' '}
          <code className="field">headers</code>. <code className="field">meta.searchStatus</code> (Python:{' '}
          <code className="field">meta.search_status</code>) is <code className="field">ok</code>,{' '}
          <code className="field">empty</code>, <code className="field">partial</code> or{' '}
          <code className="field">degraded</code>: <code className="field">empty</code> means the search finished and
          there is nothing, <code className="field">degraded</code> means it did not finish, so an empty list says nothing
          about availability (
          <Link href="/flights-api/search-status" className={linkClass}>
            search status
          </Link>
          ). Any non-2xx answer raises <code className="field">FlightPowersError</code>. Retries are off by default.
        </p>
      </Section>

      <Section>
        <SectionHead eyebrow="Methods" title="Four namespaces, one method per endpoint" />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b rule text-ink-400">
                <th className="py-2 pr-6 font-medium">API</th>
                <th className="py-2 pr-6 font-medium">JavaScript / TypeScript</th>
                <th className="py-2 font-medium">Python</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.api} className="border-b rule align-top">
                  <td className="py-3 pr-6">
                    <Link href={m.href} className={linkClass}>
                      {m.api}
                    </Link>
                  </td>
                  <td className="py-3 pr-6 font-mono text-[12.5px] text-ink-200">
                    {m.js.map((x) => (
                      <div key={x}>{x}</div>
                    ))}
                  </td>
                  <td className="py-3 font-mono text-[12.5px] text-ink-200">
                    {m.py.map((x) => (
                      <div key={x}>{x}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          The full options, response fields, errors and retries are in each package&rsquo;s README on{' '}
          <a href={LINKS.sdkRepo} rel="noopener" className={linkClass}>
            github.com/mtnrabi/flightpowers-sdk
          </a>
          . Flights, Booking.com, Airbnb and Google Hotels are separate RapidAPI subscriptions; plans, quotas and rate
          limits are on{' '}
          <Link href="/pricing" className={linkClass}>
            the pricing page
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
