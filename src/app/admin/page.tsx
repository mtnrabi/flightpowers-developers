import type { Metadata } from 'next';
import { Container } from '@/components/ui';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getAdminEmail, readConfig } from '@/lib/admin/auth';

/**
 * The internal metrics dashboard: two tabs, Flights and Booking.
 *
 * Not linked from anywhere on the site, noindex + nofollow, excluded from the
 * sitemap, and `Disallow: /admin` in robots.txt. None of those is the access
 * control -- the Google sign-in is. They exist so the page does not turn up in
 * a search result for the brand, which is its own kind of invitation.
 *
 * Reachable on two hostnames: admin.flightpowers.com and
 * flightpowers.com/admin. Both are the same deployment and the same sign-in;
 * both have to be registered as redirect URIs on the OAuth client.
 */

export const metadata: Metadata = {
  title: 'Metrics',
  description: 'Internal.',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

const SIGN_IN_ERRORS: Record<string, string> = {
  not_allowed: 'That Google account is not on the allowlist.',
  cancelled: 'Sign-in was cancelled.',
  bad_state: 'The sign-in link expired or was opened in a different browser. Try again.',
  no_code: 'Google did not return an authorization code. Try again.',
  no_verified_email: 'That Google account has no verified email address.',
  token_exchange_failed: 'Google rejected the sign-in. Check the client id, secret and redirect URI.',
  not_configured: 'Sign-in is not configured on this deployment.',
  unexpected_host: 'This hostname is not one the sign-in accepts.',
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const email = await getAdminEmail();
  const params = await searchParams;
  const rawError = params.error;
  const error = typeof rawError === 'string' ? SIGN_IN_ERRORS[rawError] ?? 'Sign-in failed.' : null;

  if (!email) {
    const config = readConfig();
    const problem = typeof config === 'string' ? config : null;

    return (
      <Container className="py-20 sm:py-28">
        <div className="max-w-md">
          <p className="eyebrow">Internal</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink-100">Metrics</h1>
          <p className="mt-4 text-[15px] text-ink-300 leading-relaxed">
            Sign in with the Google account on the allowlist.
          </p>

          {error ? (
            <p className="mt-5 rounded-md border border-verdict-high/40 bg-verdict-high/10 px-4 py-3 text-[14px] text-ink-200">
              {error}
            </p>
          ) : null}

          {problem ? (
            <p className="mt-5 rounded-md border rule bg-ink-900 px-4 py-3 text-[13px] font-mono text-ink-400 leading-relaxed">
              {problem}
            </p>
          ) : (
            <a
              href="/api/admin/auth/login"
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-signal-500 px-5 py-3 text-[15px] font-medium text-ink-950 hover:bg-signal-400"
            >
              Continue with Google
            </a>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">Internal</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-ink-100">Metrics</h1>
        </div>
        <form action="/api/admin/auth/logout" method="post" className="text-[13px] text-ink-400">
          <span className="font-mono">{email}</span>
          <button type="submit" className="ml-3 underline underline-offset-4 hover:text-ink-200">
            Sign out
          </button>
        </form>
      </div>

      <AdminDashboard />
    </Container>
  );
}
