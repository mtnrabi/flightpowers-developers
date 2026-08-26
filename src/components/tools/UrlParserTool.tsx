'use client';

import { useState } from 'react';
import { ApiUpsellCard } from '@/components/ApiUpsellCard';
import { Code } from '@/components/ui';
import { onewaySnippets, roundtripSnippets, type Snippets } from '@/lib/snippets';
import { rapidApiPricingUrl } from '@/lib/site';
import { track } from '@/lib/track';

/* ------------------------------------------------------------------ */
/* Generic protobuf wire-format decoder — no dependencies, no schema. */
/* The tfs format is undocumented; the wire format is not. We decode  */
/* structure (field numbers, wire types, nesting) and let the page    */
/* label only the values it can honestly recognize.                   */
/* ------------------------------------------------------------------ */

type WireNode =
  | { field: number; kind: 'varint' | 'fixed32' | 'fixed64'; value: string }
  | { field: number; kind: 'string'; value: string }
  | { field: number; kind: 'bytes'; value: string }
  | { field: number; kind: 'message'; children: WireNode[] };

function b64urlToBytes(s: string): Uint8Array {
  const normalized = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Read one varint. Returns [value, nextIndex]; throws on truncation. */
function readVarint(b: Uint8Array, i: number, end: number): [number, number] {
  let value = 0;
  let shift = 0;
  for (;;) {
    if (i >= end) throw new Error('truncated varint');
    const byte = b[i]!;
    i += 1;
    value += (byte & 0x7f) * 2 ** shift;
    shift += 7;
    if ((byte & 0x80) === 0) return [value, i];
    if (shift > 63) throw new Error('varint too long');
  }
}

function isPrintableAscii(b: Uint8Array, start: number, end: number): boolean {
  if (end <= start) return false;
  for (let i = start; i < end; i += 1) {
    const c = b[i]!;
    if (c < 0x20 || c > 0x7e) return false;
  }
  return true;
}

/**
 * Parse a byte range as a protobuf message. Length-delimited fields that
 * themselves parse cleanly as messages are recursed into; otherwise they
 * fall back to a printable string, then raw hex. Throws when the range is
 * not a valid message — the caller uses that as the "not a message" signal.
 */
function parseMessage(b: Uint8Array, start: number, end: number, depth: number): WireNode[] {
  if (depth > 8) throw new Error('nested too deep');
  const out: WireNode[] = [];
  let i = start;
  while (i < end) {
    let tag: number;
    [tag, i] = readVarint(b, i, end);
    const field = Math.floor(tag / 8);
    const wireType = tag % 8;
    if (field === 0) throw new Error('invalid field number 0');
    if (wireType === 0) {
      let v: number;
      [v, i] = readVarint(b, i, end);
      out.push({ field, kind: 'varint', value: String(v) });
    } else if (wireType === 5) {
      if (i + 4 > end) throw new Error('truncated fixed32');
      const dv = new DataView(b.buffer, b.byteOffset + i, 4);
      out.push({ field, kind: 'fixed32', value: String(dv.getUint32(0, true)) });
      i += 4;
    } else if (wireType === 1) {
      if (i + 8 > end) throw new Error('truncated fixed64');
      const dv = new DataView(b.buffer, b.byteOffset + i, 8);
      out.push({ field, kind: 'fixed64', value: dv.getBigUint64(0, true).toString() });
      i += 8;
    } else if (wireType === 2) {
      let len: number;
      [len, i] = readVarint(b, i, end);
      if (i + len > end) throw new Error('truncated length-delimited payload');
      const pStart = i;
      const pEnd = i + len;
      i = pEnd;
      let node: WireNode | null = null;
      if (len === 0) {
        node = { field, kind: 'string', value: '' };
      } else {
        try {
          node = { field, kind: 'message', children: parseMessage(b, pStart, pEnd, depth + 1) };
        } catch {
          node = null;
        }
      }
      if (!node) {
        if (isPrintableAscii(b, pStart, pEnd)) {
          let s = '';
          for (let j = pStart; j < pEnd; j += 1) s += String.fromCharCode(b[j]!);
          node = { field, kind: 'string', value: s };
        } else {
          let hex = '0x';
          for (let j = pStart; j < pEnd; j += 1) hex += b[j]!.toString(16).padStart(2, '0');
          node = { field, kind: 'bytes', value: hex };
        }
      }
      out.push(node);
    } else {
      throw new Error(`unsupported wire type ${wireType}`);
    }
  }
  return out;
}

function renderTree(nodes: WireNode[], indent = ''): string {
  return nodes
    .map((n) => {
      if (n.kind === 'message') {
        return `${indent}${n.field} {\n${renderTree(n.children, indent + '  ')}\n${indent}}`;
      }
      const value = n.kind === 'string' ? JSON.stringify(n.value) : n.value;
      return `${indent}${n.field} (${n.kind}): ${value}`;
    })
    .join('\n');
}

function collectStrings(nodes: WireNode[], out: string[]): void {
  for (const n of nodes) {
    if (n.kind === 'string') out.push(n.value);
    else if (n.kind === 'message') collectStrings(n.children, out);
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IATA_RE = /^[A-Z]{3}$/;

type Extracted = {
  dates: string[];
  airports: string[];
  route: { from: string; to: string; date: string; returnDate: string | null } | null;
};

/** Best-effort extraction: dates and 3-letter A–Z strings, in decode order. */
function extract(nodes: WireNode[]): Extracted {
  const strings: string[] = [];
  collectStrings(nodes, strings);
  const dates = [...new Set(strings.filter((s) => DATE_RE.test(s) && !Number.isNaN(Date.parse(s))))];
  const airports = [...new Set(strings.filter((s) => IATA_RE.test(s)))];
  const route =
    dates.length >= 1 && airports.length >= 2
      ? {
          from: airports[0]!,
          to: airports[1]!,
          date: dates[0]!,
          returnDate: dates.length >= 2 ? dates[1]! : null,
        }
      : null;
  return { dates, airports, route };
}

/** Pull the tfs value out of whatever the visitor pasted. */
function findTfs(input: string): { tfs: string } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { error: 'Paste a Google Flights URL first.' };
  try {
    const url = new URL(trimmed);
    const tfs = url.searchParams.get('tfs');
    if (tfs) return { tfs };
    // Some URLs carry the parameter in the hash fragment instead.
    const inHash = trimmed.match(/[?&#]tfs=([A-Za-z0-9_-]+)/);
    if (inHash) return { tfs: inHash[1]! };
    return {
      error:
        'That URL has no tfs= parameter — nothing to decode. Plain search URLs (?q=…) carry the query as text, not as an encoded state blob. Share links and buy_link URLs carry tfs=.',
    };
  } catch {
    // Not a URL. Accept a bare tfs value pasted on its own.
    const m = trimmed.match(/(?:^|[?&#])tfs=([A-Za-z0-9_-]+)/);
    if (m) return { tfs: m[1]! };
    if (/^[A-Za-z0-9_-]{16,}$/.test(trimmed)) return { tfs: trimmed };
    return { error: 'That doesn’t look like a Google Flights URL or a tfs value. Paste the full URL from the address bar.' };
  }
}

type DecodeState =
  | { phase: 'idle' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; tree: string; extracted: Extracted };

type BuildState = { url: string; phrase: string; snippets: Snippets; query: string } | null;

/**
 * Tier-A tool: 100% client-side, ungated. Nothing here calls a server —
 * the decode and the build both happen in the visitor's browser.
 */
export function UrlParserTool({ exampleUrl, exampleCapturedAt }: { exampleUrl: string; exampleCapturedAt: string }) {
  const [mode, setMode] = useState<'decode' | 'build'>('decode');

  // Decode direction
  const [input, setInput] = useState(exampleUrl);
  const [decoded, setDecoded] = useState<DecodeState>({ phase: 'idle' });

  // Build direction
  const [from, setFrom] = useState('TLV');
  const [to, setTo] = useState('JFK');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [built, setBuilt] = useState<BuildState>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  function runDecode(e: React.FormEvent) {
    e.preventDefault();
    track({ e: 'demo_run', tool: 'url-parser', mode: 'client' });
    const found = findTfs(input);
    if ('error' in found) {
      setDecoded({ phase: 'error', message: found.error });
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = b64urlToBytes(found.tfs);
    } catch {
      setDecoded({ phase: 'error', message: 'The tfs value isn’t valid base64url — the URL may have been truncated while copying.' });
      return;
    }
    try {
      const nodes = parseMessage(bytes, 0, bytes.length, 0);
      setDecoded({ phase: 'done', tree: renderTree(nodes), extracted: extract(nodes) });
    } catch {
      setDecoded({
        phase: 'error',
        message:
          'The tfs value decoded to bytes but they don’t parse as a protobuf message. Google may have changed the encoding for this URL — this tool decodes the wire format best-effort and says so when it can’t.',
      });
    }
  }

  function runBuild(e: React.FormEvent) {
    e.preventDefault();
    track({ e: 'demo_run', tool: 'url-parser', mode: 'client' });
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (!IATA_RE.test(f) || !IATA_RE.test(t) || !date) return;
    const phrase = `Flights from ${f} to ${t} on ${date}${returnDate ? ` through ${returnDate}` : ''}`;
    const url = `https://www.google.com/travel/flights?q=${encodeURIComponent(phrase)}`;
    const snippets = returnDate
      ? roundtripSnippets({ from: f, to: t, date, returnDate })
      : onewaySnippets({ from: f, to: t, date });
    setBuilt({ url, phrase, snippets, query: `${f} → ${t} · ${date}${returnDate ? ` – ${returnDate}` : ''}` });
    setCopiedLink(false);
  }

  async function copyBuiltLink() {
    if (!built) return;
    try {
      await navigator.clipboard.writeText(built.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const done = decoded.phase === 'done' ? decoded : null;
  const route = done?.extracted.route ?? null;
  const routeSnippets = route
    ? route.returnDate
      ? roundtripSnippets({ from: route.from, to: route.to, date: route.date, returnDate: route.returnDate })
      : onewaySnippets({ from: route.from, to: route.to, date: route.date })
    : null;

  const inputCls =
    'mt-1.5 w-full rounded-xl border rule bg-ink-950 px-3.5 py-2.5 font-mono text-[14px] text-ink-100 placeholder:text-ink-600 focus:border-signal-600 focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border rule bg-ink-900/70 p-5 sm:p-6">
        <div className="mb-5 flex gap-1 rounded-xl border rule bg-ink-950 p-1 w-fit" role="tablist" aria-label="Direction">
          {(
            [
              ['decode', 'Decode a URL'],
              ['build', 'Build a link'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`rounded-lg px-4 py-1.5 font-mono text-[12px] tracking-wide transition-colors ${
                mode === id ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'decode' ? (
          <form onSubmit={runDecode}>
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Google Flights URL (with tfs=)</span>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                required
                spellCheck={false}
                placeholder="https://www.google.com/travel/flights?tfs=…"
                className={`${inputCls} resize-y text-[12.5px] leading-relaxed break-all`}
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="submit" className="btn btn-accent">
                Decode it
              </button>
              <p className="font-mono text-[11px] text-ink-500">
                100% client-side — the URL never leaves your browser. No rate limit, no account.
              </p>
            </div>
            <p className="mt-2 font-mono text-[11px] text-ink-500">
              Pre-filled with a real <span className="text-signal-400">buy_link</span> the API returned on {exampleCapturedAt} — hit
              Decode to see inside it.
            </p>
          </form>
        ) : (
          <form onSubmit={runBuild}>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_1.2fr_auto]">
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">From (IATA)</span>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value.toUpperCase())}
                  maxLength={3}
                  required
                  placeholder="TLV"
                  className={`${inputCls} uppercase text-[15px]`}
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
                  className={`${inputCls} uppercase text-[15px]`}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Departure date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={`${inputCls} [color-scheme:dark]`} />
              </label>
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Return (optional)</span>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={date || undefined}
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </label>
              <div className="flex items-end">
                <button type="submit" className="btn btn-accent w-full sm:w-auto">
                  Build the link
                </button>
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] text-ink-500">
              Emits the search-query form (?q=Flights from … to … on …) — a phrase Google parses like a search-box entry, not a
              tfs deep link. The tfs format is undocumented and this tool doesn&apos;t fabricate one.
            </p>
          </form>
        )}
      </div>

      {mode === 'decode' && decoded.phase === 'error' ? (
        <p className="text-[14.5px] text-verdict-typical leading-relaxed">{decoded.message}</p>
      ) : null}

      {mode === 'decode' && done ? (
        <>
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
            <h3 className="text-[16px] font-semibold text-ink-100">Decoded wire format</h3>
            <p className="mt-1.5 text-[13.5px] text-ink-400 leading-relaxed">
              The tfs format is undocumented; we decode the wire format and label the fields we can identify — the raw tree is
              always shown. <span className="font-mono text-[12px]">field (type): value</span>, nested messages in braces.
            </p>
            <div className="mt-4">
              <Code label="tfs · decoded protobuf tree">{done.tree}</Code>
            </div>

            <div className="mt-5 border-t rule pt-5">
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Best-effort reading</h4>
              {route ? (
                <p className="mt-2 text-[15px] text-ink-200">
                  Looks like{' '}
                  <span className="font-mono text-signal-400">
                    {route.from} → {route.to}
                  </span>{' '}
                  departing <span className="font-mono text-signal-400">{route.date}</span>
                  {route.returnDate ? (
                    <>
                      , returning <span className="font-mono text-signal-400">{route.returnDate}</span> (two dates → round trip)
                    </>
                  ) : (
                    <> (one date → one-way)</>
                  )}
                  .
                </p>
              ) : (
                <p className="mt-2 text-[14.5px] text-ink-300 leading-relaxed">
                  Couldn&apos;t infer a full route: the tree needs at least one YYYY-MM-DD date and two 3-letter airport codes.
                  {done.extracted.airports.length > 0 ? ` Airport-like strings found: ${done.extracted.airports.join(', ')}.` : ''}
                  {done.extracted.dates.length > 0 ? ` Dates found: ${done.extracted.dates.join(', ')}.` : ''}
                </p>
              )}
              {route ? (
                <p className="mt-1.5 text-[13px] text-ink-400 leading-relaxed">
                  Inference rule, stated plainly: strings shaped like dates are dates, 3-letter A–Z strings are airports; first
                  date + first two airports make the route. It can be wrong on multi-city URLs — the tree above is the ground
                  truth.
                </p>
              ) : null}
            </div>
          </div>

          {route && routeSnippets ? (
            <ApiUpsellCard
              tool="url-parser"
              snippets={routeSnippets}
              pricingHref={rapidApiPricingUrl('flights', 'tool')}
              docsHref="/flights-api/one-way"
              headline="Now get the live fares for this exact route"
              body="The same query as a FlightPowers API request — live fares with Google’s price band and the low | typical | high verdict on every row."
            />
          ) : null}
        </>
      ) : null}

      {mode === 'build' && built ? (
        <>
          <div className="rounded-2xl border rule bg-ink-900/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[16px] font-semibold text-ink-100">{built.query}</h3>
              <span className="font-mono text-[11px] text-ink-500">search-query link</span>
            </div>
            <p className="mt-3 break-all rounded-xl border rule bg-ink-950 px-3.5 py-3 font-mono text-[12.5px] text-ink-200">
              {built.url}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={copyBuiltLink} className="btn btn-ghost !py-2 text-sm">
                {copiedLink ? 'Copied ✓' : 'Copy link'}
              </button>
              <a href={built.url} target="_blank" rel="noopener nofollow" className="text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
                Open in Google Flights →
              </a>
            </div>
            <p className="mt-3 font-mono text-[11px] text-ink-500">
              Google parses the phrase “{built.phrase}” like a search-box entry and opens the matching results page.
            </p>
          </div>

          <ApiUpsellCard
            tool="url-parser"
            snippets={built.snippets}
            pricingHref={rapidApiPricingUrl('flights', 'tool')}
            docsHref="/flights-api/one-way"
            headline="Skip the browser — get these fares as JSON"
            body="The matching API request for the link you just built, with Google’s price band and verdict attached to every result."
          />
        </>
      ) : null}
    </div>
  );
}
