import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import {
  Breadcrumbs,
  CapturedBadge,
  Code,
  Container,
  Cta,
  JsonLd,
  Section,
  SectionHead,
  VerdictBadge,
} from '@/components/ui';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';
import RUN from './run-2026-10-06.json';
import TOOLS from './tools-2026-10-06.json';

// W2-5: the "google flights mcp" / "flights mcp" / "flight mcp server" page.
// The H1 is the query; /mcp stays the hub for both servers. title.absolute
// keeps the " · FlightPowers" suffix off so the tag stays under 60 chars.
const TITLE = 'Google Flights MCP server: live fares for Claude and Cursor';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description:
      "Google Flights MCP server for Claude, Cursor and ChatGPT: live fares with Google's price band, a date range in one call, round trips as one request.",
    alternates: { canonical: '/mcp/google-flights' },
  }),
  title: { absolute: TITLE },
};

export const dynamic = 'force-static';

const PRO = FLIGHT_PLANS[1]!;
const BASIC = FLIGHT_PLANS[0]!;
const FREE_HOST = LINKS.mcpFree.replace('https://', '');
const HOST = LINKS.mcpFlights.replace('https://', '');

/** Answers to the three questions people type, one sentence each. Also the FAQPage. */
const SHORT_ANSWERS: { q: string; a: string }[] = [
  {
    q: 'Is there an MCP for flights?',
    a: `Yes. FlightPowers runs a hosted flights MCP server at ${HOST}: add the URL to Claude, Cursor, ChatGPT or any MCP client, sign in with Google, and the assistant can search live fares one-way or round trip.`,
  },
  {
    q: 'Is there an MCP for Google Flights?',
    a: `Google has offered no public flights API since QPX Express closed in 2018, so a Google Flights MCP reads the live public results. This one hands them to the assistant with a booking link on every fare and Google's own low / typical / high price band for the route.`,
  },
  {
    q: 'What is an MCP server for?',
    a: 'An MCP (Model Context Protocol) server gives an AI assistant tools it can call. A flights MCP lets the assistant fetch real fares when you ask, instead of guessing from what it was trained on.',
  },
];

const MORE_FAQ: { q: string; a: string }[] = [
  {
    q: 'Is there a free flights MCP?',
    a: `Yes, ${FREE_HOST}: sign in with Google and you get the same flight and hotel tools with no key, 50 searches a day and 250 a month, with one labelled sponsored card on each result. It is the place to try the tools. For anything you ship, use the ad-free server on this page with your own RapidAPI key.`,
  },
  {
    q: 'What does a search cost on my key?',
    a: `One date and destination combination is one request on your RapidAPI plan. The run on this page covered 3 departure dates and 2 destinations, so it billed 6. PRO is $${PRO.priceMonthly} for ${PRO.quota.toLocaleString('en-US')} searches a month; BASIC is free with ${BASIC.quota} a month, enough to check the setup works.`,
  },
  {
    q: 'Can it search a whole month?',
    a: 'Yes, in one call. departure_date_from and departure_date_to set the range and nights takes a list of trip lengths, so a month at three trip lengths is one tool call that prices 93 combinations. The server says how many it searched in search_coverage.',
  },
  {
    q: 'Does it book flights?',
    a: 'No. Every fare carries a buy_link that opens Google Flights on that itinerary, and the booking happens there.',
  },
];

const ALL_FAQ = [...SHORT_ANSWERS, ...MORE_FAQ];

const CLAUDE_CODE = `claude mcp add --transport http flights ${LINKS.mcpFlights}`;

const MCP_JSON = `{
  "mcpServers": {
    "flights": { "url": "${LINKS.mcpFlights}" }
  }
}`;

const KEY_JSON = `{
  "mcpServers": {
    "flights": {
      "url": "${LINKS.mcpFlights}",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    }
  }
}`;

/** The call as it went over the wire, so the passage can be run as it stands. */
const CALL = JSON.stringify({ name: RUN.tool, arguments: RUN.arguments }, null, 2);

/** The response, trimmed to two rows and the summary blocks. Never hand-written. */
const EXCERPT = JSON.stringify(
  {
    search_status: RUN.result.search_status,
    results_total: RUN.result.results_total,
    results: RUN.result.results.slice(0, 2).map((r) => ({
      to_airport: r.to_airport,
      departure_date: r.departure_date,
      return_date: r.return_date,
      nights: r.nights,
      total_price: r.total_price,
      total_stops: r.total_stops,
      departure_flight_airline: r.departure_flight_airline,
      return_flight_airline: r.return_flight_airline,
      price_insights_low: r.price_insights_low,
      price_insights_high: r.price_insights_high,
      price_range_in_relation_to_other_periods: r.price_range_in_relation_to_other_periods,
      buy_link: r.buy_link.slice(0, 48) + '…',
    })),
    search_coverage: {
      requested_combinations: RUN.result.search_coverage.requested_combinations,
      searched_combinations: RUN.result.search_coverage.searched_combinations,
      hub_requests_billed: RUN.result.search_coverage.hub_requests_billed,
    },
  },
  null,
  2
);

const RUN_DATE = RUN.captured_at.slice(0, 10);
const RUN_TIME = RUN.captured_at.slice(11, 16);
const RUN_SECONDS = Math.round((Date.parse(RUN.finished_at) - Date.parse(RUN.captured_at)) / 1000);
const CHEAPEST = RUN.result.results[0]!;

const RELATED = [
  { href: '/mcp', label: 'Both MCP servers', sub: 'The hub: flights and hotels, every way to connect' },
  { href: '/mcp/booking-hotels', label: 'Hotel MCP server', sub: 'Live Booking.com rates for the same clients' },
  { href: '/guides/best-travel-mcp-servers-2026', label: 'Travel MCP servers compared', sub: '11 servers, read on the same day' },
  { href: '/guides/google-flights-mcp-claude', label: 'Setup: Claude', sub: 'Desktop, Code and claude.ai' },
  { href: '/guides/google-flights-mcp-cursor', label: 'Setup: Cursor', sub: 'One block in .cursor/mcp.json' },
  { href: '/guides/google-flights-mcp-chatgpt', label: 'Setup: ChatGPT', sub: 'Developer-mode connectors' },
  { href: '/flights-api', label: 'Flights API (REST)', sub: 'The same data over plain HTTP' },
  { href: '/status', label: 'Status', sub: 'The uptime probe and nightly tests' },
];

export default function GoogleFlightsMcpPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'MCP servers', item: `${SITE.url}/mcp` },
            { '@type': 'ListItem', position: 3, name: 'Google Flights MCP', item: `${SITE.url}/mcp/google-flights` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Google Flights MCP server',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          url: `${SITE.url}/mcp/google-flights`,
          installUrl: LINKS.mcpFlights,
          offers: [
            {
              '@type': 'Offer',
              name: BASIC.name,
              price: String(BASIC.priceMonthly),
              priceCurrency: 'USD',
              description: `${BASIC.quota} searches a month on your own RapidAPI key, hard cap`,
            },
            {
              '@type': 'Offer',
              name: PRO.name,
              price: String(PRO.priceMonthly),
              priceCurrency: 'USD',
              description: `${PRO.quota.toLocaleString('en-US')} searches a month on your own RapidAPI key`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: ALL_FAQ.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/mcp', label: 'MCP servers' },
            { href: '/mcp/google-flights', label: 'Google Flights' },
          ]}
        />
      </Container>

      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-start">
            <div>
              <p className="eyebrow">Flights MCP</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Google Flights MCP server for <span className="text-signal-500">Claude, Cursor and ChatGPT</span>
              </h1>
              {/* The MCP citation sentence, flights variant (plan "The one citation sentence").
                  Numbers from lib/pricing.ts and the free server's published caps. The date
                  range claim is an MCP claim and this is an MCP page. */}
              <p className="lede mt-5">
                FlightPowers&apos; Google Flights MCP server gives Claude, Cursor and ChatGPT live Google Flights fares with
                Google&apos;s own low / typical / high price band, a date range and a list of destinations in one call, and a
                round trip priced as one request with one booking link. Free with ads at{' '}
                <code className="font-mono text-[0.85em] text-signal-400">{FREE_HOST}</code> (Google sign-in, 50 searches a
                day); ad-free on your own RapidAPI key, where PRO is ${PRO.priceMonthly} for{' '}
                {PRO.quota.toLocaleString('en-US')} searches. Best for fare tracking, date scans and AI agents; it does not book.
              </p>
              <p className="mt-3 text-[15px] text-ink-400 leading-relaxed">
                Also called a flights MCP, a flight search MCP or a flight MCP server. It is hosted: you add a URL, nothing runs
                on your machine.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'mcp')} external variant="primary">
                  Get a flights key →
                </Cta>
                <Cta href="#connect" variant="ghost">
                  Connect it
                </Cta>
              </div>
            </div>
            <div>
              <Code label="add this URL to your MCP client">{LINKS.mcpFlights}</Code>
              <p className="mt-3 text-[15px] text-ink-300 leading-relaxed">
                Your client shows a <strong className="text-ink-100">Sign in</strong> button. Sign in with Google; your first
                10 searches each day run free and ad-free with nothing pasted, and you paste your RapidAPI key once on the page
                that opens when you want more.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* ============================== SHORT ANSWERS ============================== */}
      <Section>
        <div className="max-w-3xl space-y-10">
          {SHORT_ANSWERS.map((f) => (
            <div key={f.q}>
              <h2 className="text-[1.5rem] sm:text-3xl font-semibold">{f.q}</h2>
              <p className="mt-3 text-[15.5px] text-ink-300 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================== ONE REAL SEARCH ============================== */}
      <Section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead
            eyebrow="One real search"
            title="Six round trips priced in one tool call"
            lede={`New York to Lisbon or Barcelona, leaving any day from November 10 to 12, five nights. I sent this call to ${HOST} on ${RUN_DATE} at ${RUN_TIME} UTC; it is the call an assistant makes for that question. It came back in about ${RUN_SECONDS} seconds and billed ${RUN.result.api_usage.requests_used_by_this_call} requests.`}
          />
          <CapturedBadge date={RUN_DATE} />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <Code label="tools/call · the request">{CALL}</Code>
          <Code label="the response · trimmed to 2 of 6 rows">{EXCERPT}</Code>
        </div>
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">To</th>
                  <th className="px-4 py-3 font-normal">Out → back</th>
                  <th className="px-4 py-3 font-normal">Airlines</th>
                  <th className="px-4 py-3 font-normal text-right">Total</th>
                  <th className="px-4 py-3 font-normal text-right">Google&apos;s range</th>
                  <th className="px-4 py-3 font-normal">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {RUN.result.results.map((r) => (
                  <tr key={`${r.to_airport}-${r.departure_date}`} className="border-t rule">
                    <td className="px-4 py-3 text-ink-100">{r.to_airport}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-ink-300 whitespace-nowrap">
                      {r.departure_date.slice(5)} → {r.return_date.slice(5)}
                    </td>
                    <td className="px-4 py-3 text-ink-400">
                      {r.departure_flight_airline.split(' | ')[0]}
                      {r.return_flight_airline.split(' | ')[0] !== r.departure_flight_airline.split(' | ')[0]
                        ? ` / ${r.return_flight_airline.split(' | ')[0]}`
                        : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-100">{r.total_price}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-400 whitespace-nowrap">
                      ${r.price_insights_low} to ${r.price_insights_high}
                    </td>
                    <td className="px-4 py-3">
                      <VerdictBadge verdict={r.price_range_in_relation_to_other_periods as 'low' | 'typical' | 'high'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Each row is a whole round trip: both legs, one total, one <code className="field">buy_link</code>. The cheapest was{' '}
          {CHEAPEST.to_airport} at {CHEAPEST.total_price}, which Google marks {CHEAPEST.price_range_in_relation_to_other_periods}{' '}
          for that route (its range ${CHEAPEST.price_insights_low} to ${CHEAPEST.price_insights_high}). I asked for 5 rows; the
          server raised the limit to {RUN.result.search_coverage.searched_combinations} so every date and destination it searched
          gets a row, and says so in <code className="field">search_coverage</code>. Fares move by the minute, so read this as a
          captured run, not a price you can book today.
        </p>
      </Section>

      {/* ============================== CONNECT ============================== */}
      <Section id="connect">
        <SectionHead
          eyebrow="Connect it"
          title="One URL, any MCP client"
          lede="The same address works for every client. A client with a sign-in button gets a Google sign-in; a script sends your key in a header instead."
        />
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100">Claude (claude.ai and Desktop)</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              Settings, Connectors, Add custom connector, paste <code className="field">{LINKS.mcpFlights}</code>, press
              Connect and sign in with Google.
            </p>
            <h3 className="mt-6 text-[16px] font-semibold text-ink-100">Claude Code</h3>
            <div className="mt-2">
              <Code label="terminal">{CLAUDE_CODE}</Code>
            </div>
            <p className="mt-2 text-[14px] text-ink-500">Then open /mcp in a session and sign in.</p>
            <h3 className="mt-6 text-[16px] font-semibold text-ink-100">ChatGPT</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              Settings, Connectors, turn on developer mode, add the URL as a connector with OAuth authentication, and sign in
              with Google.{' '}
              <Link href="/guides/google-flights-mcp-chatgpt" className="text-signal-400 underline underline-offset-4">
                Step by step
              </Link>
              .
            </p>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100">Cursor and any mcp.json client</h3>
            <div className="mt-2">
              <Code label=".cursor/mcp.json">{MCP_JSON}</Code>
            </div>
            <h3 className="mt-6 text-[16px] font-semibold text-ink-100">Scripts, CI and clients with no sign-in button</h3>
            <div className="mt-2">
              <Code label="same URL, key in a header">{KEY_JSON}</Code>
            </div>
            <p className="mt-2 text-[14px] text-ink-500">
              A client that takes only a URL can put the key on it: <code className="field">?rapidapi_key=</code>. Treat that
              URL as a secret.
            </p>
          </div>
        </div>
      </Section>

      {/* ============================== TOOLS, RAW ============================== */}
      <Section>
        <SectionHead
          eyebrow="The tools, printed raw"
          title={`${TOOLS.tools.length} tools, read from a live tools/list`}
          lede={`Names, titles, hints and every parameter as ${HOST} returned them on ${TOOLS.read_at.slice(0, 10)}. Each parameter line is the first sentence of the server's own description.`}
        />
        <div className="mt-10 space-y-12">
          {TOOLS.tools.map((t) => (
            <div key={t.name}>
              <p className="font-mono text-[15px] text-signal-400">{t.name}</p>
              <p className="mt-1 text-[14px] text-ink-500">
                {t.title} · required: {t.required.join(', ')} · readOnlyHint {String(t.annotations.readOnlyHint)} ·
                idempotentHint {String(t.annotations.idempotentHint)}
              </p>
              <p className="mt-3 max-w-3xl text-[15px] text-ink-300 leading-relaxed">{t.summary}</p>
              <div className="mt-4 scroll-x rounded-2xl border rule">
                <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-[13.5px]">
                    <tbody>
                      {t.parameters.map((p) => (
                        <tr key={p.name} className="border-t rule first:border-t-0">
                          <td className="px-4 py-2.5 align-top font-mono text-[12.5px] text-ink-100 whitespace-nowrap">{p.name}</td>
                          <td className="px-4 py-2.5 text-ink-400 leading-relaxed">{p.about}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          idempotentHint is false on purpose: a fare search is a live lookup, and a client that caches it would hand you an old
          price.
        </p>
      </Section>

      {/* ============================== PRICE ============================== */}
      <Section>
        <SectionHead eyebrow="What it costs" title="Free to try, $10 for the big scans" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Try it free</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              <code className="field">{FREE_HOST}</code>: Google sign-in, no key, 50 searches a day and 250 a month, one
              sponsored card per result.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">PRO on your key</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              ${PRO.priceMonthly} a month for {PRO.quota.toLocaleString('en-US')} searches, {PRO.ratePerMinute} a minute, no
              ads. A month at three trip lengths is 93 searches, so PRO covers about{' '}
              {Math.floor(PRO.quota / 93)} of them.
            </p>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Bigger plans</h3>
            <p className="mt-2 text-[15px] text-ink-400 leading-relaxed">
              {FLIGHT_PLANS.slice(2)
                .map((p) => `${p.name} $${p.priceMonthly} for ${p.quota.toLocaleString('en-US')}`)
                .join(', ')}
              . Billing runs on RapidAPI, month to month. <Link href="/pricing" className="text-signal-400 underline underline-offset-4">All plans</Link>
              .
            </p>
          </div>
        </div>
      </Section>

      {/* ============================== MORE QUESTIONS ============================== */}
      <Section>
        <SectionHead title="More questions" />
        <dl className="mt-8 max-w-3xl">
          {MORE_FAQ.map((f) => (
            <div key={f.q} className="border-t rule py-6">
              <dt className="text-[16px] font-semibold text-ink-100">{f.q}</dt>
              <dd className="mt-2 text-[15px] text-ink-400 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ============================== RELATED ============================== */}
      <Section>
        <SectionHead eyebrow="Keep going" title="Where to next" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-[14px] text-ink-400">
          The server code is mirrored at{' '}
          <a href="https://github.com/mtnrabi/google-flights-mcp" rel="noopener" className="text-signal-400 underline underline-offset-4">
            github.com/mtnrabi/google-flights-mcp
          </a>
          .
        </p>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="mcp"
          title="Ask your assistant for a fare"
          body="Add the URL, sign in with Google, and ask for a month of fares to two cities. Google's verdict on the price comes back with the fares."
        />
      </Section>
    </>
  );
}
