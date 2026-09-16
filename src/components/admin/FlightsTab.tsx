'use client';

import { useMemo } from 'react';
import type { LaneMetrics, LanePoint, LaneSummary } from '@/lib/admin/lane-metrics';
import {
  ChartFrame,
  HUES,
  Legend,
  LineChart,
  Note,
  SeriesTable,
  StackedBarChart,
  Stat,
  TEXT_MUTED,
  fmtInt,
  fmtMs,
  fmtPct,
  fmtPercentile,
  fmtUsd,
} from './chart-kit';
import type { ChartPoint, Series } from './chart-kit';

/**
 * The Flights tab — the direct-first experiment, lane by lane.
 *
 * One entity, one hue, everywhere on this tab: the green in the volume chart
 * and the green in the latency chart are the same transport, and adding a lane
 * never repaints anything.
 */

const TRANSPORTS: Series[] = [
  // Stack order, bottom to top.
  { key: 'direct', label: 'Direct', color: HUES.aqua },
  { key: 'direct_then_proxied', label: 'Direct, then proxied', color: HUES.orange },
  { key: 'proxied', label: 'Proxied', color: HUES.blue },
  { key: 'unknown', label: 'Unknown', color: HUES.grey },
];

const COLOR_BY_TRANSPORT = Object.fromEntries(TRANSPORTS.map((t) => [t.key, t.color]));
const LABEL_BY_TRANSPORT = Object.fromEntries(TRANSPORTS.map((t) => [t.key, t.label]));

export function FlightsTab({ data }: { data: LaneMetrics }) {
  if (data.empty) {
    return (
      <div className="mt-10 rounded-md border rule bg-ink-900 px-5 py-6">
        <p className="text-[15px] text-ink-200">No lane rows in this window.</p>
        <p className="mt-3 text-[14px] text-ink-400 leading-relaxed">
          Expected until the backend emits <code className="font-mono">[lane]</code> lines
          (flight_rabbi PR A) and the 20-minute rollup (PR B) has run at least once. Window read:{' '}
          <span className="font-mono">{data.range.fromIso}</span> →{' '}
          <span className="font-mono">{data.range.toIso}</span>.
        </p>
      </div>
    );
  }

  const { totals } = data;
  const saved = totals.allProxiedCostUsd - totals.estimatedCostUsd;

  return (
    <>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Calls" value={fmtInt(totals.calls)} note="every lane, every outcome" />
        <Stat
          label="Direct-first hit rate"
          value={fmtPct(totals.directFirstHitRate)}
          note={`${fmtInt(totals.directCalls)} of ${fmtInt(
            totals.directCalls + totals.fallbackCalls
          )} direct attempts never touched a proxy`}
        />
        <Stat
          label="Blocked rate"
          value={fmtPct(totals.blockedRate)}
          tone={totals.blockedRate !== null && totals.blockedRate > 0.05 ? 'warning' : undefined}
          note={`${fmtInt(totals.directBlocked)} direct attempts blocked`}
        />
        <Stat
          label="Proxied share"
          value={fmtPct(totals.proxiedShare)}
          note={`${fmtInt(totals.proxiedCalls + totals.fallbackCalls)} calls touched a proxy`}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Stat
          label="Estimated cost"
          value={fmtUsd(totals.estimatedCostUsd)}
          note="proxied and fallback calls at $0.00106, direct at $0.000017 — an estimate from per-call rates, not a bill"
        />
        <Stat
          label="If everything were proxied"
          value={fmtUsd(totals.allProxiedCostUsd)}
          note={
            saved > 0 ? `${fmtUsd(saved)} less on the estimate as it stands` : 'no direct traffic yet'
          }
        />
      </div>

      {data.lanes.map((lane) => (
        <LaneSection
          key={lane.lane}
          lane={lane}
          points={data.series[lane.lane] ?? []}
          resolution={data.range.resolution}
        />
      ))}
    </>
  );
}

function LaneSection({
  lane,
  points,
  resolution,
}: {
  lane: LaneSummary;
  points: LanePoint[];
  resolution: string;
}) {
  const present = useMemo(
    () => TRANSPORTS.filter((t) => points.some((p) => (p.byTransport[t.key]?.calls ?? 0) > 0)),
    [points]
  );

  const volume: ChartPoint[] = useMemo(
    () =>
      points.map((p) => ({
        t: p.t,
        values: Object.fromEntries(
          present.map((s) => [s.key, p.byTransport[s.key]?.calls ?? 0])
        ),
        footer: `total ${fmtInt(p.calls)} · blocked ${fmtInt(p.directBlocked)}`,
      })),
    [points, present]
  );

  const latency: ChartPoint[] = useMemo(
    () =>
      points.map((p) => ({
        t: p.t,
        values: Object.fromEntries(present.map((s) => [s.key, p.byTransport[s.key]?.avgMs ?? null])),
      })),
    [points, present]
  );

  return (
    <section className="mt-12 border-t rule pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold text-ink-100">
          <span className="font-mono text-signal-500">{lane.lane}</span> lane
        </h2>
        <Legend items={present} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Calls" value={fmtInt(lane.calls)} />
        <Stat label="Direct blocked" value={fmtInt(lane.directBlocked)} />
        <Stat label="Avg (wall clock)" value={fmtMs(lane.avgMs)} />
        <Stat
          label="p50 / p90"
          value={`${fmtPercentile(lane.p50Ms, lane.p50Overflow)} / ${fmtPercentile(
            lane.p90Ms,
            lane.p90Overflow
          )}`}
        />
      </div>

      <TransportTable lane={lane} />

      {points.length > 1 ? (
        <>
          <ChartFrame
            title="Calls over time"
            subtitle={`stacked by transport, ${resolution} buckets, UTC`}
          >
            <StackedBarChart
              points={volume}
              series={present}
              resolution={resolution}
              ariaLabel={`Calls per time bucket on the ${lane.lane} lane, stacked by transport.`}
            />
          </ChartFrame>
          <SeriesTable
            points={volume}
            series={present}
            resolution={resolution}
            label="Calls by transport"
          />

          <ChartFrame
            title="Average wall clock over time"
            subtitle={`per transport, ${resolution} buckets, UTC`}
          >
            <LineChart
              points={latency}
              series={present}
              resolution={resolution}
              ariaLabel={`Average wall clock per time bucket on the ${lane.lane} lane, one line per transport.`}
            />
          </ChartFrame>
          <SeriesTable
            points={latency}
            series={present}
            resolution={resolution}
            format={fmtMs}
            label="Average wall clock by transport"
          />
        </>
      ) : (
        <p className="mt-6 text-[14px] text-ink-400">
          Not enough buckets in this window to draw a trend.
        </p>
      )}
    </section>
  );
}

/**
 * The per-transport table, and the accessible alternative to the charts.
 *
 * The footnote is not decoration. p50/p90 come from a histogram of the WALL
 * CLOCK, so they belong to the transport that served the call; the two average
 * figures underneath come from the per-leg sums, which include the direct leg
 * of a call that fell back. Mixing the two silently is how a number ends up
 * being argued about six weeks later.
 */
function TransportTable({ lane }: { lane: LaneSummary }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-[14px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-400 font-mono">
            <th className="py-2 pr-4 font-normal">Transport</th>
            <th className="py-2 pr-4 font-normal text-right">Calls</th>
            <th className="py-2 pr-4 font-normal text-right">Share</th>
            <th className="py-2 pr-4 font-normal text-right">Avg</th>
            <th className="py-2 pr-4 font-normal text-right">p50</th>
            <th className="py-2 font-normal text-right">p90</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {lane.byTransport.map((slice) => (
            <tr key={slice.transport} className="border-t rule">
              <td className="py-2 pr-4">
                <span className="flex items-center gap-2 text-ink-200">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: COLOR_BY_TRANSPORT[slice.transport] ?? TEXT_MUTED }}
                  />
                  {LABEL_BY_TRANSPORT[slice.transport] ?? slice.transport}
                </span>
              </td>
              <td className="py-2 pr-4 text-right text-ink-200">{fmtInt(slice.calls)}</td>
              <td className="py-2 pr-4 text-right text-ink-400">
                {fmtPct(lane.calls > 0 ? slice.calls / lane.calls : null)}
              </td>
              <td className="py-2 pr-4 text-right text-ink-200">{fmtMs(slice.avgMs)}</td>
              <td className="py-2 pr-4 text-right text-ink-200">
                {fmtPercentile(slice.p50Ms, slice.p50Overflow)}
              </td>
              <td className="py-2 text-right text-ink-200">
                {fmtPercentile(slice.p90Ms, slice.p90Overflow)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Note>
        Per-leg averages, which include the two legs of a call that fell back:{' '}
        <strong className="text-ink-200">direct leg {fmtMs(lane.avgDirectLegMs)}</strong>,{' '}
        <strong className="text-ink-200">proxied leg {fmtMs(lane.avgProxiedLegMs)}</strong>. The
        avg/p50/p90 in the table above are the wall clock of the calls each transport served, so a
        “direct, then proxied” row is both legs together.
      </Note>
    </div>
  );
}
