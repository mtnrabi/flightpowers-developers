import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui';
import { UnsubscribeBox } from '@/components/UnsubscribeBox';

/**
 * The exit. It exists before the first email does, on purpose: we do not
 * collect an address for a list with no way off it.
 *
 * noindex, and excluded from the sitemap in src/lib/routes.ts. It is a
 * utility page for people who already have the link, not a search result.
 */

export const metadata: Metadata = {
  title: 'Unsubscribe',
  description: 'Take an address off the FlightPowers API changelog list.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/unsubscribe' },
};

export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.t;
  const token = typeof raw === 'string' && raw.length > 0 && raw.length <= 128 ? raw : undefined;

  return (
    <Container className="py-14 sm:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Email</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink-100">Unsubscribe</h1>
        <p className="mt-5 text-[15px] text-ink-300 leading-relaxed">
          One list exists on this site: an email when something ships that changes what you can build. This page takes an
          address off it, immediately and for good.
        </p>
        <div className="mt-7">
          <UnsubscribeBox token={token} />
        </div>
        <p className="mt-6 text-[14px] text-ink-400 leading-relaxed">
          This has nothing to do with a RapidAPI or Apify subscription. Those live in your marketplace account, and this
          site cannot touch them. What we store, and why, is on{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-ink-200">
            the privacy page
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
