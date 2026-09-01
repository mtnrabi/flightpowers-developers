'use client';

import { useRef, useState } from 'react';
import { CodeTabs } from './CodeTabs';
import { HotelMarketsTable, SearchHeaderChips } from './results';
import { CapturedBadge } from './ui';
import type { HotelByName, OnewayFlight } from '@/lib/fixtures';
import { hotelGeoSnippets, onewaySnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

/**
 * The hero: a live API playground. Pick flights or hotels, edit the request,
 * press Send, watch the real JSON come back. Every Send goes through the
 * budget-capped /api/demo path on OUR key (per-visitor and per-day caps,
 * cache, honest cap messages); the code tabs show the identical request
 * against the RapidAPI host a subscriber would call with their own key.
 *
 * First paint shows a captured run (server-rendered, labelled), so the box is
 * never empty and crawlers see a real response without JS.
 */

type Market = { country: string; result: HotelByName | null };

export type PlaygroundInitial = {
  flights: {
    capturedAt: string;
    request: { from: string; to: string; date: string };
    flights: OnewayFlight[];
    headers: Record<string, string>;
  };
  hotels: {
    capturedAt: string;
    query: { hotel: string; area?: string; checkin: string; checkout: string; countries: string[] };
    markets: Market[];
  };
};

/** Mirrors the server's allowlist (shapes.ts GEO_COUNTRIES), first 6 shown. */
const MARKETS = ['us', 'de', 'il', 'gb', 'fr', 'jp'];

const HOT_KEYS =
  /"(price_range_in_relation_to_other_periods|price_insights_low|price_insights_high|price_string|available)":/;

function HighlightedJson({ value, maxH = 'max-h-[260px]' }: { value: unknown; maxH?: string }) {
  const lines = JSON.stringify(value, null, 2).split('\n');
  return (
    <pre tabIndex={0} className={`overflow-x-auto overflow-y-auto p-3 text-[12px] leading-relaxed ${maxH}`}>
      <code className="font-mono text-ink-300">
        {lines.map((l, i) =>
          HOT_KEYS.test(l) ? (
            <span key={i} className="block -mx-3 bg-signal-600/10 px-3 text-signal-400">
              {l}
            </span>
          ) : (
            <span key={i} className="block">
              {l}
            </span>
          )
        )}
      </code>
    </pre>
  );
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'capped'; message: string }
  | { phase: 'error'; message: string }
  | { phase: 'flights'; mode: 'live' | 'cached'; flights: OnewayFlight[]; headers: Record<string, string>; ms: number }
  | { phase: 'hotels'; mode: 'live' | 'cached'; markets: Market[]; ms: number };

export function Playground({ initial }: { initial: PlaygroundInitial }) {
  const [api, setApi] = useState<'flights' | 'hotels'>('flights');

  // Flights request (defaults come from the captured run: deterministic,
  // so server HTML and hydration agree).
  const [from, setFrom] = useState(initial.flights.request.from);
  const [to, setTo] = useState(initial.flights.request.to);
  const [date, setDate] = useState(initial.flights.request.date);

  // Hotels request.
  const [hotel, setHotel] = useState(initial.hotels.query.hotel);
  const [checkin, setCheckin] = useState(initial.hotels.query.checkin);
  const [checkout, setCheckout] = useState(initial.hotels.query.checkout);
  const [countries, setCountries] = useState<string[]>(initial.hotels.query.countries);

  const [state, setState] = useState<RunState>({ phase: 'idle' });
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlight = useRef(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const area = initial.hotels.query.area;

  function toggleCountry(code: string) {
    setCountries((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : prev.length >= 3 ? prev : [...prev, code]));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setState({ phase: 'running' });
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    track({ e: 'demo_run', tool: 'playground', mode: 'live', action: api });
    // The answer lands right here; make sure "here" is on screen.
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try {
      const body =
        api === 'flights'
          ? { shape: 'oneway', from, to, date }
          : { shape: 'hotel-geo', hotel, area, checkin, checkout, countries };
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (data.mode === 'capped') {
        setState({ phase: 'capped', message: String(data.message) });
        return;
      }
      if (!res.ok) {
        setState({ phase: 'error', message: String(data.message ?? 'The request failed. Try again.') });
        return;
      }
      const mode = data.mode === 'cached' ? 'cached' : 'live';
      if (data.kind === 'oneway') {
        setState({
          phase: 'flights',
          mode,
          flights: data.flights as OnewayFlight[],
          headers: (data.headers as Record<string, string>) ?? {},
          ms: Number(data.ms ?? 0),
        });
      } else {
        setState({ phase: 'hotels', mode, markets: data.markets as Market[], ms: Number(data.ms ?? 0) });
      }
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server. Try again.' });
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      inFlight.current = false;
    }
  }

  const snippets =
    api === 'flights'
      ? onewaySnippets({ from: from.toUpperCase(), to: to.toUpperCase(), date })
      : hotelGeoSnippets({ hotel, area, checkin, checkout, countries });

  const inputCls =
    'mt-1 w-full rounded-lg border rule bg-ink-950 px-3 py-2 font-mono text-[13.5px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none';
  const running = state.phase === 'running';

  return (
    <div className="terminal" id="demo">
      <div className="terminal-bar justify-between">
        <div className="flex items-center gap-2">
          <span className="terminal-dots flex gap-1.5" aria-hidden="true">
            <span className="bg-verdict-high/70" />
            <span className="bg-verdict-typical/70" />
            <span className="bg-verdict-low/70" />
          </span>
          <span className="uppercase tracking-wider">api playground</span>
        </div>
        <span className="live-badge">live API behind this box</span>
      </div>

      <form onSubmit={send} className="p-3 sm:p-4">
        {/* API toggle */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose an API">
          {(
            [
              ['flights', 'Google Flights', 'POST /v1/flights/oneway'],
              ['hotels', 'Booking.com', 'POST /v1/hotels/by-name'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={api === id}
              onClick={() => {
                setApi(id);
                setState({ phase: 'idle' });
              }}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                api === id ? 'bg-ink-100 text-ink-950' : 'border rule text-ink-300 hover:text-ink-100'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto hidden sm:inline font-mono text-[11px] text-ink-500">
            {api === 'flights' ? 'POST /v1/flights/oneway' : 'POST /v1/hotels/by-name'}
          </span>
        </div>

        {/* Editable request */}
        {api === 'flights' ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
            <label className="block">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">from_airport</span>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value.toUpperCase())}
                required
                pattern="[A-Za-z]{3}"
                maxLength={3}
                placeholder="JFK"
                title="3-letter IATA code"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">to_airport</span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value.toUpperCase())}
                required
                pattern="[A-Za-z]{3}"
                maxLength={3}
                placeholder="CUN"
                title="3-letter IATA code"
                className={inputCls}
              />
            </label>
            <label className="block col-span-2 sm:col-span-1">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">departure_date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={`${inputCls} [color-scheme:dark]`}
              />
            </label>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.6fr_1fr_1fr]">
              <label className="block col-span-2 sm:col-span-1">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">hotel_name</span>
                <input
                  value={hotel}
                  onChange={(e) => setHotel(e.target.value)}
                  required
                  minLength={3}
                  maxLength={80}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">checkin_date</span>
                <input
                  type="date"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                  required
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">checkout_date</span>
                <input
                  type="date"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                  required
                  min={checkin || undefined}
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </label>
            </div>
            <div>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-500">
                proxy_country · pick 2–3, one request per market
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MARKETS.map((code) => {
                  const on = countries.includes(code);
                  const full = !on && countries.length >= 3;
                  return (
                    <label
                      key={code}
                      className={`cursor-pointer rounded-lg border rule px-2.5 py-1 font-mono text-[12px] transition-colors ${
                        on
                          ? 'border-signal-600 bg-signal-600/10 text-ink-100'
                          : full
                            ? 'cursor-not-allowed text-ink-600'
                            : 'text-ink-300 hover:border-ink-500'
                      }`}
                    >
                      <input type="checkbox" checked={on} disabled={full} onChange={() => toggleCountry(code)} className="sr-only" />
                      {code}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-accent !px-6" disabled={running}>
            {running ? 'Sending…' : 'Send'}
          </button>
          <p className="font-mono text-[11px] text-ink-500">
            Runs live on our demo key, capped per visitor and per day.
            {api === 'hotels' ? ' Residential proxies are slow; expect 10–40s.' : ' Hard routes can take ~30s.'}
          </p>
        </div>
      </form>

      {/* Response: lands directly under Send. */}
      <div className="border-t rule" ref={resultRef}>
        <div className="flex flex-wrap items-center gap-2 px-3 pt-2 sm:px-4">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500">response</span>
          {state.phase === 'running' ? (
            <span className="font-mono text-[12px] text-signal-400" role="status">
              searching live{elapsed > 0 ? ` · ${elapsed}s` : '…'}
            </span>
          ) : state.phase === 'flights' || state.phase === 'hotels' ? (
            <>
              {state.mode === 'live' ? (
                <span className="live-badge">live</span>
              ) : (
                <span className="font-mono text-[11px] text-ink-400">demo cache · a recent live run of this exact request</span>
              )}
              <span className="font-mono text-[11px] text-ink-500">{(state.ms / 1000).toFixed(1)}s upstream</span>
            </>
          ) : state.phase === 'idle' ? (
            <CapturedBadge date={api === 'flights' ? initial.flights.capturedAt : initial.hotels.capturedAt} />
          ) : null}
        </div>

        {state.phase === 'capped' ? (
          <div className="p-3 sm:p-4">
            <p className="text-[14px] text-verdict-typical leading-relaxed">{state.message}</p>
            <a href={rapidApiPricingUrl(api, 'demo-upsell')} rel="noopener" className="btn btn-primary mt-3 text-sm">
              Run it with your own key →
            </a>
          </div>
        ) : state.phase === 'error' ? (
          <p className="p-3 sm:p-4 text-[14px] text-verdict-typical leading-relaxed">{state.message}</p>
        ) : state.phase === 'running' ? (
          <p className="p-3 sm:p-4 font-mono text-[12px] text-ink-500">
            nothing here is cached unless it says so; this is a real search
          </p>
        ) : state.phase === 'flights' ? (
          state.flights.length === 0 ? (
            <div className="p-3 sm:p-4 space-y-2">
              <p className="text-[14px] text-ink-300 leading-relaxed">
                Empty list, and the header says why. An honest &quot;empty&quot; means no itineraries exist for that route and
                date; &quot;degraded&quot; means the search failed, so retry it.
              </p>
              <SearchHeaderChips headers={state.headers} />
            </div>
          ) : (
            <>
              <div className="px-3 pt-2 sm:px-4">
                <SearchHeaderChips headers={state.headers} />
              </div>
              <HighlightedJson value={state.flights.slice(0, 3)} />
            </>
          )
        ) : state.phase === 'hotels' ? (
          <div className="p-3 sm:p-4 pt-2 space-y-3">
            <HotelMarketsTable markets={state.markets} />
            <HighlightedJson value={state.markets} maxH="max-h-[240px]" />
          </div>
        ) : api === 'flights' ? (
          <>
            <div className="px-3 pt-2 sm:px-4">
              <SearchHeaderChips headers={initial.flights.headers} />
            </div>
            <HighlightedJson value={initial.flights.flights.slice(0, 2)} />
          </>
        ) : (
          <div className="p-3 sm:p-4 pt-2">
            <HotelMarketsTable markets={initial.hotels.markets} />
          </div>
        )}
      </div>

      {/* The same request, your key. */}
      <div className="border-t rule p-3 sm:p-4">
        <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500">the same request with your key</p>
        <CodeTabs snippets={snippets} tool="playground" />
        <p className="mt-3 font-mono text-[11px] text-ink-500">
          Free tier on RapidAPI verifies your key.{' '}
          <a href={rapidApiPricingUrl(api, 'demo-upsell')} rel="noopener" className="text-signal-400 hover:text-signal-500">
            Get a key →
          </a>
        </p>
      </div>
    </div>
  );
}
