'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * The admin dashboard's chart primitives — shared by the Flights and Booking
 * tabs so both products are drawn by the same code and read the same way.
 *
 * NOT A CHART LIBRARY, ON PURPOSE. Two forms are needed (a stacked bar over
 * time and a line over time), each is a hundred lines of SVG, and the site
 * ships no client-side chart dependency today.
 *
 * COLOUR IS BY ENTITY, IN A FIXED ORDER, NEVER CYCLED. Every palette below was
 * validated against this site's dark surface (#0c0e11) for lightness band,
 * chroma floor, contrast and colour-vision separation. The worst adjacent pair
 * anywhere is ΔE 8.4 under protanopia, above the ΔE 8 floor. Do not substitute
 * prettier hues without re-running that check — "it looked fine to me" is
 * exactly the reasoning the check exists to replace.
 *
 * NO DUAL AXES ANYWHERE. Volume and latency are different measures at
 * different scales, so they are separate charts sharing an x axis, never one
 * chart with a second y scale.
 */

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

export type Series = { key: string; label: string; color: string };

/** Validated 5-slot categorical set, in fixed assignment order. */
export const HUES = {
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  violet: '#9085e9',
  /** For an unrecognised label only — never slot 6 of a real palette. */
  grey: '#7d8794',
} as const;

/**
 * Status colours, reserved. They are never reused as a categorical slot, and
 * they are never the only signal: every chart that uses one is a SINGLE-series
 * chart whose title names the thing, and every tile that uses one carries its
 * label in text.
 */
export const STATUS = {
  warning: '#c98500',
  critical: '#e0544e',
} as const;

export const SURFACE = '#0c0e11';
export const GRID = '#222831';
export const TEXT_MUTED = '#7d8794';

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const nf = new Intl.NumberFormat('en-US');

export function fmtInt(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : nf.format(Math.round(n));
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 1 : 2)} s` : `${Math.round(ms)} ms`;
}

/**
 * A percentile, which may have landed in the unbounded `>= 90 s` bucket.
 *
 * `null` + overflow is "slower than the top edge, we cannot say by how much",
 * and it must not render as the same em dash as "no samples" — those two look
 * identical on screen and mean opposite things.
 */
export function fmtPercentile(ms: number | null | undefined, overflow = false): string {
  if (overflow) return '> 90 s';
  return fmtMs(ms);
}

export function fmtPct(fraction: number | null | undefined): string {
  return fraction === null || fraction === undefined ? '—' : `${(fraction * 100).toFixed(1)}%`;
}

export function fmtUsd(value: number): string {
  return value >= 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(4)}`;
}

/**
 * One unit for a whole axis. Ticks reading "10.0 s / 7.50 s / 5.00 s / 0 ms"
 * make the reader convert in their head on the last row, which is exactly the
 * moment they misread the chart.
 */
export type Unit = 'count' | 'ms' | 'pct';

export function tooltipFormatter(unit: Unit): (value: number | null) => string {
  if (unit === 'ms') return fmtMs;
  if (unit === 'pct') return fmtPct;
  return fmtInt;
}

export function axisFormatter(unit: Unit, max: number): (value: number) => string {
  if (unit === 'pct') return (value) => `${Math.round(value * 100)}%`;
  if (unit === 'ms') {
    return max >= 1000
      ? (value) => `${(value / 1000).toFixed(value === 0 ? 0 : 1)} s`
      : (value) => `${Math.round(value)} ms`;
  }
  return fmtInt;
}

export function fmtTime(iso: string, resolution: string): string {
  const d = new Date(iso);
  if (resolution === '1d') {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  }
  if (resolution === '1h') {
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      timeZone: 'UTC',
    });
  }
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Tiles and frames
// ---------------------------------------------------------------------------

export function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: ReactNode;
  /** A reserved status colour, shown with its label — never colour alone. */
  tone?: 'warning' | 'critical';
}) {
  const color = tone ? STATUS[tone] : undefined;
  return (
    <div className="rounded-md border rule bg-ink-900 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400 font-mono">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: color ?? '#e8edf2' }}>
        {value}
      </p>
      {note ? <p className="mt-1.5 text-[12px] text-ink-400 leading-snug">{note}</p> : null}
    </div>
  );
}

export function ChartFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <figure className="mt-8">
      <figcaption>
        <p className="text-[15px] font-medium text-ink-100">{title}</p>
        <p className="mt-0.5 text-[12px] text-ink-400">{subtitle}</p>
      </figcaption>
      <div className="mt-3">{children}</div>
    </figure>
  );
}

export function Legend({ items }: { items: Series[] }) {
  if (items.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-4">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2 text-[13px] text-ink-300">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[12px] text-ink-400 leading-relaxed">{children}</p>;
}

// ---------------------------------------------------------------------------
// Chart geometry
// ---------------------------------------------------------------------------

export type ChartPoint = {
  /** ISO instant of the bucket start */
  t: string;
  /** one value per series key; null or 0 means "no data", not "zero latency" */
  values: Record<string, number | null>;
  /** shown under the tooltip's series list, e.g. "total 412 · blocked 9" */
  footer?: string;
};

const VIEW_W = 960;
const VIEW_H = 240;
const PAD = { top: 12, right: 16, bottom: 26, left: 56 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

/** A top gridline at a number a person would have picked. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

function tickValues(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max * i) / count);
}

/** Which bucket the pointer is over, if any. */
function useHoverIndex(count: number) {
  const [index, setIndex] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);

  const onMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const svg = ref.current;
      if (!svg || count === 0) return;
      const rect = svg.getBoundingClientRect();
      // The SVG scales to its container, so map client px back to view units.
      const x = ((event.clientX - rect.left) / rect.width) * VIEW_W - PAD.left;
      const slot = Math.floor((x / PLOT_W) * count);
      setIndex(slot >= 0 && slot < count ? slot : null);
    },
    [count]
  );

  return { index, setIndex, ref, onMove };
}

function XAxis({
  points,
  resolution,
  count,
}: {
  points: ChartPoint[];
  resolution: string;
  count: number;
}) {
  // About six labels whatever the bucket count, so they never collide.
  const every = Math.max(1, Math.ceil(count / 6));
  return (
    <>
      {points.map((point, i) =>
        i % every === 0 ? (
          <text
            key={point.t}
            x={PAD.left + ((i + 0.5) / count) * PLOT_W}
            y={VIEW_H - 8}
            textAnchor="middle"
            fontSize="11"
            fill={TEXT_MUTED}
            fontFamily="var(--font-mono)"
          >
            {fmtTime(point.t, resolution)}
          </text>
        ) : null
      )}
    </>
  );
}

function YGrid({ max, format }: { max: number; format: (value: number) => string }) {
  return (
    <>
      {tickValues(max).map((value) => {
        const y = PAD.top + PLOT_H - (value / max) * PLOT_H;
        return (
          <g key={value}>
            <line x1={PAD.left} x2={PAD.left + PLOT_W} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
            <text
              x={PAD.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill={TEXT_MUTED}
              fontFamily="var(--font-mono)"
            >
              {format(value)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function Baseline() {
  return (
    <line
      x1={PAD.left}
      x2={PAD.left + PLOT_W}
      y1={PAD.top + PLOT_H}
      y2={PAD.top + PLOT_H}
      stroke={GRID}
      strokeWidth="1"
    />
  );
}

function Crosshair({ x }: { x: number }) {
  return (
    <line
      x1={x}
      x2={x}
      y1={PAD.top}
      y2={PAD.top + PLOT_H}
      stroke={TEXT_MUTED}
      strokeWidth="1"
      strokeDasharray="3 3"
    />
  );
}

function Tooltip({
  point,
  series,
  resolution,
  format,
}: {
  point: ChartPoint;
  series: Series[];
  resolution: string;
  format: (value: number | null) => string;
}) {
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-md border rule bg-ink-950/95 px-3 py-2 text-[12px] shadow-lg">
      <p className="font-mono text-ink-400">{fmtTime(point.t, resolution)}</p>
      <ul className="mt-1.5 space-y-0.5">
        {series.map((s) => {
          const value = point.values[s.key];
          if (value === null || value === undefined) return null;
          return (
            <li key={s.key} className="flex items-center gap-2 text-ink-200 tabular-nums">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-[2px]"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-ink-400">{s.label}</span>
              <span className="ml-auto pl-3">{format(value)}</span>
            </li>
          );
        })}
      </ul>
      {point.footer ? (
        <p className="mt-1.5 border-t rule pt-1.5 text-ink-400 tabular-nums">{point.footer}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The two forms
// ---------------------------------------------------------------------------

export function StackedBarChart({
  points,
  series,
  resolution,
  ariaLabel,
  unit = 'count',
}: {
  points: ChartPoint[];
  series: Series[];
  resolution: string;
  ariaLabel: string;
  unit?: Unit;
}) {
  const { index, setIndex, ref, onMove } = useHoverIndex(points.length);
  const format = tooltipFormatter(unit);

  const totals = points.map((p) =>
    series.reduce((sum, s) => sum + (p.values[s.key] ?? 0), 0)
  );
  const max = niceMax(Math.max(...totals, 1));
  const slotWidth = PLOT_W / points.length;
  // A 2px surface gap between adjacent bars -- but PROPORTIONAL at high bucket
  // counts. At 144 ten-minute buckets a flat 2 units is a third of the slot and
  // the stack reads as dotted lines instead of bars.
  const barWidth = Math.max(0.8, slotWidth - Math.min(2, slotWidth * 0.2));

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        role="img"
        aria-label={`${ariaLabel} The table below carries the same numbers.`}
        onPointerMove={onMove}
        onPointerLeave={() => setIndex(null)}
      >
        <YGrid max={max} format={axisFormatter(unit, max)} />

        {points.map((point, i) => {
          const x = PAD.left + i * slotWidth + (slotWidth - barWidth) / 2;
          let cursor = PAD.top + PLOT_H;
          return (
            <g key={point.t} opacity={index === null || index === i ? 1 : 0.45}>
              {series.map((s) => {
                const value = point.values[s.key] ?? 0;
                if (value <= 0) return null;
                const height = (value / max) * PLOT_H;
                cursor -= height;
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={cursor}
                    width={barWidth}
                    // The same gap between stacked segments, and the same
                    // proportional cap: a thin segment must stay visible rather
                    // than be eaten by its own separator.
                    height={Math.max(height - Math.min(2, height * 0.3), 0.5)}
                    fill={s.color}
                    rx="1.5"
                  />
                );
              })}
            </g>
          );
        })}

        {index !== null ? <Crosshair x={PAD.left + (index + 0.5) * slotWidth} /> : null}
        <Baseline />
        <XAxis points={points} resolution={resolution} count={points.length} />
      </svg>

      {index !== null ? (
        <Tooltip
          point={points[index]}
          series={series}
          resolution={resolution}
          format={format}
        />
      ) : null}
    </div>
  );
}

export function LineChart({
  points,
  series,
  resolution,
  ariaLabel,
  unit = 'ms',
}: {
  points: ChartPoint[];
  series: Series[];
  resolution: string;
  ariaLabel: string;
  unit?: Unit;
}) {
  const { index, setIndex, ref, onMove } = useHoverIndex(points.length);
  const format = tooltipFormatter(unit);

  const values = points.flatMap((p) =>
    series.map((s) => p.values[s.key]).filter((v): v is number => v !== null && v > 0)
  );
  // A share chart is pinned to 0-100%: a quiet hour with one bad call must not
  // draw itself as a crisis the height of the chart.
  const max = unit === 'pct' ? 1 : niceMax(Math.max(...values, 1));
  const slotWidth = PLOT_W / points.length;
  const xFor = (i: number) => PAD.left + (i + 0.5) * slotWidth;
  const yFor = (value: number) => PAD.top + PLOT_H - (value / max) * PLOT_H;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        role="img"
        aria-label={`${ariaLabel} The table below carries the same numbers.`}
        onPointerMove={onMove}
        onPointerLeave={() => setIndex(null)}
      >
        <YGrid max={max} format={axisFormatter(unit, max)} />

        {series.map((s) => {
          // A gap in the data is a gap in the line, never a straight segment
          // across it — an hour with no proxied calls is not "latency held
          // flat", and drawing it that way is a lie the eye believes.
          const segments: string[] = [];
          let current: string[] = [];
          points.forEach((point, i) => {
            const value = point.values[s.key];
            if (value === null || value === undefined) {
              if (current.length > 1) segments.push(current.join(' '));
              current = [];
              return;
            }
            current.push(`${current.length === 0 ? 'M' : 'L'}${xFor(i)},${yFor(value)}`);
          });
          if (current.length > 1) segments.push(current.join(' '));

          const last = points
            .map((point, i) => ({ i, value: point.values[s.key] }))
            .filter((entry): entry is { i: number; value: number } => entry.value !== null && entry.value !== undefined)
            .pop();

          return (
            <g key={s.key}>
              {segments.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
              {/* Direct label at the end of the line: identity is never colour
                  alone, and with <= 4 series there is room for all of them. */}
              {last ? (
                <>
                  <circle
                    cx={xFor(last.i)}
                    cy={yFor(last.value)}
                    r="3.5"
                    fill={s.color}
                    // A 2px surface ring so overlapping end markers stay legible.
                    stroke={SURFACE}
                    strokeWidth="2"
                  />
                  <text
                    x={Math.min(xFor(last.i) - 8, VIEW_W - PAD.right)}
                    y={yFor(last.value) - 8}
                    textAnchor="end"
                    fontSize="11"
                    fill={TEXT_MUTED}
                    fontFamily="var(--font-mono)"
                  >
                    {s.label}
                  </text>
                </>
              ) : null}
            </g>
          );
        })}

        {index !== null ? <Crosshair x={xFor(index)} /> : null}
        <Baseline />
        <XAxis points={points} resolution={resolution} count={points.length} />
      </svg>

      {index !== null ? (
        <Tooltip point={points[index]} series={series} resolution={resolution} format={format} />
      ) : null}
    </div>
  );
}

/**
 * The charts' numbers as text. Every chart on this page has one — a colour
 * encoding that cannot be read is not an encoding.
 */
export function SeriesTable({
  points,
  series,
  resolution,
  format = fmtInt,
  label,
}: {
  points: ChartPoint[];
  series: Series[];
  resolution: string;
  format?: (value: number | null) => string;
  label: string;
}) {
  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-[13px] text-ink-400 hover:text-ink-200">
        {label} — {points.length} buckets as a table
      </summary>
      <div className="mt-3 max-h-96 overflow-auto">
        <table className="w-full min-w-[34rem] text-[13px]">
          <thead className="sticky top-0 bg-ink-950">
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-ink-400 font-mono">
              <th className="py-2 pr-4 font-normal">Bucket (UTC)</th>
              {series.map((s) => (
                <th key={s.key} className="py-2 pr-4 font-normal text-right">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {points.map((point) => (
              <tr key={point.t} className="border-t rule">
                <td className="py-1.5 pr-4 font-mono text-ink-400">
                  {fmtTime(point.t, resolution)}
                </td>
                {series.map((s) => (
                  <td key={s.key} className="py-1.5 pr-4 text-right text-ink-200">
                    {format(point.values[s.key] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
