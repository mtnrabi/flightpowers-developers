import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Plain-language terms for flightpowers.com: this site is informational, API usage is governed by the marketplace you buy through, there is no site account, and the live demos are rate-limited and provided as-is.',
  alternates: { canonical: '/terms' },
};

export const dynamic = 'force-static';

export default function TermsPage() {
  return (
    <Container className="py-14 sm:py-20">
      <article className="prose-fp max-w-3xl">
        <p className="eyebrow">Terms of Use</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink-100">Terms, in plain language</h1>
        <p className="mt-5">
          This is a plain-language summary written by the developer who runs the site, not legal advice. It says what this
          site is and isn&apos;t, and which rules actually apply when you use the APIs.
        </p>

        <h2>This site is informational</h2>
        <p>
          flightpowers.com describes the FlightPowers APIs, documents how they behave, and lets you try them through demos and
          free tools. Nothing on it is a contract, a price guarantee, or a promise of availability. Prices and plan details
          shown here are read from the live marketplace listings on a stated date; the listing itself is always authoritative.
        </p>

        <h2>API usage is governed by the marketplace you buy through</h2>
        <p>
          You don&apos;t buy anything on this site. Subscriptions to the APIs happen on RapidAPI and are governed by
          RapidAPI&apos;s terms; the Apify actors are governed by Apify&apos;s terms. Your agreement about billing, quotas,
          refunds, and acceptable use is with the marketplace you subscribed through, under the plan you chose there.
        </p>

        <h2>There is no site account</h2>
        <p>
          This site has no signup, no login, and no account system. Anything account-shaped (keys, billing, usage metering)
          lives with the marketplace that issued your key.
        </p>

        <h2>Live demos are rate-limited and provided as-is</h2>
        <p>
          The demos and free tools on this site run real searches against the live APIs on our own key. They exist so you can
          evaluate the data honestly, so they are capped: per-visitor limits, a daily overall budget, and short-lived caching
          of repeated queries. When a cap is reached, the site says so and shows a labelled captured run instead. Results are
          live third-party data at request time, provided as-is, with no warranty of completeness or fitness for any purpose.
        </p>

        <h2>Don&apos;t abuse the demo endpoints</h2>
        <p>
          The demos are for humans evaluating the product. Scripting them, rotating IPs around the caps, or using them as a
          free data feed defeats the reason they exist and will get the caps tightened for everyone. If you need programmatic
          access, that&apos;s exactly what <Link href="/pricing">the API plans</Link> are for.
        </p>

        <h2>Questions</h2>
        <p>
          If anything here is unclear, ask: <Link href="/contact">the contact page</Link> lists the channels the developer
          actually reads.
        </p>
      </article>
    </Container>
  );
}
