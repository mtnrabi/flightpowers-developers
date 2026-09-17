'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LaneMetrics } from '@/lib/admin/lane-metrics';
import type { HotelMetrics } from '@/lib/admin/hotel-metrics';
import type { LambdaReport } from '@/lib/admin/lambda-report';
import { FlightsTab } from './FlightsTab';
import { BookingTab } from './BookingTab';

/**
 * Two products, one window.
 *
 * The range picker sits ABOVE the tabs, not inside them, so switching tabs
 * never silently changes the window you are looking at — "hotels look quiet"
 * when the hotels tab quietly reset to the last hour is the kind of wrong
 * conclusion a dashboard exists to prevent.
 *
 * Flights is the default tab: it is the one with a live experiment attached.
 * Each tab fetches only when it is first opened, and then follows the range.
 */

const TABS = [
  { id: 'flights', label: 'Flights' },
  { id: 'booking', label: 'Booking' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const RANGES = [
  { id: '24h', label: 'Last 24 h' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
] as const;

export function AdminDashboard() {
  const [tab, setTab] = useState<TabId>('flights');
  const [range, setRange] = useState<string>('24h');
  const [custom, setCustom] = useState({ from: '', to: '' });

  const query = useMemo(() => {
    if (range === 'custom' && custom.from && custom.to) {
      const from = new Date(custom.from).toISOString();
      const to = new Date(custom.to).toISOString();
      return `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    }
    return `range=${range === 'custom' ? '24h' : range}`;
  }, [range, custom]);

  const flights = useMetrics<LaneMetrics>('/api/admin/lane-metrics', query, tab === 'flights');
  const booking = useMetrics<HotelMetrics>('/api/admin/hotel-metrics', query, tab === 'booking');
  // One request for all three Lambdas, enabled on both tabs: the endpoint
  // returns every function and each tab picks its own out, so switching tabs
  // costs no second round trip and the two tabs cannot end up showing
  // different windows of the same table.
  const lambda = useMetrics<LambdaReport>('/api/admin/lambda-report', query, true);

  // Deliberately NOT folded into `active`: the Lambda panel has its own
  // endpoint and renders its own failure inside itself. A REPORT-line query
  // that fails must not blank the lane charts above it.
  const active = tab === 'flights' ? flights : booking;

  return (
    <div className="mt-8">
      <RangePicker
        range={range}
        custom={custom}
        onRange={setRange}
        onCustom={setCustom}
        onRefresh={() => {
          flights.reload();
          booking.reload();
          lambda.reload();
        }}
        loading={active.loading}
      />

      <div
        role="tablist"
        aria-label="Product"
        className="mt-6 flex items-center gap-1 border-b rule"
      >
        {TABS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={tab === option.id}
            onClick={() => setTab(option.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-[14px] ${
              tab === option.id
                ? 'border-signal-500 text-ink-100 font-medium'
                : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {active.error ? (
        <p className="mt-8 rounded-md border border-verdict-high/40 bg-verdict-high/10 px-4 py-3 text-[14px] text-ink-200">
          {active.error}
        </p>
      ) : null}

      {tab === 'flights' && flights.data ? (
        <FlightsTab data={flights.data} lambda={lambda.data} lambdaError={lambda.error} />
      ) : null}
      {tab === 'booking' && booking.data ? (
        <BookingTab data={booking.data} lambda={lambda.data} lambdaError={lambda.error} />
      ) : null}

      {active.loading && !active.data ? (
        <p className="mt-8 text-[14px] text-ink-400">Loading…</p>
      ) : null}

      {active.data ? <Provenance range={active.data.range} tab={tab} /> : null}
    </div>
  );
}

/**
 * Fetch-on-visible. `enabled` is the tab being open, so the Booking tab costs
 * nothing until somebody looks at it, and both tabs re-fetch when the window
 * changes — but only while they are on screen.
 */
function useMetrics<T extends { range: { fromIso: string; toIso: string; resolution: string } }>(
  endpoint: string,
  query: string,
  enabled: boolean
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${endpoint}?${query}`, { cache: 'no-store' });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.detail ?? body?.error ?? `HTTP ${res.status}`);
          setData(null);
        } else {
          setData(body as T);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Request failed');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [endpoint, query, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload };
}

function RangePicker({
  range,
  custom,
  onRange,
  onCustom,
  onRefresh,
  loading,
}: {
  range: string;
  custom: { from: string; to: string };
  onRange: (value: string) => void;
  onCustom: (value: { from: string; to: string }) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const button = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => onRange(id)}
      className={`rounded-md px-3 py-1.5 text-[13px] ${
        range === id
          ? 'bg-signal-500 text-ink-950 font-medium'
          : 'border rule text-ink-300 hover:text-ink-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-b rule pb-5">
      {RANGES.map((option) => button(option.id, option.label))}
      {button('custom', 'Custom')}

      {range === 'custom' ? (
        <span className="flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            value={custom.from}
            onChange={(e) => onCustom({ ...custom, from: e.target.value })}
            className="rounded-md border rule bg-ink-900 px-2 py-1.5 text-[13px] font-mono text-ink-200"
            aria-label="From"
          />
          <span className="text-ink-400" aria-hidden>
            →
          </span>
          <input
            type="datetime-local"
            value={custom.to}
            onChange={(e) => onCustom({ ...custom, to: e.target.value })}
            className="rounded-md border rule bg-ink-900 px-2 py-1.5 text-[13px] font-mono text-ink-200"
            aria-label="To"
          />
        </span>
      ) : null}

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto rounded-md border rule px-3 py-1.5 text-[13px] text-ink-300 hover:text-ink-100 disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Refresh'}
      </button>
    </div>
  );
}

function Provenance({
  range,
  tab,
}: {
  range: { fromIso: string; toIso: string; resolution: string };
  tab: TabId;
}) {
  return (
    <p className="mt-12 border-t rule pt-6 text-[12px] text-ink-400 leading-relaxed">
      Window <span className="font-mono">{range.fromIso}</span> →{' '}
      <span className="font-mono">{range.toIso}</span>, {range.resolution} buckets.{' '}
      {tab === 'flights' ? (
        <>
          Source: <span className="font-mono">lane_metrics_10m</span>, written every 20 minutes by
          flight_rabbi&apos;s <span className="font-mono">lane-metrics-rollup.yml</span> from the{' '}
          <span className="font-mono">[lane]</span> lines in CloudWatch (us-east-2).
        </>
      ) : (
        <>
          Source: <span className="font-mono">hotel_metrics_10m</span> and{' '}
          <span className="font-mono">hotel_top_users_daily</span>, written by a rollup in
          hotel_agent — the hotels Lambdas run in eu-central-1 under a different AWS identity, so
          that pipeline is separate from the flights one.
        </>
      )}{' '}
      The Lambda panel on both tabs reads <span className="font-mono">lambda_report_10m</span>,
      which the same two rollups fill from the CloudWatch REPORT line — memory used against memory
      allocated, billed duration, timeouts, OOM kills and cold starts. Percentiles here (p50, p90,
      p99, and the memory median) come from a fixed-edge histogram, so they are the upper edge of
      the bucket the percentile falls in, not an interpolated value; one past the top edge reads
      <span className="font-mono"> &gt; 90 s</span> or <span className="font-mono">&gt; 2048 MB</span>{' '}
      rather than a number.
    </p>
  );
}
