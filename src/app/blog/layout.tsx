import { RelatedLinks } from '@/components/RelatedLinks';

/** Blog posts render themselves; this only adds the "Read next" list from src/lib/related.ts. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RelatedLinks contained />
    </>
  );
}
