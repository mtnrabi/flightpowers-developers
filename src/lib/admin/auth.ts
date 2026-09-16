import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Google sign-in for /admin, and nothing else on this site.
 *
 * WHY THIS IS HAND-ROLLED AND NOT NextAuth
 * NextAuth's App Router support lives in 5.x, which is still a beta, and 4.x
 * is a Pages Router library with React 19 peer conflicts. This site has no
 * auth today, no user table, no second protected route on the roadmap, and
 * exactly ONE person is ever allowed in. What that actually needs is the
 * standard authorization-code flow and a signed cookie -- about a hundred
 * lines -- against a dependency that would carry adapters, providers, JWT
 * encryption and a database session store none of which is wanted here. If a
 * second protected surface ever appears, swapping this for NextAuth is a
 * contained change: everything auth touches is this file plus the three
 * handlers under /api/admin/auth.
 *
 * WHY NO JWKS VERIFICATION, AND WHAT IS CHECKED INSTEAD
 * This is the authorization-code flow, not the implicit one. The `id_token` is
 * not read out of a redirect URL where an attacker could have put it; it comes
 * back in the body of a direct server-to-server POST to
 * https://oauth2.googleapis.com/token, over TLS, authenticated with our client
 * secret. A token delivered that way is already known to be from Google, and
 * Google's own documentation says a server may skip signature validation for
 * exactly this case.
 *
 * What that argument does NOT cover is whether the token was minted for US.
 * Skipping the signature and then also skipping the claims would accept a
 * perfectly genuine Google token issued to a completely different application
 * -- anybody who can get a token out of their own Google project could sign in
 * here. So `verifyIdTokenClaims` below checks `aud` against our own client id,
 * `iss` against Google's two issuer strings, and `exp` against the clock,
 * before `email_verified` and the allowlist are looked at. Those three are the
 * claims that make the token ours; the signature only makes it Google's.
 *
 * PKCE (S256) is sent alongside `state`. `state` proves the callback belongs to
 * this browser; PKCE proves the code is being redeemed by whoever started the
 * flow, so an authorization code intercepted in a log, a referrer or a shared
 * machine is not by itself enough to complete a sign-in.
 *
 * WHAT THE SESSION COOKIE IS
 * `<base64url(payload)>.<base64url(hmac-sha256)>`, signed with
 * ADMIN_SESSION_SECRET. HttpOnly, Secure, SameSite=Lax, path /. The payload is
 * the email and an expiry, nothing else -- no Google tokens are ever stored,
 * because nothing here calls a Google API after sign-in. Lax rather than
 * Strict because the OAuth callback is a cross-site top-level GET and a Strict
 * cookie set on it would not be sent on the redirect that follows.
 *
 * FAIL CLOSED
 * Every missing piece of configuration -- no client id, no secret, no session
 * secret, an empty ADMIN_EMAILS -- denies access. There is deliberately no
 * "development mode" bypass: the one that gets left switched on is how these
 * pages end up public.
 */

const SESSION_COOKIE = 'fp_admin_session';
const STATE_COOKIE = 'fp_admin_oauth_state';
const VERIFIER_COOKIE = 'fp_admin_oauth_verifier';

/** Eight hours. Short enough that a forgotten laptop is not an open door. */
const SESSION_TTL_SECONDS = 8 * 60 * 60;

/** The state cookie only has to survive one trip to Google and back. */
const STATE_TTL_SECONDS = 10 * 60;

export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export type AdminConfig = {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  allowedEmails: string[];
};

/** A reason sign-in cannot work, phrased for whoever has to fix it. */
export type ConfigProblem = string;

export function readConfig(): AdminConfig | ConfigProblem {
  const clientId = (process.env.GOOGLE_OAUTH_CLIENT_ID ?? '').trim();
  const clientSecret = (process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '').trim();
  const sessionSecret = (process.env.ADMIN_SESSION_SECRET ?? '').trim();
  const allowedEmails = parseAllowedEmails(process.env.ADMIN_EMAILS);

  if (!clientId || !clientSecret) {
    return 'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are not set on this deployment.';
  }
  if (sessionSecret.length < 32) {
    return 'ADMIN_SESSION_SECRET is missing or shorter than 32 characters.';
  }
  if (allowedEmails.length === 0) {
    return 'ADMIN_EMAILS is empty, so nobody is allowed in.';
  }
  return { clientId, clientSecret, sessionSecret, allowedEmails };
}

/** Comma- or whitespace-separated, lowercased, deduplicated. */
export function parseAllowedEmails(raw: string | undefined): string[] {
  return Array.from(
    new Set(
      (raw ?? '')
        .split(/[,\s]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.includes('@'))
    )
  );
}

export function isAllowed(email: string, allowedEmails: string[]): boolean {
  return allowedEmails.includes(email.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Cookie signing
// ---------------------------------------------------------------------------

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * Constant-time comparison. `timingSafeEqual` throws on a length mismatch, so
 * the lengths are checked first and a mismatch is simply "not valid" -- the
 * length of an HMAC is not a secret.
 */
function signatureMatches(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type SessionPayload = { email: string; exp: number };

export function encodeSession(email: string, secret: string, now = Date.now()): string {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = b64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, secret)}`;
}

/**
 * Returns the payload, or null. Null covers every failure the same way on
 * purpose: a tampered cookie, an expired one and a malformed one are all
 * "sign in again", and telling them apart tells an attacker which of the three
 * they achieved.
 */
export function decodeSession(
  token: string | undefined,
  secret: string,
  now = Date.now()
): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!signatureMatches(sign(encoded, secret), signature)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload?.email !== 'string' || typeof payload?.exp !== 'number') return null;
  if (payload.exp * 1000 <= now) return null;
  return payload;
}

// ---------------------------------------------------------------------------
// The session, as the app sees it
// ---------------------------------------------------------------------------

/**
 * The signed-in admin's email, or null.
 *
 * The allowlist is re-checked here, not only at sign-in. Removing an address
 * from ADMIN_EMAILS has to lock that person out of a session they already
 * hold, not just stop them signing in again.
 */
export async function getAdminEmail(): Promise<string | null> {
  const config = readConfig();
  if (typeof config === 'string') return null;

  const jar = await cookies();
  const session = decodeSession(jar.get(SESSION_COOKIE)?.value, config.sessionSecret);
  if (!session) return null;
  if (!isAllowed(session.email, config.allowedEmails)) return null;
  return session.email;
}

// ---------------------------------------------------------------------------
// Cookie plumbing for the three route handlers
// ---------------------------------------------------------------------------

const BASE_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * A CSRF token for the sign-out form, derived from the session itself.
 *
 * Sign-out is not a dangerous action, but a cross-site POST that logs the
 * admin out mid-read is a confusing one, and the token costs a hidden input.
 * Derived rather than stored so there is no extra cookie to keep in sync.
 */
export function csrfTokenFor(email: string, secret: string): string {
  return createHmac('sha256', secret).update(`logout:${email}`).digest('base64url');
}

export function csrfTokenMatches(email: string, secret: string, supplied: string): boolean {
  return signatureMatches(csrfTokenFor(email, secret), supplied);
}

/** The signed-in email plus its sign-out token, for the page to render. */
export async function getAdminSession(): Promise<{ email: string; csrf: string } | null> {
  const config = readConfig();
  if (typeof config === 'string') return null;
  const email = await getAdminEmail();
  if (!email) return null;
  return { email, csrf: csrfTokenFor(email, config.sessionSecret) };
}

export async function setSessionCookie(email: string, secret: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSession(email, secret), {
    ...BASE_COOKIE,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', { ...BASE_COOKIE, maxAge: 0 });
}

/**
 * The CSRF guard on the callback. A random value goes to Google in `state` and
 * into a short-lived cookie; the callback only proceeds when the two match, so
 * a callback URL replayed by somebody else lands on a request that has no
 * matching cookie.
 */
export async function issueState(): Promise<string> {
  const state = randomBytes(24).toString('base64url');
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, { ...BASE_COOKIE, maxAge: STATE_TTL_SECONDS });
  return state;
}

export async function consumeState(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(STATE_COOKIE)?.value ?? null;
  // One use only, whether or not it matched.
  jar.set(STATE_COOKIE, '', { ...BASE_COOKIE, maxAge: 0 });
  return value;
}

export function stateMatches(fromGoogle: string | null, fromCookie: string | null): boolean {
  if (!fromGoogle || !fromCookie) return false;
  return signatureMatches(fromGoogle, fromCookie);
}

/**
 * The redirect URI, derived from the host the request actually arrived on.
 *
 * This page is reachable on two hostnames (admin.flightpowers.com and
 * flightpowers.com/admin) and both are registered with the OAuth client, so
 * the URI has to follow the request rather than be pinned to one. Only hosts
 * on the allowlist are honoured -- otherwise a forged Host header would send
 * the OAuth code somewhere else.
 */
// `www.flightpowers.com` is deliberately absent: next.config.mjs 308s it to
// the apex before any route handler runs, so a redirect URI on that host could
// never be reached — and an entry nobody can hit is an entry nobody maintains.
const ALLOWED_HOSTS = new Set([
  'admin.flightpowers.com',
  'flightpowers.com',
  'localhost:3000',
  '127.0.0.1:3000',
]);

export const CALLBACK_PATH = '/api/admin/auth/callback';

export function redirectUriFor(requestUrl: string, forwardedHost?: string | null): string | null {
  const url = new URL(requestUrl);
  const host = (forwardedHost || url.host || '').toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}${CALLBACK_PATH}`;
}

/** The `iss` values Google actually mints. Both are current; accept both. */
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

export type IdTokenClaims = {
  email?: string;
  email_verified?: boolean;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  sub?: string;
};

/** Decode the payload. Decoding is not verifying — see verifyIdTokenClaims. */
export function readIdTokenClaims(idToken: string): IdTokenClaims | null {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * The claims that make a Google token OUR token.
 *
 * Without the `aud` check, any valid Google id_token would be accepted —
 * including one minted for somebody else's Google project entirely. `iss` and
 * `exp` are the other two the OpenID spec requires of a relying party.
 *
 * Returns the verified email, or null. Null for every failure, because a
 * caller that is told which check failed learns which one they beat.
 */
export function verifyIdTokenClaims(
  claims: IdTokenClaims | null,
  clientId: string,
  now = Date.now()
): string | null {
  if (!claims) return null;

  // `aud` is a string for a normal web client, but the spec allows an array.
  const audiences = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (!audiences.includes(clientId)) return null;

  if (typeof claims.iss !== 'string' || !GOOGLE_ISSUERS.has(claims.iss)) return null;

  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= now) return null;

  if (claims.email_verified !== true) return null;

  const email = (claims.email ?? '').trim().toLowerCase();
  return email.includes('@') ? email : null;
}

// ---------------------------------------------------------------------------
// PKCE
// ---------------------------------------------------------------------------

/**
 * Proof Key for Code Exchange, S256.
 *
 * `state` answers "did this callback come back to the browser that started the
 * flow". PKCE answers a different question: "is the party redeeming this code
 * the party that asked for it". An authorization code that leaks — into a
 * proxy log, a Referer header, a shared machine's history — is useless without
 * the verifier, which never leaves this server's cookie jar.
 */
export function challengeFor(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export async function issueVerifier(): Promise<string> {
  // 43-128 chars of base64url per RFC 7636; 32 random bytes gives 43.
  const verifier = randomBytes(32).toString('base64url');
  const jar = await cookies();
  jar.set(VERIFIER_COOKIE, verifier, { ...BASE_COOKIE, maxAge: STATE_TTL_SECONDS });
  return verifier;
}

export async function consumeVerifier(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(VERIFIER_COOKIE)?.value ?? null;
  // One use only, whether or not the exchange succeeds.
  jar.set(VERIFIER_COOKIE, '', { ...BASE_COOKIE, maxAge: 0 });
  return value;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
