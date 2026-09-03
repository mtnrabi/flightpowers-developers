/**
 * Spend controls for every route that calls the upstream API with the
 * server-held demo key. Nothing may import upstream.ts without going
 * through this module first.
 *
 * Controls, in order:
 *   1. same-origin check — the demo endpoints serve this site's pages only
 *   2. response cache  — repeats and scripted re-runs are free
 *   3. per-IP daily cap — one visitor cannot drain the budget
 *   4. global daily budget — the hard ceiling on what a day can cost
 *
 * State is in-memory per serverless instance. That is a real limitation
 * (multiple warm instances each carry their own counters), which is why the
 * numbers are conservative and why the global budget is a ceiling per
 * instance, not an exact account. The upstream key's own plan quota is the
 * final backstop. See README "Demo budget" for the full reasoning.
 */

type Counter = { day: string; n: number };

const PER_IP_DAILY = Number(process.env.DEMO_PER_IP_DAILY ?? 12);
const GLOBAL_DAILY = Number(process.env.DAILY_BACKEND_CALL_BUDGET ?? 400);
const CACHE_MAX_ENTRIES = 500;

const ipCounters = new Map<string, Counter>();
let globalCounter: Counter = { day: '', n: 0 };

const cache = new Map<string, { expires: number; value: unknown }>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Reject requests that plainly did not come from this site's own pages. */
export function sameOrigin(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  // Older clients: fall back to a permissive pass — the caps still hold.
  return true;
}

/**
 * The strict version, for routes that WRITE.
 *
 * `sameOrigin` above passes anything that omits `Sec-Fetch-Site`, on the
 * reasoning that an older browser should still get the demo. For a write that
 * is the wrong trade: curl, a scanner and a spam bot all omit that header too,
 * so the permissive fallback is an open door. Verified against production on
 * 2026-09-03 — `curl -X POST -d '{"email":"a@b.com"}' /api/subscribe` with no
 * headers at all answered `{"ok":true,"created":true}` and inserted a row.
 *
 * Two signals, either of which is enough:
 *  - `Sec-Fetch-Site: same-origin` (Chrome 76+, Firefox 90+, Safari 16.4+)
 *  - an `Origin` whose host matches the host the request arrived on. Per the
 *    Fetch spec a browser sends `Origin` on every POST, same-origin included,
 *    so this covers the browsers that predate Sec-Fetch-Site.
 *
 * A real visitor sends both. A bare POST sends neither.
 */
export function fromOwnPages(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';

  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    const host = req.headers.get('host') ?? new URL(req.url).host;
    return originHost === host;
  } catch {
    return false;
  }
}

/**
 * Reject an oversized body before it is read. `req.json()` buffers whatever
 * arrives; a junk POST should cost a header check, not a parse.
 */
export function oversized(req: Request, maxBytes: number): boolean {
  const len = Number(req.headers.get('content-length') ?? '0');
  return Number.isFinite(len) && len > maxBytes;
}

export type BudgetDecision =
  | { ok: true; charge: (actualCost?: number) => void }
  | { ok: false; status: 429 | 403; body: { error: string; message: string } };

/**
 * Ask permission to spend `cost` upstream calls on behalf of `ip`.
 * Returns a `charge` callback — call it after the upstream calls actually
 * happen (with the true cost if it differs), so failed validations are free.
 */
export function requestBudget(req: Request, cost: number): BudgetDecision {
  if (!sameOrigin(req)) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'cross_origin',
        message:
          'The live demo only serves flightpowers.com pages. For your own integration, get a key on RapidAPI. The free tier takes about a minute.',
      },
    };
  }

  const day = today();
  if (globalCounter.day !== day) globalCounter = { day, n: 0 };
  if (globalCounter.n + cost > GLOBAL_DAILY) {
    return {
      ok: false,
      status: 429,
      body: {
        error: 'daily_budget_spent',
        message:
          "The live demo hit today's backend budget. Every run here is a real request against live Google Flights and Booking.com data, and we cap what a day can cost. Captured example runs are shown instead. With your own free RapidAPI key, your requests are your own.",
      },
    };
  }

  const ip = clientIp(req);
  let c = ipCounters.get(ip);
  if (!c || c.day !== day) {
    c = { day, n: 0 };
    ipCounters.set(ip, c);
  }
  if (c.n + cost > PER_IP_DAILY) {
    return {
      ok: false,
      status: 429,
      body: {
        error: 'per_ip_cap',
        message: `That's the live-demo limit for today (${PER_IP_DAILY} backend calls per visitor per day; each run is a real search against live data). It resets at midnight UTC. If you're evaluating seriously, a free RapidAPI key takes about a minute and the Pro tier is $10/month.`,
      },
    };
  }

  // Opportunistic cleanup so the map cannot grow without bound.
  if (ipCounters.size > 5000) {
    for (const [k, v] of ipCounters) if (v.day !== day) ipCounters.delete(k);
  }

  const counter = c;
  return {
    ok: true,
    charge: (actualCost: number = cost) => {
      counter.n += actualCost;
      globalCounter.n += actualCost;
    },
  };
}

export function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Drop the oldest entries (Map preserves insertion order).
    let dropped = 0;
    for (const k of cache.keys()) {
      cache.delete(k);
      if (++dropped >= 50) break;
    }
  }
  cache.set(key, { expires: Date.now() + ttlMs, value });
}
