import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { declaredDates } from './page-source';

/**
 * Route discovery for sitemap.ts.
 *
 * The old flightpowers.com sitemap was a hand-maintained static file whose every
 * `lastmod` was frozen at 2025-08-02, so pages added after that date were never
 * announced. This walks the App Router tree instead: any `page.tsx` / `page.mdx`
 * that exists is in the sitemap, automatically, with no list to remember to edit.
 *
 * `lastModified` is the date the page declares about itself (moved forward only
 * when the file was edited on a later day), else the last git commit that really
 * edited the file (see gitHistory below for the shallow-clone and sweep commits
 * it skips), else nothing. Never the filesystem mtime: on Vercel
 * that is the checkout time, i.e. every build would claim every page changed.
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
export const NOINDEX_ROUTES = new Set(['/unsubscribe', '/admin']);

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

/**
 * How many PAGE files one commit may touch and still count as an edit to each
 * of them. A commit past this is a sweep (a refactor, a copy change across a
 * family, a generated set shipped in one push) and says nothing about when any
 * single page's content last changed. Components and lib files do not count
 * toward it: a nav change touching 3 pages is still a 3-page edit.
 */
const SWEEP_PAGE_FILES = 20;

let history: Map<string, string> | null = null;

function isPageFile(rel: string): boolean {
  return rel.startsWith('src/app/') && PAGE_FILES.has(path.basename(rel));
}

/**
 * File -> date of its last real edit, from one `git log` over the whole
 * visible history, kept for the build.
 *
 * Vercel builds from a SHALLOW clone. The live sitemap read on 2026-10-06
 * shows it: 162 of its 388 lastmods carried 2026-09-17, the date of the 10th
 * commit back from main, because the oldest commit a shallow clone can see is
 * a graft that appears to add every file in the repo. Those boundary commits are
 * listed in the repository's `shallow` file and are skipped here, together
 * with every sweep. A file whose last real edit is older than the clone
 * reaches gets NO git date, and the sitemap then omits its <lastmod>: Google
 * ignores lastmod on a site where it proves wrong, and an absent value is
 * not wrong.
 */
function gitHistory(): Map<string, string> {
  if (history) return history;
  const byFile = new Map<string, string>();
  try {
    const cwd = process.cwd();
    const run = (args: string[]) =>
      execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
    const shallowFile = run(['rev-parse', '--git-path', 'shallow']).trim();
    let boundary = new Set<string>();
    try {
      boundary = new Set(
        fs
          .readFileSync(path.isAbsolute(shallowFile) ? shallowFile : path.join(cwd, shallowFile), 'utf8')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      );
    } catch {
      // Not a shallow clone: no boundary commits.
    }
    const log = run(['log', '--no-renames', '--format=%x1e%H %cI', '--name-only']);
    for (const chunk of log.split('\x1e')) {
      const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      const [hash, iso] = lines[0]!.split(' ');
      if (!hash || !iso || boundary.has(hash)) continue;
      const files = lines.slice(1);
      if (files.filter(isPageFile).length > SWEEP_PAGE_FILES) continue;
      // `git log` is newest first, so the first sighting of a file is its last edit.
      for (const file of files) if (!byFile.has(file)) byFile.set(file, iso);
    }
  } catch {
    // No git (a tarball build): every page falls back to its declared date or none.
  }
  history = byFile;
  return history;
}

function toDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** The date of the last commit that edited `file` and was not a sweep or a shallow-clone boundary. */
export function gitEditDate(file: string): Date | undefined {
  const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
  return toDate(gitHistory().get(rel));
}

/**
 * The date the sitemap prints for a page.
 *
 * A page that declares its own date (JSON-LD `dateModified`, or the visible
 * <GuideDates> line on a guide) gets that date, so <lastmod> says what the
 * page says about itself. The one exception is a file edited on a LATER day
 * than the date it declares (the edit forgot to move the date): <lastmod>
 * then takes the edit, because understating a change throws away the recrawl
 * it should trigger. The fix for that case is in the page, moving its date
 * with its edit, after which the two agree again. A page that declares no
 * date gets its last real edit; with neither, it gets no <lastmod>.
 */
export function lastModified(file: string): Date | undefined {
  let declared: Date | undefined;
  try {
    declared = toDate(declaredDates(fs.readFileSync(file, 'utf8')).modified);
  } catch {
    declared = undefined;
  }
  const edited = gitEditDate(file);
  if (declared && edited) {
    const day = (d: Date) => d.toISOString().slice(0, 10);
    return day(edited) > day(declared) ? edited : declared;
  }
  return declared ?? edited;
}

/** The newest of several files' git edit dates: for a generated page, its dataset and its template. */
export function newestEdit(files: string[]): Date | undefined {
  const dates = files.map(gitEditDate).filter((d): d is Date => d !== undefined);
  return dates.length === 0 ? undefined : new Date(Math.max(...dates.map((d) => d.getTime())));
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
