/**
 * Reads what a page file says about itself: the dates in its JSON-LD and the
 * title and description in its metadata export.
 *
 * WHY THIS READS SOURCE TEXT. The sitemap and /feed.xml are built from the
 * file tree (src/lib/routes.ts), not by rendering pages, and the dates a page
 * shows Google live as literals inside that page's own file:
 * `dateModified: '2026-09-29'` in the JSON-LD (or `dateModified: RETRIEVED`
 * with `const RETRIEVED = '2026-09-07'` above it, the compare-page shape) and
 * `<GuideDates published="…" updated="…" />` on the guides. Reading them here
 * makes the page the one place its date is written: the feed prints it, and
 * the sitemap's <lastmod> prints it too unless the file was edited on a later
 * day without moving it (lastModified in src/lib/routes.ts).
 *
 * No imports and no `@/` aliases, so `npm test` can load it under plain node
 * (--experimental-strip-types), the same reason src/lib/admin/histogram.ts
 * has none.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export type DeclaredDates = { published?: string; modified?: string };

/** `const NAME = '2026-09-07'` anywhere in the file, for the identifier form of a date field. */
function constantDate(source: string, name: string): string | undefined {
  const m = source.match(new RegExp(`const\\s+${name}\\s*(?::\\s*string\\s*)?=\\s*['"](\\d{4}-\\d{2}-\\d{2})['"]`));
  return m?.[1];
}

/** Every value a JSON-LD date field takes in the file, literal or resolved from a constant. */
function fieldDates(source: string, field: 'datePublished' | 'dateModified'): string[] {
  const out: string[] = [];
  const re = new RegExp(`${field}\\s*:\\s*(?:['"](\\d{4}-\\d{2}-\\d{2})['"]|([A-Za-z_$][\\w$]*))`, 'g');
  for (const m of source.matchAll(re)) {
    const value = m[1] ?? (m[2] ? constantDate(source, m[2]) : undefined);
    if (value && ISO_DAY.test(value)) out.push(value);
  }
  return out;
}

function latest(dates: string[]): string | undefined {
  return dates.length === 0 ? undefined : [...dates].sort().at(-1);
}

function earliest(dates: string[]): string | undefined {
  return dates.length === 0 ? undefined : [...dates].sort()[0];
}

/**
 * The dates a page declares. JSON-LD wins; the visible <GuideDates> line is
 * read as well, so a guide whose two dates were ever edited apart still gets
 * the later "updated" and the earlier "published".
 */
export function declaredDates(source: string): DeclaredDates {
  const modified = fieldDates(source, 'dateModified');
  const published = fieldDates(source, 'datePublished');
  const visible = source.match(/<GuideDates\s+published="(\d{4}-\d{2}-\d{2})"\s+updated="(\d{4}-\d{2}-\d{2})"/);
  if (visible) {
    published.push(visible[1]!);
    modified.push(visible[2]!);
  }
  return { published: earliest(published), modified: latest(modified) ?? latest(published) };
}

/** Undo the escapes a JS string literal can carry, so the feed prints what the page renders. */
function unescapeJs(raw: string): string {
  return raw.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|n|t|r|.)/g, (_, esc: string) => {
    if (esc.startsWith('u{')) return String.fromCodePoint(parseInt(esc.slice(2, -1), 16));
    if (esc.startsWith('u') && esc.length === 5) return String.fromCharCode(parseInt(esc.slice(1), 16));
    if (esc.startsWith('x') && esc.length === 3) return String.fromCharCode(parseInt(esc.slice(1), 16));
    if (esc === 'n') return '\n';
    if (esc === 't') return '\t';
    if (esc === 'r') return '\r';
    return esc;
  });
}

/** One string literal right after `key:` (single, double or a backtick string with no `${}`). */
function stringAfter(text: string, key: RegExp): string | undefined {
  const m = text.match(
    new RegExp(`${key.source}\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"|\`((?:[^\`\\\\$]|\\\\.)*)\`)`)
  );
  if (!m) return undefined;
  const raw = m[1] ?? m[2] ?? m[3];
  return raw === undefined ? undefined : unescapeJs(raw).replace(/\s+/g, ' ').trim();
}

export type DeclaredMeta = { title?: string; description?: string };

/**
 * The title and description of a page's `export const metadata`. A
 * `title: { absolute: '…' }` override wins over the title handed to withOg(),
 * because that is the <title> the page ships.
 */
export function declaredMeta(source: string): DeclaredMeta {
  const start = source.indexOf('export const metadata');
  if (start === -1) return {};
  // The metadata object ends at the first line that closes it at column 0.
  const end = source.indexOf('\n}', start);
  const block = source.slice(start, end === -1 ? undefined : end + 2);
  const title = stringAfter(block, /title:\s*\{\s*absolute:/) ?? stringAfter(block, /\btitle:/);
  const description = stringAfter(block, /\bdescription:/);
  return { title, description };
}
