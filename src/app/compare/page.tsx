import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Container, JsonLd, Section, SectionHead } from '@/components/ui';
import { FLIGHT_PLANS, HOTEL_PLANS, perThousand } from '@/lib/pricing';
import { SITE } from '@/lib/site';
import { CompareTable, Quotable } from './_components/CompareTable';
import { COMPARE_PAGES, GROUPS } from './_lib/pages';

/** The day every rival figure in the "at a glance" table was read from the rival's own page. */
const READ = '2026-10-06';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const ULTRA = FLIGHT_PLANS.find((p) => p.name === 'ULTRA')!;
const HOTEL_PRO = HOTEL_PLANS.find((p) => p.name === 'PRO')!;

const TITLE = 'Flight API alternatives: SerpApi, Amadeus, Skyscanner, Kiwi';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description: `FlightPowers compared with SerpApi, SearchApi, HasData, FlightAPI.io, Skyscanner, Kiwi.com, Amadeus and Duffel. Rival prices read ${READ}.`,
    alternates: { canonical: '/compare' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

export default function CompareIndexPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Flight and hotel API alternatives, compared',
          url: `${SITE.url}/compare`,
          dateModified: READ,
          hasPart: COMPARE_PAGES.map((p) => ({
            '@type': 'WebPage',
            name: p.title,
            url: `${SITE.url}${p.href}`,
          })),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE.url}/compare` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }]} />
      </Container>

      <Container className="pt-8 sm:pt-12 pb-4">
        <p className="eyebrow">Compare · rival pages read {READ}</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-3xl">
          Flight and hotel API <span className="text-signal-500">alternatives</span>, compared
        </h1>
        <Quotable>
          FlightPowers is a travel data API: live Google Flights fares with Google&apos;s price band and a round trip in one request,
          plus live Booking.com hotel rates, from {`$${PRO.priceMonthly}`} for {PRO.quota.toLocaleString('en-US')} flight searches.
          These pages compare it with SerpApi, SearchApi, HasData, FlightAPI.io, Skyscanner, Kiwi.com, Amadeus and Duffel, using each
          rival&apos;s own pages, read on the date shown.
        </Quotable>
        <p className="lede mt-6 max-w-2xl">
          Where the other product is better, the page says so. A comparison you can&apos;t trust on the rows we lose is not worth
          much on the rows we win.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead
          eyebrow="At a glance"
          title="Getting in, the first bill, and a round trip"
          lede="The three questions that decide most shortlists. Every rival cell is from that rival's own page, read on the date at the top; the pages below carry the quotes."
        />
        <div className="mt-8">
          <CompareTable
            caption={`Rival cells read ${READ} from serpapi.com, searchapi.io, hasdata.com, flightapi.io, partners.skyscanner.net, media.kiwi.com, developers.amadeus.com and duffel.com. FlightPowers cells: src/lib/pricing.ts.`}
            head={['', 'How you get in', 'Smallest paid plan', 'Per 1,000 flight searches', 'Round trip with the return flight']}
            rows={[
              [
                <Link key="fp" href="/flights-api" className="text-signal-400 underline underline-offset-4">
                  FlightPowers
                </Link>,
                'Subscribe on RapidAPI',
                `$${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')} (hotels: $${HOTEL_PRO.priceMonthly} for ${HOTEL_PRO.quota.toLocaleString('en-US')})`,
                `${perThousand(PRO)} (ULTRA ${perThousand(ULTRA)})`,
                '1 request',
              ],
              [
                <Link key="serp" href="/compare/serpapi" className="text-signal-400 underline underline-offset-4">
                  SerpApi
                </Link>,
                'Sign up',
                'Cheapest plan $25 for 1,000',
                '$25.00',
                '2 requests (departure_token)',
              ],
              [
                <Link key="sa" href="/compare/searchapi" className="text-signal-400 underline underline-offset-4">
                  SearchApi
                </Link>,
                'Sign up',
                '$40 for 10,000',
                '$4.00',
                '2 requests (departure_token)',
              ],
              [
                <Link key="hd" href="/compare/hasdata" className="text-signal-400 underline underline-offset-4">
                  HasData
                </Link>,
                'Sign up',
                '$59 for 13,333 route searches',
                '$4.43',
                '2 requests (departureToken)',
              ],
              [
                <Link key="fa" href="/compare/flightapi-io" className="text-signal-400 underline underline-offset-4">
                  FlightAPI.io
                </Link>,
                'Sign up',
                '$49 for 30,000 credits, 2 credits a search',
                '$3.27',
                '1 request',
              ],
              [
                <Link key="sky" href="/compare/skyscanner" className="text-signal-400 underline underline-offset-4">
                  Skyscanner
                </Link>,
                'Application, reviewed within two weeks',
                'No public price; partners earn commission',
                '-',
                '-',
              ],
              [
                <Link key="kiwi" href="/compare/kiwi-tequila" className="text-signal-400 underline underline-offset-4">
                  Kiwi.com Tequila
                </Link>,
                'Invitation only since May 2024',
                'No public price',
                '-',
                '-',
              ],
              [
                <Link key="am" href="/compare/amadeus" className="text-signal-400 underline underline-offset-4">
                  Amadeus Self-Service
                </Link>,
                'Closed July 17, 2026 (Enterprise remains)',
                '-',
                '-',
                '-',
              ],
              [
                <Link key="du" href="/compare/duffel" className="text-signal-400 underline underline-offset-4">
                  Duffel
                </Link>,
                'Sign up (a booking API)',
                '$3.00 per order; 1,500 searches per order free',
                '$5.00 past the allowance ($0.005 a search)',
                'Booking flow, not compared',
              ],
            ]}
          />
        </div>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Per 1,000 is the smallest paid plan&apos;s price divided by the searches it includes. The round-trip column counts the
          requests needed to see both the outbound and the return flight. A range of dates in one call is a separate question: our
          REST API takes one date pair per request, our{' '}
          <Link href="/mcp" className="text-signal-400 underline underline-offset-4">
            MCP servers
          </Link>{' '}
          take a date range and a list of destinations, and each page says what the rival offers.
        </p>
      </Section>

      {GROUPS.map((g) => {
        const pages = COMPARE_PAGES.filter((p) => p.group === g.id);
        return (
          <Section key={g.id}>
            <SectionHead title={g.title} lede={g.lede} />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {pages.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group rounded-2xl border rule bg-ink-900/50 p-6 hover:border-signal-500 transition-all flex flex-col"
                >
                  <h2 className="text-[18px] font-semibold text-ink-100 group-hover:text-signal-400 transition-colors">{p.title}</h2>
                  <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed flex-1">{p.sub}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-mono text-[11px] text-ink-500">their pages read {p.read}</p>
                    <span className="text-signal-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        );
      })}

      <Section>
        <SectionHead
          eyebrow="How these pages are made"
          title="Their pages, quoted and dated"
          lede="We read each rival's live pricing and documentation pages on the stamped date and quote them rather than paraphrase. If a number here disagrees with their site today, believe their site."
        />
        <p className="mt-6 max-w-3xl text-[14.5px] text-ink-400 leading-relaxed">
          Our own numbers come from the same file as{' '}
          <Link href="/pricing" className="text-signal-400 underline underline-offset-4">
            /pricing
          </Link>
          , read from our live RapidAPI listings. The pages refreshed on {READ} also carry one real request through our API, with the time it ran.
          The wider field, including APIs cheaper per request than ours, is in{' '}
          <Link href="/guides/best-flight-data-apis-2026" className="text-signal-400 underline underline-offset-4">
            the best flight data APIs in 2026
          </Link>{' '}
          and{' '}
          <Link href="/guides/best-hotel-data-apis-2026" className="text-signal-400 underline underline-offset-4">
            the best hotel data APIs in 2026
          </Link>
          .
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/price-insights', label: 'Price Insights', sub: "Google's band + verdict" },
            { href: '/flights-api/round-trip', label: 'Round-Trip', sub: 'Paired legs, one request' },
            { href: '/flights-api/search-status', label: 'Search Status', sub: '"empty" vs "failed"' },
            { href: '/hotels-api/geo-pricing', label: 'Geo-Pricing', sub: 'proxy_country, per market' },
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
          showBoth
          title="Or skip the comparison and run it"
          body="Live Google Flights fares and Booking.com rates on one RapidAPI key. Judge the data, not the copy."
        />
      </Section>
    </>
  );
}
