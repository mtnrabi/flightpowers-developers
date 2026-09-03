/**
 * The email capture endpoint — one address, one opt-in, one row.
 *
 * What it will NOT do:
 *  - return ok when nothing was saved. If storage is unavailable the caller
 *    gets a 503 and the form says so. We never claim a capture we did not make.
 *  - accept anything but an address, a source label and a path. No name, no
 *    company, no cookies, no identifiers. There is exactly one hidden field,
 *    the `company` honeypot, and it is never stored: a non-empty value is a
 *    400 and the request ends there.
 *
 * The address is stored so we can send the API changelog described on the
 * form. Every row gets its unsubscribe token at insert, so the opt-out path
 * exists before anything can ever be sent.
 */

import { NextResponse } from 'next/server';
import { clientIp, fromOwnPages, oversized } from '@/lib/demo/budget';
import { isConfigured, normalizeEmail, saveSubscriber } from '@/lib/subscribers';

export const runtime = 'nodejs';
export const maxDuration = 15;
export const dynamic = 'force-dynamic';

const attempts = new Map<string, { day: string; n: number }>();
const PER_IP_DAILY = 8;

/** An address, a source label, a path and four campaign tokens. Nothing here
 *  is long, so anything bigger than this is not a sign-up. */
const MAX_BODY_BYTES = 4096;

export async function POST(req: Request) {
  // Cheapest checks first, in order of cost: two header reads, then the
  // in-memory counter, then a parse, and only then the database. A junk POST
  // should never reach Postgres.
  if (!fromOwnPages(req)) {
    return NextResponse.json({ error: 'cross_origin' }, { status: 403 });
  }
  if (oversized(req, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
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
      { error: 'rate_limited', message: 'That is the sign-up limit for today from this address.' },
      { status: 429 }
    );
  }
  c.n += 1;
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.day !== day) attempts.delete(k);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // Honeypot. `company` is a hidden, off-screen, tab-skipped field that the
  // real form always submits empty (see EmailCapture.tsx). A form-filling bot
  // fills every input it finds; a person cannot reach this one.
  if (String(body.company ?? '').length > 0) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json(
      { error: 'bad_email', message: 'That does not look like an email address. Check it and try again.' },
      { status: 400 }
    );
  }

  if (!isConfigured()) {
    // Loud on purpose: an unconfigured deployment must not look like it worked.
    console.error('[fp-subscribe] DATABASE_URL is not set; refusing to report a save that did not happen');
    return NextResponse.json(
      {
        error: 'storage_unavailable',
        message: 'We could not save that right now. Nothing was recorded. Try again later, or email app@flightpowers.com.',
      },
      { status: 503 }
    );
  }

  try {
    const { created } = await saveSubscriber({
      email,
      source: String(body.source ?? 'unknown'),
      path: String(body.path ?? ''),
      utmSource: String(body.us ?? ''),
      utmMedium: String(body.um ?? ''),
      utmCampaign: String(body.uc ?? ''),
    });
    console.log(
      `[fp-event] ${JSON.stringify({
        t: new Date().toISOString(),
        e: 'email_saved',
        created,
        source: String(body.source ?? '').slice(0, 60),
        us: String(body.us ?? '').slice(0, 60),
        um: String(body.um ?? '').slice(0, 60),
        uc: String(body.uc ?? '').slice(0, 60),
      })}`
    );
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error('[fp-subscribe] write failed', err);
    return NextResponse.json(
      {
        error: 'storage_unavailable',
        message: 'We could not save that right now. Nothing was recorded. Try again later, or email app@flightpowers.com.',
      },
      { status: 503 }
    );
  }
}
