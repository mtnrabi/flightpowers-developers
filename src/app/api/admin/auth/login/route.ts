/**
 * Step 1 of the sign-in: bounce to Google.
 *
 * GET only, and nothing here is cacheable -- every visit mints a fresh CSRF
 * state cookie. `prompt=select_account` because the person signing in has more
 * than one Google account on this machine and a silent re-use of the wrong one
 * looks like a permission bug.
 */
import { NextResponse } from 'next/server';
import {
  GOOGLE_AUTH_ENDPOINT,
  issueState,
  readConfig,
  redirectUriFor,
} from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const config = readConfig();
  if (typeof config === 'string') {
    // A configuration problem is the admin's own problem to fix, and this page
    // is not public, so saying which piece is missing is help rather than a leak.
    return NextResponse.json({ error: 'not_configured', detail: config }, { status: 503 });
  }

  const redirectUri = redirectUriFor(req.url, req.headers.get('x-forwarded-host'));
  if (!redirectUri) {
    return NextResponse.json({ error: 'unexpected_host' }, { status: 400 });
  }

  const state = await issueState();
  const auth = new URL(GOOGLE_AUTH_ENDPOINT);
  auth.searchParams.set('client_id', config.clientId);
  auth.searchParams.set('redirect_uri', redirectUri);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid email');
  auth.searchParams.set('state', state);
  auth.searchParams.set('prompt', 'select_account');
  // No refresh token is wanted: nothing here calls a Google API after sign-in.
  auth.searchParams.set('access_type', 'online');

  return NextResponse.redirect(auth.toString(), { status: 302 });
}
