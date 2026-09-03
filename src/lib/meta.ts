import type { Metadata } from 'next';
import { ogImagePath } from '@/app/og/card';

/**
 * Per-route share cards. Every page wraps its metadata in withOg() so the
 * OpenGraph/Twitter card carries THAT page's title, description, url, and a
 * generated image. Before this, all 100 routes shipped the homepage card,
 * which is the worst possible first impression for a shared link.
 *
 * The og:title deliberately omits the " · FlightPowers" suffix: og:site_name
 * already carries it and platforms render both.
 */
export function withOg<T extends Metadata>(meta: T): T {
  const title = typeof meta.title === 'string' ? meta.title : null;
  if (!title) return meta;
  const description = typeof meta.description === 'string' ? meta.description : undefined;
  const canonical =
    typeof meta.alternates?.canonical === 'string' ? meta.alternates.canonical : undefined;
  const image = ogImagePath(title);
  return {
    ...meta,
    openGraph: {
      type: 'website',
      siteName: 'FlightPowers',
      title,
      description,
      ...(canonical ? { url: canonical } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...meta.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      ...meta.twitter,
    },
  };
}
