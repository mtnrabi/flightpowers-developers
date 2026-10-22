import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui';

export const metadata: Metadata = withOg({
  title: 'Privacy',
  description:
    'Plain-language privacy notes for flightpowers.com and the demo: what the site, the demo and our flights backend keep, for how long, and who else sees it. Each MCP server has its own page.',
  alternates: { canonical: '/privacy' },
});

export const dynamic = 'force-static';

export default function PrivacyPage() {
  return (
    <Container className="py-14 sm:py-20">
      <article className="prose-fp max-w-3xl">
        <p className="eyebrow">Privacy</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink-100">Privacy, in plain language</h1>
        <p className="mt-5">
          This is a plain-language summary written by the developer who runs the site, not legal advice. Last updated
          2026-10-22. It covers this website (flightpowers.com), the demo at demo.flightpowers.com, and the inputs our
          flights backend keeps when a search fails. Our MCP servers each have their own page (see the end). We do not
          sell your personal data.
        </p>

        <h2>On this site: no cookies, no third-party trackers</h2>
        <p>
          The site sets no cookies, loads no third-party analytics scripts, and carries no ad pixels. There is no consent
          banner because there is nothing to consent to.
        </p>
        <p>
          We count page views with Vercel Web Analytics, our hosting provider&apos;s cookieless measurement, which stores
          no cookies and no personal identifiers.
        </p>

        <h2>A first-party anonymous event beacon</h2>
        <p>
          To learn which pages and tools are actually useful, the site records interaction events: which tool was used, which
          action was taken (like copying a code snippet or clicking through to a listing), and the page path. These events
          carry no identifiers: no user ID, no fingerprint, no cross-site anything. They answer &ldquo;was this feature
          used?&rdquo;, not &ldquo;who used it?&rdquo;.
        </p>
        <p>
          Two more things ride along, and both are worth stating plainly. If you arrived through a link that carried
          campaign labels in the address bar (<code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>),
          those labels are recorded, so we can tell whether a post we wrote actually sent anyone here. And the{' '}
          <em>hostname</em> of the site you came from is recorded, never the full referring address, which can contain a
          search query. To avoid counting the same visit twice, the labels are kept for the life of the browser tab in
          <code>sessionStorage</code> and discarded when you close it. That is not a cookie, it is not shared between
          tabs or sites, and it still contains no identifier of any kind &mdash; which is also its limit: it counts
          arrivals, not people.
        </p>

        <h2>Free tools on this site</h2>
        <p>
          When you run a free tool on this site, your query (a route, a date, a hotel name) is sent to our API to answer
          that request and cached briefly in memory, keyed by the query itself, not by you, so repeated searches don&apos;t
          cost extra API calls. To stop one visitor from using up the day&apos;s budget, the server also counts requests
          per IP address in memory for the day; that count is not written to any database. This site has no accounts, so
          queries are not tied to one. If a flight search fails, its inputs are kept (see{' '}
          <a href="#failed-searches">failed flight searches</a>).
        </p>

        <h2>The demo (demo.flightpowers.com)</h2>
        <p>
          The demo is a separate app and works differently from this site. If you sign in with Google, we keep your
          name, email address, profile picture, and when you signed up and last visited.
        </p>
        <p>
          What you type is sent to OpenAI to turn it into a search. The conversation and its results are kept in a cache
          for 3 hours so the results page can load, and are not tied to your account. Flights you choose to save are kept
          with your account email (route, dates, airlines, stops, price and booking link) until you remove them.
        </p>
        <p>
          The demo uses PostHog (EU servers) for analytics: it records the text of your search, the country part of your
          browser&apos;s language setting, and clicks on flights and sponsored links, under a random id that PostHog keeps
          in your browser&apos;s local storage. Session recording and heatmaps are off. Signing in uses a cookie.
        </p>
        <p>
          An earlier version of the demo (April 2025 to March 2026) saved each search (airports, dates, nights, stops)
          with the signed-in account&apos;s email address, and on a small number of rows the IP address. That history is
          still in our database and is kept until deleted; the current demo does not save searches this way. To have yours
          deleted, ask us (see Questions).
        </p>

        <h2 id="failed-searches">Failed flight searches</h2>
        <p>
          When a flight search fails, our flights backend saves its inputs (airports, dates, filters, currency, maximum
          price) together with the error, so we can find and fix the problem. This applies to every search that reaches
          that backend: this site&apos;s tools, the demo, the API, our MCP servers and our Apify flights actor. Your
          account, email address, IP address and API key are not saved with them. There is no automatic deletion yet:
          they are kept until we delete them.
        </p>

        <h2>Pasted API keys are never stored</h2>
        <p>
          The key checker on <Link href="/pricing">the pricing page</Link> forwards the key you paste once, to the live API,
          to see whether it authenticates. It is not stored, not logged, and not sent anywhere else.
        </p>

        <h2>The one thing we ask for: an email address</h2>
        <p>
          There is a single form on this site that asks for anything, and it asks for one field. If you give it an
          address, that address is stored so we can send you an email when something ships that changes what you can
          build: a new endpoint, a changed field, a deprecation, a price move. That is the whole purpose. It is not
          shared, not sold, not passed to the marketplaces, and not used to build a profile of you.
        </p>
        <p>
          Stored with it: where you signed up from (which tool or page), when, and the campaign labels described above if
          your link carried any. No name, no company, no tracking pixel in the mail. Every email carries an unsubscribe
          link, and{' '}
          <Link href="/unsubscribe">the unsubscribe page</Link> works without one, straight from the address. Opting out
          takes effect immediately and needs no reason.
        </p>
        <p>
          Nothing on the site is withheld behind that form. The{' '}
          <Link href="/docs/quickstart">quickstart</Link>, the docs and the free tools are open to everyone, with or
          without an address.
        </p>

        <h2>Server logs</h2>
        <p>
          Like every website, the servers keep standard infrastructure logs (request paths, status codes, timestamps) for
          debugging and abuse prevention. They are ordinary operational logs, not an analytics system. Our search
          backends&apos; logs include the search itself and are kept for about a day.
        </p>

        <h2>The marketplaces are separate</h2>
        <p>
          If you subscribe to the APIs, that happens on RapidAPI or Apify, under their accounts and their privacy policies.
          This site never sees your card, your marketplace account, or your usage data there.
        </p>

        <h2>Our MCP servers</h2>
        <p>Each MCP server has its own privacy page, describing what that server keeps:</p>
        <ul>
          <li>
            Free MCP (with a sponsored card):{' '}
            <a href="https://free-trial.flightpowers.com/privacy">free-trial.flightpowers.com/privacy</a>
          </li>
          <li>
            Paid flights MCP: <a href="https://flights.flightpowers.com/privacy">flights.flightpowers.com/privacy</a>
          </li>
          <li>
            Paid hotels MCP: <a href="https://hotels.flightpowers.com/privacy">hotels.flightpowers.com/privacy</a>
          </li>
        </ul>

        <h2>Questions</h2>
        <p>
          If you want to know anything about how this site or the demo handles data, or want your data deleted, ask
          directly: <Link href="/contact">the contact page</Link> or app@flightpowers.com reaches the person who wrote this
          page.
        </p>
      </article>
    </Container>
  );
}
