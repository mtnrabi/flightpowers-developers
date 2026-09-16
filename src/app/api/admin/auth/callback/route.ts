/**
 * Step 2 of the sign-in: Google comes back with a code.
 *
 * Order matters here and it is deliberate:
 *   1. the CSRF state has to match a cookie this browser was given
 *   2. the code is exchanged server-to-server, with the client secret
 *   3. the email has to be verified by Google AND on ADMIN_EMAILS
 * Only then is a session cookie set. Every failure lands back on /admin with a
 * short reason in the query string and no session -- the page renders the
 * sign-in card again rather than a stack trace.
 */
import { NextResponse } from 'next/server';
import {
  GOOGLE_TOKEN_ENDPOINT,
  consumeState,
  consumeVerifier,
  isAllowed,
  readConfig,
  readIdTokenClaims,
  redirectUriFor,
  setSessionCookie,
  stateMatches,
  verifyIdTokenClaims,
} from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function back(req: Request, reason: string) {
  const url = new URL('/admin', req.url);
  url.searchParams.set('error', reason);
  return NextResponse.redirect(url, { status: 302 });
}

export async function GET(req: Request) {
  const config = readConfig();
  if (typeof config === 'string') return back(req, 'not_configured');

  const incoming = new URL(req.url);
  if (incoming.searchParams.get('error')) {
    // The person pressed Cancel on Google's consent screen.
    return back(req, 'cancelled');
  }

  // Both one-shot cookies are consumed before anything can return early, so a
  // failed attempt cannot leave a reusable state or verifier behind.
  const cookieState = await consumeState();
  const verifier = await consumeVerifier();
  if (!stateMatches(incoming.searchParams.get('state'), cookieState)) {
    return back(req, 'bad_state');
  }
  if (!verifier) return back(req, 'bad_state');

  const code = incoming.searchParams.get('code');
  if (!code) return back(req, 'no_code');

  const redirectUri = redirectUriFor(req.url, req.headers.get('x-forwarded-host'));
  if (!redirectUri) return back(req, 'unexpected_host');

  let idToken = '';
  try {
    const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return back(req, 'token_exchange_failed');
    const body = (await res.json()) as { id_token?: string };
    idToken = body.id_token ?? '';
  } catch {
    return back(req, 'token_exchange_failed');
  }

  // aud / iss / exp / email_verified, in that order. Skipping the signature is
  // defensible because the token came straight from Google over TLS; skipping
  // these would additionally accept a genuine Google token minted for somebody
  // else's project entirely.
  const email = verifyIdTokenClaims(
    idToken ? readIdTokenClaims(idToken) : null,
    config.clientId
  );
  if (!email) return back(req, 'no_verified_email');

  // The allowlist is the whole access-control model. One address.
  if (!isAllowed(email, config.allowedEmails)) return back(req, 'not_allowed');

  await setSessionCookie(email, config.sessionSecret);
  return NextResponse.redirect(new URL('/admin', req.url), { status: 302 });
}
