import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';
import { withOg } from '@/lib/meta';
import { LINKS, SITE, installLinks, rapidApiPricingUrl } from '@/lib/site';
import { DAILY_JOBS, job, perMonth, shareOf } from '@/lib/daily-runs';
import { FLIGHT_PLANS } from '@/lib/pricing';
import { Breadcrumbs, Code, Container, Cta, JsonLd, Section, SectionHead } from '@/components/ui';

/**
 * From a new PRO key to a job that runs by itself every day.
 *
 * Every output below is from one live run of that path on 2026-11-25 between
 * 20:42 and 20:43 UTC (7 requests in all: cron 2, fare-watcher 2, n8n 1, MCP 2).
 * Request counts come from lib/daily-runs.ts, prices and quotas from
 * lib/pricing.ts. The script shown is public/daily_fare.py itself.
 */

export const metadata: Metadata = withOg({
  title: 'Run a fare check every day: four setups, from key to daily job',
  description:
    'From a new API key to a flight price check that runs by itself every day: a GitHub Actions template, an n8n workflow, a cron script, or Claude and Cursor over MCP. Steps, real output and the requests each one uses a month.',
  alternates: { canonical: '/docs/run-daily' },
});

export const dynamic = 'force-static';

const SCRIPT = fs.readFileSync(path.join(process.cwd(), 'public', 'daily_fare.py'), 'utf8').trimEnd();
const PRO = FLIGHT_PLANS.find((p) => p.name === 'PRO')!;
const FREE = FLIGHT_PLANS.find((p) => p.name === 'BASIC')!;
const n = (x: number) => x.toLocaleString('en-US');
const linkClass = 'text-signal-400 underline underline-offset-4 hover:text-signal-500';
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} rel="noopener" className={linkClass}>
    {children}
  </a>
);

const VERIFY = `export RAPIDAPI_KEY="..."
curl -sS "https://api.flightpowers.com/v1/verify" -H "x-api-key: $RAPIDAPI_KEY"`;

const WATCH_JSON = `{
  "from": ["JFK"],
  "to": ["LIS"],
  "nights": [7],
  "window": { "starts_in_days": 45, "days": 31 },
  "currency": "USD",
  "confirm": 1,
  "max_requests": 4
}`;

const TEMPLATE_OUT = `1 origin(s) x 1 destination(s) x 1 trip length(s), departures 2027-01-09 to 2027-02-08:
31 dated fares read, 2 requests.

route      nights  cheapest departure  return      USD  dearest date in the window
JFK → LIS  7       2027-01-12          2027-01-19  556  697

Confirmed with a full search
route      dates                     calendar  full search  Google says  usual range  stops  airline (outbound)
JFK → LIS  2027-01-12 to 2027-01-19  556       556          typical      410-650      0      Tap Air Portugal / JetBlue

No alert: nothing new that qualifies.`;

const N8N_OUT = `Subject: Fare watch: JFK-LIS 563 USD (typical)

JFK -> LIS, 2027-01-09 to 2027-01-16: 563 USD round trip
Outbound: LEVEL, Vueling, 1 stop(s), 11:45 PM on Sat, Jan 9
Return: Vueling, LEVEL, 1 stop(s), 2:05 PM on Sat, Jan 16
Google: typical (usual 420-730 USD)
Why: at or under your target of 600
Book: https://www.google.com/travel/flights?tfs=...
Fetched 2026-11-25 20:42 UTC. Fares change within minutes.`;

const CRON_SETUP = `mkdir -p ~/fares && cd ~/fares
curl -sSO ${SITE.url}/daily_fare.py        # then edit FROM, TO, NIGHTS, TARGET
(umask 077; echo 'export RAPIDAPI_KEY="your-key"' > env)
. ./env && python3 daily_fare.py                    # one run now, 2 requests

crontab -e                                          # add this line: every day at 06:17
17 6 * * * cd $HOME/fares && . ./env && python3 daily_fare.py >> watch.log 2>&1`;

const CRON_OUT = `2026-11-25 20:42 UTC  LHR-JFK 2027-01-21 to 2027-01-28: calendar 483, full search 599 USD, Google says typical (usual 425-930)`;

const MCP_PROMPT = `Every day, use the FlightPowers Flights tool search_roundtrip_flights once:
from JFK to LIS and DUB, departing 60 days from today, 7 nights, limit 5.
If Google's verdict on any fare is "low", or a fare is under 400 USD, tell me the
fare, the dates, the airline, the usual range and the booking link.
Otherwise write one line: the cheapest fare to each city. Do not search again.`;

const MCP_OUT = `search_roundtrip_flights
{"from_airport": "JFK", "to_airport": ["LIS", "DUB"], "departure_date": "2027-01-26", "nights": 7, "limit": 2}

to_airport    dates                     total  stops  airline (outbound)          Google says  usual range
Dublin (DUB)  2027-01-26 to 2027-02-02  $394   2      Icelandair                  typical      345-610
Lisbon (LIS)  2027-01-26 to 2027-02-02  $556   0      Tap Air Portugal | JetBlue  typical      410-650

search_coverage: requested_combinations 2, searched_combinations 2, hub_requests_billed 2`;

const STEPS = [
  { id: 'key', name: 'Get the key and check it' },
  { id: 'pick', name: 'Pick a setup and see what it uses' },
  { id: 'template', name: 'GitHub Actions template' },
  { id: 'n8n', name: 'n8n workflow' },
  { id: 'cron', name: 'Plain cron' },
  { id: 'mcp', name: 'Claude or Cursor over MCP' },
] as const;

function Uses({ id, children }: { id: string; children?: React.ReactNode }) {
  const j = job(id);
  return (
    <p className="text-[15px] text-ink-200 leading-relaxed">
      <strong className="text-ink-100">
        {j.perRun === 1 ? '1 request' : `${j.perRun} requests`} a day, {n(perMonth(j.perRun))} in a 31-day month.
      </strong>{' '}
      That is {shareOf(j.perRun, PRO.quota)} of PRO&rsquo;s {n(PRO.quota)}. {children}
    </p>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-2.5 pl-5 text-[15px] text-ink-300 leading-relaxed marker:text-ink-500">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  );
}

function Path({
  id,
  eyebrow,
  title,
  lede,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <Section id={id} className="scroll-mt-24">
      <SectionHead eyebrow={eyebrow} title={title} lede={lede} />
      <div className="mt-8 max-w-4xl space-y-6">{children}</div>
    </Section>
  );
}

export default function RunDailyPage() {
  const flights = installLinks('flights');
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'Run a flight price check every day on your own API key',
          description:
            'Get a key for the Google Flights Live API, check it for free, then set up one daily job: a GitHub Actions template, an n8n workflow, a cron script, or Claude and Cursor over MCP.',
          step: STEPS.map((s) => ({ '@type': 'HowToStep', name: s.name, url: `${SITE.url}/docs/run-daily#${s.id}` })),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE.url}/docs` },
            { '@type': 'ListItem', position: 3, name: 'Run it every day', item: `${SITE.url}/docs/run-daily` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/docs', label: 'Docs' },
            { href: '/docs/run-daily', label: 'Run it every day' },
          ]}
        />
      </Container>

      <Container className="pt-8 sm:pt-12 pb-12">
        <p className="eyebrow">Run it every day</p>
        <h1 className="mt-4 text-[2.25rem] sm:text-[3rem] leading-[1.05] font-semibold">
          From a new key to a job that <span className="text-signal-500">runs by itself</span>
        </h1>
        <p className="lede mt-5 max-w-2xl">
          PRO is ${PRO.priceMonthly} a month for {n(PRO.quota)} requests. A route checked every morning, a month of dates at a
          time, uses {n(perMonth(job('template-one').perRun))} of them. Pick one of the four setups below, set it up once, and it
          tells you when the fare is worth a look.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Cta href="#template" variant="primary">
            GitHub Actions
          </Cta>
          <Cta href="#n8n" variant="ghost">
            n8n
          </Cta>
          <Cta href="#cron" variant="ghost">
            Cron
          </Cta>
          <Cta href="#mcp" variant="ghost">
            Claude or Cursor
          </Cta>
        </div>
      </Container>

      <Section id="key" className="scroll-mt-24">
        <SectionHead eyebrow="Step 1" title="Get the key and check it" />
        <div className="mt-8 max-w-4xl space-y-6">
          <Steps
            items={[
              <>
                Open <A href={rapidApiPricingUrl('flights', 'docs', 'run-daily')}>the plans on RapidAPI</A>, sign in and
                subscribe. PRO is ${PRO.priceMonthly} for {n(PRO.quota)} requests a month, then ${PRO.overagePerRequest} each. The
                free BASIC plan ({FREE.quota} a month, hard cap, no card) is enough to test every setup on this page.
              </>,
              <>
                Copy your <code className="field">X-RapidAPI-Key</code> from the listing&rsquo;s Endpoints tab.
              </>,
              <>Check it. This call asks RapidAPI whether the key is subscribed and costs no request:</>,
            ]}
          />
          <Code label="curl · costs 0 requests">{VERIFY}</Code>
        </div>
      </Section>

      <Section id="pick" className="scroll-mt-24">
        <SectionHead
          eyebrow="Step 2"
          title="What each setup uses"
          lede={`Requests in a 31-day month, against PRO's ${n(PRO.quota)}. A month of dates is one request on the REST API (cheapest dates). Over MCP it is one request per date and city.`}
        />
        <div className="mt-8 overflow-x-auto rounded-2xl border rule">
          <table className="w-full min-w-[640px] text-[14px]">
            <thead>
              <tr className="bg-ink-900/80 text-left font-mono text-[11px] uppercase tracking-wider text-ink-500">
                <th className="px-4 py-3 font-normal">Setup</th>
                <th className="px-4 py-3 font-normal">The watch</th>
                <th className="px-4 py-3 text-right font-normal">A day</th>
                <th className="px-4 py-3 text-right font-normal">A month</th>
                <th className="px-4 py-3 text-right font-normal">Of PRO</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_JOBS.map((j) => (
                <tr key={j.id} className="border-t rule text-ink-300">
                  <td className="px-4 py-3 text-ink-100">{j.path}</td>
                  <td className="px-4 py-3">{j.watch}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{j.perRun}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{n(perMonth(j.perRun))}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{shareOf(j.perRun, PRO.quota)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          A search that fails with a server error is retried once (the n8n workflow sends it once), so a bad day can add a few.
          On the free plan, the small watches fit on weekdays: {FREE.quota} requests is {Math.floor(FREE.quota / 2)} runs of 2.
        </p>
      </Section>

      <Path
        id="template"
        eyebrow="Setup 1"
        title="GitHub Actions: copy the template, add the key"
        lede="fare-watcher scans a month of dates once a day and opens a GitHub issue when Google marks the fare low, when it is under Google's usual range, or at your target. No server, and the price history stays in your repo."
      >
        <Steps
          items={[
            <>
              Open <A href="https://github.com/mtnrabi/fare-watcher">github.com/mtnrabi/fare-watcher</A> and press{' '}
              <em>Use this template</em>. Make it private if you don&rsquo;t want your watch to be public.
            </>,
            <>
              <em>Settings &gt; Secrets and variables &gt; Actions &gt; New repository secret</em>, name{' '}
              <code className="field">RAPIDAPI_KEY</code>.
            </>,
            <>
              Edit <code className="field">watch.json</code> with your airports (a small one below).
            </>,
            <>
              <em>Actions &gt; fare watch &gt; Run workflow</em> once. After that it runs every day at 06:17 UTC.
            </>,
          ]}
        />
        <Code label="watch.json · one route">{WATCH_JSON}</Code>
        <Uses id="template-one">
          The shipped example (2 x 2 airports, 2 trip lengths) is {job('template-readme').perRun} a day and{' '}
          {n(perMonth(job('template-readme').perRun))} a month. 3 x 8 airports at 3 trip lengths is{' '}
          {job('template-wide').perRun} a day and {n(perMonth(job('template-wide').perRun))} a month, about all of PRO.{' '}
          <code className="field">python fare_watch.py --plan</code> prints the count for your watch without sending anything.
        </Uses>
        <Code label="real run · 2026-11-25 20:42 UTC · booking links cut">{TEMPLATE_OUT}</Code>
      </Path>

      <Path
        id="n8n"
        eyebrow="Setup 2"
        title="n8n: import one workflow"
        lede="A schedule at 08:00, one round-trip search, and an email (or Slack message) only when the fare is under your target, under Google's usual range, or rated low."
      >
        <Steps
          items={[
            <>
              Download{' '}
              <A href="https://github.com/mtnrabi/n8n-flight-fare-watch/blob/main/workflows/fare-watch-http-request.json">
                fare-watch-http-request.json
              </A>{' '}
              and use <em>Workflows &gt; Import from file</em>. (The same repo has a version for the{' '}
              <Link href="/integrations/n8n" className={linkClass}>
                FlightPowers node
              </Link>
              .)
            </>,
            <>
              On <em>Search round trip</em>, create a Header Auth credential: name <code className="field">x-rapidapi-key</code>,
              value your key.
            </>,
            <>
              Edit <em>Watch settings</em>: airports, target price, email. The dates roll: 45 days out, 7 nights.
            </>,
            <>
              Add your SMTP credential on <em>Email me</em>, press <em>Execute workflow</em> once, then <em>Activate</em>.
            </>,
          ]}
        />
        <Uses id="n8n">
          One date pair, so it is the smallest of the four. Copy the workflow for each route you watch.
        </Uses>
        <Code label="real run · 2026-11-25 20:42 UTC · the workflow's own request and Code node, booking link cut">{N8N_OUT}</Code>
        <p className="text-[14px] text-ink-400 leading-relaxed">
          We ran the workflow&rsquo;s request and its Code node outside the n8n editor with the shipped settings (target 600)
          and <code className="field">always_send</code> on.
          The email step is n8n&rsquo;s own.
        </p>
      </Path>

      <Path
        id="cron"
        eyebrow="Setup 3"
        title="Plain cron: one Python file"
        lede="Standard library only. It finds the cheapest date in a rolling month, prices that trip in full, adds a line to fares.csv, and marks a DEAL when Google says low or the fare is at your target."
      >
        <Code label="shell">{CRON_SETUP}</Code>
        <Uses id="cron">
          One route is one copy of the script. {Math.floor(PRO.quota / perMonth(job('cron').perRun))} routes a day still fit in
          PRO.
        </Uses>
        <Code label="real run · 2026-11-25 20:42 UTC">{CRON_OUT}</Code>
        <p className="text-[14px] text-ink-400 leading-relaxed">
          Two prices, because Google&rsquo;s calendar is the lowest fare of any itinerary that day and the full search returns
          the best ones on price, time and stops together. It marks the DEAL again every day the fare stays there (setup 1
          remembers what it already told you). Set <code className="field">SLACK_WEBHOOK_URL</code> in{' '}
          <code className="field">env</code> to get the deals in Slack.
        </p>
        <details className="rounded-2xl border rule p-4">
          <summary className="cursor-pointer text-[15px] text-ink-200">
            Read daily_fare.py ({SCRIPT.split('\n').length} lines)
          </summary>
          <div className="mt-4">
            <Code label="daily_fare.py">{SCRIPT}</Code>
          </div>
        </details>
      </Path>

      <Path
        id="mcp"
        eyebrow="Setup 4"
        title="Claude or Cursor: a scheduled prompt"
        lede="Add the MCP server once, paste your key once, and give the prompt a schedule. No code."
      >
        <Steps
          items={[
            <>
              Add the server: <A href={flights.claude}>Add to Claude</A> (after Continue, choose &lsquo;Sign in when
              needed&rsquo;) or <A href={flights.cursorWeb}>Add to Cursor</A>. Or paste{' '}
              <code className="field">{LINKS.mcpFlights}</code>.
            </>,
            <>
              Sign in with Google, then paste your RapidAPI key once at{' '}
              <A href={LINKS.mcpConnectFlights}>{LINKS.mcpConnectFlights.replace('https://', '')}</A>. Until you do, the first
              10 searches a day are free.
            </>,
            <>
              Claude: make a scheduled task at{' '}
              <A href="https://claude.ai/code/routines">claude.ai/code/routines</A> or with{' '}
              <code className="field">/schedule</code>. It runs on Anthropic&rsquo;s side, on a paid plan, and can use your
              connectors (<A href="https://code.claude.com/docs/en/routines">Anthropic&rsquo;s docs</A>).
            </>,
            <>
              Cursor: make an automation at <A href="https://cursor.com/automations">cursor.com/automations</A> with a schedule
              trigger and this MCP server as a tool (
              <A href="https://cursor.com/docs/cloud-agent/automations">Cursor&rsquo;s docs</A>).
            </>,
            <>Paste the prompt:</>,
          ]}
        />
        <Code label="prompt">{MCP_PROMPT}</Code>
        <Uses id="mcp-two">
          Every date counts here: two cities over a whole month of dates is {job('mcp-month').perRun} a day and{' '}
          {n(perMonth(job('mcp-month').perRun))} a month. For a month of dates every day, setups 1 and 3 do it in 2.
        </Uses>
        <Code label="real tool call · 2026-11-25 20:42 UTC · rows trimmed">{MCP_OUT}</Code>
        <p className="text-[14px] text-ink-400 leading-relaxed">
          The tool call the prompt makes, with a fixed date and limit 2, sent to the server directly on our own key. The schedule itself is
          Claude&rsquo;s or Cursor&rsquo;s; their docs above were read on 2026-11-25. Every answer carries{' '}
          <code className="field">api_usage</code>, so you can see what a run spent.
        </p>
      </Path>

      <Section>
        <SectionHead eyebrow="Next" title="Once it runs" />
        <ul className="mt-6 max-w-3xl space-y-2.5 text-[15px] text-ink-300 leading-relaxed">
          <li>
            Read an empty answer right: <Link href="/flights-api/search-status" className={linkClass}>search status</Link> tells
            no flights apart from a search that did not finish.
          </li>
          <li>
            The two calls behind setups 1 and 3:{' '}
            <Link href="/flights-api/cheapest-dates" className={linkClass}>
              cheapest dates
            </Link>{' '}
            and{' '}
            <Link href="/flights-api/round-trip" className={linkClass}>
              round trip
            </Link>
            .
          </li>
          <li>
            More to fork: <Link href="/docs/examples" className={linkClass}>the example apps</Link>, with a Telegram and Discord
            bot.
          </li>
          <li>
            Hotels instead? A{' '}
            <Link href="/use-cases/hotel-comp-set-tracking" className={linkClass}>
              competitive set by name
            </Link>{' '}
            is the same kind of daily job.
          </li>
        </ul>
      </Section>
    </>
  );
}
