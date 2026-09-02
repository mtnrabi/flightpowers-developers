/**
 * Unsubscribe. This route exists BEFORE any email is ever sent, which is the
 * point: we do not collect an address for a list that has no exit.
 *
 * POST { token } — the token is the per-row secret minted at sign-up. No
 * same-origin check, because a mail client's one-click unsubscribe
 * (RFC 8058) posts here directly. Idempotent: unsubscribing twice is fine,
 * and an unknown token answers calmly instead of leaking whether it exists.
 */

import { NextResponse } from 'next/server';
import { isConfigured, normalizeEmail, unsubscribeByEmail, unsubscribeByToken } from '@/lib/subscribers';

export const runtime = 'nodejs';
export const maxDuration = 15;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let token = '';
  let email: string | null = null;
  try {
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const body = (await req.json()) as Record<string, unknown>;
      token = String(body.token ?? '').trim();
      email = normalizeEmail(body.email);
    } else {
      // RFC 8058 one-click posts `List-Unsubscribe=One-Click` as a form body;
      // the token then rides in the query string of the link we sent.
      token = new URL(req.url).searchParams.get('t')?.trim() ?? '';
    }
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  if (!token && !email) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Use the link from any email, or type the address you signed up with.' },
      { status: 400 }
    );
  }
  if (token.length > 128) {
    return NextResponse.json({ error: 'bad_request', message: 'That unsubscribe link is not valid.' }, { status: 400 });
  }

  if (!isConfigured()) {
    console.error('[fp-unsubscribe] DATABASE_URL is not set; cannot honour an opt-out');
    return NextResponse.json(
      { error: 'storage_unavailable', message: 'We could not process that right now. Email app@flightpowers.com and it will be done by hand.' },
      { status: 503 }
    );
  }

  try {
    if (!token && email) {
      await unsubscribeByEmail(email);
      // Deliberately the same answer whether or not the address was on the
      // list: this endpoint must not confirm membership to a stranger.
      return NextResponse.json({ ok: true, result: 'done' });
    }
    const result = await unsubscribeByToken(token);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('[fp-unsubscribe] write failed', err);
    return NextResponse.json(
      { error: 'storage_unavailable', message: 'We could not process that right now. Email app@flightpowers.com and it will be done by hand.' },
      { status: 503 }
    );
  }
}
