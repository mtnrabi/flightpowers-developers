import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { CheckBullets, Container, FaqSection, Feature, Section, SectionHead, type Faq } from '@/components/ui';

export const metadata: Metadata = withOg({
  title: 'Trip-Planning Bots: flight answers a chatbot can stand behind',
  description:
    'Build Telegram, Discord, Slack, or n8n travel bots on live data: paired round-trip itineraries in one call, a price context from Google Flights to back every recommendation, and honest “no flights” answers backed by X-Search-Status.',
  alternates: { canonical: '/use-cases/trip-planning-bots' },
});

export const dynamic = 'force-static';

const faq: Faq[] = [
  {
    q: 'What does the bot actually send and receive?',
    a: 'One POST per search: route, dates, and optional filters in; a flat JSON array of itineraries out, each with price as a string and a number, airline, duration, stops with layover details, local times in plain text, Google’s price band and verdict, and a buy_link. The plain-text time fields (like “10:15 AM on Mon, Jun 15”) drop straight into a chat message.',
  },
  {
    q: 'Can a no-code bot use this?',
    a: 'Yes: there is a first-party n8n community node (n8n-nodes-flightpowers on npm), so an n8n workflow can take a chat trigger, run a flight or hotel search, and post the reply without custom HTTP code. Agent frameworks connect through the hosted MCP servers instead.',
  },
  {
    q: 'What should the bot say when the search comes back empty?',
    a: 'Whatever the X-Search-Status header justifies. “empty” means Google genuinely has no itineraries: the bot can say “no flights that day” with confidence. “degraded” means the search didn’t complete; the honest reply is “let me retry,” and opt-in strict mode can turn that case into a hard error your bot code catches.',
  },
];

export default function TripPlanningBotsPage() {
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
          A trip bot users can <span className="text-signal-500">trust</span> by the third answer
        </h1>
        <p className="lede mt-5 max-w-2xl">Chat in, live itineraries out, with the price context that turns a reply into a recommendation.</p>
        <p className="mt-6 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          A travel bot gets exactly one chance: the first time it quotes a fare that doesn&apos;t exist, or says &ldquo;no
          flights&rdquo; when there were plenty, the user stops asking. Behind the chat window the hard parts are all data
          problems: round-trip quotes that need two searches awkwardly combined, prices with nothing to justify a
          &ldquo;that&apos;s a good deal&rdquo;, and empty responses that could mean anything. The bot&apos;s tone can be
          casual; its data can&apos;t be.
        </p>
      </Container>

      <Section bordered={false} className="!pt-10">
        <SectionHead eyebrow="How FlightPowers helps" title="Chat-ready responses from a live source" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Feature title="Round-trips arrive paired">
            One call to /roundtrip returns complete itineraries (total_price, both legs, layovers), so &ldquo;JFK to Rome,
            out Friday back Sunday&rdquo; is one request and one message, not a stitching job.
          </Feature>
          <Feature title="Price context writes the recommendation">
            Price context from Google Flights plus the price band gives the bot a defensible sentence: &ldquo;$517 is
            typical for this route: the usual range is $460–$610.&rdquo; No invented judgment.
          </Feature>
          <Feature title="X-Search-Status scripts the hard replies">
            The header tells the bot which of its three honest answers applies: here are your flights, there are genuinely
            none, or the search failed and I&apos;m retrying. Users forgive a retry; they don&apos;t forgive a lie.
          </Feature>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Key workflows" title="From chat message to booked-ready reply" />
        <div className="mt-8 max-w-3xl">
          <CheckBullets
            items={[
              <>
                <strong className="text-ink-100">Parse intent to parameters.</strong> Route, dates, and constraints
                (&ldquo;nonstop&rdquo;, &ldquo;under $400&rdquo;, &ldquo;morning flight&rdquo;) map to real request fields:
                max_stops, max_price, departure-time windows.
              </>,
              <>
                <strong className="text-ink-100">Search live at ask time.</strong> Every query is scanned at request time, so
                the quoted fare is current. The bot never apologises for a stale cache.
              </>,
              <>
                <strong className="text-ink-100">Compose from plain-text fields.</strong> departure_description and
                arrival_description are already human-readable: the reply template is mostly field insertion.
              </>,
              <>
                <strong className="text-ink-100">Recommend with the price band.</strong> Lead with the cheapest flight, attach the
                price context, and let the user decide with real context.
              </>,
              <>
                <strong className="text-ink-100">Close with buy_link.</strong> The bot&apos;s last message is a working link to
                that exact itinerary on Google Flights.
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
            { href: '/flights-api/round-trip', label: 'Round-Trip API', sub: 'The paired-itinerary endpoint' },
            { href: '/flights-api/search-status', label: 'Search Status', sub: 'The three honest empty-state replies' },
            { href: '/tools/flight-price-checker', label: 'Flight Price Checker', sub: 'The response your bot would relay' },
            { href: '/guides/flight-api-in-n8n', label: 'n8n guide', sub: 'A bot workflow without custom code' },
            { href: '/use-cases/ai-travel-agents', label: 'AI travel agents', sub: 'When the bot becomes an agent' },
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
          title="Give your bot answers worth repeating"
          body="Live itineraries, paired round-trips, and price context on every flight, one POST away from your chat handler."
        />
      </Section>
    </>
  );
}
