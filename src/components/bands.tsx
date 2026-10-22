import Link from 'next/link';
import { FLIGHT_PLANS, HOTEL_PLANS } from '@/lib/pricing';
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

/**
 * The two-step start, for pages that get search traffic but send almost
 * nobody to pricing (site double-down plan 2026-10-18, item 1): taste on the
 * free ad-supported MCP server, then the PRO key for the big scans. Both
 * buttons are outbound links the site-wide OutboundTracker already records
 * (free-trial.flightpowers.com is an MCP host, the pricing link carries the
 * page's utm_medium), so the effect reads per page on the beacon. Numbers come
 * from lib/pricing.ts; the 50-a-day cap is the free server's published one.
 */
export function TwoStepCta({ medium }: { medium: UtmMedium }) {
  const flightsPro = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
  const hotelsPro = HOTEL_PLANS.find((p) => p.name === 'PRO')!;
  const freeHost = LINKS.mcpFree.replace('https://', '');
  return (
    <div className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border rule bg-ink-900/60 p-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">1 · Try it free</p>
        <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">
          Add <code className="font-mono text-[0.9em] text-signal-400 break-all">{freeHost}</code> to Claude, ChatGPT or
          Cursor and sign in with Google: 50 searches a day, no key, one labelled sponsored card per result.
        </p>
        <div className="mt-4">
          <Cta href={LINKS.freeHome} external variant="ghost">
            Open the free MCP →
          </Cta>
        </div>
      </div>
      <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.05] p-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">2 · Run the big scans</p>
        <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">
          PRO is ${flightsPro.priceMonthly} a month for {flightsPro.quota.toLocaleString('en-US')} flight searches on RapidAPI.
          Hotels is a separate PRO plan, ${hotelsPro.priceMonthly} for {hotelsPro.quota.toLocaleString('en-US')}. Each key
          works over REST and in the keyed MCP servers, with no ads.
        </p>
        <div className="mt-4">
          <Cta href={rapidApiPricingUrl('flights', medium)} external variant="primary">
            See PRO on RapidAPI →
          </Cta>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-width closing CTA band. Every page ends with it. Under the buttons it
 * names the product hubs in running text, so every guide and compare page
 * links /flights-api, /hotels-api and /mcp from body copy with the head term
 * as the anchor (before this the hubs had 5 and 10 body-copy inbound links).
 */
export function CtaBand({
  title = 'Get live flight and hotel data',
  body = 'Live Google Flights and Booking.com data as clean JSON. Free tier on RapidAPI, no card to try.',
  medium,
  api = 'flights',
  showBoth = false,
}: {
  title?: string;
  body?: string;
  medium: UtmMedium;
  api?: 'flights' | 'hotels';
  showBoth?: boolean;
}) {
  return (
    <div className="rounded-3xl border rule bg-ink-900/70 px-6 py-10 sm:px-12 sm:py-16 text-center">
      <h2 className="text-[1.75rem] sm:text-4xl font-semibold">{title}</h2>
      <p className="lede mx-auto mt-4 max-w-2xl">{body}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {showBoth ? (
          <>
            <Cta href={rapidApiPricingUrl('flights', medium)} external variant="primary">
              Flights key →
            </Cta>
            <Cta href={rapidApiPricingUrl('hotels', medium)} external variant="primary">
              Hotels key →
            </Cta>
          </>
        ) : (
          <Cta href={rapidApiPricingUrl(api, medium)} external variant="primary">
            Get a key on RapidAPI →
          </Cta>
        )}
        <Cta href="/pricing" variant="ghost">
          See pricing
        </Cta>
      </div>
      <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier: 10 requests/month. No card to try.</p>
      <p className="mt-5 text-[14px] text-ink-400">
        Docs:{' '}
        {showBoth || api === 'flights' ? (
          <>
            the{' '}
            <Link href="/flights-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Flights API
            </Link>
            {showBoth ? ', ' : ' and '}
          </>
        ) : null}
        {showBoth || api === 'hotels' ? (
          <>
            the{' '}
            <Link href="/hotels-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Hotels API
            </Link>{' '}
            and{' '}
          </>
        ) : null}
        the{' '}
        <Link href="/mcp" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          MCP servers
        </Link>
        .
      </p>
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
       "departure_date":"2027-04-15"}'`}</Code>
          <Link href="/ai-agents" className="mt-3 inline-block text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
            Agent recipes →
          </Link>
        </div>
      </div>
    </div>
  );
}
