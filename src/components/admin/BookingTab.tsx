'use client';

import { useMemo } from 'react';
import type { HotelMetrics } from '@/lib/admin/hotel-metrics';
import {
  ChartFrame,
  HUES,
  Legend,
  LineChart,
  Note,
  STATUS,
  SeriesTable,
  StackedBarChart,
  Stat,
  fmtInt,
  fmtMs,
  fmtPct,
} from './chart-kit';
import type { ChartPoint, Series } from './chart-kit';

/**
 * The Booking tab — the hotels API.
 *
 * WHERE THE DATA COMES FROM. `hotel_metrics_10m` and `hotel_top_users_daily`,
 * created by the same migration as the flights tables but written by a rollup
 * in mtnrabi/hotel_agent: the hotels Lambdas are in eu-central-1 under a
 * different AWS identity, so their pipeline cannot live in flight_rabbi. Until
 * that rollup ships this tab is empty and says so.
 *
 * WHY `source` IS ON EVERY VIEW. On 2026-09-12, 124 `source=rapidapi` lines
 * were read as 124 customer calls. 79 were the bulk listing fanning out one
 * untagged lookup per hotel name, 26 were ours, 8 were Apify, and none was a
 * customer. Splitting by source everywhere is the fix; a single "calls" number
 * on this page would be the same mistake with better typography.
 */

/** Fixed slot order. A tool keeps its hue whatever else is on screen. */
const TOOL_SERIES: Series[] = [
  { key: 'search', label: 'search', color: HUES.blue },
  { key: 'by_name', label: 'by_name', color: HUES.orange },
  { key: 'bulk', label: 'bulk', color: HUES.aqua },
];

const SOURCE_SERIES: Series[] = [
  { key: 'rapidapi', label: 'rapidapi', color: HUES.blue },
  { key: 'bulk', label: 'bulk', color: HUES.orange },
  { key: 'apify', label: 'apify', color: HUES.aqua },
  { key: 'lulu', label: 'lulu', color: HUES.yellow },
  { key: 'api-front', label: 'api-front', color: HUES.violet },
];

function withUnknowns(known: Series[], seen: string[]): Series[] {
  const present = known.filter((s) => seen.includes(s.key));
  const extra = seen
    .filter((key) => !known.some((s) => s.key === key))
    .map((key) => ({ key, label: key, color: HUES.grey }));
  return [...present, ...extra];
}

export function BookingTab({ data }: { data: HotelMetrics }) {
  const tools = useMemo(() => withUnknowns(TOOL_SERIES, data.tools), [data.tools]);
  const sources = useMemo(() => withUnknowns(SOURCE_SERIES, data.sources), [data.sources]);

  const byToolPoints: ChartPoint[] = useMemo(
    () =>
      data.series.map((p) => ({
        t: p.t,
        values: Object.fromEntries(tools.map((s) => [s.key, p.byTool[s.key] ?? 0])),
        footer: `total ${fmtInt(p.calls)}`,
      })),
    [data.series, tools]
  );

  const bySourcePoints: ChartPoint[] = useMemo(
    () =>
      data.series.map((p) => ({
        t: p.t,
        values: Object.fromEntries(sources.map((s) => [s.key, p.bySource[s.key] ?? 0])),
        footer: `total ${fmtInt(p.calls)}`,
      })),
    [data.series, sources]
  );

  const latencyPoints: ChartPoint[] = useMemo(
    () =>
      data.series.map((p) => ({
        t: p.t,
        values: Object.fromEntries(tools.map((s) => [s.key, p.avgMsByTool[s.key] ?? null])),
      })),
    [data.series, tools]
  );

  // Two SINGLE-series charts rather than one with two lines. They measure
  // different things about the same denominator, and amber-next-to-red is the
  // one pair that fails the colour-vision check (ΔE 13.7 even in normal
  // vision). Separated, each is its own chart with its own title and there is
  // no adjacency to fail.
  const availableFalsePoints: ChartPoint[] = useMemo(
    () =>
      data.series.map((p) => ({
        t: p.t,
        values: {
          available_false: p.calls > 0 ? (p.byOutcome.available_false ?? 0) / p.calls : null,
        },
      })),
    [data.series]
  );

  const error5xxPoints: ChartPoint[] = useMemo(
    () =>
      data.series.map((p) => ({
        t: p.t,
        values: { error_5xx: p.calls > 0 ? (p.byOutcome.error_5xx ?? 0) / p.calls : null },
      })),
    [data.series]
  );

  if (data.schemaMissing) {
    return (
      <div className="mt-10 rounded-md border rule bg-ink-900 px-5 py-6">
        <p className="text-[15px] text-ink-200">The hotels tables do not exist yet.</p>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">
          Apply <code className="font-mono">db/0004_lane_metrics.sql</code> — the same file as{' '}
          <code className="font-mono">backend/ops/lane_metrics.sql</code> in flight_rabbi. One
          migration creates the flights tables and the hotels ones together.
        </p>
      </div>
    );
  }

  if (data.empty) {
    return (
      <div className="mt-10 rounded-md border rule bg-ink-900 px-5 py-6">
        <p className="text-[15px] text-ink-200">No hotel rows in this window.</p>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">
          The tables exist but nothing has written to them. They are filled by a rollup in
          mtnrabi/hotel_agent — the hotels Lambdas run in eu-central-1 under a different AWS
          identity, so their pipeline is separate from the flights one. Window read:{' '}
          <span className="font-mono">{data.range.fromIso}</span> →{' '}
          <span className="font-mono">{data.range.toIso}</span>.
        </p>
      </div>
    );
  }

  const { totals } = data;
  const resolution = data.range.resolution;

  return (
    <>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Calls" value={fmtInt(totals.calls)} note="every tool, every source" />
        <Stat
          label="available:false"
          value={fmtPct(totals.availableFalseShare)}
          tone="warning"
          note={`${fmtInt(totals.availableFalse)} searches answered 200 with nothing available`}
        />
        <Stat
          label="5xx share"
          value={fmtPct(totals.error5xxShare)}
          tone={totals.error5xxShare !== null && totals.error5xxShare > 0.05 ? 'critical' : undefined}
          note={`${fmtInt(totals.error5xx)} server errors · ${fmtInt(totals.error4xx)} 4xx`}
        />
        <Stat
          label="Avg · p50 · p90"
          value={`${fmtMs(totals.avgMs)} · ${fmtMs(totals.p50Ms)} · ${fmtMs(totals.p90Ms)}`}
        />
      </div>

      {/* ---- by tool ---- */}
      <section className="mt-12 border-t rule pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold text-ink-100">By tool</h2>
          <Legend items={tools} />
        </div>

        <ToolTable data={data} tools={tools} />

        {data.series.length > 1 ? (
          <>
            <ChartFrame
              title="Calls over time"
              subtitle={`stacked by tool, ${resolution} buckets, UTC`}
            >
              <StackedBarChart
                points={byToolPoints}
                series={tools}
                resolution={resolution}
                ariaLabel="Hotel calls per time bucket, stacked by tool."
              />
            </ChartFrame>
            <SeriesTable
              points={byToolPoints}
              series={tools}
              resolution={resolution}
              label="Calls by tool"
            />

            <ChartFrame
              title="Average wall clock over time"
              subtitle={`per tool, ${resolution} buckets, UTC`}
            >
              <LineChart
                points={latencyPoints}
                series={tools}
                resolution={resolution}
                ariaLabel="Average wall clock per time bucket, one line per hotel tool."
              />
            </ChartFrame>
            <SeriesTable
              points={latencyPoints}
              series={tools}
              resolution={resolution}
              format={fmtMs}
              label="Average wall clock by tool"
            />
          </>
        ) : null}
      </section>

      {/* ---- by source ---- */}
      <section className="mt-12 border-t rule pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold text-ink-100">By source</h2>
          <Legend items={sources} />
        </div>

        <SourceTable data={data} sources={sources} />

        {data.series.length > 1 ? (
          <>
            <ChartFrame
              title="Calls over time"
              subtitle={`stacked by source, ${resolution} buckets, UTC`}
            >
              <StackedBarChart
                points={bySourcePoints}
                series={sources}
                resolution={resolution}
                ariaLabel="Hotel calls per time bucket, stacked by attribution source."
              />
            </ChartFrame>
            <SeriesTable
              points={bySourcePoints}
              series={sources}
              resolution={resolution}
              label="Calls by source"
            />
          </>
        ) : null}

        <Note>
          <span className="text-ink-200">rapidapi</span> here means a direct Hub call and nothing
          else. The bulk listing fans out one untagged lookup per hotel name, and those arrive
          tagged <span className="font-mono">bulk</span> — which is why this split exists at all.
        </Note>
      </section>

      {/* ---- health ---- */}
      {data.series.length > 1 ? (
        <section className="mt-12 border-t rule pt-8">
          <h2 className="text-xl font-semibold text-ink-100">Health</h2>

          <ChartFrame
            title="available:false share"
            subtitle={`of all calls in the bucket, ${resolution}, UTC`}
          >
            <LineChart
              points={availableFalsePoints}
              series={[{ key: 'available_false', label: 'available:false', color: STATUS.warning }]}
              resolution={resolution}
              ariaLabel="Share of hotel calls per time bucket that answered 200 with nothing available."
              unit="pct"
            />
          </ChartFrame>

          <ChartFrame title="5xx share" subtitle={`of all calls in the bucket, ${resolution}, UTC`}>
            <LineChart
              points={error5xxPoints}
              series={[{ key: 'error_5xx', label: '5xx', color: STATUS.critical }]}
              resolution={resolution}
              ariaLabel="Share of hotel calls per time bucket that returned a 5xx."
              unit="pct"
            />
          </ChartFrame>

          <SeriesTable
            points={data.series.map((p) => ({
              t: p.t,
              values: {
                available_false: p.calls > 0 ? (p.byOutcome.available_false ?? 0) / p.calls : null,
                error_5xx: p.calls > 0 ? (p.byOutcome.error_5xx ?? 0) / p.calls : null,
              },
            }))}
            series={[
              { key: 'available_false', label: 'available:false', color: STATUS.warning },
              { key: 'error_5xx', label: '5xx', color: STATUS.critical },
            ]}
            resolution={resolution}
            format={(v) => fmtPct(v)}
            label="Health shares"
          />

          <Note>
            Both axes are pinned to 0–100%, so a quiet hour with one bad call does not draw itself
            as a crisis the height of the chart.
          </Note>
        </section>
      ) : null}

      {/* ---- top users ---- */}
      <section className="mt-12 border-t rule pt-8">
        <h2 className="text-xl font-semibold text-ink-100">Top callers</h2>
        <TopUsers data={data} />
      </section>
    </>
  );
}

function ToolTable({ data, tools }: { data: HotelMetrics; tools: Series[] }) {
  const colorFor = (tool: string) => tools.find((s) => s.key === tool)?.color ?? HUES.grey;
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[40rem] text-[14px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-400 font-mono">
            <th className="py-2 pr-4 font-normal">Tool</th>
            <th className="py-2 pr-4 font-normal text-right">Calls</th>
            <th className="py-2 pr-4 font-normal text-right">available:false</th>
            <th className="py-2 pr-4 font-normal text-right">4xx</th>
            <th className="py-2 pr-4 font-normal text-right">5xx</th>
            <th className="py-2 pr-4 font-normal text-right">Avg</th>
            <th className="py-2 pr-4 font-normal text-right">p50</th>
            <th className="py-2 font-normal text-right">p90</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.byTool.map((tool) => (
            <tr key={tool.tool} className="border-t rule">
              <td className="py-2 pr-4">
                <span className="flex items-center gap-2 text-ink-200 font-mono">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: colorFor(tool.tool) }}
                  />
                  {tool.tool}
                </span>
              </td>
              <td className="py-2 pr-4 text-right text-ink-200">{fmtInt(tool.calls)}</td>
              <td className="py-2 pr-4 text-right text-ink-300">
                {fmtInt(tool.availableFalse)}{' '}
                <span className="text-ink-400">
                  ({fmtPct(tool.calls > 0 ? tool.availableFalse / tool.calls : null)})
                </span>
              </td>
              <td className="py-2 pr-4 text-right text-ink-300">{fmtInt(tool.error4xx)}</td>
              <td className="py-2 pr-4 text-right text-ink-300">{fmtInt(tool.error5xx)}</td>
              <td className="py-2 pr-4 text-right text-ink-200">{fmtMs(tool.avgMs)}</td>
              <td className="py-2 pr-4 text-right text-ink-200">{fmtMs(tool.p50Ms)}</td>
              <td className="py-2 text-right text-ink-200">{fmtMs(tool.p90Ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceTable({ data, sources }: { data: HotelMetrics; sources: Series[] }) {
  const colorFor = (source: string) => sources.find((s) => s.key === source)?.color ?? HUES.grey;
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[32rem] text-[14px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-400 font-mono">
            <th className="py-2 pr-4 font-normal">Source</th>
            <th className="py-2 pr-4 font-normal text-right">Calls</th>
            <th className="py-2 pr-4 font-normal text-right">Share</th>
            <th className="py-2 pr-4 font-normal text-right">available:false</th>
            <th className="py-2 font-normal text-right">5xx</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.bySource.map((source) => (
            <tr key={source.source} className="border-t rule">
              <td className="py-2 pr-4">
                <span className="flex items-center gap-2 text-ink-200 font-mono">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: colorFor(source.source) }}
                  />
                  {source.source}
                </span>
              </td>
              <td className="py-2 pr-4 text-right text-ink-200">{fmtInt(source.calls)}</td>
              <td className="py-2 pr-4 text-right text-ink-400">
                {fmtPct(data.totals.calls > 0 ? source.calls / data.totals.calls : null)}
              </td>
              <td className="py-2 pr-4 text-right text-ink-300">{fmtInt(source.availableFalse)}</td>
              <td className="py-2 text-right text-ink-300">{fmtInt(source.error5xx)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopUsers({ data }: { data: HotelMetrics }) {
  if (data.topUsers.length === 0) {
    return (
      <Note>
        No attributed callers in this window. <span className="font-mono">hotel_top_users_daily</span>{' '}
        is a daily table, so a window shorter than a day can legitimately be empty while the charts
        above are not.
      </Note>
    );
  }

  const biggest = data.topUsers[0].calls;

  return (
    <>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-[14px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-400 font-mono">
              <th className="py-2 pr-4 font-normal">Caller</th>
              <th className="py-2 pr-4 font-normal text-right">Calls</th>
              <th className="py-2 pr-4 font-normal">Share of the top caller</th>
              <th className="py-2 font-normal">Sources</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.topUsers.map((user) => (
              <tr key={user.user} className="border-t rule">
                <td className="py-2 pr-4 font-mono text-ink-200">{user.user}</td>
                <td className="py-2 pr-4 text-right text-ink-200">{fmtInt(user.calls)}</td>
                <td className="py-2 pr-4">
                  {/* A bar, not a number twice: the ranking is the point. */}
                  <span
                    aria-hidden
                    className="block h-2 rounded-[2px]"
                    style={{
                      width: `${Math.max(2, (user.calls / biggest) * 100)}%`,
                      backgroundColor: HUES.blue,
                    }}
                  />
                </td>
                <td className="py-2 text-[12px] font-mono text-ink-400">
                  {Object.entries(user.bySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, calls]) => `${source} ${fmtInt(calls)}`)
                    .join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Note>
        {fmtInt(data.totals.namedCallers)} attributed callers in this window;{' '}
        <strong className="text-ink-200">{fmtInt(data.totals.unattributedCalls)}</strong> calls came
        in with no caller and are not in the ranking. A list of our biggest customers headed by
        “unknown” is not a list of customers — but an unattributed share that grows is a bug in the
        attribution, so it is reported rather than hidden. Daily grain, so a partial first or last
        day is counted whole.
      </Note>
    </>
  );
}
