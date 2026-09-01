import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { FloatingCta } from '@/components/FloatingCta';
import { Code, Container, Cta, JsonLd, Section } from '@/components/ui';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'ChatGPT flight API: connect live Google Flights data via MCP',
  description:
    'How to connect ChatGPT to live Google Flights data through MCP developer-mode connectors: one URL, your RapidAPI key, and Google's price verdict on every result. Pro and Business plans only.',
  alternates: { canonical: '/blog/chatgpt-flight-api' },
});

export const dynamic = 'force-static';

export default function ChatGptFlightApiPost() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: 'ChatGPT flight API: connect live Google Flights data via MCP',
          datePublished: '2026-09-01',
          dateModified: '2026-09-01',
          author: { '@type': 'Person', name: 'Matan Rabi', url: `${SITE.url}/about` },
          publisher: { '@id': `${SITE.url}/#organization` },
          image: `${SITE.url}/og?title=${encodeURIComponent('ChatGPT flight API')}`,
          url: `${SITE.url}/blog/chatgpt-flight-api`,
          description:
            'Connect ChatGPT to live Google Flights data through developer-mode MCP connectors with your own RapidAPI key.',
        }}
      />
      <FloatingCta />

      <Container className="pt-10 sm:pt-14">
        <Link href="/blog" className="font-mono text-[12px] text-ink-500 hover:text-ink-300 transition-colors">
          ← Blog
        </Link>
      </Container>

      <Container className="pt-6 sm:pt-8 pb-16">
        <article className="prose-fp max-w-3xl">
          <p className="font-mono text-[11px] text-ink-500">September 2026 · Matan Rabi</p>
          <h1 className="mt-3 text-3xl sm:text-[2.75rem] sm:leading-[1.1] font-semibold text-ink-100">
            ChatGPT flight API: connect live Google Flights data via MCP
          </h1>

          <p className="mt-6">
            ChatGPT&apos;s developer-mode connectors speak MCP. That means you can point ChatGPT at a hosted MCP server URL
            with your own RapidAPI key, and it gets native tools for searching live Google Flights and Booking.com data. No
            middleware to run, no server to maintain: the tools appear in your conversations and usage meters against your own
            subscription.
          </p>

          <h2>What developer mode is</h2>
          <p>
            Custom MCP connectors in ChatGPT are added through its developer-mode connector settings, which OpenAI documents as
            a <strong className="text-ink-100">Pro and Business plan feature</strong> (per its own help pages, checked 2026-08-27).
            Nothing about the server itself is experimental: the same URL serves Claude, Cursor, and any other MCP client. It is
            production infrastructure; the "developer mode" label is OpenAI&apos;s UI affordance for custom connectors.
          </p>

          <h2>The two connector URLs</h2>
          <p>Flights and hotels are separate MCP servers. Add both in your connector settings:</p>
          <Code label="add these URLs in developer-mode connectors">{`Flights: ${LINKS.mcpFlights}?x-rapidapi-key=YOUR_RAPIDAPI_KEY
Hotels:  ${LINKS.mcpHotels}?x-rapidapi-key=YOUR_RAPIDAPI_KEY`}</Code>
          <p>
            Replace <code className="font-mono text-[13px]">YOUR_RAPIDAPI_KEY</code> with your actual key from the RapidAPI
            listing. The key rides on the URL in your settings. ChatGPT never sees it in the chat itself. Treat the URL as a
            secret: anyone who has it can spend your quota.
          </p>

          <h2>The tools ChatGPT sees</h2>
          <p>Once connected, these tools appear in conversations:</p>
          <ul>
            <li>
              <strong>search_oneway_flights</strong> (flights server): One-way fares with Google&apos;s price band, the low |
              typical | high verdict, and a buy_link on every result. Takes a single date or a date range, expanded server-side.
            </li>
            <li>
              <strong>search_roundtrip_flights</strong> (flights server): Paired-leg round-trip itineraries with a combined
              total_price.
            </li>
            <li>
              <strong>search_hotels</strong> (hotels server): Destination search over live Booking.com rates, with the site&apos;s
              own filters (review_score_8, free_cancellation, and the rest).
            </li>
            <li>
              <strong>find_hotel_by_name</strong> (hotels server): One property by the name a human would type.
              price_as_seen_from prices it from any market, the rate-parity tool.
            </li>
          </ul>

          <h2>Example prompts that work</h2>
          <p>ChatGPT picks the tool and fills the parameters itself:</p>
          <ul>
            <li>"Is $480 for LHR to JFK in mid-October a good price, or should I wait?"</li>
            <li>"Find me the cheapest nonstop from Berlin to Paris in the second week of June."</li>
            <li>"Round trip JFK to London, out September 22, back September 29. Rank the options by value rather than price alone."</li>
            <li>"Find a hotel in Tokyo Shibuya for November 3 to 7, 2 adults, breakfast included."</li>
            <li>"Compare what the same room at the Kremlin Palace in Antalya costs when booked from Germany versus the US."</li>
          </ul>
          <p>
            The last prompt uses the <code className="font-mono text-[13px]">price_as_seen_from</code> parameter on the
            find_hotel_by_name tool: the same room priced as a visitor from a different country sees it, for rate-parity
            monitoring.
          </p>

          <h2>Is your key billed to you?</h2>
          <p>
            Yes. The MCP servers are bring-your-own-key: ChatGPT sends your RapidAPI key with each call and usage meters against
            your own subscription. There is no FlightPowers account and no second bill. You subscribe on RapidAPI, add the key
            to the connector URL, and every search ChatGPT runs is a request on your plan.
          </p>

          <h2>Which plan do you need?</h2>
          <p>
            The free tier is 10 requests/month with a hard cap: enough to verify the connector works, not to use it. For
            day-to-day use, the <strong className="text-ink-100">$10 PRO plan</strong> (2,500 requests/month on flights) is the
            realistic floor. Every plan includes all of its API&apos;s endpoints.
          </p>

          <h2>Scheduled tasks</h2>
          <p>
            ChatGPT has scheduled Tasks on every plan, but OpenAI does not document whether custom developer-mode connectors run
            inside a Task, and we have not verified that they do. If you want a scheduled daily fare scan today,{' '}
            <strong className="text-ink-100">Claude is the verified path</strong>: its scheduled tasks run the same two
            connector URLs on any paid Claude plan.
          </p>

          <h2>Try it before adding a key</h2>
          <p>
            The live demo on the homepage and the free tools on this site run real requests on our key, so you can see the exact
            responses ChatGPT will get before you subscribe. Try the Flight Price Checker or the Cheapest Month to Fly tool to
            see the data shape.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Cta href="/tools/flight-price-checker" variant="ghost">
              Try the free demo
            </Cta>
            <Cta href={rapidApiPricingUrl('flights', 'blog')} external variant="primary">
              Get a key on RapidAPI →
            </Cta>
          </div>

          <h2>The full setup guide</h2>
          <p>
            The integration page walks through adding both connectors in developer mode, testing them in a chat, and explains
            the tool inventory in detail. Start there if you want step-by-step instructions.
          </p>
          <div className="mt-6">
            <Cta href="/integrations/chatgpt" variant="ghost">
              Read the full ChatGPT integration guide →
            </Cta>
          </div>

          <h2>Other MCP clients</h2>
          <p>
            The same two server URLs work in any MCP client: Claude Desktop, Cursor, Windsurf, Zed, or your own MCP host. The
            setup is the same: add the URL with your key, and the tools appear. The integration page lists verified clients.
          </p>
        </article>
      </Container>

      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
          {[
            { href: '/integrations/chatgpt', label: 'Full ChatGPT setup', sub: 'Step-by-step, example prompts, FAQ' },
            { href: '/mcp', label: 'MCP servers', sub: 'All verified clients and setup paths' },
            { href: '/tools/flight-price-checker', label: 'Free flight checker', sub: 'Try the data, no signup' },
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
          medium="blog"
          title="Live travel data in ChatGPT conversations"
          body="Two MCP connectors, your own key, and Google's price verdict on every result. Pro and Business plans only."
        />
      </Section>
    </>
  );
}
