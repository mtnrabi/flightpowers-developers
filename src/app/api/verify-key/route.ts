/**
 * "Did my key work?" — forwards a visitor's own pasted key to
 * GET api.flightpowers.com/v1/verify and relays the answer.
 *
 * Security contract:
 *  - the pasted key is used for exactly one upstream request and is NEVER
 *    logged, stored, or echoed back
 *  - our own demo key is not involved in any way
 *  - lightly rate-limited so this can't be used as a key-testing oracle
 *
 * Honesty note (measured 2026-08-26): /v1/verify performs a real check that
 * counts as one request against the key's hotels plan. The page says so.
 */

import { NextResponse } from 'next/server';
import { clientIp, sameOrigin } from '@/lib/demo/budget';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const attempts = new Map<string, { day: string; n: number }>();
const PER_IP_DAILY = 10;

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'cross_origin' }, { status: 403 });
  }
  const day = new Date().toISOString().slice(0, 10);
  const ip = clientIp(req);
  let c = attempts.get(ip);
  if (!c || c.day !== day) {
    c = { day, n: 0 };
    attempts.set(ip, c);
  }
  if (c.n >= PER_IP_DAILY) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Key-check limit reached for today. You can call GET /v1/verify directly with your key.' },
      { status: 429 }
    );
  }
  c.n += 1;

  let key = '';
  try {
    const body = await req.json();
    key = String(body.key ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!key || key.length > 128) {
    return NextResponse.json({ error: 'bad_request', message: 'Paste the key exactly as RapidAPI shows it.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.flightpowers.com/v1/verify', {
      headers: { 'x-api-key': key },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json()) as Record<string, unknown>;
    // Relay only the fields the page needs; never echo the key.
    return NextResponse.json({ status: res.status, valid: data.valid === true, detail: data.error ?? null, usage: data.api_usage ?? null });
  } catch {
    return NextResponse.json({ error: 'upstream_unreachable', message: 'Could not reach api.flightpowers.com. Try again.' }, { status: 502 });
  }
}
