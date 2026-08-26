'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { HeatGrid } from '@/components/results';
import { CapturedBadge, VerdictBadge } from '@/components/ui';
import type { ScanDay } from '@/lib/fixtures';
import { airlineText } from '@/lib/format';
import { monthScanSnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; mode: 'live' | 'cached'; days: ScanDay[]; sampledEvery: number; query: { from: string; to: string; month: string } }
  | { phase: 'error'; message: string };

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y!, m!, 0).getDate();
}

function monthLabel(month: string): string {
  const d = new Date(Date.parse(`${month}-01T00:00:00Z`));
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function cheapestDay(days: ScanDay[]): ScanDay | null {
  const priced = days.filter((d) => d.price != null);
  if (priced.length === 0) return null;
  return priced.reduce((a, b) => (a.price! <= b.price! ? a : b));
}

/**
 * The month-scan form. The page around it is complete server-rendered copy;
 * this component only adds the interaction. A live run samples ~10 dates
 * across the month on the site's own key (budget-capped, the page says so);
 * the captured first-paint example is a REAL full 30-day scan.
 */
export function CheapestMonthTool({
  captured,
}: {
  captured: { days: ScanDay[]; capturedAt: string; note: string; query: { from: string; to: string; month: string } };
}) {
  const [from, setFrom] = useState('LIS');
  const [to, setTo] = useState('JFK');
  const [month, setMonth] = useState('');
  const [state, setState] = useState<RunState>({ phase: 'idle' });
  const monthRef = useRef<HTMLInputElement>(null);

  // min = current month, set after mount so build-time HTML never disagrees
  // with the visitor's clock.
  useEffect(() => {
    if (monthRef.current) monthRef.current.min = new Date().toISOString().slice(0, 7);
  }, []);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase === 'running') return;
    setState({ phase: 'running' });
    track({ e: 'demo_run', tool: 'cheapest-month', mode: 'live' });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shape: 'month-scan', from, to, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: 'error', message: String(data.message ?? 'The scan failed — try again.') });
        return;
      }
      setState({
        phase: 'done',
        mode: data.mode === 'cached' ? 'cached' : 'live',
        days: data.days as ScanDay[],
        sampledEvery: Number(data.sampledEvery ?? 1),
        query: { from: from.toUpperCase(), to: to.toUpperCase(), month },
      });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server — try again.' });
    }
  }

  const showing = state.phase === 'done' ? state : null;
  const days = showing ? showing.days : captured.days;
  const query = showing ? showing.query : captured.query;
  const best = cheapestDay(days);

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
              placeholder="LIS"
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
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Month</span>
            <input
              ref={monthRef}
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 focus:border-signal-600 focus:outline-none [color-scheme:dark]"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-accent w-full sm:w-auto" disabled={state.phase === 'running'}>
              {state.phase === 'running' ? 'Scanning live…' : 'Scan the month'}
            </button>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          Runs REAL searches on our key — live scans sample ~10 dates across the month to stay inside the demo budget. Can take
          ~10–30s.
        </p>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] text-verdict-typical leading-relaxed">{state.message}</p> : null}

      {/* Result: live if run, captured full-month scan on first paint */}
      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-[16px] font-semibold text-ink-100">
            {query.from} → {query.to} · {monthLabel(query.month)}
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
        <HeatGrid
          days={days}
          note={
            showing
              ? `Live demo scan — sampled every ${showing.sampledEvery} day${showing.sampledEvery > 1 ? 's' : ''} to stay inside the demo budget. A full every-day scan is one request per date on your own key.`
              : captured.note
          }
        />
        {best ? (
          <p className="mt-3 text-[14px] text-ink-300">
            Cheapest {showing ? 'sampled ' : ''}day: <span className="font-mono text-verdict-low">{best.date}</span> at{' '}
            <span className="font-mono text-verdict-low font-semibold">${best.price}</span>
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
        tool="cheapest-month"
        snippets={monthScanSnippets({ from: query.from, to: query.to, month: query.month, days: daysInMonth(query.month) })}
        pricingHref={rapidApiPricingUrl('flights', 'tool')}
        docsHref="/flights-api/parallel-date-scan"
        headline="Run the full every-day scan from your own code"
        body="One request per date, fired in parallel — the grid you are looking at, at full resolution, with Google’s price band and verdict on every fare."
      />
    </div>
  );
}
