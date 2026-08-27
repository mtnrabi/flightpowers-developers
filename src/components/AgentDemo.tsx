'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/track';
import { rapidApiPricingUrl } from '@/lib/site';
import { dealHuntSnippets, hotelGeoSnippets, monthScanSnippets, onewaySnippets, type Snippets } from '@/lib/snippets';
import type { DealHuntRow, HotelByName, OnewayFlight, ScanDay } from '@/lib/fixtures';
import { airlineText } from '@/lib/format';
import { DealHuntGrid, FlightResults, HeatGrid, HotelMarketsTable, SearchHeaderChips, StealRow } from './results';
import { ApiUpsellCard } from './ApiUpsellCard';
import { CapturedBadge } from './ui';

/**
 * The homepage centerpiece: a chat box that IS the product.
 *
 * Layout is input-FIRST: the question box and example chips sit at the top of
 * the terminal, the pending state renders directly under the input the moment
 * you press Ask, and the newest answer lands right below it, exactly where
 * your eyes already are. History stacks underneath, dimmed. (The old layout
 * appended answers above the input inside a scroll region; on a phone you
 * pressed Ask and saw nothing change.)
 *
 * Chips are context-aware: a flights conversation offers flight follow-ups;
 * the hotel geo-pricing example lives behind its own clearly-labelled
 * affordance and only joins the chip row in a hotel context.
 */

type Answer =
  | { kind: 'oneway'; flights: OnewayFlight[]; headers?: Record<string, string>; request?: unknown; askedPrice?: number }
  | { kind: 'deal-hunt'; rows: DealHuntRow[] }
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

type Chip = { id: string; label: string };

const FLIGHT_CHIPS: Chip[] = [
  { id: 'warm-getaway-january', label: 'Cheap winter sun from London in January' },
  { id: 'good-price-jfk-cun', label: 'Is $129 JFK→Cancún a good price?' },
  { id: 'cheapest-day-november', label: 'Cheapest day LIS→JFK in November' },
];

const HOTEL_CHIPS: Chip[] = [{ id: 'hotel-three-markets', label: 'Same hotel from the US, Germany and Israel' }];

const DEST_NAMES: Record<string, string> = { LPA: 'Gran Canaria', RAK: 'Marrakech', AGP: 'Málaga' };

function money(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function shortDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function dealHuntNarrative(rows: DealHuntRow[]): string {
  const priced = rows.filter((r): r is DealHuntRow & { price: number } => r.price != null);
  if (priced.length === 0) return 'None of the searches in this hunt returned a priced fare.';
  const dests = [...new Set(rows.map((r) => r.dest))];
  const dates = new Set(rows.map((r) => r.date)).size;
  const destList = dests.map((d) => DEST_NAMES[d] ?? d);
  const listText =
    destList.length > 1 ? `${destList.slice(0, -1).join(', ')} and ${destList[destList.length - 1]}` : destList[0]!;
  const parts: string[] = [`I ran ${rows.length} real searches for this: ${listText}, ${dates} January dates each, all from London Gatwick.`];

  const bestPerDest = dests
    .map((d) => priced.filter((r) => r.dest === d).sort((a, b) => a.price - b.price)[0])
    .filter((r): r is DealHuntRow & { price: number } => r != null)
    .sort((a, b) => a.price - b.price);

  const best = bestPerDest[0]!;
  const bestBits: string[] = [
    `Best find: ${DEST_NAMES[best.dest] ?? best.dest}${best.stops === 0 ? ' nonstop' : ''} for ${money(best.price)} on ${shortDate(best.date)}.`,
  ];
  if (best.verdict === 'low' && best.low != null && best.high != null) {
    bestBits.push(
      `Google's own verdict on that fare is "low". The usual range for the route is ${money(best.low)} to ${money(best.high)}, so ${money(best.price)} is under the floor.`
    );
  } else if (best.verdict) {
    bestBits.push(`Google calls that fare "${best.verdict}" for the route.`);
  }
  parts.push(bestBits.join(' '));

  for (const r of bestPerDest.slice(1)) {
    parts.push(
      `${DEST_NAMES[r.dest] ?? r.dest} bottoms out at ${money(r.price)}${r.verdict === 'low' ? ', also flagged low' : r.verdict ? ` (${r.verdict})` : ''}.`
    );
  }

  const degraded = rows.filter((r) => r.status === 'degraded').length;
  if (degraded > 0) {
    parts.push(
      `${degraded} of the ${rows.length} searches came back degraded. The API says so instead of pretending those dates are sold out, so a real run retries exactly those ${degraded}.`
    );
  }
  return parts.join(' ');
}

function onewayNarrative(flights: OnewayFlight[], askedPrice?: number): string {
  const withBand = flights.find((f) => f.price_insights_low != null && f.price_insights_high != null);
  const cheapest = flights.reduce((a, b) => (a.price_as_number <= b.price_as_number ? a : b), flights[0]!);
  const parts: string[] = [];
  if (withBand?.price_insights_low != null && withBand.price_insights_high != null) {
    parts.push(
      `Google's own price band for this route and date is ${money(withBand.price_insights_low)} to ${money(withBand.price_insights_high)}.`
    );
    if (askedPrice != null) {
      if (askedPrice < withBand.price_insights_low) {
        parts.push(`${money(askedPrice)} sits below the low end of that band. If you're seeing it, that's a good fare. Book it.`);
      } else if (askedPrice <= withBand.price_insights_high) {
        parts.push(`${money(askedPrice)} sits inside the band. A normal price for this route, not a steal.`);
      } else {
        parts.push(`${money(askedPrice)} is above the high end of the band. You can usually do better on this route.`);
      }
    }
  }
  parts.push(
    `Cheapest fare in this search: ${cheapest.price} (${airlineText(cheapest.airline)}, ${cheapest.stops === 0 ? 'nonstop' : `${cheapest.stops} stop${cheapest.stops > 1 ? 's' : ''}`})${
      cheapest.price_range_in_relation_to_other_periods ? `. Google calls it "${cheapest.price_range_in_relation_to_other_periods}".` : '.'
    }`
  );
  return parts.join(' ');
}

function scanNarrative(days: ScanDay[]): string {
  const priced = days.filter((d): d is ScanDay & { price: number } => d.price != null);
  if (priced.length === 0) return 'No priced days came back for that month.';
  const best = priced.reduce((a, b) => (a.price <= b.price ? a : b));
  const worst = priced.reduce((a, b) => (a.price >= b.price ? a : b));
  return `Cheapest day found: ${shortDate(best.date)} at ${money(best.price)}${best.verdict ? ` (Google's verdict: ${best.verdict}${best.low != null && best.high != null ? `, band ${money(best.low)} to ${money(best.high)}` : ''})` : ''}. Flying on the most expensive day would cost ${money(worst.price)}. Picking the right date saves ${money(worst.price - best.price)}.`;
}

function hotelNarrative(markets: { country: string; result: HotelByName | null }[]): string {
  const avail = markets.filter((m) => m.result?.available && m.result.price != null);
  if (avail.length === 0) return 'None of the markets returned an available rate for those dates.';
  const min = avail.reduce((a, b) => (a.result!.price! <= b.result!.price! ? a : b));
  const max = avail.reduce((a, b) => (a.result!.price! >= b.result!.price! ? a : b));
  if (min.result!.price === max.result!.price) {
    return `All markets were quoted the same rate. Rate parity is holding for this property and dates, and when it breaks, this is exactly how you catch it.`;
  }
  return `The ${min.country.toUpperCase()} market was quoted ${min.result!.price_string} for the same room the ${max.country.toUpperCase()} market sees at ${max.result!.price_string}. That's a ${money(max.result!.price! - min.result!.price!)} spread on one booking, caught by varying proxy_country.`;
}

/** Build a display turn from a captured chip payload (server-provided). */
export function buildCannedTurn(payload: Record<string, unknown>): Turn {
  if (payload.kind === 'deal-hunt') {
    const rows = payload.rows as DealHuntRow[];
    const dests = [...new Set(rows.map((r) => r.dest))];
    const dates = [...new Set(rows.map((r) => r.date))].sort();
    return {
      question: String(payload.question),
      mode: 'canned',
      capturedAt: String(payload.capturedAt),
      answer: { kind: 'deal-hunt', rows },
      narrative: dealHuntNarrative(rows),
      snippets: dealHuntSnippets({ from: 'LGW', dests, dates }),
      snippetTool: 'agent-demo-deal-hunt',
    };
  }
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

function DealHuntAnswer({ rows }: { rows: DealHuntRow[] }) {
  const dests = [...new Set(rows.map((r) => r.dest))];
  const steals = dests
    .map((d) => rows.filter((r) => r.dest === d && r.price != null).sort((a, b) => a.price! - b.price!)[0])
    .filter((r): r is DealHuntRow => r != null)
    .sort((a, b) => a.price! - b.price!);
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500 mb-1">the steals</p>
      <div className="mb-4">
        {steals.map((r) => (
          <StealRow key={`${r.dest}-${r.date}`} r={r} destName={DEST_NAMES[r.dest] ?? r.dest} />
        ))}
      </div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500 mb-1">every search in the hunt</p>
      <DealHuntGrid rows={rows} destNames={DEST_NAMES} origin="LGW" />
    </div>
  );
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
          <span className="font-mono text-[11px] text-ink-400">from the demo cache, a repeat of a recent live search</span>
        ) : null}
      </div>
      <p className="text-[14.5px] text-ink-200 leading-relaxed">{turn.narrative}</p>
      <div className="mt-4">
        {turn.answer.kind === 'deal-hunt' ? (
          <DealHuntAnswer rows={turn.answer.rows} />
        ) : turn.answer.kind === 'oneway' ? (
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
                ? `Live scans here sample every ${turn.answer.sampledEvery} days to respect the demo budget. With your own key you scan every date in one parallel burst.`
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
  const [turns, setTurns] = useState<Turn[]>(() => [buildCannedTurn(initialChipPayload)]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  // Keep the status/answer zone in view. The pending line and the newest
  // answer both render directly under the input, so one anchor serves both.
  useEffect(() => {
    if (started.current) statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns, notice, busy]);

  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function runChip(id: string) {
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
      setTurns((t) => [...t, buildCannedTurn(payload)]);
    } catch {
      setNotice('Could not load the example. Try again.');
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
              ? 'Google genuinely has no itineraries for that route and date (X-Search-Status: empty). The empty result is the answer, not a failure.'
              : 'The search did not complete (X-Search-Status: degraded). The API says so instead of pretending "no flights". Try once more.'
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
            narrative: `Found ${itins.length} paired round-trip itineraries. The full round-trip demo lives on the Round-Trip API page. This box keeps to one-way, date-scan, and hotel questions.`,
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
      setNotice('The live search failed to reach the server. Try again.');
    } finally {
      stopTimer();
      setBusy(false);
    }
  }

  // Newest answer first; a short dimmed history under it.
  const ordered = [...turns].reverse();
  const latest = ordered[0];
  const earlier = ordered.slice(1, 3);
  const hotelContext = latest?.answer.kind === 'hotel-geo';
  const chips = hotelContext ? [...HOTEL_CHIPS, ...FLIGHT_CHIPS.slice(0, 2)] : FLIGHT_CHIPS;

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

      {/* Input first: ask here, the answer appears right below. */}
      <div className="p-4 sm:p-5 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runLive(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            aria-label="Ask the travel agent a question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: "cheapest day JFK to Miami in November"'
            maxLength={300}
            className="min-w-0 flex-1 rounded-full border rule bg-ink-900 px-4 py-2.5 text-[14px] text-ink-100 placeholder:text-ink-500 focus:border-signal-600 focus:outline-none"
          />
          <button type="submit" className="btn btn-primary !px-5 text-sm" disabled={busy}>
            {busy ? '…' : 'Ask'}
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button key={chip.id} type="button" className="chip" onClick={() => runChip(chip.id)} disabled={busy}>
              {chip.label}
            </button>
          ))}
          {!hotelContext ? (
            <button
              type="button"
              className="chip !border-dashed"
              onClick={() => runChip('hotel-three-markets')}
              disabled={busy}
            >
              Hotels: same room, 3 markets →
            </button>
          ) : null}
        </div>
        <p className="font-mono text-[11px] text-ink-500">
          Chips replay captured runs, free. Typed questions run REAL searches on our key, capped per visitor and per day. It
          understands routes, dates, and &quot;cheapest day in &lt;month&gt;&quot;.
        </p>
      </div>

      {/* Status + answers: everything lands HERE, right under the input. */}
      <div className="border-t rule p-4 sm:p-5 space-y-4">
        <div ref={statusRef} className="scroll-mt-24" aria-hidden="true" />
        {busy ? (
          <div className="font-mono text-[12.5px] text-signal-400" role="status">
            <p className="flex items-center gap-2">
              <span className="live-badge" aria-hidden="true" />
              scanning live against Google Flights{elapsed > 0 ? ` · ${elapsed}s` : '…'}
            </p>
            <p className="mt-1 text-ink-500">nothing here is cached; hard routes can take ~30s</p>
          </div>
        ) : null}
        {notice ? <p className="text-[13.5px] text-verdict-typical leading-relaxed">{notice}</p> : null}

        {latest ? (
          <div className="space-y-3">
            <p className="text-[14px] text-ink-100">
              <span className="font-mono text-[11px] text-signal-500 mr-2">you →</span>
              {latest.question}
            </p>
            <AnswerBlock turn={latest} />
          </div>
        ) : null}

        {latest?.snippets ? (
          <ApiUpsellCard
            snippets={latest.snippets}
            tool={latest.snippetTool ?? 'agent-demo'}
            pricingHref={rapidApiPricingUrl('flights', 'demo-upsell')}
            docsHref="/flights-api"
            headline="The calls that produced this answer"
            body="Same requests, your code, your key. The price band, the verdict, and X-Search-Status ride on every response."
          />
        ) : null}

        {earlier.length > 0 ? (
          <div className="space-y-4 opacity-60">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-500">earlier</p>
            {earlier.map((turn, i) => (
              <div key={`${turn.question}-${i}`} className="space-y-3">
                <p className="text-[14px] text-ink-100">
                  <span className="font-mono text-[11px] text-signal-500 mr-2">you →</span>
                  {turn.question}
                </p>
                <AnswerBlock turn={turn} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
