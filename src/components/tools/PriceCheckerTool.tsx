'use client';

import { useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { FlightResults, SearchHeaderChips } from '@/components/results';
import { CapturedBadge } from '@/components/ui';
import type { OnewayFlight } from '@/lib/fixtures';
import { onewaySnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; mode: 'live' | 'cached'; flights: OnewayFlight[]; headers: Record<string, string>; query: { from: string; to: string; date: string } }
  | { phase: 'empty'; status: string }
  | { phase: 'error'; message: string };

/**
 * The live price-checker form. The page around it is complete server-rendered
 * copy; this component only adds the interaction. Live runs are real
 * requests on the site's own key, behind per-IP and daily caps — the copy
 * on the page says so.
 */
export function PriceCheckerTool({ captured }: { captured: { flights: OnewayFlight[]; headers: Record<string, string>; capturedAt: string; query: { from: string; to: string; date: string } } }) {
  const [from, setFrom] = useState('TLV');
  const [to, setTo] = useState('JFK');
  const [date, setDate] = useState('');
  const [state, setState] = useState<RunState>({ phase: 'idle' });

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase === 'running') return;
    setState({ phase: 'running' });
    track({ e: 'demo_run', tool: 'price-checker', mode: 'live' });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shape: 'oneway', from, to, date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: 'error', message: String(data.message ?? 'The check failed — try again.') });
        return;
      }
      const flights = data.flights as OnewayFlight[];
      if (!flights || flights.length === 0) {
        setState({ phase: 'empty', status: (data.headers as Record<string, string>)?.['x-search-status'] ?? 'empty' });
        return;
      }
      setState({
        phase: 'done',
        mode: data.mode === 'cached' ? 'cached' : 'live',
        flights,
        headers: (data.headers as Record<string, string>) ?? {},
        query: { from: from.toUpperCase(), to: to.toUpperCase(), date },
      });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server — try again.' });
    }
  }

  const showing = state.phase === 'done' ? state : null;

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">From (IATA)</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value.toUpperCase())}
              maxLength={3}
              required
              placeholder="TLV"
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[15px] text-ink-100 uppercase placeholder:text-ink-600 focus:border-signal-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">To (IATA)</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value.toUpperCase())}
              maxLength={3}
              required
              placeholder="JFK"
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[15px] text-ink-100 uppercase placeholder:text-ink-600 focus:border-signal-600 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Departure date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 focus:border-signal-600 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-accent w-full sm:w-auto" disabled={state.phase === 'running'}>
              {state.phase === 'running' ? 'Scanning live…' : 'Check the price'}
            </button>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          Runs a REAL search on our key — live against Google Flights, capped per visitor per day. Complex routes can take ~5–20s.
        </p>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] text-verdict-typical leading-relaxed">{state.message}</p> : null}
      {state.phase === 'empty' ? (
        <p className="text-[14.5px] text-ink-300 leading-relaxed">
          {state.status === 'empty'
            ? 'Google genuinely has no itineraries for that route and date — X-Search-Status: empty means the empty result IS the answer.'
            : 'The search did not complete (X-Search-Status: ' + state.status + '). The API says so instead of pretending "no flights" — try once more.'}
        </p>
      ) : null}

      {/* Result: live if run, captured example on first paint */}
      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-[16px] font-semibold text-ink-100">
            {showing ? `${showing.query.from} → ${showing.query.to} · ${showing.query.date}` : `${captured.query.from} → ${captured.query.to} · ${captured.query.date}`}
          </h3>
          {showing ? (
            showing.mode === 'live' ? (
              <span className="live-badge">live result</span>
            ) : (
              <span className="font-mono text-[11px] text-ink-400">from the demo cache — a recent live run of the same query</span>
            )
          ) : (
            <CapturedBadge date={captured.capturedAt} />
          )}
        </div>
        <FlightResults flights={(showing ? showing.flights : captured.flights).slice(0, 5)} />
        <div className="mt-4">
          <SearchHeaderChips headers={showing ? showing.headers : captured.headers} />
        </div>
      </div>

      <ApiUpsellCard
        tool="price-checker"
        snippets={onewaySnippets(showing ? showing.query : captured.query)}
        pricingHref={rapidApiPricingUrl('flights', 'tool')}
        docsHref="/flights-api/price-insights"
      />
    </div>
  );
}
