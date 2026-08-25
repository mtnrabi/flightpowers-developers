import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { discoverRoutes, lastModified, priorityFor } from '@/lib/routes';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return discoverRoutes()
    .map(({ pathname, file }) => ({
      url: new URL(pathname, SITE.url).toString(),
      lastModified: lastModified(file),
      changeFrequency: (pathname === '/' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: priorityFor(pathname),
    }))
    .sort((a, b) => b.priority - a.priority || a.url.localeCompare(b.url));
}
