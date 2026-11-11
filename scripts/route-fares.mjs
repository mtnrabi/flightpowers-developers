#!/usr/bin/env node
// route-fares.mjs: the data pipeline behind /flights/<from>-to-<to> (2026-11-11).
//
// Every number on a route page comes from this script's output, which comes from real
// searches against our own flights API. Nothing is estimated, interpolated or filled in:
// a date whose search failed is stored as `failed` and drawn as a gap.
//
//   node scripts/route-fares.mjs plan    [--step 7] [--horizon 168] [--lead 14]
//        prints the departure dates and the search budget (routes x dates). Spends nothing.
//   node scripts/route-fares.mjs fetch   --source rest|claude-mcp --out <rawdir> [--max-searches N] [--only JFK,LHR]
//        rest       : one POST per route and date to google-flights-live-api on RapidAPI.
//                     Needs RAPIDAPI_KEY in the environment (never printed, never written).
//        claude-mcp : drives the claude.ai "FlightPowers Flights" connector (which runs on the
//                     connected RapidAPI key) through `claude -p`, one search per origin and
//                     date that prices every destination of that origin, and reads the tool
//                     results straight from the stream-json output (the model never retypes
//                     a number). For a VM that has the connector but no key in its env.
//        Raw answers land in <rawdir>/<ORIGIN>-<date>.json, one file per origin and date.
//        --max-searches refuses to start when the plan would spend more.
//   node scripts/route-fares.mjs build   --raw <rawdir>
//        merges the raw answers into src/data/routes/fares/<slug>.json. A date that a run
//        re-searched is replaced; a still-future date from an older run keeps its own
//        fetched_at; dates already in the past are dropped.
//
// Weekly refresh (proposal): plan with --step 14 --horizon 168 (12 dates x 100 routes = 1,200
// searches), fetch, build, commit the fares files, push: the git-linked Vercel project deploys.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROUTES_FILE = path.join(ROOT, 'src/data/routes/routes.json');
export const FARES_DIR = path.join(ROOT, 'src/data/routes/fares');
const HOST = 'google-flights-live-api.p.rapidapi.com';
const ENDPOINT = '/api/google_flights/oneway/v1';
const TOOL = 'mcp__claude_ai_FlightPowers_Flights__search_oneway_flights';

export const slugOf = (from, to) => `${from.toLowerCase()}-to-${to.toLowerCase()}`;

export function loadRoutes(file = ROUTES_FILE) {
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  const list = [];
  for (const [from, dests] of Object.entries(r.origins)) for (const to of dests) list.push({ from, to, slug: slugOf(from, to) });
  return { airports: r.airports, origins: r.origins, list };
}

const iso = (d) => d.toISOString().slice(0, 10);

/** Departure dates: the first Wednesday at least `lead` days out, then every `step` days up to `horizon` days out. */
export function planDates({ today = new Date(), step = 7, horizon = 168, lead = 14 } = {}) {
  const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const first = new Date(t.getTime() + lead * 864e5);
  while (first.getUTCDay() !== 3) first.setUTCDate(first.getUTCDate() + 1);
  const out = [];
  for (let d = new Date(first); (d - t) / 864e5 <= horizon; d = new Date(d.getTime() + step * 864e5)) out.push(iso(d));
  return out;
}

/** One API row -> the fields a page shows. Only fields the API sent; nothing derived but the number parse. */
export function pickRow(row) {
  if (!row || typeof row !== 'object') return null;
  const price = typeof row.price_as_number === 'number' ? row.price_as_number : null;
  if (price == null) return null;
  const v = row.price_range_in_relation_to_other_periods;
  return {
    price,
    price_text: typeof row.price === 'string' ? row.price : null,
    airline: typeof row.airline === 'string' ? row.airline : null,
    stops: Number.isInteger(row.stops) ? row.stops : null,
    duration: typeof row.duration === 'string' ? row.duration : null,
    departure_description: typeof row.departure_description === 'string' ? row.departure_description : null,
    verdict: v === 'low' || v === 'typical' || v === 'high' ? v : null,
    band_low: typeof row.price_insights_low === 'number' ? row.price_insights_low : null,
    band_high: typeof row.price_insights_high === 'number' ? row.price_insights_high : null,
    buy_link: typeof row.buy_link === 'string' && row.buy_link.startsWith('https://www.google.com/travel/flights') ? row.buy_link : null,
  };
}

/** The connector's answer for one origin and date -> { DEST: {status, fare} }. */
export function fromMcpResult(result, dests) {
  const out = {};
  const by = result?.by_destination || {};
  for (const d of dests) {
    const e = by[d];
    if (!e) { out[d] = { status: 'failed', reason: 'missing from answer' }; continue; }
    const fare = pickRow(e.cheapest);
    if (fare) out[d] = { status: 'ok', fare };
    else if (e.searched === false) out[d] = { status: 'failed', reason: String(e.reason || 'not searched') };
    else if (/fail|error|degraded/i.test(String(e.reason || ''))) out[d] = { status: 'failed', reason: String(e.reason) };
    else out[d] = { status: 'empty', reason: String(e.reason || 'no flights') };
  }
  return out;
}

/** The REST answer for one route and date -> {status, fare}. Array body (or {data}) sorted by us, cheapest kept. */
export function fromRestBody(status, searchStatus, body) {
  const rows = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : null;
  if (status !== 200 || !rows) return { status: 'failed', reason: `http ${status}${searchStatus ? ` ${searchStatus}` : ''}` };
  const fares = rows.map(pickRow).filter(Boolean).sort((a, b) => a.price - b.price);
  if (!fares.length) return { status: searchStatus === 'degraded' ? 'failed' : 'empty', reason: searchStatus || 'no flights' };
  return { status: 'ok', fare: fares[0] };
}

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}

async function fetchRest({ origin, dests, date }) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error('RAPIDAPI_KEY is not set');
  const per = {};
  await Promise.all(dests.map(async (to) => {
    try {
      const res = await fetch(`https://${HOST}${ENDPOINT}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-rapidapi-key': key, 'x-rapidapi-host': HOST, 'X-FP-Client': 'route-pages/1' },
        body: JSON.stringify({ from_airport: origin, to_airport: to, departure_date: date, currency: 'usd' }),
        signal: AbortSignal.timeout(90_000),
      });
      const text = await res.text();
      let body = null; try { body = JSON.parse(text); } catch {}
      per[to] = fromRestBody(res.status, res.headers.get('x-search-status'), body);
    } catch (e) { per[to] = { status: 'failed', reason: e.name === 'TimeoutError' ? 'timeout' : 'network error' }; }
  }));
  return per;
}

/** Runs one `claude -p` for an origin and several dates; returns { date: per } read from the tool results. */
export function parseStream(text, origin, dests, dates) {
  const uses = new Map(); const results = new Map();
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let l; try { l = JSON.parse(line); } catch { continue; }
    for (const c of l?.message?.content || []) {
      if (c.type === 'tool_use' && c.name === TOOL) uses.set(c.id, c.input);
      if (c.type === 'tool_result') results.set(c.tool_use_id, Array.isArray(c.content) ? c.content.map((x) => x.text || '').join('') : String(c.content || ''));
    }
  }
  const out = {};
  const want = [...dests].sort().join(',');
  for (const [id, input] of uses) {
    const to = Array.isArray(input?.to_airport) ? input.to_airport : String(input?.to_airport || '').split(',');
    // Only an answer to exactly the call we asked for counts: same origin, one date, same destinations, usd.
    if (input?.from_airport !== origin || !dates.includes(input?.departure_date) || input?.departure_date_from || input?.departure_date_to) continue;
    if ([...to].map((s) => s.trim()).sort().join(',') !== want || (input.currency && input.currency !== 'usd')) continue;
    let r; try { r = JSON.parse(results.get(id) || ''); } catch { continue; }
    if (!r || !r.by_destination) continue;
    out[input.departure_date] = { per: fromMcpResult(r, dests), billed: r?.search_coverage?.hub_requests_billed ?? null };
  }
  return out;
}

function runClaude(prompt, timeoutMs = 20 * 60_000) {
  return new Promise((resolve) => {
    const p = spawn('claude', ['-p', prompt, '--model', 'sonnet', '--allowedTools', TOOL, '--output-format', 'stream-json', '--verbose'],
      { stdio: ['ignore', 'pipe', 'ignore'], cwd: process.env.ROUTE_FARES_CWD || '/tmp' });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    const t = setTimeout(() => p.kill('SIGKILL'), timeoutMs);
    p.on('close', (code) => { clearTimeout(t); resolve({ code, out }); });
  });
}

async function fetchClaude({ origin, dests, dates }) {
  const calls = dates.map((date) => JSON.stringify({ from_airport: origin, to_airport: dests, departure_date: date, limit: 1, currency: 'usd' }));
  const prompt = `Call the tool ${TOOL} once for each of these ${calls.length} argument objects, exactly as written, no other arguments. `
    + `You may make several calls at once. Do not retry a call. When every call has returned, reply with the single word DONE. Do nothing else.\n\n${calls.join('\n')}`;
  const { out } = await runClaude(prompt);
  return parseStream(out, origin, dests, dates);
}

async function main() {
  const cmd = process.argv[2];
  const { origins, list } = loadRoutes();
  const only = arg('only') ? new Set(arg('only').split(',')) : null;
  const dates = planDates({ step: +arg('step', 7), horizon: +arg('horizon', 168), lead: +arg('lead', 14) });
  const work = Object.entries(origins).filter(([o]) => !only || only.has(o));
  const searches = work.reduce((n, [, ds]) => n + ds.length, 0) * dates.length;

  if (cmd === 'plan') {
    console.log(JSON.stringify({ dates, routes: list.length, origins: work.length, searches }, null, 1));
    return;
  }
  if (cmd === 'fetch') {
    const source = arg('source'); const outDir = arg('out');
    if (!['rest', 'claude-mcp'].includes(source) || !outDir) throw new Error('fetch needs --source rest|claude-mcp and --out <dir>');
    const cap = +arg('max-searches', 1500);
    if (searches > cap) throw new Error(`plan is ${searches} searches, over --max-searches ${cap}`);
    fs.mkdirSync(outDir, { recursive: true });
    const chunk = +arg('chunk', 8); const par = +arg('parallel', 3);
    const jobs = [];
    for (const [origin, dests] of work) for (let i = 0; i < dates.length; i += chunk) jobs.push({ origin, dests, dates: dates.slice(i, i + chunk) });
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const job = jobs[next++];
        const todo = job.dates.filter((d) => !fs.existsSync(path.join(outDir, `${job.origin}-${d}.json`)));
        if (!todo.length) continue;
        const started = new Date().toISOString();
        let got = {};
        if (source === 'claude-mcp') got = await fetchClaude({ ...job, dates: todo });
        else for (const date of todo) got[date] = { per: await fetchRest({ ...job, date }), billed: job.dests.length };
        const ended = new Date().toISOString();
        for (const [date, { per, billed }] of Object.entries(got)) {
          fs.writeFileSync(path.join(outDir, `${job.origin}-${date}.json`), JSON.stringify({ origin: job.origin, date, source, started, fetched_at: ended, billed, per }, null, 1));
        }
        console.log(`${job.origin} ${todo.length} dates -> ${Object.keys(got).length} answered (${ended})`);
      }
    };
    await Promise.all(Array.from({ length: par }, worker));
    return;
  }
  if (cmd === 'build') {
    const rawDir = arg('raw'); if (!rawDir) throw new Error('build needs --raw <dir>');
    const today = iso(new Date());
    const raw = fs.readdirSync(rawDir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(rawDir, f), 'utf8')));
    let wrote = 0;
    for (const r of list) {
      const file = path.join(FARES_DIR, `${r.slug}.json`);
      const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
      const points = new Map((old?.points || []).filter((p) => p.date > today).map((p) => [p.date, p]));
      for (const x of raw) {
        if (x.origin !== r.from || !x.per?.[r.to]) continue;
        const e = x.per[r.to];
        points.set(x.date, { date: x.date, status: e.status, ...(e.fare ? { fare: e.fare } : { reason: e.reason }), fetched_at: x.fetched_at, source: x.source });
      }
      const pts = [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
      if (!pts.length) continue;
      fs.writeFileSync(file, JSON.stringify({ slug: r.slug, from: r.from, to: r.to, currency: 'usd', trip: 'one-way, 1 adult, economy', points: pts }, null, 1) + '\n');
      wrote++;
    }
    console.log(`wrote ${wrote} route files`);
    return;
  }
  console.log('usage: route-fares.mjs plan|fetch|build (see the header)');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
}
