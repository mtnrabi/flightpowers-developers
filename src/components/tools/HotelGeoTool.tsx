'use client';

import { useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { HotelMarketsTable } from '@/components/results';
import { CapturedBadge } from '@/components/ui';
import type { HotelByName } from '@/lib/fixtures';
import { hotelGeoSnippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

/** Mirrors the server's allowlist — the demo may only proxy through these markets. */
const MARKETS: { code: string; name: string }[] = [
  { code: 'us', name: 'United States' },
  { code: 'de', name: 'Germany' },
  { code: 'il', name: 'Israel' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'fr', name: 'France' },
  { code: 'br', name: 'Brazil' },
  { code: 'in', name: 'India' },
  { code: 'jp', name: 'Japan' },
  { code: 'au', name: 'Australia' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'tr', name: 'Türkiye' },
];

type Market = { country: string; result: HotelByName | null };

type Query = { hotel: string; area?: string; checkin: string; checkout: string; countries: string[] };

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; mode: 'live' | 'cached'; markets: Market[]; query: Query }
  | { phase: 'error'; message: string };

/**
 * The geo-pricing form. The page around it is complete server-rendered copy;
 * this component only adds the interaction. Each selected market is a real
 * request through a residential proxy in that country — the expensive kind
 * of call, which is why this tool has the tightest cap on the site (the page
 * says so).
 */
export function HotelGeoTool({ captured }: { captured: { markets: Market[]; capturedAt: string; query: Query } }) {
  const [hotel, setHotel] = useState('Rixos Sungate');
  const [area, setArea] = useState('Antalya');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [countries, setCountries] = useState<string[]>(['us', 'de', 'il']);
  const [state, setState] = useState<RunState>({ phase: 'idle' });

  function toggleCountry(code: string) {
    setCountries((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : prev.length >= 3 ? prev : [...prev, code]));
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase === 'running') return;
    if (countries.length < 2) {
      setState({ phase: 'error', message: 'Pick 2–3 markets to compare — one market is a price, two is a comparison.' });
      return;
    }
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
        setState({ phase: 'error', message: String(data.message ?? 'The check failed — try again.') });
        return;
      }
      setState({
        phase: 'done',
        mode: data.mode === 'cached' ? 'cached' : 'live',
        markets: data.markets as Market[],
        query: { hotel, area: area || undefined, checkin, checkout, countries: [...countries] },
      });
    } catch {
      setState({ phase: 'error', message: 'Could not reach the server — try again.' });
    }
  }

  const showing = state.phase === 'done' ? state : null;
  const query = showing ? showing.query : captured.query;

  const inputCls =
    'mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none';

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_1fr]">
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
            Markets to price from ({countries.length}/3 selected — pick 2–3)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MARKETS.map((m) => {
              const on = countries.includes(m.code);
              const full = !on && countries.length >= 3;
              return (
                <label
                  key={m.code}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border rule px-2.5 py-1.5 text-[13px] transition-colors ${
                    on ? 'border-signal-600 bg-signal-600/10 text-ink-100' : full ? 'text-ink-600 cursor-not-allowed' : 'text-ink-300 hover:border-ink-500'
                  }`}
                >
                  <input type="checkbox" checked={on} disabled={full} onChange={() => toggleCountry(m.code)} className="sr-only" />
                  <span className="font-mono text-[11px] text-signal-400">{m.code}</span>
                  {m.name}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-accent" disabled={state.phase === 'running'}>
            {state.phase === 'running' ? 'Pricing markets…' : 'Price it from each market'}
          </button>
          <p className="font-mono text-[11px] text-ink-500">
            One REAL request per market, each through a residential proxy in that country — the expensive kind of call, so this
            tool has the tightest cap on the site. Can take ~10–40s.
          </p>
        </div>
      </form>

      {state.phase === 'error' ? <p className="text-[14.5px] text-verdict-typical leading-relaxed">{state.message}</p> : null}

      {/* Result: live if run, captured example on first paint */}
      <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-[16px] font-semibold text-ink-100">
            {query.hotel}
            {query.area ? `, ${query.area}` : ''} · {query.checkin} → {query.checkout}
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
        <HotelMarketsTable markets={showing ? showing.markets : captured.markets} />
      </div>

      <ApiUpsellCard
        tool="hotel-geo"
        snippets={hotelGeoSnippets({ hotel: query.hotel, area: query.area, checkin: query.checkin, checkout: query.checkout, countries: query.countries })}
        pricingHref={rapidApiPricingUrl('hotels', 'tool')}
        docsHref="/hotels-api/geo-pricing"
        headline="Monitor this spread from your own code"
        body="The same check as JSON — one request per market, identical except proxy_country. Schedule it and rate-parity monitoring is a cron job."
      />
    </div>
  );
}
