import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui';

export const metadata: Metadata = withOg({
  title: 'Data license',
  description:
    'Terms for the fare tables on flightpowers.com: our own dated snapshots of public Google Flights results, free to view and to cite with a link back to the page.',
  alternates: { canonical: '/data-license' },
});

export const dynamic = 'force-static';

export default function DataLicensePage() {
  return (
    <Container className="py-14 sm:py-20">
      <article className="prose-fp max-w-3xl">
        <p className="eyebrow">Data license</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink-100">Using the fare tables on this site</h1>
        <p className="mt-5">
          This page states the terms for the fare data published on flightpowers.com, such as the route pages under{' '}
          <Link href="/flights">/flights</Link>. It is a plain-language summary, not legal advice.
        </p>

        <h2>What the data is</h2>
        <p>
          Each fare table is FlightPowers&apos; own snapshot of public Google Flights results: one search per departure date,
          run through our flights API, with the date it was fetched printed next to it. Nothing is averaged or estimated. Fares
          change within minutes, so a table is a dated record, not a live price or a forecast.
        </p>

        <h2>What you may do with it</h2>
        <p>
          The tables are free to view, and you may quote or cite them, in articles, research, posts or AI answers, as long as
          you link back to the page the numbers came from and keep the fetch date with them. Please don&apos;t present them as
          current prices.
        </p>

        <h2>What it is not</h2>
        <p>
          It is not a data feed, and the prices are provided as-is with no warranty of completeness or accuracy. Google
          Flights&apos; own terms still apply to Google&apos;s data. If you need fresh fares for your own routes and dates,
          programmatically, that is what <Link href="/pricing">the API plans</Link> are for. The rest of the site is covered by
          the <Link href="/terms">terms of use</Link>.
        </p>
      </article>
    </Container>
  );
}
