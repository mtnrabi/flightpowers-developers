import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/bands';
import {
  Breadcrumbs,
  Code,
  Container,
  Cta,
  FaqSection,
  JsonLd,
  Section,
  SectionHead,
  type Faq,
} from '@/components/ui';
import { LINKS, SITE, rapidApiPricingUrl } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = withOg({
  title: 'n8n community node: n8n-nodes-flightpowers',
  description:
    'Install n8n-nodes-flightpowers (v0.2.2 on npm) from Settings → Community nodes and build fare-watch crons, rate-parity checks, and cheapest-date scans on live flight and hotel data. Credential = your RapidAPI key.',
  alternates: { canonical: '/integrations/n8n' },
});

const faq: Faq[] = [
  {
    q: 'I found n8n-nodes-flight-hotel-data. Is that this?',
    a: 'That is the old package name, now superseded. Install n8n-nodes-flightpowers instead: it is the maintained node (v0.2.2 on npm). If you have the old one installed, switch; new releases land only on the new name.',
  },
  {
    q: 'Where does my key live?',
    a: 'As an n8n credential. You create it once (the value is your RapidAPI key) and every workflow that uses the node references the credential. n8n stores it encrypted; it never sits in the workflow JSON you export or share.',
  },
  {
    q: 'Is my key billed to me?',
    a: 'Yes. The node calls the live API with your key, so every execution meters against your own RapidAPI subscription. A daily fare-watch is about 30 requests a month; a 30-day date scan is 30 requests per run. Size your plan to your schedule.',
  },
  {
    q: 'Does it work on n8n Cloud and self-hosted?',
    a: 'Community nodes install by package name from the Settings screen on instances that allow them; self-hosted n8n always can. The node itself is ordinary JavaScript from npm: nothing about it requires self-hosting.',
  },
  {
    q: 'Can I use plain HTTP Request nodes instead?',
    a: 'Yes. The REST API works from a stock HTTP Request node with your key in an x-api-key header, no community node needed. The node saves you the request-building and gives you typed parameters; the API is the same either way.',
  },
];

export default function N8nIntegrationPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE.url}/integrations` },
            { '@type': 'ListItem', position: 2, name: 'n8n', item: `${SITE.url}/integrations/n8n` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs trail={[{ href: '/integrations', label: 'Integrations' }, { href: '/integrations/n8n', label: 'n8n' }]} />
      </Container>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" aria-hidden="true" />
        <Container className="relative pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
            <div>
              <p className="eyebrow">Integrations · n8n</p>
              <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
                Fare logic as an <span className="text-signal-500">n8n</span> workflow
              </h1>
              <p className="lede mt-5">
                A community node for live flight and hotel data. Because every fare arrives with Google&apos;s low | typical |
                high verdict, &ldquo;alert me when it&apos;s cheap&rdquo; is one IF condition: no price-history database to
                build first.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={rapidApiPricingUrl('flights', 'integration')} external variant="primary">
                  Get a key on RapidAPI →
                </Cta>
                <a href={LINKS.npmNode} rel="noopener" className="btn btn-ghost">
                  View on npm
                </a>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink-500">Free tier on RapidAPI. No card to try.</p>
            </div>
            <div>
              <Code label="settings → community nodes → install">{`n8n-nodes-flightpowers`}</Code>
              <p className="mt-3 text-[13.5px] text-ink-400 leading-relaxed">
                v0.2.2 on npm, one node for both APIs: a Flight resource (Search One-Way, Search Round-Trip) and a Hotel
                resource (Search Destination, Get by Name). Add your RapidAPI key once as a credential; every workflow reuses
                it.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <SectionHead
          eyebrow="Setup"
          title="Three steps to a working node"
          lede="No repo to clone and no build step: n8n pulls the package from npm."
        />
        <ol className="mt-10 max-w-3xl space-y-4">
          {[
            ['Install the node', 'Settings → Community nodes → Install, enter n8n-nodes-flightpowers, confirm. n8n fetches it from npm and restarts the node list.'],
            ['Create the credential', 'Add a credential for the node and paste your RapidAPI key. It is stored by n8n and referenced by name. Exported workflow JSON never contains it.'],
            ['Drop it into a workflow', 'Add the node to a canvas, pick what to search, and wire the output into the rest of your flow like any other node.'],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4 rounded-2xl border rule bg-ink-900/50 p-5">
              <span className="font-mono text-[15px] text-signal-500 tabular-nums">{i + 1}</span>
              <div>
                <p className="text-[15.5px] font-semibold text-ink-100">{title}</p>
                <p className="mt-1 text-[14px] text-ink-400 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHead
          eyebrow="What to build"
          title="Three workflows that earn their cron slot"
          lede="Each pattern below is prose plus the step list. The full recipes, with the exact request and response fields, are linked from each card."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border rule bg-ink-900/60 p-6 flex flex-col">
            <h3 className="text-[16px] font-semibold text-ink-100">Fare-watch cron</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed flex-1">
              A schedule trigger runs a flight search every morning. An IF node checks whether{' '}
              <code className="font-mono text-[12.5px]">price_range_in_relation_to_other_periods</code> equals{' '}
              <code className="font-mono text-[12.5px]">&quot;low&quot;</code>. Google&apos;s band is the price history, so
              that one comparison is the whole alert. On true, send the fare and its{' '}
              <code className="font-mono text-[12.5px]">buy_link</code> to email, Slack, or Telegram.
            </p>
            <ol className="mt-4 space-y-1.5 text-[13px] text-ink-400 font-mono">
              <li>1. Schedule trigger (daily)</li>
              <li>2. Flight search via the node</li>
              <li>3. IF: verdict == &quot;low&quot;</li>
              <li>4. Notify with price + buy_link</li>
            </ol>
            <Link href="/integrations/n8n/fare-alert-cron" className="mt-4 text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Full recipe →
            </Link>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6 flex flex-col">
            <h3 className="text-[16px] font-semibold text-ink-100">Rate-parity check</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed flex-1">
              Look up the same hotel several times, identical except{' '}
              <code className="font-mono text-[12.5px]">proxy_country</code>: each request is priced from a residential proxy
              in that market. Merge the results, compute the spread on{' '}
              <code className="font-mono text-[12.5px]">price</code>, and flag when one market undercuts your contracted rate.
            </p>
            <ol className="mt-4 space-y-1.5 text-[13px] text-ink-400 font-mono">
              <li>1. Schedule trigger (weekly)</li>
              <li>2. Hotel lookup × per market</li>
              <li>3. Merge + compute spread</li>
              <li>4. Alert when spread &gt; threshold</li>
            </ol>
            <Link href="/integrations/n8n/rate-parity-check" className="mt-4 text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Full recipe →
            </Link>
          </div>
          <div className="rounded-2xl border rule bg-ink-900/60 p-6 flex flex-col">
            <h3 className="text-[16px] font-semibold text-ink-100">Cheapest-date scan</h3>
            <p className="mt-2 text-[14.5px] text-ink-400 leading-relaxed flex-1">
              Generate the dates of a month, run a search per date, and sort the merged results on{' '}
              <code className="font-mono text-[12.5px]">price_as_number</code>. The output is a fare calendar: post the
              cheapest dates to a sheet or feed a weekly &ldquo;when to fly&rdquo; digest. Budget one request per date.
            </p>
            <ol className="mt-4 space-y-1.5 text-[13px] text-ink-400 font-mono">
              <li>1. Generate date list</li>
              <li>2. Search per date via the node</li>
              <li>3. Merge + sort by price</li>
              <li>4. Write calendar to sheet</li>
            </ol>
            <Link href="/integrations/n8n/cheapest-date-scan" className="mt-4 text-sm text-signal-400 underline underline-offset-4 hover:text-signal-500">
              Full recipe →
            </Link>
          </div>
        </div>
      </Section>

      <Section>
        <FaqSection items={faq} />
      </Section>

      <Section>
        <SectionHead eyebrow="All seven n8n recipes" title="Step-by-step, per task" />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/integrations/n8n/one-way-search" className="chip">
            One-way search
          </Link>
          <Link href="/integrations/n8n/round-trip-search" className="chip">
            Round-trip search
          </Link>
          <Link href="/integrations/n8n/price-insights-check" className="chip">
            Price-insights check
          </Link>
          <Link href="/integrations/n8n/cheapest-date-scan" className="chip">
            Cheapest-date scan
          </Link>
          <Link href="/integrations/n8n/hotel-search" className="chip">
            Hotel search
          </Link>
          <Link href="/integrations/n8n/rate-parity-check" className="chip">
            Rate-parity check
          </Link>
          <Link href="/integrations/n8n/fare-alert-cron" className="chip">
            Fare-alert cron
          </Link>
          <Link href="/integrations" className="chip">
            All integrations
          </Link>
        </div>
      </Section>

      <Section bordered={false} className="!pt-4">
        <CtaBand
          medium="integration"
          title="One credential, every workflow"
          body="Install the node, paste your RapidAPI key once, and every fare your workflows touch arrives already judged: low, typical, or high."
        />
      </Section>
    </>
  );
}
