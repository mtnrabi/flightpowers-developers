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
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'Claude Desktop MCP Setup: Live Google Flights & Booking.com Data',
  description:
    'Connect Claude Desktop and Claude Code to live flight and hotel data via hosted MCP servers. Bring your own RapidAPI key, paste two URLs into mcp.json, and your AI agent gets real-time pricing with Google\'s verdict. 60-second setup.',
  alternates: { canonical: '/integrations/claude-mcp' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Does this work with Claude Desktop and Claude Code?',
    a: 'Yes. Both use the same MCP configuration file (.cursor/mcp.json for Cursor, ~/Library/Application Support/Claude/claude_desktop_config.json for Claude Desktop on Mac). The setup is identical.',
  },
  {
    q: 'Is my API key secure in the config file?',
    a: 'The key lives in your local config file, not in the chat. Treat the file as you would any credential file (SSH keys, .env files). The hosted MCP server forwards your key to RapidAPI; we never store it.',
  },
  {
    q: 'What does "hosted MCP" mean?',
    a: 'The MCP server runs on our infrastructure at flights.flightpowers.com and hotels.flightpowers.com, not on your machine. You connect to a URL instead of running a local process. This means zero installation, no updates to manage, and the server is always available.',
  },
  {
    q: 'What happens if I exceed my quota?',
    a: 'On paid plans, requests beyond your monthly quota bill at the plan\'s overage rate. The free tier (10 requests/month) is hard-capped: requests beyond 10 are rejected, not billed. The MCP server returns api_usage in every response showing your remaining quota.',
  },
  {
    q: 'Can I use this with the free Lulu MCP server?',
    a: 'Yes, but the Lulu server (google-flights-lulu.flightpowers.com/mcp) is for trying the tools before getting a key. It includes one sponsored result per response and shares capacity with all users. Point production work at the keyed servers documented here.',
  },
  {
    q: 'Why are flights and hotels separate servers?',
    a: 'They are separate APIs on RapidAPI with separate subscriptions and rate limits. One RapidAPI key works for both once you subscribe to each listing, and Claude treats both servers as one unified toolbox.',
  },
];

export default function ClaudeMcpPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'Connect Claude Desktop to live flight and hotel data via MCP',
          description: '60-second MCP setup for Claude Desktop and Claude Code',
          step: [
            {
              '@type': 'HowToStep',
              name: 'Get your RapidAPI key',
              text: 'Subscribe to Google Flights Live API and/or Booking Live API on RapidAPI. Free tier available.',
            },
            {
              '@type': 'HowToStep',
              name: 'Find your MCP config file',
              text: 'For Cursor: .cursor/mcp.json in your project. For Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json on Mac.',
            },
            {
              '@type': 'HowToStep',
              name: 'Add the MCP server URLs',
              text: 'Paste the flights and hotels server URLs with your RapidAPI key into the mcpServers section.',
            },
            {
              '@type': 'HowToStep',
              name: 'Restart Claude',
              text: 'Close and reopen Claude Desktop or reload Cursor. Ask a travel question to verify the tools appear.',
            },
          ],
        }}
      />

      {/* ============================== HERO ============================== */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-14 sm:pt-20 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">Hosted MCP for Claude</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                Live flight & hotel data in <span className="text-signal-500">Claude Desktop</span>
              </h1>
              <p className="lede mt-5">
                Connect Claude Desktop and Claude Code to live Google Flights and Booking.com data in 60 seconds. Paste two URLs
                into your MCP config, bring your own RapidAPI key, and your AI agent gets real-time pricing with Google\'s verdict.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>Hosted MCP servers: no install, no processes to manage, always available</>,
                    <>
                      Bring your own RapidAPI key: you control the subscription, we never see your card
                    </>,
                    <>
                      Google\'s price verdict on every fare: <code className="font-mono text-[13px] text-signal-400">low | typical | high</code>
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'mcp')} external variant="primary">
                  Get free API key →
                </Cta>
                <Cta href="#setup" variant="ghost">
                  See setup ↓
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">
                Free tier: 10 requests/month, no credit card
              </p>
            </div>

            <div>
              <Code label=".cursor/mcp.json or claude_desktop_config.json">
{`{
  "mcpServers": {
    "flights": {
      "url": "${LINKS.mcpFlights}",
      "headers": {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY"
      }
    },
    "hotels": {
      "url": "${LINKS.mcpHotels}",
      "headers": {
        "x-rapidapi-key": "YOUR_RAPIDAPI_KEY"
      }
    }
  }
}`}
              </Code>
              <p className="mt-3 text-[15px] text-ink-300">
                Restart Claude. Ask for a fare. Done.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* ============================== SETUP STEPS ============================== */}
      <Section id="setup">
        <SectionHead
          eyebrow="Setup"
          title="Four steps, 60 seconds"
          lede="Verified against Claude Desktop 1.x and Cursor 0.x on 2026-09-01."
        />
        <ol className="mt-10 max-w-3xl space-y-6">
          <li className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-6">
            <span className="font-mono text-[17px] text-signal-500 tabular-nums">1</span>
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-ink-100">Get your RapidAPI key</h3>
              <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
                Subscribe to{' '}
                <a href={rapidApiPricingUrl('flights', 'mcp')} rel="noopener" className="text-signal-400 underline underline-offset-4">
                  Google Flights Live API
                </a>{' '}
                and/or{' '}
                <a href={rapidApiPricingUrl('hotels', 'mcp')} rel="noopener" className="text-signal-400 underline underline-offset-4">
                  Booking Live API
                </a>{' '}
                on RapidAPI. The free BASIC tier is 10 requests/month with no credit card required. One key works for both APIs once
                subscribed.
              </p>
            </div>
          </li>
          <li className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-6">
            <span className="font-mono text-[17px] text-signal-500 tabular-nums">2</span>
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-ink-100">Find your MCP config file</h3>
              <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
                <strong className="text-ink-100">For Cursor:</strong> <code className="font-mono text-[13px] text-signal-400">.cursor/mcp.json</code> in your project root.
                <br />
                <strong className="text-ink-100">For Claude Desktop:</strong> <code className="font-mono text-[13px] text-signal-400">~/Library/Application Support/Claude/claude_desktop_config.json</code> on Mac,{' '}
                <code className="font-mono text-[13px] text-signal-400">%APPDATA%/Claude/claude_desktop_config.json</code> on Windows.
              </p>
            </div>
          </li>
          <li className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-6">
            <span className="font-mono text-[17px] text-signal-500 tabular-nums">3</span>
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-ink-100">Add the MCP server URLs</h3>
              <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
                Open the config file and paste the mcpServers block from the code example above, replacing{' '}
                <code className="font-mono text-[13px] text-signal-400">YOUR_RAPIDAPI_KEY</code> with your actual key. If the file already
                has an mcpServers section, add flights and hotels inside it.
              </p>
            </div>
          </li>
          <li className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-6">
            <span className="font-mono text-[17px] text-signal-500 tabular-nums">4</span>
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-ink-100">Restart Claude and test</h3>
              <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed">
                Close and reopen Claude Desktop, or reload the Cursor window. Ask a travel question: "Find me a nonstop LHR to JFK
                flight on October 13 and tell me if the price is any good." Success looks like Claude calling{' '}
                <code className="font-mono text-[13px] text-signal-400">search_oneway_flights</code> and quoting a fare with Google\'s
                verdict.
              </p>
            </div>
          </li>
        </ol>
      </Section>

      {/* ============================== TOOLS ============================== */}
      <Section>
        <SectionHead
          eyebrow="What Claude sees"
          title="Four MCP tools across two servers"
          lede="These are the tools that appear in Claude after setup. Each one returns live data from Google Flights or Booking.com."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-ink-400 mb-3">{LINKS.mcpFlights.replace('https://', '')}</p>
            <Feature title="search_oneway_flights">
              One-way fares with Google\'s price band, a low | typical | high verdict, and a buy_link on every result. Accepts a
              single date or a range (departure_date_from / departure_date_to), expanded server-side.
            </Feature>
            <div className="mt-4" />
            <Feature title="search_roundtrip_flights">
              Paired round-trip itineraries: one object per option with both legs matched and a combined total_price. Date ranges and
              destination lists expand into multiple searches in one call.
            </Feature>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="font-mono text-[12px] text-ink-400 mb-3">{LINKS.mcpHotels.replace('https://', '')}</p>
            <Feature title="search_hotels">
              Destination search over live Booking.com rates with the site\'s own filters: review_score_8, free_cancellation,
              max_price_per_night, and more. Results include price, review score, room type, and booking link.
            </Feature>
            <div className="mt-4" />
            <Feature title="find_hotel_by_name">
              Find one property by name + city, no property ID required. price_as_seen_from (proxy_country) prices it from any market:
              the rate-parity tool.
            </Feature>
          </div>
        </div>
      </Section>

      {/* ============================== PROMPTS ============================== */}
      <Section>
        <SectionHead
          eyebrow="Ask it"
          title="Five things you can ask right after setup"
          lede="Claude picks the tool and fills the parameters itself. These all work as written."
        />
        <div className="mt-10 space-y-4 max-w-3xl">
          {[
            'Find me a nonstop LHR to JFK flight on October 13 and tell me if the price is any good.',
            'What is the cheapest day to fly Lisbon to New York in November?',
            'I need a round trip JFK to Paris, out October 6, back October 13. What are my best-value options?',
            'Find a hotel in Lisbon, October 9 to 12, 2 adults, review score 8+, free cancellation.',
            'Price the Rixos Sungate in Antalya for October 5–10 as seen from the US, Germany, and Israel.',
          ].map((prompt, i) => (
            <div key={i} className="rounded-2xl border rule bg-ink-900/50 p-5">
              <p className="text-[15.5px] text-ink-100 leading-relaxed">&ldquo;{prompt}&rdquo;</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================== ALTERNATIVE ============================== */}
      <Section>
        <div className="rounded-3xl border border-dashed rule bg-ink-950/60 p-6 sm:p-10 max-w-3xl">
          <p className="eyebrow">Alternative</p>
          <h2 className="mt-3 text-2xl font-semibold">Try before you get a key: the free Lulu MCP server</h2>
          <p className="mt-4 text-[15px] text-ink-400 leading-relaxed">
            <code className="field">{LINKS.mcpFree.replace('https://', '')}</code> serves all four tools with no key required. The
            trade: every result carries one labelled sponsored card, one call searches at most 15 date × destination combinations
            instead of 30, and capacity is shared with everyone else on it. Use it to try the tools before getting a key; point
            production work at the keyed servers above.
          </p>
          <Link href="/tools#free-mcp" className="mt-4 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
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
            { href: '/guides/ai-travel-agent', label: 'Build a Travel Agent', sub: '24/7 fare watch in 15 minutes' },
            { href: '/skills', label: 'Agent Skills', sub: '8 MIT-licensed workflows on GitHub' },
            { href: '/mcp', label: 'MCP for all clients', sub: 'ChatGPT, Cursor, and more' },
            { href: '/pricing', label: 'Pricing', sub: 'Free tier to $50/month' },
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
          title="60 seconds from config file to working travel agent"
          body="Paste two URLs, add your key, restart Claude. The free tier verifies the connection; the $10 PRO plan runs a daily agent."
        />
      </Section>
    </>
  );
}
