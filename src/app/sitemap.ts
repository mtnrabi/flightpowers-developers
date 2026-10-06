import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import path from 'node:path';
import { NOINDEX_ROUTES, discoverRoutes, lastModified, newestEdit, priorityFor } from '@/lib/routes';
import { matrixPairs } from '@/lib/matrix';
import { indexedGridPaths } from '@/lib/grid';

export const dynamic = 'force-static';

const src = (...parts: string[]) => path.join(process.cwd(), 'src', ...parts);

/**
 * Every <lastmod> here is the date the page itself carries (its JSON-LD
 * dateModified) or the last commit that really edited it, whichever is the
 * later day; a page with neither gets no <lastmod> at all rather than a
 * guessed one. See lastModified() in src/lib/routes.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = discoverRoutes()
    .filter(({ pathname }) => !NOINDEX_ROUTES.has(pathname))
    .map(({ pathname, file }) => ({
      url: new URL(pathname, SITE.url).toString(),
      lastModified: lastModified(file),
      changeFrequency: (pathname === '/' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: priorityFor(pathname),
    }));

  // Dynamic segments are enumerated explicitly from their datasets. A matrix
  // page is its dataset rendered through its template, so its lastmod is the
  // newer of the two files' last real edits.
  const matrixLastModified = newestEdit([
    src('lib', 'matrix.ts'),
    src('app', 'integrations', '[agent]', '[task]', 'page.tsx'),
  ]);
  const matrixRoutes = matrixPairs().map(({ agent, task }) => ({
    url: new URL(`/integrations/${agent.slug}/${task.slug}`, SITE.url).toString(),
    lastModified: matrixLastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // The {tool} x {route|city} grid, minus the route pages Google declined
  // (GRID_NOINDEX in src/lib/grid.ts: they carry noindex and are not
  // announced). Same date rule as the matrix: the dataset and the family's
  // template, never the hard-coded launch date this used to print on all 180.
  const gridDataset = src('lib', 'grid.ts');
  const familyTemplate: Record<string, string> = {
    'cheapest-time-to-fly': src('app', 'tools', 'cheapest-time-to-fly', '[route]', 'page.tsx'),
    'flight-price-checker': src('app', 'tools', 'flight-price-checker', '[route]', 'page.tsx'),
    'round-trip-planner': src('app', 'tools', 'round-trip-planner', '[route]', 'page.tsx'),
    'hotel-price-check': src('app', 'tools', 'hotel-price-check', '[city]', 'page.tsx'),
  };
  const familyLastModified = Object.fromEntries(
    Object.entries(familyTemplate).map(([family, template]) => [family, newestEdit([gridDataset, template])])
  );
  const gridRoutes = indexedGridPaths().map((pathname) => ({
    url: new URL(pathname, SITE.url).toString(),
    lastModified: familyLastModified[pathname.split('/')[2]!],
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // /pricing.md and /pricing.txt are NOT listed: they are text copies of
  // /pricing and answer with `Link: <…/pricing>; rel="canonical"`
  // (next.config.mjs), and a sitemap lists canonical URLs only. Agents find
  // them through /llms.txt, which is where they look.

  return [...staticRoutes, ...matrixRoutes, ...gridRoutes].sort(
    (a, b) => b.priority - a.priority || a.url.localeCompare(b.url)
  );
}
