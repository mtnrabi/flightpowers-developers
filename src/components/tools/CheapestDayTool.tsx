'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeTabs } from '@/components/CodeTabs';
import { CopyPrompt } from '@/components/CopyPrompt';
import { CapturedBadge } from '@/components/ui';
import {
  NIGHT_OPTIONS,
  calendarCells,
  cheapestDatesBody,
  cheapestRow,
  googleFlightsUrl,
  mcpPrompt,
  monthLabel,
  tripLabel,
  usd,
  type CheapestDatesAnswer,
  type CheapestDayQuery,
} from '@/lib/cheapest-day';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { bothHosts, cheapestDatesSnippets, type SnippetHost } from '@/lib/snippets';
import { LINKS, rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Shown = { answer: CheapestDatesAnswer; query: CheapestDayQuery; source: 'live' | 'cached' | 'captured'; searchStatus: string };

type RunState = { phase: 'idle' } | { phase: 'running' } | { phase: 'error'; message: string };

/** The next 11 months, YYYY-MM, starting with the current one. */
function monthOptions(now: Date): string[] {
  return Array.from({ length: 11 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

function fetchedText(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

const inputCls =
  'mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[15px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none';

/**
 * "Cheapest day to fly": route + month + trip length → a calendar heatmap of
 * Google Flights' lowest fare per departure date, from ONE request to the
 * cheapest-dates endpoint, run server-side on our key (/api/demo, rate- and
 * cache-limited). The key never reaches the browser.
 *
 * variant "page" (the /tools/cheapest-day page): opens on a captured run and
 * shows the exact request, the plan CTA and the MCP prompt under the result.
 * variant "embed" (each /flights/<route> page): prefilled with the route,
 * nothing runs until the visitor presses the button, and the API part is one
 * line with the code folded away.
 */
export function CheapestDayTool({
  initial,
  captured,
  variant = 'page',
}: {
  initial: CheapestDayQuery;
  captured?: { answer: CheapestDatesAnswer; capturedAt: string };
  variant?: 'page' | 'embed';
}) {
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [month, setMonth] = useState(initial.month);
  const [nights, setNights] = useState(initial.nights);
  const [state, setState] = useState<RunState>({ phase: 'idle' });
  const [shown, setShown] = useState<Shown | null>(
    captured ? { answer: captured.answer, query: initial, source: 'captured', searchStatus: 'ok' } : null
  );
  const [now, setNow] = useState<Date | null>(null);
  const inFlight = useRef(false);
  const tool = variant === 'page' ? 'cheapest-day' : 'cheapest-day-route';

  // Month list is built after mount so a static page never ships stale months.
  useEffect(() => {
    const d = new Date();
    setNow(d);
    // A static page can outlive its prefilled month: never offer a past one.
    const current = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    setMonth((m) => (m < current ? current : m));
  }, []);
  const months = useMemo(() => {
    const list = now ? monthOptions(now) : [];
    return list.includes(month) ? list : [month, ...list];
  }, [now, month]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setState({ phase: 'running' });
    track({ e: 'demo_run', tool, mode: 'live' });
    const query: CheapestDayQuery = { from: from.toUpperCase(), to: to.toUpperCase(), month, nights };
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shape: 'cheapest-dates', ...query }),
      });
      const data = await res.json();
      if (!res.ok || !data.answer) {
        setState({ phase: 'error', message: String(data.message ?? 'The search did not complete. Try again in a moment.') });
        return;
      }
      setShown({
        answer: data.answer as CheapestDatesAnswer,
        query,
        source: data.mode === 'cached' ? 'cached' : 'live',
        searchStatus: String(data.searchStatus ?? 'ok'),
      });
      setState({ phase: 'idle' });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server. Try again.' });
    } finally {
      inFlight.current = false;
    }
  }

  const q = shown?.query ?? { from: from.toUpperCase(), to: to.toUpperCase(), month, nights };
  const body = cheapestDatesBody(q);
  const best = shown ? cheapestRow(shown.answer.dates) : null;
  const cells = shown ? calendarCells(shown.query.month, shown.answer.dates) : [];
  const priced = shown ? shown.answer.dates.filter((d) => typeof d.price === 'number').length : 0;

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.3fr_1.3fr_auto]">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">From (IATA)</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              maxLength={3}
              required
              placeholder="JFK"
              aria-label="From airport"
              className={`${inputCls} uppercase`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">To (IATA)</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              maxLength={3}
              required
              placeholder="LAX"
              aria-label="To airport"
              className={`${inputCls} uppercase`}
            />
          </label>
          <label className="col-span-2 block sm:col-span-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Month</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputCls} !text-[14px] [color-scheme:dark]`}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 block sm:col-span-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Trip</span>
            <select
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className={`${inputCls} !text-[14px] [color-scheme:dark]`}
            >
              {NIGHT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'One-way' : `Round trip, ${n} nights`}
                </option>
              ))}
            </select>
          </label>
          <div className="col-span-2 flex items-end sm:col-span-1">
            <button type="submit" className="btn btn-accent w-full sm:w-auto" disabled={state.phase === 'running'}>
              {state.phase === 'running' ? 'Searching…' : 'Find the cheapest day'}
            </button>
          </div>
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          One live request for the whole month, on our key. Free, no signup, 10 runs a day per visitor. Takes a few seconds.
        </p>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] leading-relaxed text-verdict-typical">{state.message}</p> : null}

      {shown ? (
        <div className="rounded-2xl border rule bg-ink-900/60 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="text-[16px] font-semibold text-ink-100">
              {shown.query.from} → {shown.query.to} · {monthLabel(shown.query.month)} · {tripLabel(shown.query.nights)}
            </h3>
            {shown.source === 'live' ? (
              <span className="live-badge">live result</span>
            ) : shown.source === 'cached' ? (
              <span className="font-mono text-[11px] text-ink-400">from our 6-hour cache of the same search</span>
            ) : (
              <CapturedBadge date={captured!.capturedAt} />
            )}
          </div>

          {priced === 0 ? (
            <p className="text-[14px] text-ink-300">
              Google shows no calendar fare for any date of this month on this route. Try another month, or a nearby airport.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label="Lowest fare per departure date">
                {WEEKDAYS.map((w) => (
                  <p key={w} className="pb-1 text-center font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    {w}
                  </p>
                ))}
                {cells.map((c, i) =>
                  c.kind === 'pad' ? (
                    <div key={`pad-${i}`} aria-hidden="true" />
                  ) : (
                    <div
                      key={c.date}
                      role="gridcell"
                      title={
                        c.price == null
                          ? `${c.date}: ${c.missing ? 'not searched' : 'no fare shown'}`
                          : `${c.date}${c.returnDate ? ` → ${c.returnDate}` : ''}: ${usd(c.price)}`
                      }
                      className={`relative rounded-lg border px-0.5 py-1.5 text-center sm:px-1.5 sm:py-2 ${c.cheapest ? 'border-transparent' : 'rule'}`}
                      style={{
                        background:
                          c.heat == null
                            ? 'transparent'
                            : c.heat < 0.25
                              ? 'color-mix(in oklab, var(--color-verdict-low) 22%, transparent)'
                              : c.heat < 0.6
                                ? 'color-mix(in oklab, var(--color-verdict-typical) 14%, transparent)'
                                : 'color-mix(in oklab, var(--color-verdict-high) 16%, transparent)',
                        outline: c.cheapest ? '2px solid var(--color-verdict-low)' : undefined,
                        outlineOffset: c.cheapest ? '-1px' : undefined,
                        opacity: c.missing ? 0.45 : 1,
                      }}
                    >
                      <p className="font-mono text-[10px] text-ink-500">{c.day}</p>
                      <p
                        className={`font-mono text-[11px] tabular-nums sm:text-[13px] ${
                          c.cheapest ? 'font-bold text-verdict-low' : 'text-ink-200'
                        }`}
                      >
                        {c.price == null ? '—' : usd(c.price)}
                      </p>
                    </div>
                  )
                )}
              </div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-ink-500">
                Green is this month&apos;s low end, red its high end. A dash is a date Google shows no fare for
                {cells.some((c) => c.kind === 'day' && c.missing) ? ' (faded: already past)' : ''}.
              </p>
            </>
          )}

          {best ? (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-verdict-low/30 bg-ink-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14.5px] text-ink-200">
                Cheapest day: <span className="font-mono text-verdict-low">{best.departure_date}</span>
                {best.return_date ? <span className="text-ink-400"> (back {best.return_date})</span> : null} at{' '}
                <span className="font-mono font-semibold text-verdict-low">{usd(best.price!)}</span>
              </p>
              <a
                href={googleFlightsUrl(shown.query.from, shown.query.to, best.departure_date, best.return_date)}
                target="_blank"
                rel="nofollow noopener"
                className="btn btn-ghost !py-2 text-sm"
                onClick={() => track({ e: 'outbound', tool, target: 'google-flights' })}
              >
                See full flights for this date →
              </a>
            </div>
          ) : null}

          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-400">
            These are Google Flights&apos; calendar estimates: the lowest fare Google shows for each departure date, for one adult,
            in USD, with no airline or flight details. Fetched {fetchedText(shown.answer.fetched_at)}. A full search of a date can
            come back different, so check the date you pick before you book.
          </p>
        </div>
      ) : variant === 'embed' ? (
        <p className="text-[14px] text-ink-400">
          Pick a month and a trip length: the calendar for every departure date comes back from one live request.
        </p>
      ) : null}

      {variant === 'page' ? (
        <ApiBlock body={body} query={q} tool={tool} />
      ) : shown ? (
        <div className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-4 sm:p-5">
          <p className="text-[14.5px] text-ink-200">
            This calendar was <strong className="text-ink-100">one API request</strong>. PRO is ${PRO.priceMonthly} for{' '}
            {PRO.quota.toLocaleString('en-US')} requests a month.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={rapidApiPricingUrl('flights', 'tool', 'cheapest-day-route')}
              rel="noopener"
              className="btn btn-accent !py-2 text-sm"
              onClick={() => track({ e: 'api_upsell_click', tool, action: 'get_key' })}
            >
              Get this as an API →
            </a>
            <a href="/tools/cheapest-day" className="text-sm text-ink-300 underline underline-offset-4 hover:text-ink-100">
              Open the full tool
            </a>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-[13px] text-signal-400">The exact request</summary>
            <div className="mt-3">
              <CodeTabs snippets={cheapestDatesSnippets(body, 'own')} tool={tool} />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

/** The exact request behind the calendar, the plan CTA and the MCP prompt. */
function ApiBlock({ body, query, tool }: { body: Record<string, string | number>; query: CheapestDayQuery; tool: string }) {
  const [host, setHost] = useState<SnippetHost>('rapidapi');
  const pair = bothHosts((h) => cheapestDatesSnippets(body, h));
  return (
    <aside className="rounded-2xl border border-signal-600/30 bg-signal-600/[0.04] p-5 sm:p-6">
      <p className="text-[16px] font-semibold text-ink-100">Get this as an API</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-300">
        The calendar above is one request to the cheapest-dates endpoint. Here it is with your route, month and trip length. PRO
        is ${PRO.priceMonthly} for {PRO.quota.toLocaleString('en-US')} requests a month, and each month-wide calendar is one of
        them.
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(['rapidapi', 'own'] as const).map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={host === h}
            onClick={() => {
              setHost(h);
              track({ e: 'api_upsell_click', tool, action: `host_${h}` });
            }}
            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors ${
              host === h ? 'bg-ink-700 text-ink-100' : 'border rule text-ink-400 hover:text-ink-200'
            }`}
          >
            {h === 'rapidapi' ? 'RapidAPI host' : 'api.flightpowers.com'}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <CodeTabs snippets={pair[host]} tool={tool} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={rapidApiPricingUrl('flights', 'tool', 'cheapest-day')}
          rel="noopener"
          className="btn btn-accent !py-2 text-sm"
          onClick={() => track({ e: 'api_upsell_click', tool, action: 'get_key' })}
        >
          PRO: ${PRO.priceMonthly} for {PRO.quota.toLocaleString('en-US')} requests →
        </a>
        <a href="/flights-api/cheapest-dates" className="text-sm text-ink-300 underline underline-offset-4 hover:text-ink-100">
          Cheapest dates docs
        </a>
      </div>

      <div className="mt-7 border-t rule pt-5">
        <p className="text-[15px] font-semibold text-ink-100">Or ask your AI app</p>
        <p className="mt-1.5 mb-3 text-[14px] leading-relaxed text-ink-400">
          Add the flights connector, <code className="font-mono text-[0.9em] text-ink-200">{LINKS.mcpFlights}</code>, to Claude,
          Cursor or ChatGPT and connect your RapidAPI key. Then one sentence prices every date of the month in full, with airline
          and Google&apos;s price range (one request per date):
        </p>
        <CopyPrompt prompt={mcpPrompt(query)} tool={tool} />
      </div>
    </aside>
  );
}
