/**
 * RSS 2.0 for the guides and the blog (/feed.xml).
 *
 * Pure string work with no imports, so `npm test` loads it under plain node.
 * The route handler (src/app/feed.xml/route.ts) gathers the items from the
 * page files themselves; this only prints them.
 */

export type FeedItem = {
  url: string;
  title: string;
  description?: string;
  /** YYYY-MM-DD, the page's own datePublished. */
  published: string;
  /** YYYY-MM-DD, the page's own dateModified. */
  modified?: string;
};

export type Feed = {
  title: string;
  description: string;
  /** The HTML page the feed belongs to. */
  link: string;
  /** Where the feed itself lives (atom:link rel="self"). */
  self: string;
  items: FeedItem[];
};

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822 date for a YYYY-MM-DD day, at 00:00 UTC (the pages carry a day, not a time). */
export function rfc822(day: string): string {
  return new Date(`${day}T00:00:00Z`).toUTCString();
}

/** Newest first by publish date, then by title, so the output is stable from build to build. */
export function sortItems(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
}

export function renderRss(feed: Feed): string {
  const items = sortItems(feed.items);
  // lastBuildDate is the newest content date, not the build clock: a rebuild
  // with no new writing must not look like news to a feed reader.
  const newest = items.map((i) => i.modified ?? i.published).sort().at(-1);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeXml(feed.title)}</title>`,
    `<link>${escapeXml(feed.link)}</link>`,
    `<description>${escapeXml(feed.description)}</description>`,
    '<language>en</language>',
    `<atom:link href="${escapeXml(feed.self)}" rel="self" type="application/rss+xml"/>`,
    ...(newest ? [`<lastBuildDate>${rfc822(newest)}</lastBuildDate>`] : []),
    ...items.map((item) =>
      [
        '<item>',
        `<title>${escapeXml(item.title)}</title>`,
        `<link>${escapeXml(item.url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
        ...(item.description ? [`<description>${escapeXml(item.description)}</description>`] : []),
        `<pubDate>${rfc822(item.published)}</pubDate>`,
        '</item>',
      ].join('')
    ),
    '</channel>',
    '</rss>',
  ];
  return `${lines.join('\n')}\n`;
}
