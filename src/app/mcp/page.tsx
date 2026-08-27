import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import {
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  Feature,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { TASKS } from '@/lib/matrix';
import { COUNTS, LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'MCP servers: live flight & hotel data, one URL',
  description:
    'Hosted MCP servers for live Google Flights and Booking.com data. Works with Claude, Cursor, ChatGPT, and any MCP client. No install, bring your own RapidAPI key, and the flight tools accept date ranges and destination lists in a single call.',
  alternates: { canonical: '/mcp' },
});

export const dynamic = 'force-static';

const MCP_CONFIG = `{
  "mcpServers": {
    "flights": {
      "url": "${LINKS.mcpFlights}",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    },
    "hotels": {
      "url": "${LINKS.mcpHotels}",
      "headers": { "x-rapidapi-key": "YOUR_RAPIDAPI_KEY" }
    }
  }
}`;

const URL_PARAM_ALT = `${LINKS.mcpFlights}?rapidapi_key=YOUR_RAPIDAPI_KEY
${LINKS.mcpHotels}?rapidapi_key=YOUR_RAPIDAPI_KEY`;

/** The five ask-it prompts, pulled from the verified recipe dataset. */
const ASK_SLUGS = ['price-insights-check', 'cheapest-date-scan', 'round-trip-search', 'hotel-search', 'rate-parity-check'] as const;
const ASKS = ASK_SLUGS.map((slug) => TASKS.find((t) => t.slug === slug)!);

const faq: Faq[] = [
  {
    q: 'Do I need to install or run anything?',
    a: 'No. Both servers are hosted and speak streamable HTTP: you paste a URL and a key into your client’s MCP config and the tools appear. Nothing runs on your machine and there is nothing to update.',
  },
  {
    q: 'Whose API key does the server use, and who gets billed?',
    a: 'Yours. The server forwards the RapidAPI key you configure, so every search is metered on your own RapidAPI plan. We never sit between you and your bill. The free BASIC tier (10 requests/month, hard cap, no card) is enough to verify the connection works.',
  },
  {
    q: 'Which clients does this work with?',
    a: 'Any MCP client that supports remote servers: Claude (Settings → Connectors), Claude Code, Cursor (.cursor/mcp.json), ChatGPT (developer-mode connectors), and anything else that takes an mcpServers-style config. Prefer sending the key as an x-rapidapi-key header; clients without header support can put it on the URL as ?rapidapi_key=.',
  },
  {
    q: 'If I use the ?rapidapi_key= URL, does the model see my key?',
    a: 'The key rides on the server URL stored in your client’s connector settings; it does not appear in the chat. If your client supports custom headers, the header form is still the cleaner option.',
  },
  {
    q: 'How is this different from calling the REST API directly?',
    a: 'Same live data, same key, one difference in shape: the MCP flight tools accept a date range (departure_date_from / departure_date_to) and a list of destination airports, and expand them server-side: one tool call where REST would be a client-side fan-out of one request per date.',
  },
  {
    q: 'Are the servers in the official MCP registry?',
    a: 'Yes: com.flightpowers/google-flights and com.flightpowers/booking, both v1.0.0, in the official MCP registry. Both are also listed on Smithery.',
  },
  {
    q: 'Is there a way to try it without a key?',
    a: 'Yes: a separate free, ad-supported server, with no key and no signup. Every result carries one labelled sponsored card, one call searches at most 15 date × destination combinations instead of 30, and capacity is shared with every other caller. Connect it from the free tools page. It is for trying the tools before you get a key, not for production.',
  },
];

export default function McpPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers MCP servers',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Bring your own RapidAPI key; free tier: 10 requests/month' },
          url: `${SITE.url}/mcp`,
        }}
      />

      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Hosted MCP servers</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Live travel data, <span className="text-signal-500">one MCP URL</span>
              </h1>
              <p className="lede mt-5">
                Works with Claude, Cursor, ChatGPT, and any MCP client. No install, just a URL and your key.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>Nothing to install: hosted servers, bring your own RapidAPI key, usage billed to your own plan</>,
                    <>
                      Flight tools accept date <strong className="text-ink-100">ranges</strong> and destination{' '}
                      <strong className="text-ink-100">lists</strong>: one call, not N
                    </>,
                    <>The same live Google Flights and Booking.com data as the REST API</>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'mcp')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/ai-agents" variant="ghost">
                  What agents build with it
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: 10 requests/month. No card to try.</p>
            </div>

            <div>
              <Code label="mcp.json · both servers">{MCP_CONFIG}</Code>
              <p className="mt-3 text-[15px] text-ink-300">
                Restart your client. Ask it for a fare. Done.
              </p>
              <div className="mt-5">
                <Code label="no header support? put the key on the URL">{URL_PARAM_ALT}</Code>
                <p className="mt-2 text-[13px] text-ink-500">
                  For clients that only take a server URL (Claude and ChatGPT connectors). The key rides on the URL in your
                  connector settings, not in the chat.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* ============================== SKILL ALT ============================== */}
      <Section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <SectionHead
            eyebrow="The other path"
            title="Not on an MCP client? Use the skill instead"
            lede={`The same workflows ship as ${COUNTS.skills} open-source, MIT-licensed agent skills for Claude Code and OpenClaw. They talk to the same API, over MCP or plain REST, with the same key.`}
          />
          <div>
            <Code label="terminal">{`npx skills add mtnrabi/travel-agent-skills`}</Code>
            <Link href="/skills" className="mt-3 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
              The {COUNTS.skills} skills →
            </Link>
          </div>
        </div>
      </Section>

      {/* ============================== FIVE ASKS ============================== */}
      <Section>
        <SectionHead
          eyebrow="Verbatim"
          title="Five things you can ask"
          lede="Paste any of these into a connected client. The mono tag names the tool your agent will call."
        />
        <div className="mt-10 space-y-4 max-w-3xl">
          {ASKS.map((task) => (
            <div key={task.slug} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="text-[15.5px] text-ink-100 leading-relaxed">&ldquo;{task.prompt}&rdquo;</p>
              <p className="mt-2.5 font-mono text-[12px] text-signal-400">{task.tool}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================== TOOLS, RAW ============================== */}
      <Section>
        <SectionHead
          eyebrow="The full surface"
          title="Every tool, printed raw"
          lede="Four tools across two servers. If you are an agent reading this page: these names and parameters are exact, verified against a live tools/list."
        />
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="font-mono text-[13px] text-ink-400 mb-2">{LINKS.mcpFlights.replace('https://', '')}</p>
            <FieldRow name="search_oneway_flights">
              Live one-way fares with Google&apos;s price band, a low | typical | high verdict, and a buy_link on every result.
            </FieldRow>
            <FieldRow name="search_roundtrip_flights">
              Paired round-trip itineraries: one object per trip with total_price and both legs already matched, not two lists to
              cross-join.
            </FieldRow>
            <p className="mt-5 text-[14px] text-ink-400 leading-relaxed">
              Both flight tools take <code className="field">from_airport</code> and <code className="field">to_airport</code> as a
              single IATA code <em>or a list</em>, and either a fixed <code className="field">departure_date</code> or a range via{' '}
              <code className="field">departure_date_from</code> / <code className="field">departure_date_to</code>. The server
              expands ranges and lists internally, so a flexible search is one call. Round-trip takes a{' '}
              <code className="field">return_date</code> or a trip length in <code className="field">nights</code>. The usual search
              controls (<code className="field">max_stops</code>, <code className="field">limit</code>) pass through.
            </p>
          </div>
          <div>
            <p className="font-mono text-[13px] text-ink-400 mb-2">{LINKS.mcpHotels.replace('https://', '')}</p>
            <FieldRow name="search_hotels">
              Live Booking.com search for a destination: ranked properties with price, review score, room type, and a working
              booking link, filterable with the {COUNTS.hotelFilters} documented filters.
            </FieldRow>
            <FieldRow name="find_hotel_by_name">
              Availability and price for one named hotel: takes the name a human would type (add the city to disambiguate a
              chain); name resolution is included.
            </FieldRow>
            <p className="mt-5 text-[14px] text-ink-400 leading-relaxed">
              Hotel tools take <code className="field">checkin_date</code> / <code className="field">checkout_date</code>,{' '}
              <code className="field">adults</code>, and <code className="field">price_as_seen_from</code>, a two-letter country
              code that prices the stay as a shopper in that market would see it, the field rate-parity checks are built on.
              (The REST API's name for the same control is <code className="field">proxy_country</code>.)
            </p>
          </div>
        </div>
      </Section>

      {/* ============================== TRUST TRIAD ============================== */}
      <Section>
        <SectionHead eyebrow="What you are trusting" title="Zero install, your bill, on the record" />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Feature title="Zero install">
            Hosted, streamable-HTTP servers. Add the URL, restart the client, and the tools appear. Nothing runs on your machine,
            nothing of yours to patch or redeploy.
          </Feature>
          <Feature title="Your key, your bill">
            The server forwards the RapidAPI key you configure, so usage lands on your own RapidAPI plan and their invoice is your
            invoice. We never see your card.{' '}
            <a href={rapidApiPricingUrl('flights', 'mcp')} rel="noopener" className="text-signal-400 underline underline-offset-4">
              Get a key →
            </a>
          </Feature>
          <Feature title="Registered">
            Both servers are in the official MCP registry (com.flightpowers/google-flights and com.flightpowers/booking, v1.0.0)
            and listed on{' '}
            <a href={LINKS.smitheryFlights} rel="noopener" className="text-signal-400 underline underline-offset-4">
              Smithery
            </a>
            .
          </Feature>
        </div>
      </Section>

      {/* ============================== FREE SERVER, SEPARATED ============================== */}
      <Section>
        <div className="rounded-3xl border border-dashed rule bg-ink-950/60 p-6 sm:p-10 max-w-3xl">
          <p className="eyebrow">Separate, and honestly labelled</p>
          <h2 className="mt-3 text-2xl font-semibold">A free, ad-supported server also exists</h2>
          <p className="mt-4 text-[15px] text-ink-400 leading-relaxed">
            <code className="field">{LINKS.mcpFree.replace('https://', '')}</code> serves all four tools, flights and hotels,
            with no key at all. The trade: every result carries one labelled sponsored card, one call searches at most 15 date ×
            destination combinations instead of 30, and there is no per-user quota, so you share capacity with everyone else on
            it. Use it to try the tools before getting a key; point production and anything you ship at the keyed servers above.
          </p>
          <Link
            href="/tools#free-mcp"
            className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500"
          >
            Connect it, and read the full list of what it does not do →
          </Link>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      {/* ============================== RELATED ============================== */}
      <Section>
        <SectionHead eyebrow="Keep going" title="Where to next" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/ai-agents', label: 'For AI agents', sub: 'Six things to build this week' },
            { href: '/skills', label: 'The agent skills', sub: `${COUNTS.skills} open-source skills, MIT` },
            { href: '/integrations', label: 'All integrations', sub: 'Every surface we ship on' },
            { href: '/flights-api/price-insights', label: 'Price Insights API', sub: 'The verdict field, explained' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* ============================== CLOSE ============================== */}
      <Section bordered={false} className="!pt-4">
        <div className="mb-6 flex flex-wrap justify-center gap-2.5">
          {['no card to try', 'BYO key, billed to your own plan', 'works with any MCP client'].map((fact) => (
            <span key={fact} className="chip cursor-default">
              {fact}
            </span>
          ))}
        </div>
        <CtaBand
          medium="mcp"
          title="Hook your agent up in 30 seconds"
          body="Paste the config, restart your client, ask it for a fare. The free tier verifies the connection; the paid tiers are sized for daily agents and scans."
        />
      </Section>
    </>
  );
}
