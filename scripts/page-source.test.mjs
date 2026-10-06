#!/usr/bin/env node
/**
 * The page-file reader behind the sitemap's <lastmod> and /feed.xml.
 *
 * Both are built from what each page file says about itself, read as text. A
 * guide whose metadata the reader cannot parse would silently drop out of the
 * feed, and a date it misreads would put a wrong <lastmod> on the page. This
 * runs the reader over every real guide and post. Run with `npm test`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { declaredDates, declaredMeta } from '../src/lib/page-source.ts';
import { renderRss } from '../src/lib/feed.ts';

const APP = path.join(process.cwd(), 'src', 'app');

function pages(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pages(full));
    else if (/^page\.(tsx|mdx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const feedPages = [
  ...pages(path.join(APP, 'guides', '(article)')),
  ...pages(path.join(APP, 'blog')).filter((f) => path.dirname(f) !== path.join(APP, 'blog')),
];

test('every guide and blog post yields a title, a description and its dates', () => {
  assert.ok(feedPages.length >= 40, `found only ${feedPages.length} pages`);
  for (const file of feedPages) {
    const source = fs.readFileSync(file, 'utf8');
    const meta = declaredMeta(source);
    const dates = declaredDates(source);
    const rel = path.relative(APP, file);
    assert.ok(meta.title && meta.title.length > 5, `${rel}: no title`);
    assert.ok(!meta.title.includes('\\'), `${rel}: escape left in title`);
    assert.ok(meta.description && meta.description.length > 40, `${rel}: no description`);
    assert.match(dates.published ?? '', /^\d{4}-\d{2}-\d{2}$/, `${rel}: no datePublished`);
    assert.match(dates.modified ?? '', /^\d{4}-\d{2}-\d{2}$/, `${rel}: no dateModified`);
    assert.ok(dates.modified >= dates.published, `${rel}: modified before published`);
  }
});

test('the absolute title wins over the withOg title', () => {
  const src = `export const metadata = {
  ...withOg({
    title: 'Short',
    description: 'The description of the page, long enough to count.',
  }),
  title: { absolute: 'The absolute title, as shipped' },
};`;
  assert.equal(declaredMeta(src).title, 'The absolute title, as shipped');
});

test('escapes in a JS string come out as the characters the page renders', () => {
  const src = `export const metadata = withOg({
  title: 'Booking.com\\'s Partner API',
  description:
    "Google\\u2019s own band, \\"quoted\\".",
});`;
  assert.deepEqual(declaredMeta(src), { title: "Booking.com's Partner API", description: 'Google’s own band, "quoted".' });
});

test('a date held in a constant resolves (the compare-page shape)', () => {
  const src = `const RETRIEVED = '2026-09-07';\n<JsonLd data={{ datePublished: '2026-08-24', dateModified: RETRIEVED }} />`;
  assert.deepEqual(declaredDates(src), { published: '2026-08-24', modified: '2026-09-07' });
});

test('a page with no dates declares none', () => {
  assert.deepEqual(declaredDates('export default function Page() { return null; }'), {
    published: undefined,
    modified: undefined,
  });
});

test('the feed escapes text, sorts newest first and dates the channel by content, not the clock', () => {
  const xml = renderRss({
    title: 'T',
    description: 'D',
    link: 'https://flightpowers.com/guides',
    self: 'https://flightpowers.com/feed.xml',
    items: [
      { url: 'https://flightpowers.com/guides/a', title: 'A & <b>', published: '2026-09-01', modified: '2026-09-29' },
      { url: 'https://flightpowers.com/guides/b', title: 'B', description: 'x', published: '2026-09-05' },
    ],
  });
  assert.ok(xml.includes('<title>A &amp; &lt;b&gt;</title>'));
  assert.ok(xml.indexOf('/guides/b') < xml.indexOf('/guides/a'));
  assert.ok(xml.includes('<lastBuildDate>Tue, 29 Sep 2026 00:00:00 GMT</lastBuildDate>'));
  assert.ok(xml.includes('<pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>'));
});
