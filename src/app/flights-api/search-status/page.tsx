import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import { PricingTable } from '@/components/PricingTable';
import {
  Breadcrumbs,
  CapturedBadge,
  CheckBullets,
  Code,
  Container,
  Cta,
  FaqSection,
  FieldRow,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { FIXTURES } from '@/lib/fixtures';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { COUNTS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const metadata: Metadata = withOg({
  title: 'X-Search-Status: telling “no flights” from “the search failed”',
  description:
    'Every response carries X-Search-Status: ok, empty, partial, or degraded. An empty array is only ever reported when the page it came from positively said so, and opt-in strict mode turns a degraded search into an HTTP 503.',
  alternates: { canonical: '/flights-api/search-status' },
});

export const dynamic = 'force-static';

/** Renders a captured header set the way `curl -i` would show it. */
function headerBlock(headers: Record<string, string>, body: string): string {
  const first = ['x-search-status', 'x-search-reason', 'x-search-retries'];
  const keys = Object.keys(headers).sort((a, b) => {
    const ia = first.indexOf(a);
    const ib = first.indexOf(b);
    return (ia === -1 ? first.length : ia) - (ib === -1 ? first.length : ib) || a.localeCompare(b);
  });
  return `HTTP/2 200\n${keys.map((k) => `${k}: ${headers[k]}`).join('\n')}\n\n${body}`;
}

const STATUSES: { value: string; cls: string; meaning: string }[] = [
  { value: 'ok', cls: 'text-verdict-low', meaning: 'Results returned, array complete.' },
  {
    value: 'empty',
    cls: 'text-ink-200',
    meaning:
      'The search completed and Google genuinely has no itineraries for that route and date. The empty array is the answer, not a failure you should retry.',
  },
  {
    value: 'partial',
    cls: 'text-verdict-typical',
    meaning:
      'There are itineraries, but the array is knowingly short: rows whose price could not be read were dropped, or a round-trip’s return-leg fan-out lost some of the outbound candidates it set out to price. Real results, minus the ones the search could not deliver.',
  },
  {
    value: 'degraded',
    cls: 'text-verdict-high',
    meaning: 'The search did not complete. The empty array says nothing about availability. Retry it.',
  },
];

const REASONS = ['blocked_page', 'unrecognized_page', 'unreadable_prices', 'upstream_timeout', 'search_truncated', 'upstream_status_<code>'];

const faq: Faq[] = [
  {
    q: 'Why does a flight API return an empty array?',
    a: 'For two very different reasons: either there really are no flights on that route and date, or the scrape behind the search silently failed: a consent wall, a bot check, a truncated page. Most APIs return [] either way and you cannot tell which happened. Here the X-Search-Status header says which: "empty" is a real answer, "degraded" is a failed search.',
  },
  {
    q: 'What does X-Search-Status: degraded mean?',
    a: 'The search did not complete. The page could not be read even after automatic retries. The empty (or short) array says nothing about availability. Retry the request; do not tell your user "no flights found".',
  },
  {
    q: 'What does X-Search-Status: partial mean?',
    a: 'Real results, knowingly incomplete: rows whose price could not be read were dropped, or a round-trip’s return-leg fan-out lost some outbound candidates. What you got is trustworthy; there may have been more.',
  },
  {
    q: 'When should I retry a search?',
    a: 'Retry on "degraded", that is its meaning. Never on "empty": an empty result is only reported when the page positively said there are no flights, and Google reporting no flights is never retried internally either, so a real empty costs no extra time.',
  },
  {
    q: 'Can I get an error instead of a misleading empty list?',
    a: 'Yes. Send "strict": true and a degraded search returns HTTP 503 with {"error": {"type": "search_incomplete", "reason": ...}} instead of []. It is opt-in and off by default; leave it out and responses are exactly what they are today.',
  },
  {
    q: 'X-Search-Reason is set but the status is ok. Did something fail?',
    a: 'Nothing you need to act on. X-Search-Reason records the first failure the search hit, so it can ride along on a response that a retry already rescued. The captured "ok" response on this page carries reason blocked_page for exactly that reason. Branch on X-Search-Status, read X-Search-Reason for diagnostics.',
  },
  {
    q: 'Do these headers change the response body?',
    a: 'No. The body of a normal response is unchanged and the headers are additive, so nothing already built against the API breaks. strict is the only behavior change, and it is opt-in.',
  },
];

export default function SearchStatusPage() {
  const degraded = FIXTURES.degradedExample;
  const rescued = FIXTURES.roundtripJfkLhr;
  const degradedText = headerBlock(degraded.headers ?? {}, '[]   ← says NOTHING about availability. Retry it.');
  const rescuedText = headerBlock(
    rescued.headers ?? {},
    `[ { "total_price": "${rescued.data[0]!.total_price}", … } ]   ← ${rescued.data.length} real itineraries`
  );

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Flights API', item: `${SITE.url}/flights-api` },
            { '@type': 'ListItem', position: 3, name: 'Search Status', item: `${SITE.url}/flights-api/search-status` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FlightPowers Search Status Headers',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier: 10 requests/month on RapidAPI' },
          url: `${SITE.url}/flights-api/search-status`,
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/', label: 'Home' }, { href: '/flights-api', label: 'Flights API' }, { href: '/flights-api/search-status', label: 'Search Status' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="eyebrow">X-Search-Status</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
                &quot;No flights&quot; and &quot;the search failed&quot; are{' '}
                <span className="text-signal-500">different answers</span>
              </h1>
              <p className="lede mt-5">
                Everywhere else, <code className="font-mono text-[15px]">200 []</code> is ambiguous. Here an empty array is only
                ever reported when the page it came from positively said so.
              </p>
              <div className="mt-7">
                <CheckBullets
                  items={[
                    <>
                      <code className="font-mono text-[13px] text-signal-400">X-Search-Status</code> on every response:{' '}
                      <span className="text-verdict-low font-mono text-[13px]">ok</span> ·{' '}
                      <span className="font-mono text-[13px]">empty</span> ·{' '}
                      <span className="text-verdict-typical font-mono text-[13px]">partial</span> ·{' '}
                      <span className="text-verdict-high font-mono text-[13px]">degraded</span>
                    </>,
                    <>Unreadable pages are retried automatically. Degraded means retry, empty means believe it</>,
                    <>
                      Opt-in <code className="font-mono text-[13px] text-signal-400">strict: true</code> turns a degraded search
                      into an HTTP 503
                    </>,
                  ]}
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'endpoint')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <Cta href="/guides/handle-empty-flight-search-results" variant="ghost">
                  The handling guide
                </Cta>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-end">
                <CapturedBadge date={degraded.captured_at} />
              </div>
              <Code label="a real degraded search: Google blocked the page, retries exhausted">{degradedText}</Code>
              <Code label="the same request, retried seconds later">{rescuedText}</Code>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="The problem"
          title="Every scraper gets handed pages it cannot read"
          lede="A consent wall, a bot check, a truncated response. Most flight APIs return an empty list anyway, and your product tells a user something false."
        />
        <div className="mt-6 max-w-3xl space-y-4 text-[15px] text-ink-300 leading-relaxed">
          <p>
            This API separates the two. A search that fails to read a page is retried automatically, and an empty array is only
            ever reported as a real answer when the page it came from positively said so, including the case where flight rows{' '}
            <em>were</em> on the page but their prices could not be read, which is what a Google markup change looks like from the
            inside. A page where Google genuinely reports no flights is never retried, so a real empty result costs you nothing
            extra. Whatever is left is reported on the response.
          </p>
          <p className="text-ink-400">
            The two captures above are that story happening for real: the first request hit a blocked page and said so
            (<code className="field">degraded</code>, <code className="field">blocked_page</code>) instead of pretending{' '}
            <code className="field">[]</code> meant no flights, and the retry seconds later came back{' '}
            <code className="field">ok</code> with {rescued.data.length} itineraries and{' '}
            <code className="field">x-search-retries: 1</code> on its record.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="The contract" title="The four states of X-Search-Status" />
        <div className="mt-8 scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                <th className="px-4 py-3 font-normal">X-Search-Status</th>
                <th className="px-4 py-3 font-normal">What it means</th>
              </tr>
            </thead>
            <tbody>
              {STATUSES.map((s) => (
                <tr key={s.value} className="border-t rule align-top">
                  <td className="px-4 py-3.5">
                    <code className={`font-mono text-[13px] ${s.cls}`}>{s.value}</code>
                  </td>
                  <td className="px-4 py-3.5 text-ink-300 leading-relaxed">{s.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          Round-trip gets the same treatment as one-way, which is harder than it sounds: a round-trip prices a return leg for
          every outbound candidate, and each of those fetches can fail on its own. <code className="field">empty</code> is only
          reported when every candidate was attempted and every one of them read a real Google Flights page saying it had
          nothing. A fan-out that was blocked, or that stopped on the request&apos;s time ceiling, reports{' '}
          <code className="field">degraded</code> or <code className="field">partial</code>, never &quot;no flights&quot;.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Diagnostics"
          title="The reason, and the work the search did"
          lede="Status is the field you branch on. The rest of the x-search-* family tells you why and how much."
        />
        <div className="mt-8 max-w-3xl">
          <FieldRow name="X-Search-Reason" type="string">
            The cause when there is one:{' '}
            {REASONS.map((r, i) => (
              <span key={r}>
                <code className="field">{r}</code>
                {i < REASONS.length - 1 ? ', ' : ''}
              </span>
            ))}{' '}
            and a few more. It records the <em>first</em> failure, so it can ride along on a response a retry already rescued.
            branch on <code className="field">X-Search-Status</code>, log the reason.
          </FieldRow>
          <FieldRow name="X-Search-Results / X-Search-Attempts / X-Search-Combinations" type="int">
            How much work the search did: results returned, page fetches attempted, and date-pair combinations the search set out
            to price.
          </FieldRow>
          <FieldRow name="X-Search-Retries" type="int, when non-zero">
            Automatic retries that rescued unreadable pages. The captured &quot;ok&quot; response above carries{' '}
            <code className="field">x-search-retries: 1</code>.
          </FieldRow>
          <FieldRow name="X-Search-Lost-Combinations / X-Search-Incomplete-Combinations" type="int, when non-zero">
            Round-trip fan-out accounting: outbound candidates whose return-leg pricing was lost or cut short. The reason a
            short array can honestly call itself <code className="field">partial</code>.
          </FieldRow>
          <FieldRow name="X-Search-Unreadable-Pages" type="int, when non-zero">
            Pages fetched but not parseable, the raw material of a <code className="field">degraded</code> verdict.
          </FieldRow>
        </div>
        <p className="mt-4 max-w-3xl font-mono text-[12px] text-ink-500">
          The captures on this page include a few further internal counters. All x-search-* headers are additive and safe to
          ignore. The only one your code should branch on is x-search-status.
        </p>
      </Section>

      <Section>
        <SectionHead
          eyebrow="In code"
          title="Branch on the status, not the array length"
          lede="The whole integration is one if-statement before you touch the body."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <Code label="python · the pattern">{`r = requests.post(url, headers=headers, json=body)

if r.headers.get("X-Search-Status") == "degraded":
    # The search did not happen.
    # Do NOT tell the user "no flights found".
    raise RuntimeError(
        f"search incomplete "
        f"({r.headers.get('X-Search-Reason')}), retry")

flights = r.json()
if not flights:
    # Status is "empty" - Google really has
    # nothing for this route and date.
    print("No flights on this route for these dates")`}</Code>
          <div>
            <h3 className="text-[16px] font-semibold text-ink-100">Prefer an error to an empty list?</h3>
            <p className="mt-2.5 text-[15px] text-ink-400 leading-relaxed">
              Send <code className="field">&quot;strict&quot;: true</code> and a degraded search returns{' '}
              <strong className="text-ink-100">HTTP 503</strong> instead of a misleading <code className="field">[]</code>:
            </p>
            <div className="mt-4">
              <Code label="strict: true · degraded search">{`HTTP/2 503
{
  "error": {
    "type": "search_incomplete",
    "reason": "blocked_page"
  }
}`}</Code>
            </div>
            <p className="mt-4 text-[14px] text-ink-400 leading-relaxed">
              <code className="field">strict</code> is opt-in and off by default. Leave it out and you get exactly the responses
              you get today. The body of a normal response is unchanged and the headers are additive, so nothing you have already
              built breaks. Full walkthrough:{' '}
              <Link href="/guides/handle-empty-flight-search-results" className="text-signal-400 underline underline-offset-4">
                handling empty flight-search results
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Pricing" title="The headers ride on every plan" />
        <div className="mt-8">
          <PricingTable api="flights" plans={FLIGHT_PLANS} medium="endpoint" />
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="Explore more" title="More Flights API" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/flights-api/one-way', label: 'One-way search', sub: 'The base endpoint' },
            { href: '/flights-api/round-trip', label: 'Round-trip search', sub: 'Paired-leg itineraries' },
            { href: '/flights-api/price-insights', label: 'Price insights', sub: 'The band & the verdict' },
            { href: '/flights-api/parallel-date-scan', label: 'Parallel date scans', sub: `${COUNTS.flightsRateLimits} req/min` },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="endpoint"
          title="Build on answers, not ambiguity"
          body="Live Google Flights data that says what happened (ok, empty, partial, or degraded) on every single response."
        />
      </Section>
    </>
  );
}
