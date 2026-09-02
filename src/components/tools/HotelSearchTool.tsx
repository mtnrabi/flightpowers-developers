'use client';

import { useRef, useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { EmailCapture } from '@/components/EmailCapture';
import { HotelPropertyResults } from '@/components/results';
import type { HotelProperty } from '@/lib/fixtures';
import { bothHosts, hotelSearchSnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | {
      phase: 'done';
      mode: 'live' | 'cached';
      properties: HotelProperty[];
      query: { destination: string; checkin: string; checkout: string };
    }
  | { phase: 'error'; message: string };

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The hotel search form. One call to /v1/hotels/search, one destination, two
 * dates, and the properties that came back rendered cheapest first.
 *
 * What this deliberately does NOT do: compare countries. Per-country pricing
 * needs the same question asked of each market several times before a gap
 * means anything, so it lives in its own tool with its own budget, not here.
 */
export function HotelSearchTool({ initial }: { initial?: { destination: string } }) {
  const [destination, setDestination] = useState(initial?.destination ?? 'Lisbon');
  const [checkin, setCheckin] = useState(iso(30));
  const [checkout, setCheckout] = useState(iso(32));
  const [state, setState] = useState<RunState>({ phase: 'idle' });

  const inFlight = useRef(false); // ref, not state: two clicks inside one render can both pass a state check

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current || state.phase === 'running') return;
    inFlight.current = true;
    setState({ phase: 'running' });
    track({ e: 'demo_run', tool: 'hotel-search', mode: 'live' });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shape: 'hotel-search', destination, checkin, checkout }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: 'error', message: String(data.message ?? 'The search failed. Try again.') });
        return;
      }
      setState({
        phase: 'done',
        mode: data.mode === 'cached' ? 'cached' : 'live',
        properties: (data.properties ?? []) as HotelProperty[],
        query: { destination, checkin, checkout },
      });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server. Try again.' });
    } finally {
      inFlight.current = false;
    }
  }

  const showing = state.phase === 'done' ? state : null;
  const nights = Math.max(0, Math.round((Date.parse(checkout) - Date.parse(checkin)) / 86_400_000));

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_auto]">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Destination</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value.slice(0, 60))}
              required
              placeholder="Lisbon"
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Check in</span>
            <input
              type="date"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 focus:border-signal-600 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Check out</span>
            <input
              type="date"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 focus:border-signal-600 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-accent w-full lg:w-auto" disabled={state.phase === 'running'}>
              {state.phase === 'running' ? 'Searching…' : 'Search hotels'}
            </button>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          {nights > 0 ? `${nights} nights, 2 adults. ` : ''}One REAL Booking.com search on our key, capped per visitor per day.
        </p>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] text-verdict-typical leading-relaxed">{state.message}</p> : null}

      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-[16px] font-semibold text-ink-100">
            {showing ? `${showing.query.destination} · ${showing.query.checkin} to ${showing.query.checkout}` : destination}
          </h3>
          {showing ? (
            showing.mode === 'live' ? (
              <span className="live-badge">live result</span>
            ) : (
              <span className="font-mono text-[11px] text-ink-400">from the demo cache, a recent live run of the same query</span>
            )
          ) : (
            <span className="font-mono text-[11px] text-ink-500">nothing searched yet</span>
          )}
        </div>
        {showing ? (
          <HotelPropertyResults
            properties={showing.properties}
            nights={Math.max(0, Math.round((Date.parse(showing.query.checkout) - Date.parse(showing.query.checkin)) / 86_400_000))}
          />
        ) : (
          <p className="text-[14.5px] text-ink-300 leading-relaxed">
            Pick your dates and press <span className="font-semibold text-ink-100">Search hotels</span>. What comes back is one
            live Booking.com search: property names, the total for the stay, review scores and a link that opens the same room
            with your dates already filled in. Rates go stale in minutes, so this page keeps none.
          </p>
        )}
      </div>

      <ApiUpsellCard
        tool="hotel-search"
        snippets={bothHosts((host) =>
          hotelSearchSnippets(showing ? showing.query : { destination, checkin, checkout }, host)
        )}
        pricingHref={rapidApiPricingUrl('hotels', 'tool')}
        docsHref="/hotels-api/search"
        headline="Run this search from your own code"
        body="The same properties as JSON: price for the stay, review score and count, room type, and the Booking.com deep link. Add a per-night budget or any of the 24 filters on your own key."
      />

      <EmailCapture tool="hotel-search" source="tool:hotel-search" />
    </div>
  );
}
