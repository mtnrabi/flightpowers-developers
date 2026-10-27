import { RelatedLinks } from '@/components/RelatedLinks';

/** Use-case pages render themselves; this only adds the "Read next" list from src/lib/related.ts. */
export default function UseCasesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RelatedLinks contained />
    </>
  );
}
