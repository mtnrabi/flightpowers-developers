import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AddToClientButtons } from '@/components/AddToClientButtons';
import { Breadcrumbs, Container, FaqSection, FieldRow, JsonLd, Section, SectionHead, type Faq } from '@/components/ui';
import { AIRBNB_PLANS, FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
import { LINKS, SITE, installLinks } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Documentation page for the two connectors submitted to Claude's connector
 * directory: FlightPowers Flights (flights.flightpowers.com/mcp) and
 * FlightPowers Hotels (hotels.flightpowers.com/mcp). Both are the ad-free
 * servers. The ad-supported free server is deliberately not offered on this
 * page: a directory listing must not lead to an ad-carrying server.
 *
 * Example prompts are the listing's own (each one ran on 2026-10-22 against the
 * live hosts, keyed), with the year written out so they never read as past.
 * The cost line under each prompt is what it uses in searches.
 */

const PAGE = '/integrations/claude/connectors';

export const metadata: Metadata = {
  ...withOg({
    title: 'FlightPowers Flights and Hotels connectors for Claude',
    description:
      'Ad-free connectors for Claude: live Google Flights fares and Booking.com rates. Sign in with Google for 10 free searches a day; connect a key for full scans.',
    alternates: { canonical: PAGE },
  }),
  title: { absolute: 'FlightPowers Flights and Hotels connectors for Claude' },
};

const flightsPro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const hotelsPro = HOTEL_PLANS.find((p) => p.name === 'PRO')!;
const airbnbPro = AIRBNB_PLANS.find((p) => p.name === 'PRO')!;

const CONNECTORS = [
  {
    server: 'flights' as const,
    name: 'FlightPowers Flights',
    what: 'Live Google Flights fares: one-way and round trip, a whole month of dates, several airports and trip lengths in one ask, with Google’s usual price range and a low / typical / high verdict.',
    connect: LINKS.mcpConnectFlights,
    pro: flightsPro,
    unit: 'flight',
  },
  {
    server: 'hotels' as const,
    name: 'FlightPowers Hotels',
    what: 'Live Booking.com rates: a city over a range of check-in days, a nightly budget and Booking.com’s filters, or one named hotel, priced as a shopper in another country sees it. With an Airbnb subscription on the same key, live Airbnb stays too, and the same stay compared on both.',
    connect: LINKS.mcpConnectHotels,
    pro: hotelsPro,
    unit: 'hotel',
  },
];

type Example = { prompt: string; cost: string };

const FLIGHT_EXAMPLES: Example[] = [
  {
    prompt:
      'What’s the cheapest week to fly from New York JFK to Lisbon and back in March 2027, staying 7 nights? Is the best fare a good price?',
    cost: '31 searches: full with a key; on the free tier it samples the month evenly with the searches you have left that day (up to 10) and says which dates it covered',
  },
  {
    prompt: 'Cheapest one-way from JFK to Lisbon, Madrid or Barcelona any day from February 8 to 14, 2027. Which city wins?',
    cost: '21 searches: full with a key; sampled on the free 10 a day',
  },
  {
    prompt:
      'Round trip JFK to London, out March 10, 2027, back March 17. What are my options, and is the cheapest one a good deal?',
    cost: '1 search',
  },
  {
    prompt: 'Cheapest one-way from JFK to Lisbon, Madrid or Barcelona on February 10, 2027.',
    cost: '3 searches',
  },
];

const HOTEL_EXAMPLES: Example[] = [
  {
    prompt:
      'Cheapest 3-night stay in Lisbon with free cancellation, under $150 a night, checking in any day from March 5 to 11, 2027.',
    cost: '7 searches',
  },
  {
    prompt: 'Price Hotel Artemide in Rome for 3 nights, for every check-in day from March 8 to 14, 2027. Which day is cheapest?',
    cost: '7 searches',
  },
  {
    prompt: 'What does Hotel Artemide in Rome cost for March 10 to 13, 2027, as a shopper in Germany would see it?',
    cost: '1 search',
  },
];

const TOOLS = [
  {
    name: 'search_oneway_flights',
    type: 'FlightPowers Flights',
    note: 'One-way fares for one date or a date range, to one airport or several. Each result has the total price, airlines, stops, times, Google’s usual price range with the verdict, and a booking link.',
  },
  {
    name: 'search_roundtrip_flights',
    type: 'FlightPowers Flights',
    note: 'Round trips priced as a pair of legs with one total, for fixed dates or every departure day in a range at one or more trip lengths.',
  },
  {
    name: 'search_hotels',
    type: 'FlightPowers Hotels',
    note: 'A city and dates, or a range of check-in days and a stay length. Price, review score, room type, location and a booking link; a nightly budget and Booking.com filters such as free_cancellation.',
  },
  {
    name: 'find_hotel_by_name',
    type: 'FlightPowers Hotels',
    note: 'One hotel by the name you would type, no property ID. Over a range of dates it gives a rate calendar; price_as_seen_from prices it as a shopper in another country sees it.',
  },
  {
    name: 'search_airbnb',
    type: 'FlightPowers Hotels',
    note: 'Live Airbnb stays for a city and dates: stay total, price per night, rating out of 5, room type, bedrooms, beds, baths and an Airbnb link. Needs its own Airbnb Live API subscription on your key; the free daily searches do not cover it.',
  },
  {
    name: 'compare_hotel_rates',
    type: 'FlightPowers Hotels',
    note: 'One stay priced on Booking.com and Airbnb: a row per source with the cheapest total, the median total and how many places were priced. A source you have no subscription for is listed as skipped. It runs on your own RapidAPI key; the free sign-in searches do not cover it.',
  },
];

const faq: Faq[] = [
  {
    q: 'Do I need an API key to start?',
    a: 'No. Sign in with Google when Claude asks and you get 10 searches a day, with no ads, shared by both connectors. A key is only needed for more.',
  },
  {
    q: 'What counts as one search?',
    a: 'Each date, destination and trip-length combination is one search. A month of departures at one trip length to one city is about 30. When an ask is bigger than what you have left, it is sampled evenly across the range and the answer says which dates were covered.',
  },
  {
    q: 'How do I get the full scans?',
    a: `Subscribe to a plan on RapidAPI (PRO is $${flightsPro.priceMonthly} a month for ${flightsPro.quota.toLocaleString('en-US')} flight searches, or $${hotelsPro.priceMonthly} for ${hotelsPro.quota.toLocaleString('en-US')} hotel searches) and paste the key once at ${LINKS.mcpConnectFlights} or ${LINKS.mcpConnectHotels}. The daily limit then no longer applies. Each subscription covers its own product: Airbnb searches on the Hotels connector need an Airbnb Live API subscription on the same key (PRO is $${airbnbPro.priceMonthly} for ${airbnbPro.quota.toLocaleString('en-US')}).`,
  },
  {
    q: 'Does Claude see my key?',
    a: 'No. The key goes into the form on our /connect page once, is stored encrypted and is used only when a search runs. Disconnect on the same page deletes it.',
  },
  {
    q: 'Can these connectors book anything?',
    a: 'No. Every tool is a read-only search. Results carry a link to book on Google Flights, Booking.com or Airbnb yourself.',
  },
  {
    q: 'Where do the prices come from?',
    a: 'They are read live from Google Flights, Booking.com and Airbnb when you ask. FlightPowers is an independent service and is not affiliated with Google, Booking.com or Airbnb.',
  },
];

function ExampleList({ items }: { items: Example[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4">
      {items.map((ex) => (
        <div key={ex.prompt} className="rounded-2xl border rule bg-ink-900/60 p-5">
          <p className="text-[15px] leading-relaxed text-ink-200">&ldquo;{ex.prompt}&rdquo;</p>
          <p className="mt-2 font-mono text-[12px] text-ink-500">{ex.cost}</p>
        </div>
      ))}
    </div>
  );
}

export default function ClaudeConnectorsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'Claude connectors', item: `${SITE.url}${PAGE}` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/integrations', label: 'Integrations' },
            { href: PAGE, label: 'Claude connectors' },
          ]}
        />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <p className="eyebrow">Claude connectors</p>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
            FlightPowers <span className="text-signal-500">Flights</span> and{' '}
            <span className="text-signal-500">Hotels</span> for Claude
          </h1>
          <p className="lede mt-5 max-w-2xl">
            Ask Claude for flight fares and hotel rates, and it searches live prices while you talk. No ads. Sign in
            with Google and the first 10 searches a day are free, shared by both connectors.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {CONNECTORS.map((c) => (
              <div key={c.server} className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.05] p-5">
                <p className="text-[17px] font-semibold text-ink-100">{c.name}</p>
                <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">{c.what}</p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ink-500">Connector URL</p>
                <code className="mt-1 block font-mono text-[13px] text-signal-400 break-all">{installLinks(c.server).url}</code>
                <div className="mt-4">
                  <AddToClientButtons server={c.server} clients={['claude']} />
                </div>
                <p className="mt-4 text-[13.5px] text-ink-400 leading-relaxed">
                  For full scans: ${c.pro.priceMonthly} a month for {c.pro.quota.toLocaleString('en-US')} {c.unit}{' '}
                  searches (PRO, sold through RapidAPI). Connect the key once at{' '}
                  <a href={c.connect} rel="noopener" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
                    {c.connect.replace('https://', '')}
                  </a>
                  .
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Section id="connect">
        <SectionHead eyebrow="Get started" title="Three steps" />
        <ol className="mt-10 max-w-3xl space-y-4">
          {[
            {
              title: 'Add the connector',
              body: 'Press Add to Claude above: claude.ai opens Add custom connector with the name and URL filled in: press Continue, choose ‘Sign in when needed’ (not the pre-selected ‘No sign-in’), then Add. By hand it is Customize → Connectors → + Add → Add custom connector, a name and the URL above, then the same: press Continue, choose ‘Sign in when needed’ (not the pre-selected ‘No sign-in’), then Add. Add it on the web once and it works in the Claude app on your phone too.',
            },
            {
              title: 'Sign in with Google',
              body: 'Claude asks you to sign in the first time it searches. A FlightPowers page opens: sign in with Google there. Google shares only your account id and email address with us. Do this once for each connector you added. That gives you 10 searches a day, no ads, no key.',
            },
            {
              title: 'Ask',
              body: 'In a chat, check that FlightPowers Flights and/or FlightPowers Hotels are switched on under + → Connectors, then ask in plain words. Claude picks the tool and fills in the dates and airports itself.',
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-5">
              <span className="font-mono text-[15px] text-signal-500 tabular-nums">{i + 1}</span>
              <div>
                <p className="text-[15.5px] font-semibold text-ink-100">{step.title}</p>
                <p className="mt-1 text-[14px] text-ink-400 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 max-w-3xl space-y-2 text-[14px] text-ink-400 leading-relaxed">
          <p>Claude Free allows one custom connector: add the one you need most.</p>
          <p>On a Team plan an Owner adds the connector first; members then press Connect.</p>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Ask it"
          title="Example prompts"
          lede="Each one ran against the live connectors. The line under it is what it costs in searches."
        />
        <div className="max-w-3xl">
          <h3 className="mt-10 text-[1.15rem] font-semibold text-ink-100">FlightPowers Flights</h3>
          <ExampleList items={FLIGHT_EXAMPLES} />
          <h3 className="mt-10 text-[1.15rem] font-semibold text-ink-100">FlightPowers Hotels</h3>
          <ExampleList items={HOTEL_EXAMPLES} />
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Tools"
          title="The tools listed in Claude"
          lede="Claude shows each connector’s exact list when you open it. These are the searches behind the prompts above, all read-only."
        />
        <div className="mt-8 max-w-3xl">
          {TOOLS.map((tool) => (
            <FieldRow key={tool.name} name={tool.name} type={tool.type}>
              {tool.note}
            </FieldRow>
          ))}
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Policies and support" title="Privacy, terms, help" />
        <div className="mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 text-[14.5px] text-ink-300">
          {(['flights', 'hotels'] as const).map((host) => (
            <div key={host} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-semibold text-ink-100">{host === 'flights' ? 'FlightPowers Flights' : 'FlightPowers Hotels'}</p>
              <ul className="mt-2 space-y-1">
                {['privacy', 'terms', 'support'].map((p) => (
                  <li key={p}>
                    <a
                      href={new URL(`/${p}`, host === 'flights' ? LINKS.mcpFlights : LINKS.mcpHotels).toString()}
                      rel="noopener"
                      className="text-signal-400 underline underline-offset-4 hover:text-signal-500"
                    >
                      {p[0]!.toUpperCase() + p.slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Questions: <a href="mailto:app@flightpowers.com" className="text-signal-400 underline underline-offset-4">app@flightpowers.com</a>.
          Scheduled fare checks and more ways to use FlightPowers with Claude:{' '}
          <Link href="/integrations/claude" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
            FlightPowers and Claude
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
