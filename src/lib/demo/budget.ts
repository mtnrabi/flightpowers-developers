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
