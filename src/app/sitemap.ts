import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { discoverRoutes, lastModified, priorityFor } from '@/lib/routes';
import { matrixPairs } from '@/lib/matrix';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = discoverRoutes().map(({ pathname, file }) => ({
    url: new URL(pathname, SITE.url).toString(),
    lastModified: lastModified(file),
    changeFrequency: (pathname === '/' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: priorityFor(pathname),
  }));

  // Dynamic segments are enumerated explicitly from their datasets.
  const matrixRoutes = matrixPairs().map(({ agent, task }) => ({
    url: new URL(`/integrations/${agent.slug}/${task.slug}`, SITE.url).toString(),
    lastModified: new Date('2026-08-26'),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...matrixRoutes].sort(
    (a, b) => b.priority - a.priority || a.url.localeCompare(b.url)
  );
}
