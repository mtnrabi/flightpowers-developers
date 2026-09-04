import { DEFAULT_TITLE, OG_CACHE_CONTROL, ogImagePath } from './card-url';

/**
 * The old share-card URL, `/og?title=…`, kept as a permanent redirect.
 *
 * Every page now emits `/og/<base64url(title)>.png` instead (see card.tsx for
 * why), but this URL is in the OpenGraph tags of every page a crawler has ever
 * fetched, and in whatever Slack, X and Discord have cached. It stays.
 *
 * A query string cannot be rewritten into a base64 path segment by a
 * next.config redirect rule, so this has to be a handler. It runs on the EDGE
 * runtime because the handler body was never the cost: measured on 2026-09-04
 * a cold Node invocation of this route spent ~0.79 s on bootstrap alone to
 * answer with a header and a 308, and at ~1 request an hour it is cold every
 * time. A V8 isolate has no such bootstrap. Nothing about the response
 * changes. It imports ./card-url rather than ./card so that `next/og` — WASM,
 * fonts, a base64 robot — stays out of an isolate that only spells a URL.
 *
 * The redirect itself is cacheable for a year, so a repeat of the same legacy
 * URL is served from the edge cache with no invocation at all.
 */

export const runtime = 'edge';

export function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get('title') ?? DEFAULT_TITLE;
  return new Response(null, {
    status: 308,
    headers: {
      location: new URL(ogImagePath(title), url.origin).toString(),
      'cache-control': OG_CACHE_CONTROL,
    },
  });
}
