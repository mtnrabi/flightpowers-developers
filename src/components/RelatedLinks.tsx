'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui';
import { relatedFor } from '@/lib/related';

/**
 * A quiet "Read next" list under guides, use cases and blog posts, fed by the
 * one map in src/lib/related.ts. Renders nothing on pages the map does not
 * name (the index pages, and every page not in the map). The links are in the
 * prerendered HTML, so crawlers see them without running JavaScript.
 *
 * `contained` wraps the list in the site Container, for layouts whose pages
 * close their own containers (blog posts, use cases); the guide layout places
 * it inside its existing Container under the article.
 */
export function RelatedLinks({ contained = false }: { contained?: boolean }) {
  const links = relatedFor(usePathname());
  if (links.length === 0) return null;

  const list = (
    <nav aria-label="Read next" className="mt-14 max-w-3xl border-t rule pt-8">
      <p className="eyebrow">Read next</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-[15px] text-ink-300 underline-offset-4 transition-colors hover:text-signal-400 hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return contained ? <Container className="pb-16">{list}</Container> : list;
}
