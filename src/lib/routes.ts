import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Route discovery for sitemap.ts.
 *
 * The old flightpowers.com sitemap was a hand-maintained static file whose every
 * `lastmod` was frozen at 2025-08-02, so pages added after that date were never
 * announced. This walks the App Router tree instead: any `page.tsx` / `page.mdx`
 * that exists is in the sitemap, automatically, with no list to remember to edit.
 *
 * `lastModified` comes from the file's last git commit date where git is available
 * (it is, during a Vercel build — the deployment is a clone), falling back to the
 * filesystem mtime. Both are real dates; neither is a made-up one.
 */

const APP_DIR = path.join(process.cwd(), 'src', 'app');

const PAGE_FILES = new Set(['page.tsx', 'page.ts', 'page.mdx', 'page.md', 'page.jsx', 'page.js']);

/** Segments App Router treats specially and that must not become URL segments. */
function isSkippedSegment(name: string, prefix: string): boolean {
  return (
    name.startsWith('_') || // private folder
    name.startsWith('.') ||
    name.startsWith('@') || // parallel route
    // Route handlers live at the ROOT /api only. A nested segment named "api"
    // (e.g. /integrations/api) is a real page and belongs in the sitemap.
    (name === 'api' && prefix === '') ||
    name.includes('[') // dynamic segment: enumerate these explicitly when they exist
  );
}

/** Route groups `(marketing)` contribute no URL segment. */
function isRouteGroup(name: string): boolean {
  return name.startsWith('(') && name.endsWith(')');
}

/**
 * Pages that exist but must never be announced. `/unsubscribe` is a utility
 * page reached from an email link; indexing it would put an opt-out form in
 * search results for the brand name.
 */
export const NOINDEX_ROUTES = new Set(['/unsubscribe']);

export type DiscoveredRoute = { pathname: string; file: string };

export function discoverRoutes(dir: string = APP_DIR, prefix = ''): DiscoveredRoute[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: DiscoveredRoute[] = [];

  for (const entry of entries) {
    if (entry.isFile() && PAGE_FILES.has(entry.name)) {
      out.push({ pathname: prefix === '' ? '/' : prefix, file: path.join(dir, entry.name) });
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (isSkippedSegment(entry.name, prefix)) continue;
    const nextPrefix = isRouteGroup(entry.name) ? prefix : `${prefix}/${entry.name}`;
    out.push(...discoverRoutes(path.join(dir, entry.name), nextPrefix));
  }

  return out;
}

const gitDateCache = new Map<string, string | null>();

export function lastModified(file: string): Date {
  if (!gitDateCache.has(file)) {
    let iso: string | null = null;
    try {
      const stdout = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      iso = stdout.length > 0 ? stdout : null;
    } catch {
      iso = null;
    }
    gitDateCache.set(file, iso);
  }

  const iso = gitDateCache.get(file);
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }

  try {
    return fs.statSync(file).mtime;
  } catch {
    return new Date();
  }
}

/**
 * Pages that exist because they have to, not because we want them ranked.
 * Depth alone put these at 0.8 while /compare/serpapi and
 * /tools/cheapest-month-to-fly sat at 0.6, i.e. the legal boilerplate
 * outranked the money pages. This is the inversion.
 */
const OBLIGATION_PAGES = new Set(['/terms', '/privacy', '/contact', '/changelog']);

/**
 * Families whose CHILDREN are the pages a buyer lands on. A child of one of
 * these is worth more than a generic depth-2 page, and more than a legal page
 * at any depth.
 */
const BUYER_FAMILIES = ['/compare', '/tools', '/flights-api', '/hotels-api', '/use-cases', '/guides'];

/**
 * Crawl priority, derived from what the page is for rather than from depth
 * alone: the home page 1.0, a top-level hub 0.8, a child of a buyer-facing
 * family 0.7, any other child 0.6, and the obligation pages 0.3.
 */
export function priorityFor(pathname: string): number {
  if (pathname === '/') return 1;
  if (OBLIGATION_PAGES.has(pathname)) return 0.3;
  const depth = pathname.split('/').filter(Boolean).length;
  if (depth <= 1) return 0.8;
  if (BUYER_FAMILIES.some((family) => pathname.startsWith(`${family}/`))) return 0.7;
  return 0.6;
}
