import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Plain-language privacy notes for flightpowers.com: no cookies, no third-party trackers, no ad pixels. A first-party anonymous event beacon, transient demo processing, and API keys that are forwarded once and never stored.',
  alternates: { canonical: '/privacy' },
};

export const dynamic = 'force-static';

export default function PrivacyPage() {
  return (
    <Container className="py-14 sm:py-20">
      <article className="prose-fp max-w-3xl">
        <p className="eyebrow">Privacy</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink-100">Privacy, in plain language</h1>
        <p className="mt-5">
          This is a plain-language summary written by the developer who runs the site, not legal advice. The short version:
          this site is built to need as little of your data as possible, and it collects accordingly.
        </p>

        <h2>No cookies, no third-party trackers</h2>
        <p>
          The site sets no cookies, loads no third-party analytics scripts, and carries no ad pixels. There is no consent
          banner because there is nothing to consent to.
        </p>

        <h2>A first-party anonymous event beacon</h2>
        <p>
          To learn which pages and tools are actually useful, the site records interaction events — which tool was used, which
          action was taken (like copying a code snippet or clicking through to a listing), and the page path. These events
          carry no identifiers: no user ID, no fingerprint, no cross-site anything. They answer &ldquo;was this feature
          used?&rdquo;, not &ldquo;who used it?&rdquo;.
        </p>

        <h2>Demo searches are transient</h2>
        <p>
          When you run a live demo or free tool, your query (a route, a date, a hotel name) is processed to answer that
          request and cached briefly, keyed by the query itself — not by you — so repeated searches don&apos;t cost extra API
          calls. Queries are not tied to a profile, because no profile exists.
        </p>

        <h2>Pasted API keys are never stored</h2>
        <p>
          The key checker on <Link href="/pricing">the pricing page</Link> forwards the key you paste once, to the live API,
          to see whether it authenticates. It is not stored, not logged, and not sent anywhere else.
        </p>

        <h2>Server logs</h2>
        <p>
          Like every website, the servers keep standard infrastructure logs (request paths, status codes, timestamps) for
          debugging and abuse prevention. They are ordinary operational logs, not an analytics system.
        </p>

        <h2>The marketplaces are separate</h2>
        <p>
          If you subscribe to the APIs, that happens on RapidAPI or Apify, under their accounts and their privacy policies.
          This site never sees your card, your marketplace account, or your usage data there.
        </p>

        <h2>Questions</h2>
        <p>
          If you want to know anything about how this site handles data, ask directly — <Link href="/contact">the contact
          page</Link> reaches the person who wrote this page.
        </p>
      </article>
    </Container>
  );
}
