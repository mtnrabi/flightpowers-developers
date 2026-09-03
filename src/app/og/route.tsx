import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_TITLE, OG_CACHE_CONTROL, ogImagePath } from './card';

/**
 * The old share-card URL, `/og?title=…`, kept as a permanent redirect.
 *
 * Every page now emits `/og/<base64url(title)>.png` instead (see card.tsx for
 * why), but this URL is in the OpenGraph tags of every page a crawler has ever
 * fetched, and in whatever Slack, X and Discord have cached. It stays.
 *
 * A query string cannot be rewritten into a base64 path segment by a
 * next.config redirect rule, so this has to be a handler. It is a cheap one:
 * no ImageResponse, no WASM, no font work — a header and a 308. The redirect
 * itself is cacheable for a year, so even the redirect stops being invoked.
 */

export function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title') ?? DEFAULT_TITLE;
  return NextResponse.redirect(new URL(ogImagePath(title), req.nextUrl.origin), {
    status: 308,
    headers: { 'cache-control': OG_CACHE_CONTROL },
  });
}
