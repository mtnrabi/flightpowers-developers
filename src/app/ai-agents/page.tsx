import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AgentBand, CtaBand } from '@/components/bands';
import {
  CapturedBadge,
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { AGENTS } from '@/lib/matrix';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Travel data for AI agents: MCP, skills, and REST on one key',
  description:
    'Live Google Flights and Booking.com prices as flat JSON an agent can act on: booking links, per-country hotel rates. One RapidAPI key authenticates MCP, the open-source skills, and REST.',
  alternates: { canonical: '/ai-agents' },
});

export const dynamic = 'force-static';

type Recipe = { title: string; chips: string[]; body: string };

const geo = FIXTURES.hotelGeoRixos;

const RECIPES: Recipe[] = [
  {
    title: 'A fare-alert cron',
    chips: ['search_oneway_flights', 'price_range_in_relation_to_other_periods', 'buy_link'],
    body: 'Poll a route on a schedule and alert when prices drop. Send the buy_link in the alert so the user can book from the notification.',
  },
  {
    title: 'A cheapest-week scanner',
    chips: ['search_oneway_flights', 'departure_date_from / departure_date_to', 'price'],
    body: 'The MCP tool takes a date range and expands it server-side: one call, not thirty. The agent gets a flight price per day and answers with the cheapest date and what picking it saves. Over REST, the same scan is a parallel burst; the rate limits are sized for it.',
  },
  {
    title: 'A rate-parity watcher',
    chips: ['find_hotel_by_name', 'price_as_seen_from', 'price'],
    body: `One call per market, identical except price_as_seen_from (proxy_country over REST), then compare the quotes. In a captured run on ${geo.captured_at}, the US market was quoted ${geo.data.us.price_string} for the same room Germany and Israel saw at ${geo.data.de.price_string}.`,
  },
  {
    title: 'A trip-planning agent that answers with booking links',
    chips: ['search_roundtrip_flights', 'search_hotels', 'buy_link'],
    body: 'Round-trip returns paired itineraries with a combined total; the hotel search returns ranked properties with live rates. Every flight carries a buy_link and every property a booking link, so the plan the agent hands back is actionable, not a description.',
  },
  {
    title: 'A hotel comp-set tracker',
    chips: ['find_hotel_by_name', 'available', 'price_string'],
    body: 'Run the by-name lookup across a competitive set on a schedule. Sold-out comes back as the same shape with available: false, so the tracker never branches on error formats: it just logs price and availability per property, per night.',
  },
  {
    title: 'A “should I book it now” advisor',
    chips: ['search_oneway_flights', 'price_insights_low / price_insights_high'],
    body: 'The user brings a quoted price; the agent compares it against Google’s own band for the route and dates. Below the low end: take it. Above the high end: wait. The recommendation cites a source instead of a hunch.',
  },
];

type TableRow = { approach: string; time: string; upkeep: string; judgment: string; ours?: boolean };

const DECISION_ROWS: TableRow[] = [
  {
    approach: 'Headless-browser DIY (Puppeteer / Playwright)',
    time: 'Days: selectors, proxies, consent walls',
    upkeep: 'Breaks on markup changes, and the fixes are yours',
    judgment: 'None, and an empty page and a failed scrape return the same empty list',
  },
  {
    approach: 'Official GDS APIs',
    time: 'Weeks: contracting and certification before the first call',
    upkeep: 'An enterprise integration to maintain',
    judgment: 'Built for ticketing workflows; consumer price context is not the product',
  },
  {
    approach: 'Generic scraper marketplaces',
    time: 'Hours: pick a scraper, wire up runs',
    upkeep: 'Per-search economics: cost scales linearly with volume',
    judgment: 'Raw prices with no reference band to judge them against',
  },
  {
    approach: 'FlightPowers REST',
    time: 'Minutes: one POST with your key',
    upkeep: 'Managed: automatic retries and error handling',
    judgment: 'Price context from Google Flights',
    ours: true,
  },
  {
    approach: 'FlightPowers MCP',
    time: '30 seconds: paste a URL into your client',
    upkeep: 'Hosted; nothing of yours to run',
    judgment: 'The same context fields, delivered as a first-class tool result',
    ours: true,
  },
];

const faq: Faq[] = [
  {
    q: 'What is the fastest way to connect an agent?',
    a: 'The MCP URL. Paste the mcpServers config (or the connector URL with your key) into Claude, Cursor, or ChatGPT, restart, and the four tools appear. No SDK, no install. The /mcp page has the exact block to copy.',
  },
  {
    q: 'Does one key really cover MCP, the skills, and REST?',
    a: 'Yes. All three surfaces authenticate with the same RapidAPI key and meter against the same plan. You subscribe once on RapidAPI; the MCP servers forward your key, the skills read it from your environment, and REST takes it as the x-rapidapi-key header.',
  },
  {
    q: 'How do the rate limits map to agent workloads?',
    a: 'Flights: 150 requests/minute on Pro, 250 on Ultra, 500 on Mega, sized so a month-long flexible-date scan over REST finishes in one burst. Hotels: 25/minute on Pro and Ultra, 50 on Mega. A daily price-watch across several routes fits comfortably in the $10 Pro tier’s 2,500 requests.',
  },
  {
    q: 'What does the agent actually get back?',
    a: 'Flat JSON per result. Flights: price as string and number, airline, duration, stops with layover details, Google’s price_insights_low/high band, price context from Google Flights, and a working buy_link. Hotels: price, review score and count, room type, availability, and a booking link.',
    a: 'Flat JSON per result. Flights: price as string and number, airline, duration, stops with layover details, and a working buy_link. Hotels: price, review score and count, room type, availability, and a booking link.',
  },
  {
    q: 'Is there a way to demo without a key?',
    a: 'The free ad-supported MCP server runs the flight and hotel tools with no key: every result carries one labelled sponsored card, one call searches at most 15 date × destination combinations instead of 30, and capacity is shared with every other caller, so it is for trying, not production. The free tools on this site also run live requests on our own key.',
  },
];

export default function AiAgentsPage() {
  const fx = FIXTURES.onewayJfkCun;
  const rec = fx.data[0]!;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Travel data for AI agents',
          url: `${SITE.url}/ai-agents`,
          hasPart: [
            { '@type': 'WebPage', name: 'MCP servers', url: `${SITE.url}/mcp` },
            { '@type': 'WebPage', name: 'Agent skills', url: `${SITE.url}/skills` },
            { '@type': 'WebPage', name: 'Integrations', url: `${SITE.url}/integrations` },
          ],
        }}
      />

      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">For agent builders</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Travel data, built for <span className="text-signal-500">AI agents</span>
              </h1>
              <p className="lede mt-5">
                Live Google Flights and Booking.com prices as flat JSON, with the fields that turn a number into a decision.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      {COUNTS.mcpServers} hosted MCP servers, {COUNTS.skills} open-source skills, an n8n node, and plain REST: one
                      key authenticates all of it
                    </>,
                    <>Every flight carries Google&apos;s price band, a price context, and a working buy_link</>,
                    <>Real-time pricing with booking links</>,
                    <>Hotels price per market (price_as_seen_from over MCP, proxy_country over REST): rate-parity checks from a single API</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'mcp')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/mcp" variant="ghost">
                  The MCP config
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: 10 requests/month. No card to try.</p>
            </div>

            <div>
              <div className="mb-2.5">
                <CapturedBadge date={fx.captured_at} />
              </div>
              <Code label="the tool response your agent reads">{`{
  "price": "${rec.price}",
  "price_insights_low": ${rec.price_insights_low},
  "price_insights_high": ${rec.price_insights_high},
  "price_range_in_relation_to_other_periods":
      "${rec.price_range_in_relation_to_other_periods}",
  "airline": "${rec.airline}",
  "stops": ${rec.stops},
  "buy_link": "https://www.google.com/travel/flights?tfs=..."
}
// "${rec.price} is ${rec.price_range_in_relation_to_other_periods} for JFK→CUN on these dates:
//  The usual range is $${rec.price_insights_low} to $${rec.price_insights_high}."`}</Code>
              <p className="mt-3 text-[13px] text-ink-500">
                A real captured response, trimmed to the fields an agent branches on. The comment is the sentence those fields let
                it say.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* ============================== HOW ============================== */}
      <Section>
        <SectionHead
          eyebrow="The loop"
          title="How agents use FlightPowers"
          lede="One key, four steps, and every surface points at the same live data."
        />
        <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            [
              'Get one RapidAPI key',
              'The free tier needs no card and verifies your key works. That single key authenticates REST, both MCP servers, and the skills.',
            ],
            [
              'Pick the surface your stack speaks',
              'An MCP URL for Claude, Cursor, and ChatGPT; skills for Claude Code and OpenClaw; a community node for n8n; plain REST for everything else.',
            ],
            [
              'Let the agent call the tools',
              'Flat JSON per result: price, band, price context, booking link for flights; price, availability, review score, link for hotels. Small enough to drop straight into a tool result.',
              'Flat JSON per result: price, booking link for flights; price, availability, review score, link for hotels. Small enough to drop straight into a tool result.',
            ],
            [
              'Branch on the judgment fields',
              'Verdict flips to “low”: alert. Fare under the band: recommend booking. REST reports degraded: retry, and never tell the user “no flights”.',
            ],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="font-mono text-[13px] text-signal-500">{i + 1}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-ink-100">{title}</p>
              <p className="mt-1.5 text-[14px] text-ink-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ============================== SIX RECIPES ============================== */}
      <Section>
        <SectionHead
          eyebrow="Recipes"
          title="Six things you can build this week"
          lede="Each card names the exact tool chain. The per-agent pages below turn every one into a copy-paste setup."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map((r) => (
            <div key={r.title} className="rounded-2xl border rule bg-ink-900/60 p-6">
              <h3 className="text-[16px] font-semibold text-ink-100">{r.title}</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.chips.map((chip) => (
                  <code key={chip} className="rounded-md border rule bg-ink-950/70 px-1.5 py-0.5 font-mono text-[11px] text-signal-400">
                    {chip}
                  </code>
                ))}
              </div>
              <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">Setup per agent</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {AGENTS.map((agent) => (
              <Link key={agent.slug} href={`/integrations/${agent.slug}`} className="chip">
                {agent.name}
              </Link>
            ))}
            <Link href="/integrations" className="chip">
              All integrations →
            </Link>
          </div>
        </div>
      </Section>

      {/* ============================== WHY NOT SCRAPE ============================== */}
      <Section>
        <SectionHead
          eyebrow="The decision"
          title="Why not scrape it yourself?"
          lede="Five ways to get flight and hotel prices into an agent, compared on the three things that end up mattering."
        />
        <div className="mt-10 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[52rem] text-left text-[14px]">
            <thead>
              <tr className="border-b rule bg-ink-900/70">
                <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-ink-500 font-medium">Approach</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-ink-500 font-medium">Time to first result</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-ink-500 font-medium">Ongoing burden</th>
                <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-ink-500 font-medium">Price judgment</th>
              </tr>
            </thead>
            <tbody>
              {DECISION_ROWS.map((row) => (
                <tr key={row.approach} className={`border-b rule last:border-b-0 ${row.ours ? 'bg-signal-600/5' : ''}`}>
                  <td className={`p-4 align-top font-semibold ${row.ours ? 'text-signal-400' : 'text-ink-100'}`}>{row.approach}</td>
                  <td className="p-4 align-top text-ink-300">{row.time}</td>
                  <td className="p-4 align-top text-ink-300">{row.upkeep}</td>
                  <td className="p-4 align-top text-ink-300">{row.judgment}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[13px] text-ink-500 leading-relaxed">
          The competitor rows describe categories, not any single vendor. Evaluate the specific tool you are considering against
          them. The FlightPowers rows are checkable on this site: the price_range_in_relation_to_other_periods field on{' '}
          them. The FlightPowers rows are checkable on this site: the API on{' '}
          <Link href="/flights-api/price-insights" className="text-signal-400 underline underline-offset-4">
            the Price Insights page
          </Link>
          , the config on{' '}
          <Link href="/mcp" className="text-signal-400 underline underline-offset-4">
            the MCP page
          </Link>
          .
        </p>
      </Section>

      {/* ============================== AGENT BAND ============================== */}
      <Section>
        <AgentBand />
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      {/* ============================== RELATED ============================== */}
      <Section>
        <SectionHead eyebrow="Keep going" title="Where to next" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/mcp', label: 'The MCP servers', sub: 'One URL, four tools, your key' },
            { href: '/skills', label: 'The agent skills', sub: `${COUNTS.skills} open-source skills, MIT` },
            { href: '/integrations', label: 'All integrations', sub: 'Every surface we ship on' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans from $0, billed on RapidAPI' },
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
          medium="mcp"
          title="Give your agent a travel budget it can defend"
          body="Live flight prices with Google's own price band and price context, so the agent recommends with a source, not a hunch. One key covers MCP, skills, and REST."
          body="Live flight and hotel data, so your agent has current pricing. One key covers MCP, skills, and REST."
        />
      </Section>
    </>
  );
}
