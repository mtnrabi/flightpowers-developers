'use client';

import { useRef, useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { EmailCapture } from '@/components/EmailCapture';
import { RoundtripResults, SearchHeaderChips } from '@/components/results';
import type { RoundtripItinerary } from '@/lib/fixtures';
import { bothHosts, roundtripSnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | {
      phase: 'done';
      mode: 'live' | 'cached';
      itineraries: RoundtripItinerary[];
      headers: Record<string, string>;
      query: { from: string; to: string; date: string; returnDate: string };
    }
  | { phase: 'empty'; status: string }
  | { phase: 'error'; message: string };

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The round-trip form. It calls /v1/flights/roundtrip, which prices an out
 * and a back leg as ONE itinerary rather than adding two one-way searches
 * together, so the total is the total a booking engine would actually sell.
 *
 * Dates default in the browser, never at build time, so a statically rendered
 * page can never serve a date that has already passed.
 */
export function RoundTripTool({ initial }: { initial?: { from: string; to: string } }) {
  const [from, setFrom] = useState(initial?.from ?? 'LHR');
  const [to, setTo] = useState(initial?.to ?? 'JFK');
  const [date, setDate] = useState(iso(30));
  const [returnDate, setReturnDate] = useState(iso(37));
  const [state, setState] = useState<RunState>({ phase: 'idle' });

  const inFlight = useRef(false); // ref, not state: two clicks inside one render can both pass a state check

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current || state.phase === 'running') return;
    inFlight.current = true;
    setState({ phase: 'running' });
    track({ e: 'demo_run', tool: 'round-trip', mode: 'live' });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shape: 'roundtrip', from, to, date, returnDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: 'error', message: String(data.message ?? 'The search failed. Try again.') });
        return;
      }
      const itineraries = data.itineraries as RoundtripItinerary[];
      if (!itineraries || itineraries.length === 0) {
        setState({ phase: 'empty', status: (data.headers as Record<string, string>)?.['x-search-status'] ?? 'empty' });
        return;
      }
      setState({
        phase: 'done',
        mode: data.mode === 'cached' ? 'cached' : 'live',
        itineraries,
        headers: (data.headers as Record<string, string>) ?? {},
        query: { from: from.toUpperCase(), to: to.toUpperCase(), date, returnDate },
      });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server. Try again.' });
    } finally {
      inFlight.current = false;
    }
  }

  const showing = state.phase === 'done' ? state : null;
  const nights = Math.max(0, Math.round((Date.parse(returnDate) - Date.parse(date)) / 86_400_000));

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1.2fr_auto]">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">From (IATA)</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              maxLength={3}
              required
              placeholder="LHR"
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[15px] text-ink-100 uppercase placeholder:text-ink-600 focus:border-signal-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">To (IATA)</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              maxLength={3}
              required
              placeholder="JFK"
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[15px] text-ink-100 uppercase placeholder:text-ink-600 focus:border-signal-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Out</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 focus:border-signal-600 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Back</span>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 focus:border-signal-600 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-accent w-full lg:w-auto" disabled={state.phase === 'running'}>
              {state.phase === 'running' ? 'Searching…' : 'Price the trip'}
            </button>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          {nights > 0 ? `${nights} nights. ` : ''}One REAL paired-leg search on our key, capped per visitor per day. Round trips
          take longer than one-ways: allow ~10-30s.
        </p>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] text-verdict-typical leading-relaxed">{state.message}</p> : null}
      {state.phase === 'empty' ? (
        <p className="text-[14.5px] text-ink-300 leading-relaxed">
          {state.status === 'empty'
            ? 'Google has no round-trip itineraries for those two dates. X-Search-Status: empty means the empty result IS the answer, usually a same-day or overnight return that nothing serves.'
            : 'The search did not complete (X-Search-Status: ' + state.status + '). The API says so instead of pretending there is nothing to sell. Try once more.'}
        </p>
      ) : null}

      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-[16px] font-semibold text-ink-100">
            {showing ? `${showing.query.from} ⇄ ${showing.query.to} · ${showing.query.date} to ${showing.query.returnDate}` : `${from} ⇄ ${to}`}
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
          <>
            <RoundtripResults itineraries={showing.itineraries.slice(0, 5)} />
            <div className="mt-4">
              <SearchHeaderChips headers={showing.headers} />
            </div>
          </>
        ) : (
          <p className="text-[14.5px] text-ink-300 leading-relaxed">
            Set two dates and press <span className="font-semibold text-ink-100">Price the trip</span>. Each row that comes back
            is one itinerary: the outbound and the return with their own airlines, stops and durations, and one total price for
            the pair. No stale sample sits here in the meantime, because a fare captured last month is not information.
          </p>
        )}
      </div>

      <ApiUpsellCard
        tool="round-trip"
        snippets={bothHosts((host) =>
          roundtripSnippets(showing ? showing.query : { from, to, date, returnDate }, host)
        )}
        pricingHref={rapidApiPricingUrl('flights', 'tool')}
        docsHref="/flights-api/round-trip"
        headline="Price out-and-back trips from your own code"
        body="One request, one itinerary list: paired legs with a real total, not two one-way searches you add together and hope match."
      />

      <EmailCapture tool="round-trip" source="tool:round-trip" />
    </div>
  );
}
