import Link from 'next/link';
import { AddToClientButtons } from './AddToClientButtons';
import { TrackedLink } from './TrackedLink';
import { PAID_TRIAL_LINE } from '@/lib/install-copy';
import { planBoxContent, ladderLine } from '@/lib/plan-box';
import { AIRBNB_PLANS, FLIGHT_PLANS, GOOGLE_HOTELS_PLANS, HOTEL_PLANS, type Plan } from '@/lib/pricing';
import { CLAUDE_AUTH_HINT_LABELLED, rapidApiPricingUrl, type RapidApiListing, type UtmMedium } from '@/lib/site';

/**
 * The "key and price" box at the end of pages that rank but sent almost
 * nobody to a plan (growth push 2026-11-07, funnel.md lever 1: the MCP
 * roundup, the two "best ... APIs 2026" guides, the benchmark and four compare
 * pages, ~550 visitors / 28 days -> 1 RapidAPI click). The pages that do
 * convert end on the same three things this box carries: what it is, what a
 * plan costs, and the button.
 *
 * - One line on what FlightPowers does, marked as mine (the pages' own
 *   disclosure; the box never ranks it against the others).
 * - That page's ladder, one line per listing, read from lib/pricing.ts.
 * - A "Get a key" button per listing to its RapidAPI pricing tab, with
 *   utm_content = planbox-<page path>, and its own `outbound` beacon with
 *   medium "planbox", so a box click reads apart from the other links on the
 *   same page.
 * - On MCP pages, Add to Claude for the two paid connectors (the install
 *   rule of 2026-10-22: install buttons are the paid servers).
 */

type Listing = Extract<RapidApiListing, 'flights' | 'hotels' | 'airbnb' | 'googleHotels'>;

const LISTINGS: Record<Listing, { label: string; plans: Plan[]; button: string }> = {
  flights: { label: 'Google Flights Live API', plans: FLIGHT_PLANS, button: 'Get a flights key →' },
  hotels: { label: 'Booking Live API (Booking.com rates)', plans: HOTEL_PLANS, button: 'Get a Booking.com key →' },
  airbnb: { label: 'Airbnb Live API', plans: AIRBNB_PLANS, button: 'Get an Airbnb key →' },
  googleHotels: { label: 'Google Hotels Live API', plans: GOOGLE_HOTELS_PLANS, button: 'Get a Google Hotels key →' },
};

function whatWeDo(listings: Listing[]): string {
  const flights = listings.includes('flights');
  const hotels = listings.includes('hotels');
  if (flights && hotels) {
    return 'It reads live Google Flights fares and Booking.com rates when you ask and returns them as JSON, over REST or as an MCP server for Claude, Cursor and ChatGPT.';
  }
  if (flights) {
    return 'It reads live Google Flights fares when you ask: both legs of a round trip in one request, Google’s own price range when Google shows one, and a booking link on every result.';
  }
  return 'It reads live Booking.com rates when you ask, by destination or by hotel name, priced the way a shopper in a country you pick would see them.';
}

export function PlanBox({
  page,
  listings,
  medium,
  title = 'Try mine on your own searches',
  mcp = false,
}: {
  /** this page's path, e.g. "/compare/duffel": it becomes the utm_content label */
  page: string;
  /** which listings this page is about, in the order to show them */
  listings: Listing[];
  medium: UtmMedium;
  title?: string;
  /** show Add to Claude for the paid flights and hotels connectors */
  mcp?: boolean;
}) {
  const content = planBoxContent(page);
  return (
    <div className="not-prose my-10 rounded-3xl border border-signal-600/30 bg-signal-600/[0.05] px-6 py-8 sm:px-10 sm:py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500">FlightPowers (mine)</p>
      <h2 className="mt-3 text-[1.5rem] sm:text-3xl font-semibold text-ink-100">{title}</h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-300">{whatWeDo(listings)}</p>
      <ul className="mt-4 space-y-1.5 text-[14.5px] leading-relaxed text-ink-300">
        {listings.map((l) => (
          <li key={l}>{ladderLine(LISTINGS[l].label, LISTINGS[l].plans)}</li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {listings.map((l) => {
          const href = rapidApiPricingUrl(l, medium, content);
          const u = new URL(href);
          return (
            <TrackedLink key={l} href={href} target={`${u.host}${u.pathname}`} medium="planbox" className="btn btn-primary">
              {LISTINGS[l].button}
            </TrackedLink>
          );
        })}
        <Link href="/pricing" className="btn btn-ghost">
          See all plans
        </Link>
      </div>
      {mcp ? (
        <div className="mt-6 border-t rule pt-5">
          <p className="text-[14.5px] leading-relaxed text-ink-300">
            In Claude, the same data is two connectors: <code className="font-mono text-[0.9em] text-signal-400">flights.flightpowers.com/mcp</code>{' '}
            and <code className="font-mono text-[0.9em] text-signal-400">hotels.flightpowers.com/mcp</code>.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <AddToClientButtons server="flights" clients={['claude']} claudeLabel="Add flights to Claude" claudeVariant="primary" claudeHint={false} />
            <AddToClientButtons server="hotels" clients={['claude']} claudeLabel="Add hotels to Claude" claudeVariant="ghost" claudeHint={false} />
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-300">{PAID_TRIAL_LINE}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-400">{CLAUDE_AUTH_HINT_LABELLED}</p>
        </div>
      ) : null}
      <p className="mt-5 text-[14px] text-ink-400">
        Docs:{' '}
        {listings.includes('flights') ? (
          <>
            the{' '}
            <Link href="/flights-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Flights API
            </Link>
            ,{' '}
          </>
        ) : null}
        {listings.some((l) => l !== 'flights') ? (
          <>
            the{' '}
            <Link href="/hotels-api" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Hotels API
            </Link>
            ,{' '}
          </>
        ) : null}
        the{' '}
        <Link href="/mcp" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          MCP servers
        </Link>{' '}
        and{' '}
        <Link href="/pricing" className="text-signal-400 underline underline-offset-4 hover:text-signal-500">
          every plan side by side
        </Link>
        .
      </p>
    </div>
  );
}
