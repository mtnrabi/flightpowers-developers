'use client';

import { useRef, useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { HotelMarketSamplesTable, HotelRepeatSamplesTable } from '@/components/results';
import { CapturedBadge } from '@/components/ui';
import type { GeoRepeatRun, HotelByName } from '@/lib/fixtures';
import { hotelGeoSnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

/** Mirrors the server's allowlist: the demo may only proxy through these markets. */
const MARKETS: { code: string; name: string }[] = [
  { code: 'de', name: 'Germany' },
  { code: 'jp', name: 'Japan' },
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'il', name: 'Israel' },
  { code: 'br', name: 'Brazil' },
];

/** Mirrors the server: two markets, each asked the same question three times. */
const MAX_MARKETS = 2;
const SAMPLES_PER_MARKET = 3;

type Market = { country: string; samples: (HotelByName | null)[] };

type Query = { hotel: string; area?: string; checkin: string; checkout: string; countries: string[] };

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; mode: 'live' | 'cached'; markets: Market[]; query: Query }
  | { phase: 'error'; message: string };

/**
 * The geo-pricing form. The page around it is complete server-rendered copy;
 * this component only adds the interaction.
 *
 * Two markets, three identical requests each. The earlier shape (one request
 * per market, up to three markets) printed a single-sample delta as a spread,
 * and a market's own quote moves between identical requests, so that number
 * could be pure noise. Six calls buys a range per market instead of a
 * difference between two readings, which is the comparison people can act on.
 */
export function HotelGeoTool({
  captured,
}: {
  captured: { run: GeoRepeatRun; capturedAt: string; defaultQuery: Query };
}) {
  const [hotel, setHotel] = useState('Rixos Sungate');
  const [area, setArea] = useState('Antalya');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [countries, setCountries] = useState<string[]>(['de', 'jp']);
  const [state, setState] = useState<RunState>({ phase: 'idle' });

  function toggleCountry(code: string) {
    setCountries((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= MAX_MARKETS) return [...prev.slice(1), code];
      return [...prev, code];
    });
  }

  const inFlight = useRef(false); // ref, not state: two clicks inside one render can both pass a state check

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current || state.phase === 'running') return;
    if (countries.length !== MAX_MARKETS) {
      setState({ phase: 'error', message: 'Pick two markets. One market is a price; two sampled markets is a comparison.' });
      return;
    }
    inFlight.current = true;
    setState({ phase: 'running' });
    track({ e: 'demo_run', tool: 'hotel-geo', mode: 'live' });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shape: 'hotel-geo', hotel, area: area || undefined, checkin, checkout, countries }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: 'error', message: String(data.message ?? 'The check failed. Try again.') });
        return;
      }
      setState({
        phase: 'done',
        mode: data.mode === 'cached' ? 'cached' : 'live',
        markets: data.markets as Market[],
        query: { hotel, area: area || undefined, checkin, checkout, countries: [...countries] },
      });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server. Try again.' });
    } finally {
      inFlight.current = false;
    }
  }

  const showing = state.phase === 'done' ? state : null;
  const query = showing ? showing.query : captured.defaultQuery;

  const inputCls =
    'mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none';

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Hotel name</span>
            <input
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              required
              minLength={3}
              maxLength={80}
              placeholder="Rixos Sungate"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Area (optional)</span>
            <input value={area} onChange={(e) => setArea(e.target.value)} maxLength={40} placeholder="Antalya" className={inputCls} />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Check-in</span>
            <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} required className={`${inputCls} [color-scheme:dark]`} />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Check-out</span>
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

        <fieldset className="mt-4">
          <legend className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
            Two markets to compare ({countries.length}/{MAX_MARKETS} selected)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MARKETS.map((m) => {
              const on = countries.includes(m.code);
              return (
                <label
                  key={m.code}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border rule px-2.5 py-1.5 text-[13px] transition-colors ${
                    on ? 'border-signal-600 bg-signal-600/10 text-ink-100' : 'text-ink-300 hover:border-ink-500'
                  }`}
                >
                  <input type="checkbox" checked={on} onChange={() => toggleCountry(m.code)} className="sr-only" />
                  <span className="font-mono text-[11px] text-signal-400">{m.code}</span>
                  {m.name}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] text-ink-400 leading-relaxed">
            Germany and Japan to start with: in our own repeat runs those two held steady, so a difference between them means
            something. Pick a third market and the oldest choice drops off.
          </p>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-accent" disabled={state.phase === 'running'}>
            {state.phase === 'running' ? 'Sampling both markets…' : 'Price it from both markets'}
          </button>
          <p className="font-mono text-[11px] text-ink-500">
            {MAX_MARKETS * SAMPLES_PER_MARKET} REAL requests: each market asked {SAMPLES_PER_MARKET} times, every request
            through a residential proxy in that country. The expensive kind of call, so this tool has the tightest cap on the
            site. Can take ~20–60s.
          </p>
        </div>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] text-verdict-typical leading-relaxed">{state.message}</p> : null}

      {/* Result: live if run, a captured repeat-sampling run on first paint */}
      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-[16px] font-semibold text-ink-100">
            {showing ? (
              <>
                {query.hotel}
                {query.area ? `, ${query.area}` : ''} · {query.checkin} → {query.checkout}
              </>
            ) : (
              <>Three Rome properties, three markets, three requests each</>
            )}
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
        </div>
        {showing ? <HotelMarketSamplesTable markets={showing.markets} /> : <HotelRepeatSamplesTable run={captured.run} />}
        {showing ? null : (
          <p className="mt-3 text-[13.5px] text-ink-400 leading-relaxed">
            Japan came in under Germany on all three properties, and both markets returned the same number on every request. The
            US moved on its own between identical requests, by more than the Germany–Japan gap. Run your own check above.
          </p>
        )}
      </div>

      <ApiUpsellCard
        tool="hotel-geo"
        snippets={hotelGeoSnippets({
          hotel: query.hotel,
          area: query.area,
          checkin: query.checkin,
          checkout: query.checkout,
          countries: query.countries,
          samples: SAMPLES_PER_MARKET,
        })}
        pricingHref={rapidApiPricingUrl('hotels', 'tool')}
        docsHref="/hotels-api/geo-pricing"
        headline="Run this check from your own code"
        body="The same method as JSON: hold the property fixed, sample each market a few times, and compare the ranges. Schedule it and rate-parity monitoring is a cron job."
      />
    </div>
  );
}
