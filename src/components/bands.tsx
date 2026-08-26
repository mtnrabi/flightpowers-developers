import Link from 'next/link';
import { COUNTS, LINKS, SURFACES, rapidApiPricingUrl, type UtmMedium } from '@/lib/site';
import { Code, Cta, SectionHead } from './ui';

/** The breadth argument: the surfaces we actually ship on. Server-rendered. */
export function SurfaceStrip({ label = 'One API, everywhere your stack already lives' }: { label?: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        {SURFACES.map((s) =>
          s.external ? (
            <a key={s.label} href={s.href} rel="noopener" className="text-[15px] font-medium text-ink-400 hover:text-ink-100 transition-colors">
              {s.label}
            </a>
          ) : (
            <Link key={s.label} href={s.href} className="text-[15px] font-medium text-ink-400 hover:text-ink-100 transition-colors">
              {s.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

/** Full-width closing CTA band. Every page ends with it. */
export function CtaBand({
  title = 'Put a verdict on every fare',
  body = 'Live Google Flights and Booking.com data, with the price band and verdict attached to every result. Free tier on RapidAPI, no card to try.',
  medium,
  api = 'flights',
}: {
  title?: string;
  body?: string;
  medium: UtmMedium;
  api?: 'flights' | 'hotels';
}) {
  return (
    <div className="rounded-3xl border rule bg-ink-900/70 px-6 py-12 sm:px-12 sm:py-16 text-center">
      <h2 className="text-[1.75rem] sm:text-4xl font-semibold">{title}</h2>
      <p className="lede mx-auto mt-4 max-w-2xl">{body}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Cta href={rapidApiPricingUrl(api, medium)} external variant="primary">
          Get a key on RapidAPI →
        </Cta>
        <Cta href="/pricing" variant="ghost">
          See pricing
        </Cta>
      </div>
      <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: 10 requests/month. No card to try.</p>
    </div>
  );
}

/** "Your agent already knows how to use this": three cards, one per integration mode. */
export function AgentBand() {
  return (
    <div>
      <SectionHead
        eyebrow="For AI agents"
        title="Your agent already knows how to use this"
        lede={`${COUNTS.mcpServers} hosted MCP servers, ${COUNTS.skills} open-source skills, and a plain REST API. All first-party, all maintained, all pointing at the same live data.`}
      />
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <h3 className="text-[16px] font-semibold text-ink-100 mb-3">MCP: no install, just a URL</h3>
          <Code label="claude / cursor / any MCP client">{`{
  "mcpServers": {
    "flights": {
      "url": "${LINKS.mcpFlights}",
      "headers": { "x-rapidapi-key": "YOUR_KEY" }
    }
  }
}`}</Code>
          <Link href="/mcp" className="mt-3 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
            MCP setup →
          </Link>
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-ink-100 mb-3">Skills: for Claude Code &amp; OpenClaw</h3>
          <Code label="terminal">{`npx skills add mtnrabi/travel-agent-skills

# then just ask:
# "find me the cheapest week to fly
#  JFK to Lisbon this winter"`}</Code>
          <Link href="/skills" className="mt-3 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
            The {COUNTS.skills} skills →
          </Link>
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-ink-100 mb-3">REST: one POST, flat JSON</h3>
          <Code label="curl">{`curl -X POST "https://google-flights-live-api\\
.p.rapidapi.com/api/google_flights/oneway/v1" \\
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"from_airport":"JFK","to_airport":"CUN",
       "departure_date":"2027-01-01"}'`}</Code>
          <Link href="/ai-agents" className="mt-3 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
            Agent recipes →
          </Link>
        </div>
      </div>
    </div>
  );
}
