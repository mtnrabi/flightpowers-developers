'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { rapidApiPricingUrl } from '@/lib/site';
import { hotelGeoSnippets, monthScanSnippets, onewaySnippets, type Snippets } from '@/lib/snippets';
import type { HotelByName, OnewayFlight, ScanDay } from '@/lib/fixtures';
import { airlineText } from '@/lib/format';
import { FlightResults, HeatGrid, HotelMarketsTable, SearchHeaderChips } from './results';
import { ApiUpsellCard } from './ApiUpsellCard';
import { CapturedBadge } from './ui';

/**
 * The homepage centerpiece: a chat box that IS the product.
 * First paint shows a captured exchange (server-rendered — the transcript
 * is real HTML before any JS runs). The three chips replay captured runs
 * for free; typing runs a LIVE search through /api/demo behind the
 * budget caps, and says which is which at every step.
 */

type Answer =
  | { kind: 'oneway'; flights: OnewayFlight[]; headers?: Record<string, string>; request?: unknown; askedPrice?: number }
  | { kind: 'month-scan'; days: ScanDay[]; sampledEvery?: number }
  | { kind: 'hotel-geo'; markets: { country: string; result: HotelByName | null }[] }
  | { kind: 'note'; text: string };

type Turn = {
  question: string;
  mode: 'canned' | 'live' | 'cached' | 'info';
  capturedAt?: string;
  answer: Answer;
  narrative: string;
  snippets?: Snippets;
  snippetTool?: string;
};

const CHIPS = [
  { id: 'good-price-tlv-jfk', label: 'Is $480 TLV→JFK in October a good price?' },
  { id: 'cheapest-november-lis-nyc', label: 'Scan November for the cheapest LIS→NYC dates' },
  { id: 'hotel-three-markets', label: 'Same hotel, priced from the US, Germany and Israel' },
] as const;

function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function onewayNarrative(flights: OnewayFlight[], askedPrice?: number): string {
  const withBand = flights.find((f) => f.price_insights_low != null && f.price_insights_high != null);
  const cheapest = flights.reduce((a, b) => (a.price_as_number <= b.price_as_number ? a : b), flights[0]!);
  const parts: string[] = [];
  if (withBand?.price_insights_low != null && withBand.price_insights_high != null) {
    parts.push(
      `Google's own price band for this route and date is ${money(withBand.price_insights_low)}–${money(withBand.price_insights_high)}.`
    );
    if (askedPrice != null) {
      if (askedPrice < withBand.price_insights_low) {
        parts.push(`${money(askedPrice)} sits below the low end of that band — if you're seeing it, that's a good fare. Book it.`);
      } else if (askedPrice <= withBand.price_insights_high) {
        parts.push(`${money(askedPrice)} sits inside the band — a normal price for this route, not a steal.`);
      } else {
        parts.push(`${money(askedPrice)} is above the high end of the band — you can usually do better on this route.`);
      }
    }
  }
  parts.push(
    `Cheapest fare in this search: ${cheapest.price} (${airlineText(cheapest.airline)}, ${cheapest.stops === 0 ? 'nonstop' : `${cheapest.stops} stop${cheapest.stops > 1 ? 's' : ''}`})${
      cheapest.price_range_in_relation_to_other_periods ? ` — Google calls it “${cheapest.price_range_in_relation_to_other_periods}”.` : '.'
    }`
  );
  return parts.join(' ');
}

function scanNarrative(days: ScanDay[]): string {
  const priced = days.filter((d): d is ScanDay & { price: number } => d.price != null);
  if (priced.length === 0) return 'No priced days came back for that month.';
  const best = priced.reduce((a, b) => (a.price <= b.price ? a : b));
  const worst = priced.reduce((a, b) => (a.price >= b.price ? a : b));
  const d = new Date(best.date + 'T00:00:00Z');
  const nice = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `Cheapest day found: ${nice} at ${money(best.price)}${best.verdict ? ` (Google's verdict: ${best.verdict}${best.low != null && best.high != null ? `, band ${money(best.low)}–${money(best.high)}` : ''})` : ''}. Flying on the most expensive day would cost ${money(worst.price)} — picking the right date saves ${money(worst.price - best.price)}.`;
}

function hotelNarrative(markets: { country: string; result: HotelByName | null }[]): string {
  const avail = markets.filter((m) => m.result?.available && m.result.price != null);
  if (avail.length === 0) return 'None of the markets returned an available rate for those dates.';
  const min = avail.reduce((a, b) => (a.result!.price! <= b.result!.price! ? a : b));
  const max = avail.reduce((a, b) => (a.result!.price! >= b.result!.price! ? a : b));
  if (min.result!.price === max.result!.price) {
    return `All markets were quoted the same rate — rate parity is holding for this property and dates. When it breaks, this is exactly how you catch it.`;
  }
  return `The ${min.country.toUpperCase()} market was quoted ${min.result!.price_string} for the same room the ${max.country.toUpperCase()} market sees at ${max.result!.price_string} — a ${money(max.result!.price! - min.result!.price!)} spread on one booking. That's proxy_country doing rate-parity work.`;
}

/** Build the first-paint turn from the captured fixture (passed by the server). */
export function buildCannedTurn(chip: (typeof CHIPS)[number]['id'], payload: Record<string, unknown>): Turn {
  if (payload.kind === 'oneway') {
    const flights = payload.flights as OnewayFlight[];
    const askedPrice = payload.askedPrice as number | undefined;
    const req = (payload.request as { body: { from_airport: string; to_airport: string; departure_date: string } }).body;
    return {
      question: String(payload.question),
      mode: 'canned',
      capturedAt: String(payload.capturedAt),
      answer: { kind: 'oneway', flights, headers: payload.headers as Record<string, string>, askedPrice },
      narrative: onewayNarrative(flights, askedPrice),
      snippets: onewaySnippets({ from: req.from_airport, to: req.to_airport, date: req.departure_date }),
      snippetTool: 'agent-demo-oneway',
    };
  }
  if (payload.kind === 'month-scan') {
    const days = payload.days as ScanDay[];
    return {
      question: String(payload.question),
      mode: 'canned',
      capturedAt: String(payload.capturedAt),
      answer: { kind: 'month-scan', days, sampledEvery: payload.sampledEvery as number },
      narrative: scanNarrative(days),
      snippets: monthScanSnippets({ from: 'LIS', to: 'JFK', month: '2026-11', days: 30 }),
      snippetTool: 'agent-demo-scan',
    };
  }
  const markets = payload.markets as { country: string; result: HotelByName | null }[];
  return {
    question: String(payload.question),
    mode: 'canned',
    capturedAt: String(payload.capturedAt),
    answer: { kind: 'hotel-geo', markets },
    narrative: hotelNarrative(markets),
    snippets: hotelGeoSnippets({
      hotel: 'Rixos Sungate',
      area: 'Antalya',
      checkin: '2026-10-05',
      checkout: '2026-10-10',
      countries: markets.map((m) => m.country),
    }),
    snippetTool: 'agent-demo-hotel',
  };
}

function AnswerBlock({ turn }: { turn: Turn }) {
  return (
    <div className="rounded-xl border rule bg-ink-900/70 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {turn.mode === 'canned' && turn.capturedAt ? (
          <CapturedBadge date={turn.capturedAt} />
        ) : turn.mode === 'live' ? (
          <span className="live-badge">live search</span>
        ) : turn.mode === 'cached' ? (
          <span className="font-mono text-[11px] text-ink-400">served from the demo cache — a repeat of a recent live search</span>
        ) : null}
      </div>
      <p className="text-[14.5px] text-ink-200 leading-relaxed">{turn.narrative}</p>
      <div className="mt-4">
        {turn.answer.kind === 'oneway' ? (
          <>
            <FlightResults flights={turn.answer.flights.slice(0, 3)} />
            {turn.answer.headers ? (
              <div className="mt-3">
                <SearchHeaderChips headers={turn.answer.headers} />
              </div>
            ) : null}
          </>
        ) : turn.answer.kind === 'month-scan' ? (
          <HeatGrid
            days={turn.answer.days}
            note={
              turn.answer.sampledEvery && turn.answer.sampledEvery > 1
                ? `Live scans here sample every ${turn.answer.sampledEvery} days to respect the demo budget — with your own key you scan all 30 in one parallel burst.`
                : undefined
            }
          />
        ) : turn.answer.kind === 'hotel-geo' ? (
          <HotelMarketsTable markets={turn.answer.markets} />
        ) : null}
      </div>
    </div>
  );
}

export function AgentDemo({ initialChipPayload }: { initialChipPayload: Record<string, unknown> }) {
  const [turns, setTurns] = useState<Turn[]>(() => [buildCannedTurn('good-price-tlv-jfk', initialChipPayload)]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns, notice]);

  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function runChip(id: (typeof CHIPS)[number]['id'], label: string) {
    if (busy) return;
    started.current = true;
    setBusy(true);
    setNotice(null);
    track({ e: 'demo_run', tool: 'agent', mode: 'canned', action: id });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chip: id }),
      });
      const payload = (await res.json()) as Record<string, unknown>;
      setTurns((t) => [...t, buildCannedTurn(id, payload)]);
    } catch {
      setNotice('Could not load the example — try again.');
    } finally {
      setBusy(false);
    }
  }

  async function runLive(message: string) {
    if (busy || !message.trim()) return;
    started.current = true;
    setBusy(true);
    setNotice(null);
    setInput('');
    startTimer();
    track({ e: 'demo_run', tool: 'agent', mode: 'live' });
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const payload = (await res.json()) as Record<string, unknown>;

      if (payload.mode === 'unparsed') {
        setNotice(String(payload.hint));
        return;
      }
      if (payload.mode === 'capped' || payload.mode === 'degraded') {
        setNotice(String(payload.message));
        return;
      }

      const mode = payload.mode === 'cached' ? 'cached' : 'live';
      const parsed = payload.parsed as Record<string, string>;
      if (payload.kind === 'oneway') {
        const flights = payload.flights as OnewayFlight[];
        if (flights.length === 0) {
          const status = (payload.headers as Record<string, string>)?.['x-search-status'];
          setNotice(
            status === 'empty'
              ? 'Google genuinely has no itineraries for that route and date (X-Search-Status: empty) — the empty result is the answer, not a failure.'
              : 'The search did not complete (X-Search-Status: degraded) — the API says so instead of pretending "no flights". Try once more.'
          );
          return;
        }
        setTurns((t) => [
          ...t,
          {
            question: message,
            mode,
            answer: { kind: 'oneway', flights, headers: payload.headers as Record<string, string>, askedPrice: payload.askedPrice as number | undefined },
            narrative: onewayNarrative(flights, payload.askedPrice as number | undefined),
            snippets: onewaySnippets({ from: parsed.from!, to: parsed.to!, date: parsed.date! }),
            snippetTool: 'agent-demo-oneway',
          },
        ]);
      } else if (payload.kind === 'roundtrip') {
        // Render round-trips through the oneway narrative path is wrong — keep it simple and honest.
        const itins = payload.itineraries as unknown[];
        if (itins.length === 0) {
          setNotice('No paired itineraries came back for those dates. Try nearby dates.');
          return;
        }
        setNotice(null);
        setTurns((t) => [
          ...t,
          {
            question: message,
            mode,
            answer: { kind: 'note', text: '' },
            narrative: `Found ${itins.length} paired round-trip itineraries. The full round-trip demo lives on the Round-Trip API page — this box keeps to one-way, date-scan, and hotel questions.`,
          },
        ]);
      } else if (payload.kind === 'month-scan') {
        const days = payload.days as ScanDay[];
        setTurns((t) => [
          ...t,
          {
            question: message,
            mode,
            answer: { kind: 'month-scan', days, sampledEvery: payload.sampledEvery as number },
            narrative: scanNarrative(days),
            snippets: monthScanSnippets({ from: parsed.from!, to: parsed.to!, month: parsed.month!, days: 30 }),
            snippetTool: 'agent-demo-scan',
          },
        ]);
      }
    } catch {
      setNotice('The live search failed to reach the server — try again.');
    } finally {
      stopTimer();
      setBusy(false);
    }
  }

  const latest = turns[turns.length - 1];

  return (
    <div className="terminal">
      <div className="terminal-bar justify-between">
        <div className="flex items-center gap-2">
          <span className="terminal-dots flex gap-1.5" aria-hidden="true">
            <span className="bg-verdict-high/70" />
            <span className="bg-verdict-typical/70" />
            <span className="bg-verdict-low/70" />
          </span>
          <span className="uppercase tracking-wider">travel agent · flightpowers</span>
        </div>
        <span className="live-badge">live API behind this box</span>
      </div>

      <div className="p-4 sm:p-5 space-y-5 max-h-[560px] overflow-y-auto">
        {turns.map((turn, i) => (
          <div key={i} className="space-y-3">
            <p className="text-[14px] text-ink-100">
              <span className="font-mono text-[11px] text-signal-500 mr-2">you →</span>
              {turn.question}
            </p>
            <AnswerBlock turn={turn} />
          </div>
        ))}

        {busy ? (
          <p className="font-mono text-[12.5px] text-ink-400">
            scanning live against Google Flights — nothing here is cached, complex routes take longer{elapsed > 0 ? ` · ${elapsed}s` : ''}
          </p>
        ) : null}
        {notice ? <p className="text-[13.5px] text-verdict-typical leading-relaxed">{notice}</p> : null}
        <div ref={bottomRef} />
      </div>

      <div className="border-t rule p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button key={chip.id} type="button" className="chip" onClick={() => runChip(chip.id, chip.label)} disabled={busy}>
              {chip.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runLive(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask it like a travel agent — "cheapest day TLV to London in November"'
            maxLength={300}
            className="min-w-0 flex-1 rounded-full border rule bg-ink-900 px-4 py-2.5 text-[14px] text-ink-100 placeholder:text-ink-500 focus:border-signal-600 focus:outline-none"
          />
          <button type="submit" className="btn btn-primary !px-5 text-sm" disabled={busy}>
            {busy ? '…' : 'Ask'}
          </button>
        </form>
        <p className="font-mono text-[11px] text-ink-500">
          Examples replay captured runs (free). Typed questions run REAL searches on our own key — capped per visitor and per day, so
          the demo stays honest and affordable. Understands routes, dates, and &quot;cheapest day in &lt;month&gt;&quot;.
        </p>
      </div>

      {latest?.snippets ? (
        <div className="border-t rule p-4 sm:p-5">
          <ApiUpsellCard
            snippets={latest.snippets}
            tool={latest.snippetTool ?? 'agent-demo'}
            pricingHref={rapidApiPricingUrl('flights', 'demo-upsell')}
            docsHref="/flights-api"
            headline="The call that produced this answer"
            body="Same request, your code, your key — with the price band, the verdict, and X-Search-Status on every response."
          />
        </div>
      ) : null}
    </div>
  );
}
