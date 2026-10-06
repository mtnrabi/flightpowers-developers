/**
 * /feed.xml: every guide and blog post, newest first, as RSS 2.0.
 *
 * Built from the page files themselves (title and description from each
 * page's metadata export, dates from its JSON-LD), so a new guide is in the
 * feed the moment its page exists, with the same date the page shows.
 */

import fs from 'node:fs';
import { SITE } from '@/lib/site';
import { discoverRoutes } from '@/lib/routes';
import { declaredDates, declaredMeta } from '@/lib/page-source';
import { renderRss, type FeedItem } from '@/lib/feed';

export const dynamic = 'force-static';

/** The families the feed carries: written pieces, not product or tool pages. */
const FEED_FAMILIES = ['/guides/', '/blog/'];

function feedItems(): FeedItem[] {
  const items: FeedItem[] = [];
  for (const { pathname, file } of discoverRoutes()) {
    if (!FEED_FAMILIES.some((family) => pathname.startsWith(family))) continue;
    const source = fs.readFileSync(file, 'utf8');
    const { title, description } = declaredMeta(source);
    const { published, modified } = declaredDates(source);
    // A page with no title or no publish date in its own file is left out
    // rather than given an invented one; scripts/page-source.test.mjs fails
    // `npm test` if any guide or post ever lands here.
    if (!title || !published) continue;
    items.push({ url: new URL(pathname, SITE.url).toString(), title, description, published, modified });
  }
  return items;
}

export function GET(): Response {
  const body = renderRss({
    title: 'FlightPowers guides and blog',
    description:
      'Working code and sourced comparisons for live flight and hotel price data: Google Flights fares with the price band, Booking.com rates, MCP servers.',
    link: new URL('/guides', SITE.url).toString(),
    self: new URL('/feed.xml', SITE.url).toString(),
    items: feedItems(),
  });
  return new Response(body, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });
}
