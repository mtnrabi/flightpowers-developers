'use client';

import { useRef, useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { YearScanChart } from '@/components/results';
import { CapturedBadge, VerdictBadge } from '@/components/ui';
import type { YearMonth } from '@/lib/fixtures';
import { airlineText } from '@/lib/format';
import { yearScanSnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; mode: 'live' | 'cached'; months: YearMonth[]; query: { from: string; to: string } }
  | { phase: 'error'; message: string };

function monthLabel(month: string): string {
  return new Date(Date.parse(`${month}-01T00:00:00Z`)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function cheapestMonth(months: YearMonth[]): YearMonth | null {
  const priced = months.filter((m) => m.price != null);
  if (priced.length === 0) return null;
  return priced.reduce((a, b) => (a.price! <= b.price! ? a : b));
}

/**
 * The year-scan form. The page around it is complete server-rendered copy;
 * this component only adds the interaction. A live run fires one real
 * mid-month search per coming month (~10 searches) on the site's own key,
 * budget-capped; the captured first-paint example is a REAL year scan.
 */
export function CheapestTimeTool({
  captured,
}: {
  captured: { months: YearMonth[]; capturedAt: string; note: string; query: { from: string; to: string } };
}) {
  const [from, setFrom] = useState('LIS');
  const [to, setTo] = useState('JFK');
  const [state, setState] = useState<RunState>({ phase: 'idle' });

  const inFlight = useRef(false); // ref, not state: two clicks inside one render can both pass a state check

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current || state.phase === 'running') return;
    inFlight.current = true;
    setState({ phase: 'running' });
    track({ e: 'demo_run', tool: 'cheapest-time', mode: 'live' });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shape: 'year-scan', from, to }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: 'error', message: String(data.message ?? 'The scan failed. Try again.') });
        return;
      }
      setState({
        phase: 'done',
        mode: data.mode === 'cached' ? 'cached' : 'live',
        months: data.months as YearMonth[],
        query: { from: from.toUpperCase(), to: to.toUpperCase() },
      });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server. Try again.' });
    } finally {
      inFlight.current = false;
    }
  }

  const showing = state.phase === 'done' ? state : null;
  const months = showing ? showing.months : captured.months;
  const query = showing ? showing.query : captured.query;
  const best = cheapestMonth(months);

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">From (IATA)</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              maxLength={3}
              required
              placeholder="LIS"
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
          <div className="flex items-end">
            <button type="submit" className="btn btn-accent w-full sm:w-auto" disabled={state.phase === 'running'}>
              {state.phase === 'running' ? 'Scanning live…' : 'Scan the year'}
            </button>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          Runs REAL searches on our key: one per coming month, about 10 per scan. A scan spends most of a visitor&apos;s daily demo
          allowance, so expect one live run a day. Can take ~10-30s.
        </p>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] text-verdict-typical leading-relaxed">{state.message}</p> : null}

      {/* Result: live if run, captured year scan on first paint */}
      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-[16px] font-semibold text-ink-100">
            {query.from} → {query.to} · the coming months, one-way
          </h3>
          {showing ? (
            showing.mode === 'live' ? (
              <span className="live-badge">live result</span>
            ) : (
              <span className="font-mono text-[11px] text-ink-400">from the demo cache: a recent live run of the same query</span>
            )
          ) : (
            <CapturedBadge date={captured.capturedAt} />
          )}
          <span className="ml-auto hidden font-mono text-[10.5px] text-ink-500 sm:block">flightpowers.com</span>
        </div>
        <YearScanChart
          months={months}
          note={
            showing
              ? 'Live demo scan: one real mid-month search per month. Sampling more dates per month tightens the answer, and that is one request per date on your own key.'
              : captured.note
          }
        />
        {best ? (
          <p className="mt-3 text-[14px] text-ink-300">
            Cheapest scanned month: <span className="font-mono text-verdict-low">{monthLabel(best.month)}</span> at{' '}
            <span className="font-mono font-semibold text-verdict-low">${best.price}</span>
            <span className="text-ink-400"> · departing {best.date}</span>
            {best.airline ? <span className="text-ink-400"> · {airlineText(best.airline)}</span> : null}
            {best.verdict ? (
              <span className="text-ink-400">
                {' '}
                · Google&apos;s verdict: <VerdictBadge verdict={best.verdict} />
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <ApiUpsellCard
        tool="cheapest-time"
        snippets={yearScanSnippets({ from: query.from, to: query.to, months: months.map((m) => m.month) })}
        pricingHref={rapidApiPricingUrl('flights', 'tool')}
        docsHref="/flights-api/parallel-date-scan"
        headline="Run the full scan from your own code"
        body="One request per date, fired in parallel: every month, as many sample dates as you want, with Google's price band and verdict on every fare."
      />
    </div>
  );
}
