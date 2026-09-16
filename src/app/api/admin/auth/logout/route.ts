/**
 * Sign out. POST, not GET, because a GET would let any image tag on any page
 * log the admin out; and with a CSRF token, because a cross-site POST would do
 * the same thing. The token is derived from the session (see csrfTokenFor), so
 * there is no second cookie to keep in sync.
 *
 * A bad or missing token is not an error page: the session is left alone and
 * the browser goes back to /admin, which is what a confused form submission
 * should do.
 */
import { NextResponse } from 'next/server';
import { clearSessionCookie, csrfTokenMatches, getAdminEmail, readConfig } from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const home = new URL('/admin', req.url);

  const config = readConfig();
  const email = await getAdminEmail();
  // Nobody is signed in, or the deployment is unconfigured: nothing to clear.
  if (typeof config === 'string' || !email) {
    return NextResponse.redirect(home, { status: 303 });
  }

  let supplied = '';
  try {
    supplied = String((await req.formData()).get('csrf') ?? '');
  } catch {
    supplied = '';
  }

  if (!csrfTokenMatches(email, config.sessionSecret, supplied)) {
    home.searchParams.set('error', 'bad_csrf');
    return NextResponse.redirect(home, { status: 303 });
  }

  await clearSessionCookie();
  return NextResponse.redirect(home, { status: 303 });
}
