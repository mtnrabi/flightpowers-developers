import { Breadcrumbs, Container, JsonLd } from '@/components/ui';
import { FloatingCta } from '@/components/FloatingCta';
import { SITE } from '@/lib/site';

/**
 * Article chrome for the MDX guides, modeled on the changelog layout.
 * The `(article)` route group keeps this wrapper off /guides itself (the
 * index is a normal card page); every guide below gets the prose shell and
 * the floating CTA the spec reserves for guides/blog.
 */
export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The visible trail below, machine-readable. The guide's own TechArticle
          node (in its page.mdx) carries the title and the url. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE.url}/guides` },
          ],
        }}
      />
      <Container className="py-14 sm:py-20">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/guides', label: 'guides' }]} />
        <p className="eyebrow mt-8">Guide</p>
        <article className="prose-fp mt-4 max-w-3xl">{children}</article>
      </Container>
      <FloatingCta />
    </>
  );
}
