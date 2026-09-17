'use client';

import { useMemo } from 'react';
import type { LambdaFunctionSummary, LambdaPoint, LambdaReport } from '@/lib/admin/lambda-report';
import {
  ChartFrame,
  HUES,
  Legend,
  LineChart,
  Note,
  SeriesTable,
  Stat,
  fmtInt,
  fmtMb,
  fmtMs,
  fmtPct,
  fmtPercentile,
  fmtUsd,
} from './chart-kit';
import type { ChartPoint, Series } from './chart-kit';

/**
 * The Lambda panel — the CloudWatch REPORT line, on both tabs.
 *
 * WHAT IT ANSWERS. Everything else on this dashboard measures a request: which
 * lane, which tool, what the caller waited. This measures the container the
 * request ran in — how much of the memory we pay for on every single call was
 * actually used, how often a call was killed by the timeout, how often the
 * runtime was OOM-killed, and what the compute cost. Those are the numbers the
 * "is 1024 MB the right allocation" decision is made from, and none of them
 * appears in an application log.
 *
 * WHY MEDIAN AND p99 AND MAX, NOT ONE "MEMORY" NUMBER. The average says what a
 * typical call used, which is what you would size on and be wrong; the tail is
 * what an OOM kill is made of. Showing four figures against the allocation
 * makes the headroom the reader's own arithmetic instead of ours.
 *
 * SAME COMPONENT ON BOTH TABS. Flights renders `flyMyGApi`, Booking renders
 * `hotelAgent` and `multipleHotelsAgent` side by side. One panel means the
 * flights memory chart and the hotels memory chart cannot drift into meaning
 * two different things.
 */

/**
 * The top edge of `mem_hist` (MEMORY_EDGES_MB in lib/admin/lambda-report.ts).
 * Named here rather than imported so this client component never pulls in that
 * 'server-only' module — the same reason FlightsTab names GENERAL_LANE itself.
 */
const MEMORY_TOP_EDGE_MB = 2048;

/** One hue per measure, fixed, and the same on both tabs. */
const MEMORY_SERIES: Series[] = [
  { key: 'median', label: 'Median', color: HUES.aqua },
  { key: 'p99', label: 'p99', color: HUES.orange },
  { key: 'max', label: 'Max', color: HUES.violet },
];

type Percentile = { value: number | null; overflow: boolean };

/**
 * A memory percentile that may have landed in the unbounded `>= 2048 MB`
 * slot. `> 2048 MB` and `—` must not render the same: one is "bigger than the
 * top edge", the other is "no samples", and they mean opposite things.
 */
function fmtMemPercentile(p: Percentile | undefined): string {
  if (!p) return '—';
  return p.overflow ? `> ${fmtMb(MEMORY_TOP_EDGE_MB)}` : fmtMb(p.value);
}

function allocationNote(allocationMb: number | null): string {
  return allocationMb ? `of ${fmtMb(allocationMb)} allocated` : 'allocation not recorded yet';
}

export function LambdaPanel({
  report,
  error,
  functions,
  subtitle,
}: {
  report: LambdaReport | null;
  error: string | null;
  /** which functions this tab shows, in the order it shows them */
  functions: string[];
  /** one line under the heading naming the product these functions serve */
  subtitle: string;
}) {
  return (
    <section className="mt-12 border-t rule pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink-100">Lambda</h2>
          <p className="mt-1 text-[13px] text-ink-400">{subtitle}</p>
        </div>
        {report && !report.schemaMissing ? <Legend items={MEMORY_SERIES} /> : null}
      </div>

      <Body report={report} error={error} functions={functions} />
    </section>
  );
}

function Body({
  report,
  error,
  functions,
}: {
  report: LambdaReport | null;
  error: string | null;
  functions: string[];
}) {
  if (error) {
    return (
      <p className="mt-6 rounded-md border border-verdict-high/40 bg-verdict-high/10 px-4 py-3 text-[14px] text-ink-200">
        {error}
      </p>
    );
  }

  if (!report) {
    return <p className="mt-6 text-[14px] text-ink-400">Loading…</p>;
  }

  // The migration and the rows arrive at different times and for different
  // reasons, so they are different messages. "Nothing here" that turns out to
  // mean "you never ran the migration" is an hour of looking at the rollup.
  if (report.schemaMissing) {
    return (
      <div className="mt-6 rounded-md border rule bg-ink-900 px-5 py-6">
        <p className="text-[15px] text-ink-200">
          The table does not exist — the migration has not been applied.
        </p>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">
          Apply <code className="font-mono">db/0005_lambda_report.sql</code> on the same Neon
          database the rest of this page reads (it mirrors{' '}
          <code className="font-mono">backend/ops/lane_metrics.sql</code> in flight_rabbi). Until
          then there is nothing for the rollups to write to.
        </p>
      </div>
    );
  }

  return (
    <div className={functions.length > 1 ? 'grid gap-8 lg:grid-cols-2' : ''}>
      {functions.map((name) => (
        <FunctionBlock
          key={name}
          name={name}
          summary={report.functions[name]}
          points={report.series[name] ?? []}
          resolution={report.range.resolution}
          fromIso={report.range.fromIso}
          toIso={report.range.toIso}
          compact={functions.length > 1}
        />
      ))}
    </div>
  );
}

function FunctionBlock({
  name,
  summary,
  points,
  resolution,
  fromIso,
  toIso,
  compact,
}: {
  name: string;
  summary: LambdaFunctionSummary | undefined;
  points: LambdaPoint[];
  resolution: string;
  fromIso: string;
  toIso: string;
  /** two functions share a row on the Booking tab, so the cards stack narrower */
  compact: boolean;
}) {
  const memoryPoints: ChartPoint[] = useMemo(
    () =>
      points.map((p) => ({
        t: p.t,
        values: {
          // An overflow percentile has no number to plot, so it is a GAP in
          // the line rather than a point at the top edge. The cards say
          // `> 2048 MB` for the same bucket; a line drawn at 2048 would say
          // "exactly the top edge", which is the one thing we know it is not.
          median: p.memMedian.value,
          p99: p.memP99.value,
          max: p.memMaxMb,
        },
        footer: `${fmtInt(p.invocations)} invocations`,
      })),
    [points]
  );

  // An OOM kill leaves NO REPORT line -- the runtime dies before one is
  // written -- so a function can have zero invocations in this table and still
  // have something worth showing. "Nothing here" has to mean nothing at all.
  const silent =
    !summary || (summary.invocations === 0 && summary.oomKills === 0 && summary.timeouts === 0);

  if (silent) {
    return (
      <div className="mt-6 rounded-md border rule bg-ink-900 px-5 py-6">
        <p className="text-[15px] text-ink-200">
          No REPORT rows for <span className="font-mono text-signal-500">{name}</span> in this
          window.
        </p>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">
          The table exists; nothing has been written for this function yet. It is filled by the
          same 20-minute rollup that writes the lane tables —{' '}
          {name === 'flyMyGApi' ? 'flight_rabbi' : 'hotel_agent'}&apos;s — from the REPORT lines
          CloudWatch still holds. Window read: <span className="font-mono">{fromIso}</span> →{' '}
          <span className="font-mono">{toIso}</span>.
        </p>
      </div>
    );
  }

  const allocationMb = summary.allocationMb;
  const memoryCols = compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4';
  const opsCols = compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-5';

  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-medium text-ink-100">
        <span className="font-mono text-signal-500">{name}</span>{' '}
        <span className="text-ink-400 font-normal">
          · {fmtInt(summary.invocations)} invocations
        </span>
      </h3>

      <div className={`mt-4 grid gap-3 ${memoryCols}`}>
        <Stat
          label="Median memory"
          value={fmtMemPercentile(summary.memMedian)}
          note={allocationNote(allocationMb)}
        />
        <Stat
          label="Average memory"
          value={fmtMb(summary.memAvgMb)}
          note={allocationNote(allocationMb)}
        />
        <Stat
          label="p99 memory"
          value={fmtMemPercentile(summary.memP99)}
          note={allocationNote(allocationMb)}
        />
        <Stat
          label="Max memory"
          value={fmtMb(summary.memMaxMb)}
          note={
            summary.memHeadroom !== null
              ? `${fmtPct(summary.memHeadroom)} of ${fmtMb(allocationMb)} allocated`
              : allocationNote(allocationMb)
          }
          tone={summary.memHeadroom !== null && summary.memHeadroom > 0.9 ? 'critical' : undefined}
        />
      </div>

      <div className={`mt-3 grid gap-3 ${opsCols}`}>
        <Stat
          label="Duration p50 / p90"
          value={`${fmtPercentile(summary.durP50.value, summary.durP50.overflow)} / ${fmtPercentile(
            summary.durP90.value,
            summary.durP90.overflow
          )}`}
          note={`avg ${fmtMs(summary.durAvgMs)}`}
        />
        <Stat
          label="Timeouts"
          value={fmtInt(summary.timeouts)}
          tone={summary.timeouts > 0 ? 'warning' : undefined}
          note="REPORT lines with Status: timeout"
        />
        <Stat
          label="OOM kills"
          value={fmtInt(summary.oomKills)}
          tone={summary.oomKills > 0 ? 'critical' : undefined}
          note="runtime killed, no Max Memory line"
        />
        <Stat
          label="Cold starts"
          value={fmtInt(summary.coldStarts)}
          note={`${fmtPct(
            summary.invocations > 0 ? summary.coldStarts / summary.invocations : null
          )} of invocations`}
        />
        <Stat
          label="Estimated cost"
          value={fmtUsd(summary.estimatedCostUsd)}
          note="billed duration × allocation at $0.0000166667 per GB-second — compute only, an estimate rather than a bill"
        />
      </div>

      {points.length > 1 ? (
        <>
          <ChartFrame
            title="Memory used over time"
            subtitle={`median, p99 and max, ${resolution} buckets, UTC`}
          >
            <LineChart
              points={memoryPoints}
              series={MEMORY_SERIES}
              resolution={resolution}
              unit="mb"
              reference={
                allocationMb
                  ? { value: allocationMb, label: `allocated ${fmtMb(allocationMb)}` }
                  : undefined
              }
              ariaLabel={`Memory used per time bucket by ${name}: median, p99 and max, against an allocation of ${fmtMb(
                allocationMb
              )}.`}
            />
          </ChartFrame>
          <SeriesTable
            points={memoryPoints}
            series={MEMORY_SERIES}
            resolution={resolution}
            format={fmtMb}
            label={`${name} memory by bucket`}
          />
        </>
      ) : (
        <p className="mt-6 text-[14px] text-ink-400">
          Not enough buckets in this window to draw a trend.
        </p>
      )}

      <Note>
        Median and p99 come from a 16-slot fixed-edge histogram, so they are the upper edge of the
        bucket the percentile falls in; a percentile past the top edge reads{' '}
        <span className="font-mono">&gt; {fmtMb(MEMORY_TOP_EDGE_MB)}</span> and is a gap in the
        chart rather than a point. Max is exact — it is the largest{' '}
        <span className="font-mono">Max Memory Used</span> in the window, not a bucket edge.
      </Note>
    </div>
  );
}
