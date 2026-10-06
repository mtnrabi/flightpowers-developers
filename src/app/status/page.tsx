import { withOg } from '@/lib/meta';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs, Container, JsonLd, Section, SectionHead } from '@/components/ui';
import { SITE } from '@/lib/site';
import spec from '../../../public/openapi.json';
import DATA from './status-data.json';

// W2-9: a public, dated record instead of a reliability claim. Rule 1: every
// figure here is either computed on this page from the probe's public run log
// (window stated), or copied from a dated source in status-data.json. No SLA,
// no uptime percentage, no latency of our own.
const TITLE = 'FlightPowers status: uptime probe and nightly API tests';

export const metadata: Metadata = {
  ...withOg({
    title: TITLE,
    description:
      'What we check and how: an MCP probe read live from its public GitHub Actions log, nightly RapidAPI tests, and the listing service levels, each dated.',
    alternates: { canonical: '/status' },
  }),
  title: { absolute: TITLE },
};

/** The probe log is read at build time and again at most once an hour. */
export const revalidate = 3600;

const REPO = 'mtnrabi/travel-agent-skills';
const WORKFLOW = 'uptime.yml';
const WORKFLOW_URL = `https://github.com/${REPO}/actions/workflows/${WORKFLOW}`;
const WORKFLOW_SOURCE = `https://github.com/${REPO}/blob/main/.github/workflows/${WORKFLOW}`;
const WINDOW_DAYS = 30;

type Run = { id: number; created_at: string; conclusion: string | null; status: string; html_url: string };
type DayCell = { day: string; runs: number; passed: number; failed: number };
type ProbeLog = {
  ok: true;
  windowStart: string;
  windowEnd: string;
  runs: Run[];
  days: DayCell[];
  failures: { run: Run; jobs: string[] }[];
};

function ghHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'flightpowers-status-page',
  };
  // Optional: an unauthenticated read shares GitHub's 60-an-hour limit per IP.
  const token = process.env.STATUS_GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readProbeLog(): Promise<ProbeLog | { ok: false; reason: string }> {
  const now = new Date();
  // The window is the last WINDOW_DAYS UTC days, today included.
  const since = new Date(now.getTime() - (WINDOW_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
  const runs: Run[] = [];
  try {
    for (let page = 1; page <= 4; page++) {
      const url = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=100&page=${page}&created=${encodeURIComponent(`>=${since}`)}`;
      const res = await fetch(url, { headers: ghHeaders(), next: { revalidate } });
      if (!res.ok) return { ok: false, reason: `GitHub answered ${res.status}` };
      const body = (await res.json()) as { workflow_runs: Run[] };
      runs.push(...body.workflow_runs);
      if (body.workflow_runs.length < 100) break;
    }
  } catch {
    return { ok: false, reason: 'GitHub could not be reached' };
  }

  const finished = runs.filter((r) => r.status === 'completed' && r.created_at.slice(0, 10) >= since);
  const days: DayCell[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const onDay = finished.filter((r) => r.created_at.startsWith(day));
    days.push({
      day,
      runs: onDay.length,
      passed: onDay.filter((r) => r.conclusion === 'success').length,
      failed: onDay.filter((r) => r.conclusion === 'failure' || r.conclusion === 'timed_out').length,
    });
  }

  // Which host failed: one jobs read per failed run, capped so a bad week
  // cannot burn the rate limit.
  const failedRuns = finished.filter((r) => r.conclusion === 'failure' || r.conclusion === 'timed_out').slice(0, 10);
  const failures: { run: Run; jobs: string[] }[] = [];
  for (const run of failedRuns) {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${run.id}/jobs`, {
        headers: ghHeaders(),
        next: { revalidate },
      });
      const body = res.ok ? ((await res.json()) as { jobs: { name: string; conclusion: string | null }[] }) : { jobs: [] };
      failures.push({ run, jobs: body.jobs.filter((j) => j.conclusion === 'failure').map((j) => j.name) });
    } catch {
      failures.push({ run, jobs: [] });
    }
  }

  return {
    ok: true,
    windowStart: days[0]!.day,
    windowEnd: days[days.length - 1]!.day,
    runs: finished.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    days,
    failures,
  };
}

type SpecResponse = { description?: string; headers?: Record<string, { description?: string }> };
type SpecPaths = Record<string, Record<string, { responses?: Record<string, SpecResponse> }>>;
const PATHS = (spec as unknown as { paths: SpecPaths }).paths;
const FLIGHT_RESPONSES = PATHS['/v1/flights/oneway']?.post?.responses ?? {};
const HOTEL_RESPONSES = PATHS['/v1/hotels/search']?.post?.responses ?? {};
const CODES = Array.from(new Set([...Object.keys(FLIGHT_RESPONSES), ...Object.keys(HOTEL_RESPONSES)])).sort();
const SEARCH_STATUS = FLIGHT_RESPONSES['200']?.headers?.['X-Search-Status']?.description ?? '';

function fmtUtc(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

export default async function StatusPage() {
  const log = await readProbeLog();
  const nights = DATA.nightlyTests.nights;
  const renderedAt = new Date().toISOString();

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
            { '@type': 'ListItem', position: 2, name: 'Status', item: `${SITE.url}/status` },
          ],
        }}
      />

      <Container className="pt-10 sm:pt-14">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/status', label: 'Status' },
          ]}
        />
      </Container>

      <Container className="pt-8 sm:pt-12 pb-12">
        <div className="max-w-3xl">
          <p className="eyebrow">Status</p>
          <h1 className="mt-4 text-[2.25rem] sm:text-[3.25rem] leading-[1.05] font-semibold">
            FlightPowers status: what we check, and what came back
          </h1>
          <p className="lede mt-5">
            Three records, each with its date: a probe that calls the MCP servers several times a day, read live from its
            public GitHub Actions log; the nightly tests RapidAPI runs against the live listings; and the service level RapidAPI
            shows on each listing. No SLA comes with the public plans. This page is the record instead.
          </p>
        </div>
      </Container>

      {/* ============================== PROBE ============================== */}
      <Section>
        <SectionHead
          eyebrow="Record 1"
          title="MCP uptime probe"
          lede={
            <>
              A{' '}
              <a href={WORKFLOW_SOURCE} rel="noopener" className="text-signal-400 underline underline-offset-4">
                public GitHub Actions workflow
              </a>{' '}
              sends an MCP <code className="field">initialize</code> request to two deployments: the paid one that serves
              flights.flightpowers.com and hotels.flightpowers.com, and the free one at free-trial.flightpowers.com, each reached
              at an alias hostname of the same deployment. A run passes when both answer 200 with server info. It is scheduled
              every 30 minutes; GitHub queues scheduled runs, so it runs less often than that, and the count below is what
              actually ran.
            </>
          }
        />
        {log.ok ? (
          <div className="mt-10 max-w-3xl">
            <p className="text-[16px] text-ink-100">
              {log.failures.length === 0 && log.runs.every((r) => r.conclusion === 'success') ? (
                <>
                  All {log.runs.length} probe runs between {log.windowStart} and {log.windowEnd} passed.
                </>
              ) : (
                <>
                  {log.runs.filter((r) => r.conclusion === 'success').length} of {log.runs.length} probe runs between{' '}
                  {log.windowStart} and {log.windowEnd} passed.
                </>
              )}
            </p>
            {log.runs[0] ? (
              <p className="mt-2 text-[14px] text-ink-400">
                Last run:{' '}
                <a href={log.runs[0].html_url} rel="noopener" className="text-signal-400 underline underline-offset-4">
                  {fmtUtc(log.runs[0].created_at)}
                </a>
                , {log.runs[0].conclusion === 'success' ? 'passed' : log.runs[0].conclusion}. Page read the log at{' '}
                {fmtUtc(renderedAt)} and reads it again at most once an hour.
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-[3px]" role="list" aria-label={`Probe runs per day, ${log.windowStart} to ${log.windowEnd}`}>
              {log.days.map((d) => {
                const cls = d.runs === 0 ? 'bg-ink-700' : d.failed > 0 ? 'bg-verdict-high' : 'bg-verdict-low';
                const label =
                  d.runs === 0
                    ? `${d.day}: no runs`
                    : `${d.day}: ${d.runs} runs, ${d.passed} passed${d.failed ? `, ${d.failed} failed` : ''}`;
                return <span key={d.day} role="listitem" title={label} aria-label={label} className={`h-8 w-2 sm:w-3.5 rounded-sm ${cls}`} />;
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-500">
              <span>{log.windowStart}</span>
              <span>{log.windowEnd}</span>
            </div>
            <p className="mt-4 text-[14px] text-ink-400">
              One bar per UTC day: green when every run that day passed, red when one failed, grey when none ran.
              {log.runs.length > 0 ? (
                <>
                  {' '}
                  GitHub ran the probe {Math.min(...log.days.filter((d) => d.runs > 0).map((d) => d.runs))} to{' '}
                  {Math.max(...log.days.map((d) => d.runs))} times a day in this window.
                </>
              ) : null}
            </p>
            {log.failures.length > 0 ? (
              <ul className="mt-4 space-y-1 text-[14px] text-ink-300">
                {log.failures.map((f) => (
                  <li key={f.run.id}>
                    <a href={f.run.html_url} rel="noopener" className="text-signal-400 underline underline-offset-4">
                      {fmtUtc(f.run.created_at)}
                    </a>{' '}
                    failed{f.jobs.length ? `: ${f.jobs.join(', ')}` : ''}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-6 text-[14px] text-ink-400 leading-relaxed">
              What a pass proves: the server is up and its MCP session layer answers. What it does not prove: that a fare or a
              room rate came back. The search tests below send real searches.
            </p>
          </div>
        ) : (
          <div className="mt-10 max-w-3xl rounded-2xl border rule bg-ink-900/60 p-6">
            <p className="text-[15px] text-ink-300">
              The probe log could not be read for this render ({log.reason}). It is public:{' '}
              <a href={WORKFLOW_URL} rel="noopener" className="text-signal-400 underline underline-offset-4">
                every run, with its result
              </a>
              .
            </p>
          </div>
        )}
      </Section>

      {/* ============================== NIGHTLY TESTS ============================== */}
      <Section>
        <SectionHead
          eyebrow="Record 2"
          title="Nightly API tests on RapidAPI"
          lede={`${DATA.nightlyTests.suite}, ${DATA.nightlyTests.schedule}. Each test sends a real request to the live API and checks the answer. Dates are those of the nightly result mail.`}
        />
        <div className="mt-8 max-w-3xl scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Night</th>
                  <th className="px-4 py-3 font-normal text-right">Green</th>
                  <th className="px-4 py-3 font-normal">Note</th>
                </tr>
              </thead>
              <tbody>
                {[...nights].reverse().map((n) => (
                  <tr key={n.date} className="border-t rule">
                    <td className="px-4 py-3 font-mono text-[13px] text-ink-200 whitespace-nowrap">{n.date}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap ${n.passed === n.total ? 'text-verdict-low' : 'text-verdict-typical'}`}
                    >
                      {n.passed} of {n.total}
                    </td>
                    <td className="px-4 py-3 text-ink-400">{'note' in n ? n.note : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ============================== HUB CARDS ============================== */}
      <Section>
        <SectionHead
          eyebrow="Record 3"
          title="What RapidAPI measures on each listing"
          lede={`RapidAPI computes these and prints them on each listing. We copy them as shown, read on ${fmtUtc(DATA.hubCards.readAt.replace('Z', ':00Z'))}.`}
        />
        <div className="mt-8 max-w-3xl scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Listing</th>
                  <th className="px-4 py-3 font-normal text-right">Service level</th>
                  <th className="px-4 py-3 font-normal text-right">Success</th>
                  <th className="px-4 py-3 font-normal text-right">Latency</th>
                </tr>
              </thead>
              <tbody>
                {DATA.hubCards.rows.map((r) => (
                  <tr key={r.listing} className="border-t rule">
                    <td className="px-4 py-3 text-ink-100">
                      <a href={r.url} rel="noopener" className="hover:text-signal-400">
                        {r.listing}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-100">{r.serviceLevel}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-300">{r.success}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-300">{r.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
          A hotel search loads Booking.com live at request time, nothing cached, so set your client timeout well above the
          hotel latency shown here.
        </p>
      </Section>

      {/* ============================== FROM MATAN ============================== */}
      <Section>
        <div className="max-w-3xl">
          <SectionHead eyebrow="From the person who runs it" title="How it is built to stay up" />
          <p className="mt-6 text-[16px] text-ink-200 leading-relaxed">
            Matan Rabi, who builds FlightPowers, described it to a developer on 2026-09-18 as a design with no UI elements in
            the path, tested on a schedule a few times a day so he notices a break and fixes it right away, that has run{' '}
            <q className="text-ink-100">a year without a Google break</q>.
          </p>
          <p className="mt-6 text-[15px] text-ink-400 leading-relaxed">
            Need an SLA for real volume? Ask through RapidAPI messaging on either listing. Changes that ship are dated in the{' '}
            <Link href="/changelog" className="text-signal-400 underline underline-offset-4">
              changelog
            </Link>
            .
          </p>
        </div>
      </Section>

      {/* ============================== ERRORS ============================== */}
      <Section>
        <SectionHead
          eyebrow="When a call fails"
          title="What each answer means"
          lede="Copied from the API's own OpenAPI file at build time, so it cannot drift from the spec."
        />
        <div className="mt-8 max-w-4xl scroll-x rounded-2xl border rule">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-500 bg-ink-900/80">
                  <th className="px-4 py-3 font-normal">Code</th>
                  <th className="px-4 py-3 font-normal">Flights search</th>
                  <th className="px-4 py-3 font-normal">Hotels search</th>
                </tr>
              </thead>
              <tbody>
                {CODES.map((code) => (
                  <tr key={code} className="border-t rule align-top">
                    <td className="px-4 py-3 font-mono text-[13px] text-ink-100">{code}</td>
                    <td className="px-4 py-3 text-ink-400">{FLIGHT_RESPONSES[code]?.description ?? '-'}</td>
                    <td className="px-4 py-3 text-ink-400">{HOTEL_RESPONSES[code]?.description ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {SEARCH_STATUS ? (
          <p className="mt-6 max-w-3xl text-[14px] text-ink-400 leading-relaxed">
            <code className="field">X-Search-Status</code> on a flights 200: {SEARCH_STATUS}
          </p>
        ) : null}
        <p className="mt-4 max-w-3xl text-[14px] text-ink-400">
          The full spec is at{' '}
          <a href="/openapi.json" className="text-signal-400 underline underline-offset-4">
            /openapi.json
          </a>{' '}
          and the guide to it at{' '}
          <Link href="/docs" className="text-signal-400 underline underline-offset-4">
            /docs
          </Link>
          .
        </p>
      </Section>

      {/* ============================== LINKS ============================== */}
      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/mcp', label: 'MCP servers', sub: 'Flights and hotels for Claude, Cursor, ChatGPT' },
            { href: '/flights-api', label: 'Flights API', sub: 'Live Google Flights fares as JSON' },
            { href: '/hotels-api', label: 'Hotels API', sub: 'Live Booking.com rates as JSON' },
            { href: '/pricing', label: 'Pricing', sub: 'Plans read from the live listings' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl border rule bg-ink-900/50 p-5 hover:border-ink-500 transition-colors">
              <p className="text-[15px] font-semibold text-ink-100">{l.label}</p>
              <p className="mt-1 text-[13px] text-ink-400">{l.sub}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
