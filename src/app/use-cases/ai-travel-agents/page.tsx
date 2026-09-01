import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';
import { COUNTS } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'AI Travel Agents: live flight & hotel data your agent can reason with',
  description:
    'Give an AI agent real flight prices instead of guesses: hosted MCP servers, flat JSON tool responses, price context from Google Flights to ground recommendations, and a header that tells "no flights" apart from "the search failed."',
  alternates: { canonical: '/use-cases/ai-travel-agents' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'Does my agent need HTTP code to use this?',
    a: 'No. Three hosted MCP servers (flights, hotels, and a free ad-supported one) connect any MCP client (Claude, Cursor, and others) with a URL and your RapidAPI key in a header. There are also 8 open-source skills for Claude Code and OpenClaw, and an n8n community node. The REST API is there when you do want to write the call yourself.',
  },
  {
    q: 'How does the agent know whether a fare is worth booking?',
    a: 'Every result carries Google’s price_insights_low/high band and a price context for the route and dates. The agent can say “$480 is low for this route: the usual range is $520–$700” by reading two fields, instead of hallucinating a judgment.',
  },
  {
    q: 'What happens when there are no flights?',
    a: 'The X-Search-Status header distinguishes a genuine “empty” (Google really has no itineraries) from a “degraded” search that did not complete. An agent that checks it can honestly answer “there are no flights that day” versus “the search failed, let me retry”, two answers that must never be confused in front of a user.',
  },
];

export default function AiTravelAgentsPage() {
  return (
    <>
      <Container className="pt-10 sm:pt-14">
        <Link href="/use-cases" className="font-mono text-[12px] text-ink-500 hover:text-ink-300 transition-colors">
          ← All use cases
        </Link>
      </Container>

      <Container className="pt-6 sm:pt-8 pb-4">
        <p className="eyebrow">Use case</p>
        <h1 className="mt-4 text-hero font-semibold max-w-3xl">
          An AI travel agent needs <span className="text-signal-500">live data</span>, not confidence
        </h1>
        <p className="lede mt-5 max-w-2xl">Tool responses built to be read by a model: flat, small, and carrying the context a recommendation needs.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          A language model will happily invent a plausible fare, and a user will happily believe it, which is exactly why an
          agent that books or recommends travel needs a grounded tool call, not a guess. But wiring a data source into an
          agent has its own failure modes: bulky nested responses that blow up the context window, prices with no way to judge
          them, and empty results the agent confidently narrates as &ldquo;no flights exist.&rdquo; The data layer has to be
          built for a reader that takes everything literally.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="Built for tool calls from the start" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Feature title="Hosted MCP servers: a URL, not an install">
            {COUNTS.mcpServers} first-party MCP servers expose flights and hotels search to any MCP client. Your key goes in a
            header; usage bills to your own RapidAPI plan. No SDK, no glue service to run.
          </Feature>
          <Feature title="Price context the agent can quote">
            Price context from Google Flights rides on every flight. The agent&apos;s &ldquo;book it
            now&rdquo; or &ldquo;wait&rdquo; is a field read: traceable, explainable, and never invented.
          </Feature>
          <Feature title="Paired round-trips in one call">
            The round-trip endpoint returns one object per itinerary with total_price and both legs already paired. The agent
            never has to stitch two one-way searches together and hope the combination exists.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="From question to grounded answer" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Connect once.</strong> Add the MCP server URL with your key, or install the
                skills: the agent discovers the flight and hotel tools on its own.
              </>,
              <>
                <strong className="text-ink-100">Search as the user speaks.</strong> &ldquo;JFK to Lisbon, sometime in
                November, under $400&rdquo; maps to one-way or round-trip calls with real filter parameters: stops, airlines,
                time windows, max price.
              </>,
              <>
                <strong className="text-ink-100">Ground the recommendation.</strong> Quote the price with its context:
                the price_range_in_relation_to_other_periods field is the difference between an opinion and a data point.
              </>,
              <>
                <strong className="text-ink-100">Handle empty honestly.</strong> Branch on{' '}
                <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> so the agent retries degraded
                searches and only ever reports &ldquo;no flights&rdquo; when that is the verified answer.
              </>,
              <>
                <strong className="text-ink-100">Hand off with buy_link.</strong> The agent ends the conversation with a link
                to the exact itinerary on Google Flights: the booking step stays with the user.
              </>,
            ]}
          />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Related resources" title="Keep going" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: '/mcp', label: 'MCP servers', sub: 'Config blocks and everything the tools expose' },
            { href: '/flights-api/round-trip', label: 'Round-Trip API', sub: 'Paired itineraries, one call' },
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'See the exact fields your agent would read' },
            { href: '/guides/real-time-google-flights-data', label: 'Real-time data guide', sub: 'What “live” actually means here' },
            { href: '/use-cases/trip-planning-bots', label: 'Trip-planning bots', sub: 'The same data in a chat product' },
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
          medium="use-case"
          api="flights"
          title="Give your agent something true to say"
          body="Live flight prices, Google’s own price context, and honest empty-result signalling, over MCP, skills, or plain REST."
        />
      </Section>
    </>
  );
}
