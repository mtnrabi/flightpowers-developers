import fs from 'node:fs';
import path from 'node:path';
import { discoverRoutes } from '@/lib/routes';
import { gridTitles } from '@/lib/grid';
import { matrixTitles } from '@/lib/matrix';
import { COUNTS } from '@/lib/site';
import { DEFAULT_TITLE } from './card-url';

/**
 * Every share-card title the site links, collected at BUILD time.
 *
 * This is what turns `/og/[card]` from `○ (Static)` — a route that renders a
 * card the first time somebody asks for it — into `● (SSG)`, where all of them
 * are rendered during the build and served as static objects afterwards.
 *
 * WHY IT MATTERS THAT THE BUILD DOES IT. The full route cache is emptied by
 * every production deploy, so "renders once, ever" was never true: it was
 * "renders once per deployment", and at this site's traffic (about ten
 * function invocations an hour) every one of those renders is a cold start —
 * ~1.5 s of Active CPU against ~0.3 s warm. Measured on 2026-09-04 that was
 * ~4.5 s/h, roughly 62% of the whole project's burn. A build render is billed
 * to build execution, not to Fluid Active CPU.
 *
 * HOW THE SET IS BUILT, and why it is exact rather than a guess:
 *
 *  - The five dynamic families (the {tool}x{route|city} grid and the
 *    {agent}x{task} matrix) export their own title builders next to their
 *    datasets, and the pages' `generateMetadata` calls the same functions.
 *    There is one author per title, so the set cannot drift from the pages.
 *  - The ~95 hand-written pages carry their title as a literal inside
 *    `withOg({ title: … })`. There is no way to ask Next for another route's
 *    metadata from here, and importing 95 page modules to read it would pull
 *    the entire component tree into this route's graph, so the literal is read
 *    out of the source file instead. That is a build-time file read of our own
 *    repository, the same thing `src/lib/routes.ts` already does for the
 *    sitemap.
 *  - Three blog posts also name a card directly, `ogImagePath('…')` inside a
 *    JSON-LD block, with a SHORTER string than their own page title. Those are
 *    real linked cards and are collected too — missing them is how a card that
 *    every crawler fetches ends up being the one card that is not prerendered.
 *
 * Anything this misses is not broken, only slower: `dynamicParams` stays true,
 * so an unlisted title still renders on first request and joins the cache. The
 * set is a cost optimisation, never a correctness boundary.
 */

const APP_DIR = path.join(process.cwd(), 'src', 'app');

/**
 * `${…}` substitutions allowed inside a title. One page interpolates a count
 * from src/lib/site.ts; a title referencing anything else is skipped rather
 * than guessed at.
 */
const SCOPE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTS).map(([key, value]) => [`COUNTS.${key}`, String(value)])
);

/** JS string-literal escapes that can appear in a title. */
function unescape(raw: string): string {
  return raw.replace(/\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|n|t|.)/g, (_m, all, brace, four, hex) => {
    if (brace ?? four ?? hex) return String.fromCodePoint(parseInt(brace ?? four ?? hex, 16));
    if (all === 'n') return '\n';
    if (all === 't') return '\t';
    return all;
  });
}

/** Resolve `${…}` against SCOPE. Returns null if any of them is unknown. */
function interpolate(raw: string): string | null {
  let unknown = false;
  const out = raw.replace(/\$\{([^}]*)\}/g, (_m, expr) => {
    const value = SCOPE[String(expr).trim()];
    if (value === undefined) unknown = true;
    return value ?? '';
  });
  return unknown ? null : out;
}

/**
 * The title literal out of the first `withOg({ … })` call in a source file.
 * Handles the three forms the repo uses: single quotes, double quotes, and a
 * template literal with no substitution or a `COUNTS.*` one.
 */
function titleInSource(source: string): string | null {
  const call = source.indexOf('withOg({');
  if (call === -1) return null;
  // The title is the first key in every withOg call; bound the search so a
  // `title:` deeper in the file (an FAQ, a JSON-LD block) can never be read.
  const window = source.slice(call, call + 600);
  const match = /title:\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1/.exec(window);
  if (!match) return null;
  const [, quote, body] = match;
  const literal = unescape(body);
  return quote === '`' ? interpolate(literal) : literal;
}

/** Titles named by a direct `ogImagePath('…')` call, e.g. in a JSON-LD block. */
function directCardTitles(source: string): string[] {
  const out: string[] = [];
  const pattern = /ogImagePath\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1\s*\)/g;
  for (const [, quote, body] of source.matchAll(pattern)) {
    const literal = unescape(body);
    const title = quote === '`' ? interpolate(literal) : literal;
    if (title) out.push(title);
  }
  return out;
}

function read(file: string): string | null {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Every card one route links: the title of the page itself — from its own file
 * or, for an MDX page, from the layout that titles it — plus any card it names
 * outright. A route with no readable title falls through to dynamicParams.
 */
function titlesOfRoute(file: string): string[] {
  const source = read(file) ?? '';
  const layout = read(path.join(path.dirname(file), 'layout.tsx')) ?? '';
  const title = titleInSource(source) ?? titleInSource(layout);
  return [...directCardTitles(source), ...(title ? [title] : [])];
}

/** Every distinct card title on the site, deduplicated, in a stable order. */
export function allCardTitles(): string[] {
  const titles = new Set<string>([DEFAULT_TITLE]);
  for (const { file } of discoverRoutes(APP_DIR)) {
    for (const title of titlesOfRoute(file)) titles.add(title);
  }
  for (const title of gridTitles()) titles.add(title);
  for (const title of matrixTitles()) titles.add(title);
  return [...titles];
}
