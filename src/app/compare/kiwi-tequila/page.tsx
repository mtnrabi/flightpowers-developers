import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { Breadcrumbs, Code, Container, FaqSection, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { LINKS, SITE } from '@/lib/site';
import { CompareTable, Quotable } from '../_components/CompareTable';
import { OtherAlternatives } from '../_components/OtherAlternatives';

/**
 * Kiwi.com facts, all read 2026-10-06:
 * - partners.kiwi.com redirects to media.kiwi.com/articles-and-interviews/
 *   better-for-business-kiwi-com-takes-a-new-approach-to-partnerships/
 *   (dated May 30, 2024); the quotes below are from that article.
 * - tequila.kiwi.com/portal/login, rendered in a browser (the HTML is an
 *   empty React shell to curl).
 * - mcp.kiwi.com answered initialize and tools/list with no key; the tool
 *   description and parameters quoted below come from that tools/list.
 * Kiwi publishes no Tequila price we could read, so no Kiwi price appears.
 */
const READ = '2026-10-06';
/** The live FlightPowers run pasted below (raw: src/app/compare/_runs/2026-10-06/PRG-LHR-l10.json). */
const CAPTURED = '19:54 UTC on 2026-10-06';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const HOTEL_PRO = HOTEL_PLANS.find((p) => p.name === 'PRO')!;

const TITLE = 'Kiwi Tequila API alternative: live fares without an invite';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description: `New Kiwi.com Tequila partners are invitation only. FlightPowers is a key you subscribe to today: $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')} Google Flights searches. Read ${READ}.`,
    alternates: { canonical: '/compare/kiwi-tequila' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Can I still get a Kiwi.com Tequila API key?',
    a: `Only by invitation. Kiwi.com wrote on May 30, 2024 that "any new partnerships on the Tequila platform will be on an invitation only basis", and partners.kiwi.com still redirects to that article (checked ${READ}). The Tequila login page offers a magic link to existing users and an email address, affiliates@kiwi.com, for anyone interested in becoming an affiliate.`,
  },
  {
    q: 'Does Kiwi.com have an MCP server?',
    a: `Yes. mcp.kiwi.com answered our MCP handshake and listed its tools with no key on ${READ}. It has one search tool, search-flight, with flexible dates and a booking link per result. It is a good free choice for searching flights inside Claude for your own trips.`,
  },
  {
    q: 'What is the difference between Kiwi.com fares and Google Flights fares?',
    a: 'They come from different places. The Kiwi.com MCP tool says it "searches Kiwi.com for available flights" and returns a booking link per result. FlightPowers returns the fare Google Flights shows, with Google\'s own low / typical / high range for the route, and a link that opens the trip on Google Flights.',
  },
  {
    q: 'Is there a free Kiwi.com API?',
    a: `Not a REST API you can sign up for today, as far as we could see on ${READ}. Their MCP server is free to call. FlightPowers has a free BASIC plan of 10 requests a month, and PRO is $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}.`,
  },
];

export default function CompareKiwiTequilaPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: TITLE,
          url: `${SITE.url}/compare/kiwi-tequila`,
          dateModified: READ,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE.url}/compare` },
            { '@type': 'ListItem', position: 3, name: 'Kiwi.com Tequila', item: `${SITE.url}/compare/kiwi-tequila` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/compare', label: 'Compare' }, { href: '/compare/kiwi-tequila', label: 'Kiwi.com Tequila' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-14">
          <p className="eyebrow">Comparison · Kiwi.com pages read {READ}</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold max-w-4xl">
            A <span className="text-signal-500">Kiwi.com Tequila</span> alternative you can sign up for
          </h1>
          <Quotable>
            FlightPowers is a Kiwi.com Tequila alternative for developers who cannot get an invite: Kiwi has taken new Tequila
            partners by invitation only since May 2024, while our key works the day you subscribe, ${PRO.priceMonthly} for{' '}
            {PRO.quota.toLocaleString('en-US')} Google Flights searches with Google&apos;s price band. Best for building a product on
            fares; Kiwi&apos;s free MCP server if you only search for yourself.
          </Quotable>
        </Container>
      </div>

      <Section className="!pt-12">
        <SectionHead
          eyebrow="Where Tequila stands"
          title="New partners by invitation only"
          lede="Tequila was Kiwi.com's public B2B platform: the search API, white label and affiliate tools. In May 2024 Kiwi.com moved new partners to invitation only."
        />
        <div className="mt-8 max-w-3xl space-y-6">
          <blockquote className="border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
            “While previously Tequila platform provided public access to various B2B services such as the API and white label
            solution, as well as affiliate program that included widgets, deeplinks and banners, we are now focusing on only those
            key business partnerships that closely align with our strategic goals …”
            <footer className="mt-2 font-mono text-[11px] text-ink-500">
              Kiwi.com media room, May 30, 2024 · partners.kiwi.com redirects here, checked {READ}
            </footer>
          </blockquote>
          <blockquote className="border-l-2 border-signal-600 pl-4 text-[15px] text-ink-300 leading-relaxed">
            “Any new partnerships on the Tequila platform will be on an invitation only basis …”
            <footer className="mt-2 font-mono text-[11px] text-ink-500">same article</footer>
          </blockquote>
          <p className="text-[15px] text-ink-300 leading-relaxed">
            The Tequila login page, read in a browser on {READ}, offers existing users a magic link and says: “If you have an
            interest in becoming our affiliate, get in touch with us at affiliates@kiwi.com”. If you already have Tequila access,
            keep it; nothing here replaces Kiwi&apos;s own inventory. If you were planning to sign up, there is no form to sign up
            with.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Their MCP server"
          title="Kiwi.com does run a free flight search for assistants"
          lede="This is the part most alternative pages leave out, and it may be all you need."
        />
        <div className="mt-8 max-w-3xl space-y-5 text-[15px] text-ink-300 leading-relaxed">
          <p>
            <code className="font-mono text-[13px]">mcp.kiwi.com</code> answered an MCP handshake with no key on {READ} and listed
            two tools: <code className="font-mono text-[13px]">search-flight</code> and{' '}
            <code className="font-mono text-[13px]">feedback-to-devs</code>. The search tool takes a departure date with up to ±10
            days of flexibility or an explicit date range, a return date or range, nights at the destination, cabin, bags, stopover
            rules and self-transfer options. Each result carries a price, baggage counts and a booking link.
          </p>
          <p>
            It is built for chat. Its own description tells the assistant to render a markdown table and to “end wishing the user a
            nice trip with a short fun fact about the destination”. For planning your own trip inside Claude, that is a good free
            tool and we would not talk you out of it.
          </p>
          <p>
            What it is not is a documented REST API with a plan you can build a product on. That is the gap Tequila left and the one
            this page is about.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Side by side" title="Tequila, Kiwi's MCP and FlightPowers" />
        <div className="mt-8">
          <CompareTable
            caption={`Kiwi.com cells: media.kiwi.com (May 30, 2024 article), tequila.kiwi.com and mcp.kiwi.com, all read ${READ}. FlightPowers cells: src/lib/pricing.ts and the run below.`}
            head={['', 'Kiwi.com Tequila', 'Kiwi.com MCP', 'FlightPowers']}
            rows={[
              ['Can you sign up today', 'Invitation only', 'No sign-up, no key', 'Yes, on RapidAPI'],
              ['Price', 'Not published on any page we could read', 'Free', `BASIC 10 requests free; PRO $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')}`],
              ['Where fares come from', 'Kiwi.com', 'Kiwi.com', 'Google Flights'],
              ['Price band / verdict', '-', 'Not in the tool\'s result shape', 'Google\'s low / typical / high range on every result'],
              ['Round trip', '-', 'One tool call, outbound and inbound legs', 'One REST request, both legs, one total'],
              ['Range of dates in one call', '-', 'Yes: flex days or a date range', 'On our MCP servers yes; on REST one date pair per request'],
              ['Booking link', '-', 'Yes, one per result', 'Yes: opens the trip on Google Flights'],
              ['Hotels', '-', 'No', `Booking.com rates on their own plan, $${HOTEL_PRO.priceMonthly} for ${HOTEL_PRO.quota.toLocaleString('en-US')}`],
              [
                'MCP',
                '-',
                'mcp.kiwi.com, free',
                <>
                  <code className="font-mono text-[12px]">{LINKS.mcpFlights}</code> on your own key
                </>,
              ],
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="A real run"
          title="Prague to London, the example in Kiwi's own tool"
          lede="Kiwi's search tool gives Prague and London Heathrow as its example places. Here is that trip through our REST API, one call."
        />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Code label="request">{`curl -X POST https://api.flightpowers.com/v1/flights/roundtrip \\
  -H "x-api-key: $FLIGHTPOWERS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_airport": "PRG",
    "to_airport": "LHR",
    "departure_date": "2026-11-17",
    "return_date": "2026-11-24",
    "currency": "USD",
    "limit": 10
  }'`}</Code>
            <p className="text-[14.5px] text-ink-400 leading-relaxed">
              The cheapest of the ten itineraries: $140 return on British Airways, nonstop both ways. Google puts this trip at $135
              to $220 usually, so the verdict is “typical”. That range is the field Kiwi&apos;s tool does not return.
            </p>
          </div>
          <Code label={`response · cheapest of 10 rows · captured ${CAPTURED}`}>{`{
  "price_range_in_relation_to_other_periods": "typical",
  "price_insights_low": 135,
  "price_insights_high": 220,
  "from_airport": "Prague (PRG)",
  "to_airport": "London (LHR)",
  "departure_date": "2026-11-17",
  "return_date": "2026-11-24",
  "total_price": "$140",
  "total_price_as_number": 140,
  "total_stops": 0,
  "departure_flight_airline": "British Airways",
  "departure_flight_duration": "2 hr 10 min",
  "departure_flight_stops": 0,
  "return_flight_airline": "British Airways",
  "return_flight_duration": "2 hr",
  "return_flight_stops": 0,
  "buy_link": "https://www.google.com/travel/flights?tfs=..."
}`}</Code>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The decision" title="Which one to use" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Kiwi.com Tequila</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              If you were invited, or already have access. Kiwi&apos;s own inventory and booking flow are things we do not have.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Kiwi.com MCP</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              If you want to search flights for your own trips inside an assistant, free, with bags and self-transfer filters.
            </p>
          </div>
          <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">FlightPowers</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
              If you are building a product and need a REST API you can sign up for today, Google&apos;s price band, or hotels on
              the same RapidAPI key.{' '}
              <Link href="/flights-api" className="text-signal-400 underline underline-offset-4">
                Flights API
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <OtherAlternatives current="/compare/kiwi-tequila" />
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="compare"
          title="No invitation needed"
          body="Subscribe on RapidAPI and the key works on the next request: live Google Flights fares with the price band on every result."
        />
      </Section>
    </>
  );
}
