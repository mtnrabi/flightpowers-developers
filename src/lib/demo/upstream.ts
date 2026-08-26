/**
 * The ONLY module that reads the demo key. Server-side only.
 *
 * Rules enforced here:
 *  - the key comes from process.env.FP_DEMO_KEY and never leaves this module
 *  - the key never appears in a log line, an error message, or a response
 *  - callers get either parsed data + the X-Search-* headers, or a typed error
 */

import 'server-only';

const API = 'https://api.flightpowers.com';

export type UpstreamResult<T> =
  | { ok: true; data: T; searchHeaders: Record<string, string>; ms: number }
  | { ok: false; error: 'not_configured' | 'timeout' | 'upstream_error'; status?: number; ms: number };

export async function callUpstream<T>(
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<UpstreamResult<T>> {
  const key = process.env.FP_DEMO_KEY;
  const started = Date.now();
  if (!key) {
    return { ok: false, error: 'not_configured', ms: 0 };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    const searchHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      if (k.toLowerCase().startsWith('x-search-')) searchHeaders[k.toLowerCase()] = v;
    });
    if (!res.ok) {
      // Never forward the upstream body: it could describe our key/plan.
      return { ok: false, error: 'upstream_error', status: res.status, ms: Date.now() - started };
    }
    const data = (await res.json()) as T;
    return { ok: true, data, searchHeaders, ms: Date.now() - started };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : 'upstream_error', ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}
