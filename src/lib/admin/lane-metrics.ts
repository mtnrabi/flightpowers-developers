import 'server-only';
import { neon } from '@neondatabase/serverless';

/**
 * Reads `lane_metrics_10m` — the table the flight_rabbi rollup writes.
 *
 * WHERE THE DATA COMES FROM
 * The backend prints one `[lane]` line per search. CloudWatch keeps it for
 * about a day, so a 20-minute GitHub Actions cron in mtnrabi/flight_rabbi
 * (`.github/workflows/lane-metrics-rollup.yml`) aggregates those lines into
 * ten-minute buckets and upserts them here. This file only ever SELECTs. The
 * schema is `backend/ops/lane_metrics.sql` in that repo, mirrored into
 * `db/0004_lane_metrics.sql` here so the site documents what it reads.
 *
 * TWO THINGS THAT SHAPE EVERY QUERY BELOW
 *
 * 1. THE MEDIAN IS NOT STORED. It cannot be: the median of a day is not the
 *    average of 144 ten-minute medians. What is stored is a 16-bucket
 *    fixed-edge histogram of `elapsed_total_ms` per row, so a percentile over
 *    any range is "sum the vectors element-wise, then walk the cumulative
 *    counts". Postgres has no element-wise array sum, hence the
 *    `unnest(...) WITH ORDINALITY` in `HISTOGRAM_SQL`.
 *
 * 2. p50/p90 ARE PER TRANSPORT SLICE, AVERAGES ARE PER LEG. The histogram is
 *    of the WALL CLOCK (`elapsed_total_ms`), so the p50 of the rows whose
 *    `transport_used` is `direct` is the direct latency distribution, and the
 *    same for `proxied`. A `direct_then_proxied` call's wall clock is both
 *    legs and belongs to neither, so it is reported as its own slice rather
 *    than being folded into one of the other two. The AVERAGES come from
 *    `sum_direct_ms / n_direct_ms` and `sum_proxied_ms / n_proxied_ms`, which
 *    DO include the two legs of a fallback call. The dashboard says so on the
 *    page; quietly mixing the two would be the kind of number that starts an
 *    argument six weeks from now.
 */

/** Frozen in the rollup as HISTOGRAM_EDGES_MS. Never edit without a migration. */
export const HISTOGRAM_EDGES_MS = [
  250, 500, 1000, 2000, 3000, 5000, 8000, 12000, 16000, 20000, 25000, 30000, 40000, 60000, 90000,
] as const;

/**
 * Per-call cost. Both figures are inputs to an ESTIMATE, not measurements of a
 * bill: $0.00106 is the residential-proxy cost of one proxied Google Flights
 * fetch and $0.000017 is the Lambda-time cost of the same fetch without one.
 * They live here, named, so the page can show its own arithmetic.
 */
export const COST_PER_PROXIED_CALL_USD = 0.00106;
export const COST_PER_DIRECT_CALL_USD = 0.000017;

export type Resolution = '10m' | '1h' | '1d';

export type Transport = 'direct' | 'proxied' | 'direct_then_proxied' | 'unknown';

export type SliceTotals = {
  calls: number;
  directBlocked: number;
  /** sum(elapsed_total_ms) over rows that had a usable clock */
  sumMs: number;
  /** how many samples went into the histogram, i.e. the denominator for avgMs */
  samples: number;
  sumDirectMs: number;
  nDirectMs: number;
  sumProxiedMs: number;
  nProxiedMs: number;
};

/** One transport's slice of one time bucket. */
export type PointSlice = { calls: number; avgMs: number | null };

export type LanePoint = {
  /** ISO instant of the bucket start, already truncated to the resolution */
  t: string;
  calls: number;
  directBlocked: number;
  avgMs: number | null;
  /** keyed by transport, so the charts can colour by the same entity throughout */
  byTransport: Record<string, PointSlice>;
};

export type TransportSummary = {
  transport: Transport;
  calls: number;
  avgMs: number | null;
  p50Ms: number | null;
  p90Ms: number | null;
  /** p50/p90 landed in the unbounded `>= 90 s` bucket, so they read `> 90 s` */
  p50Overflow: boolean;
  p90Overflow: boolean;
};

export type LaneSummary = {
  lane: string;
  calls: number;
  directBlocked: number;
  /** calls whose transport_used was exactly `direct` — the direct-first wins */
  directCalls: number;
  proxiedCalls: number;
  fallbackCalls: number;
  errorCalls: number;
  avgMs: number | null;
  p50Ms: number | null;
  p90Ms: number | null;
  p50Overflow: boolean;
  p90Overflow: boolean;
  /** from sum_direct_ms / n_direct_ms — includes the direct leg of a fallback */
  avgDirectLegMs: number | null;
  avgProxiedLegMs: number | null;
  /** p50/p90 of the wall clock, per transport slice. See the header note. */
  byTransport: TransportSummary[];
  outcomes: Record<string, number>;
};

export type LaneMetrics = {
  range: { fromIso: string; toIso: string; resolution: Resolution };
  /** true when the table exists but has no row in the window */
  empty: boolean;
  lanes: LaneSummary[];
  series: Record<string, LanePoint[]>;
  totals: {
    calls: number;
    directCalls: number;
    proxiedCalls: number;
    fallbackCalls: number;
    directBlocked: number;
    /**
     * transport_used = `direct` ÷ every call, every lane. In practice this is
     * almost entirely the SECRET lane (it never touches a proxy, ever — see
     * api-growth CLAUDE.md "secret_flights lane: NO retries, ever"), because
     * the general lane only attempts direct for allowlisted users. Do not
     * read this as a general-lane number; that is `allowlistDirectAttempts`.
     */
    directShare: number | null;
    /**
     * GENERAL-lane calls whose transport touched `direct` at all --
     * `direct` or `direct_then_proxied` -- i.e. how many calls the
     * `DIRECT_FIRST_USERS` allowlist actually attempted direct-first. Zero
     * means the allowlist is empty, not that direct-first failed.
     */
    allowlistDirectAttempts: number;
    /** Of those, how many were blocked and fell back to the proxy. */
    allowlistDirectBlocked: number;
    /** calls that ended up touching a proxy at all */
    proxiedShare: number | null;
    estimatedCostUsd: number;
    /** what the same traffic would have cost with every call proxied */
    allProxiedCostUsd: number;
  };
};

/**
 * The lane name the backend writes for allowlisted direct-first traffic (see
 * `lane` in db/0004_lane_metrics.sql). The other value is `secret`. Free text
 * in the schema, but the dashboard needs to single this one out to scope the
 * allowlist headline cards to it.
 */
export const GENERAL_LANE = 'general';

type Sql = ReturnType<typeof neon>;

let client: Sql | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!client) client = neon(url);
  return client;
}

/**
 * 10-minute detail for a day, hourly for a week, daily beyond.
 *
 * The point is a roughly constant number of points on the chart — about 144
 * for a day, 168 for a week — so a 30-day range does not try to draw 4,320
 * ten-minute buckets and a one-hour range is not flattened to a single dot.
 */
export function resolutionFor(fromMs: number, toMs: number): Resolution {
  const hours = (toMs - fromMs) / 3_600_000;
  if (hours <= 24) return '10m';
  if (hours <= 24 * 7) return '1h';
  return '1d';
}

/** The `date_trunc`/arithmetic that implements the resolution, as SQL text. */
function bucketExpression(resolution: Resolution): string {
  if (resolution === '1h') return "date_trunc('hour', bucket_ts)";
  if (resolution === '1d') return "date_trunc('day', bucket_ts)";
  // Rows are already 10-minute buckets; nothing to do.
  return 'bucket_ts';
}

/**
 * Percentile from a summed histogram. The reader half of THE HISTOGRAM
 * CONTRACT in db/0004_lane_metrics.sql — half-open, lower-inclusive buckets,
 * and the last slot unbounded.
 *
 * Returns the UPPER EDGE of the bucket the percentile falls in, not an
 * interpolation. With 250 ms as the finest edge, interpolating would be
 * inventing precision the storage does not have, and the whole reason the
 * histogram exists is that we refuse to invent the median.
 *
 * `null` means THE PERCENTILE CANNOT BE STATED, which happens two ways: an
 * empty histogram, and a percentile landing in the unbounded `>= 90 s` bucket.
 * The second used to return 90000 — turning "at least 90 seconds" into
 * "exactly 90 seconds", which is the sort of number a latency argument gets
 * built on. `percentileIsOverflow` tells the two cases apart.
 */
export function percentileFromHistogram(hist: number[], fraction: number): number | null {
  const total = hist.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return null;
  const target = total * fraction;
  let seen = 0;
  for (let i = 0; i < hist.length; i += 1) {
    seen += hist[i];
    if (seen >= target) {
      // The last slot is the unbounded overflow bucket: no upper edge to give.
      return i >= HISTOGRAM_EDGES_MS.length ? null : HISTOGRAM_EDGES_MS[i];
    }
  }
  return null;
}

/** True when the percentile lands in the unbounded `>= 90 s` bucket. */
export function percentileIsOverflow(hist: number[], fraction: number): boolean {
  const total = hist.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return false;
  const target = total * fraction;
  let seen = 0;
  for (let i = 0; i < hist.length; i += 1) {
    seen += hist[i];
    if (seen >= target) return i >= HISTOGRAM_EDGES_MS.length;
  }
  return false;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function average(sum: number, n: number): number | null {
  return n > 0 ? Math.round(sum / n) : null;
}

function num(value: unknown): number {
  // Neon returns bigint columns as strings, because a bigint does not fit a JS
  // number safely. These counts never come close to 2^53, so Number() is safe
  // here and the alternative (BigInt everywhere) would not survive JSON.
  return typeof value === 'number' ? value : Number(value ?? 0);
}

/**
 * The whole dashboard in four queries.
 *
 * Four rather than one because they group differently, and four small round
 * trips over Neon's HTTP driver on a cold start beat one query with three
 * levels of CTE that nobody can read in six months.
 */
export async function fetchLaneMetrics(fromMs: number, toMs: number): Promise<LaneMetrics> {
  const resolution = resolutionFor(fromMs, toMs);
  const from = new Date(fromMs).toISOString();
  const to = new Date(toMs).toISOString();
  const sql = getClient();

  // 1. Totals per lane x transport x outcome. Small: at most a few dozen rows.
  const totalsRows = (await sql.query(
    `SELECT lane, transport_used, outcome,
            SUM(calls)          AS calls,
            SUM(direct_blocked) AS direct_blocked,
            SUM(sum_ms)         AS sum_ms,
            SUM(sum_direct_ms)  AS sum_direct_ms,
            SUM(n_direct_ms)    AS n_direct_ms,
            SUM(sum_proxied_ms) AS sum_proxied_ms,
            SUM(n_proxied_ms)   AS n_proxied_ms
       FROM lane_metrics_10m
      WHERE bucket_ts >= $1 AND bucket_ts < $2
      GROUP BY lane, transport_used, outcome`,
    [from, to]
  )) as Array<Record<string, unknown>>;

  // 2. Element-wise histogram sums, per lane x transport. `WITH ORDINALITY`
  //    is what makes an array column summable position by position.
  const histRows = (await sql.query(
    `SELECT lane, transport_used, ord, SUM(v) AS n
       FROM lane_metrics_10m,
            LATERAL unnest(hist) WITH ORDINALITY AS t(v, ord)
      WHERE bucket_ts >= $1 AND bucket_ts < $2
      GROUP BY lane, transport_used, ord`,
    [from, to]
  )) as Array<Record<string, unknown>>;

  // 3. The time series for the charts, at the auto-chosen resolution, split by
  //    transport so every mark on the page is coloured by the same entity.
  //    `samples` is the histogram's own total, which is the right denominator
  //    for an average of `sum_ms`: a call whose clock was unreadable counts in
  //    `calls` but contributed nothing to `sum_ms`.
  const seriesRows = (await sql.query(
    `SELECT ${bucketExpression(resolution)} AS t,
            lane,
            transport_used,
            SUM(calls)          AS calls,
            SUM(direct_blocked) AS direct_blocked,
            SUM(sum_ms)         AS sum_ms,
            SUM((SELECT COALESCE(SUM(x), 0) FROM unnest(hist) AS x)) AS samples
       FROM lane_metrics_10m
      WHERE bucket_ts >= $1 AND bucket_ts < $2
      GROUP BY 1, lane, transport_used
      ORDER BY 1 ASC`,
    [from, to]
  )) as Array<Record<string, unknown>>;

  // ---- shape it ---------------------------------------------------------

  const laneKeys = new Set<string>();
  const perLane = new Map<string, SliceTotals & { outcomes: Record<string, number> }>();
  const perLaneTransport = new Map<string, SliceTotals>();

  const blank = (): SliceTotals => ({
    calls: 0,
    directBlocked: 0,
    sumMs: 0,
    samples: 0,
    sumDirectMs: 0,
    nDirectMs: 0,
    sumProxiedMs: 0,
    nProxiedMs: 0,
  });

  for (const row of totalsRows) {
    const lane = String(row.lane);
    const transport = String(row.transport_used) as Transport;
    const outcome = String(row.outcome);
    laneKeys.add(lane);

    const laneTotals =
      perLane.get(lane) ?? Object.assign(blank(), { outcomes: {} as Record<string, number> });
    const key = `${lane} ${transport}`;
    const transportTotals = perLaneTransport.get(key) ?? blank();

    const calls = num(row.calls);
    for (const target of [laneTotals, transportTotals]) {
      target.calls += calls;
      target.directBlocked += num(row.direct_blocked);
      target.sumMs += num(row.sum_ms);
      target.sumDirectMs += num(row.sum_direct_ms);
      target.nDirectMs += num(row.n_direct_ms);
      target.sumProxiedMs += num(row.sum_proxied_ms);
      target.nProxiedMs += num(row.n_proxied_ms);
    }
    laneTotals.outcomes[outcome] = (laneTotals.outcomes[outcome] ?? 0) + calls;

    perLane.set(lane, laneTotals);
    perLaneTransport.set(key, transportTotals);
  }

  // Histograms, indexed by lane and by lane+transport.
  const laneHist = new Map<string, number[]>();
  const laneTransportHist = new Map<string, number[]>();
  const emptyHist = () => new Array(HISTOGRAM_EDGES_MS.length + 1).fill(0) as number[];

  for (const row of histRows) {
    const lane = String(row.lane);
    const transport = String(row.transport_used);
    // `WITH ORDINALITY` is 1-based.
    const index = num(row.ord) - 1;
    const n = num(row.n);
    if (index < 0 || index >= HISTOGRAM_EDGES_MS.length + 1) continue;

    const forLane = laneHist.get(lane) ?? emptyHist();
    forLane[index] += n;
    laneHist.set(lane, forLane);

    const key = `${lane} ${transport}`;
    const forSlice = laneTransportHist.get(key) ?? emptyHist();
    forSlice[index] += n;
    laneTransportHist.set(key, forSlice);
  }

  const lanes: LaneSummary[] = Array.from(laneKeys)
    .sort()
    .map((lane) => {
      const totals = perLane.get(lane)!;
      const hist = laneHist.get(lane) ?? emptyHist();
      const samples = hist.reduce((sum, n) => sum + n, 0);

      const byTransport: TransportSummary[] = (
        ['direct', 'proxied', 'direct_then_proxied', 'unknown'] as Transport[]
      )
        .map((transport) => {
          const key = `${lane} ${transport}`;
          const slice = perLaneTransport.get(key);
          const sliceHist = laneTransportHist.get(key) ?? emptyHist();
          const sliceSamples = sliceHist.reduce((sum, n) => sum + n, 0);
          return {
            transport,
            calls: slice?.calls ?? 0,
            avgMs: average(slice?.sumMs ?? 0, sliceSamples),
            p50Ms: percentileFromHistogram(sliceHist, 0.5),
            p90Ms: percentileFromHistogram(sliceHist, 0.9),
            p50Overflow: percentileIsOverflow(sliceHist, 0.5),
            p90Overflow: percentileIsOverflow(sliceHist, 0.9),
          };
        })
        .filter((slice) => slice.calls > 0);

      const callsFor = (transport: Transport) =>
        perLaneTransport.get(`${lane} ${transport}`)?.calls ?? 0;

      return {
        lane,
        calls: totals.calls,
        directBlocked: totals.directBlocked,
        directCalls: callsFor('direct'),
        proxiedCalls: callsFor('proxied'),
        fallbackCalls: callsFor('direct_then_proxied'),
        errorCalls: totals.outcomes.error ?? 0,
        avgMs: average(totals.sumMs, samples),
        p50Ms: percentileFromHistogram(hist, 0.5),
        p90Ms: percentileFromHistogram(hist, 0.9),
        p50Overflow: percentileIsOverflow(hist, 0.5),
        p90Overflow: percentileIsOverflow(hist, 0.9),
        avgDirectLegMs: average(totals.sumDirectMs, totals.nDirectMs),
        avgProxiedLegMs: average(totals.sumProxiedMs, totals.nProxiedMs),
        byTransport,
        outcomes: totals.outcomes,
      };
    });

  // The rows arrive one per (bucket, lane, transport); fold them into one point
  // per (bucket, lane) carrying a slice per transport.
  const series: Record<string, LanePoint[]> = {};
  const pointIndex = new Map<string, LanePoint & { _sumMs: number; _samples: number }>();

  for (const row of seriesRows) {
    const lane = String(row.lane);
    const transport = String(row.transport_used);
    const t = new Date(String(row.t)).toISOString();
    const key = `${lane} ${t}`;

    let point = pointIndex.get(key);
    if (!point) {
      point = {
        t,
        calls: 0,
        directBlocked: 0,
        avgMs: null,
        byTransport: {},
        _sumMs: 0,
        _samples: 0,
      };
      pointIndex.set(key, point);
      (series[lane] ??= []).push(point);
    }

    const calls = num(row.calls);
    const sumMs = num(row.sum_ms);
    const samples = num(row.samples);

    point.calls += calls;
    point.directBlocked += num(row.direct_blocked);
    point._sumMs += sumMs;
    point._samples += samples;
    point.avgMs = average(point._sumMs, point._samples);

    const slice = (point.byTransport[transport] ??= { calls: 0, avgMs: null });
    slice.calls += calls;
    slice.avgMs = average(sumMs, samples);
  }
  for (const [lane, points] of Object.entries(series)) {
    points.sort((a, b) => a.t.localeCompare(b.t));
    // Drop the running totals; they were scratch space, not part of the shape
    // the client is handed.
    series[lane] = points.map(({ t, calls, directBlocked, avgMs, byTransport }) => ({
      t,
      calls,
      directBlocked,
      avgMs,
      byTransport,
    }));
  }

  // ---- headline numbers -------------------------------------------------

  const calls = lanes.reduce((sum, lane) => sum + lane.calls, 0);
  const directCalls = lanes.reduce((sum, lane) => sum + lane.directCalls, 0);
  const proxiedCalls = lanes.reduce((sum, lane) => sum + lane.proxiedCalls, 0);
  const fallbackCalls = lanes.reduce((sum, lane) => sum + lane.fallbackCalls, 0);
  const directBlocked = lanes.reduce((sum, lane) => sum + lane.directBlocked, 0);

  // A fallback call pays the proxy too, so it counts on the proxied side of
  // the bill as well as the direct side.
  const proxyTouchingCalls = proxiedCalls + fallbackCalls;
  const estimatedCostUsd =
    proxyTouchingCalls * COST_PER_PROXIED_CALL_USD + directCalls * COST_PER_DIRECT_CALL_USD;

  // The allowlist headline cards are scoped to the general lane alone -- see
  // GENERAL_LANE's doc comment. `directCalls`/`fallbackCalls`/`directBlocked`
  // above are cross-lane and answer a different question (what share of ALL
  // traffic, mostly the secret lane, never touches a proxy).
  const generalLane = lanes.find((lane) => lane.lane === GENERAL_LANE);
  const allowlistDirectAttempts = generalLane
    ? generalLane.directCalls + generalLane.fallbackCalls
    : 0;
  const allowlistDirectBlocked = generalLane?.directBlocked ?? 0;

  return {
    range: { fromIso: from, toIso: to, resolution },
    empty: calls === 0,
    lanes,
    series,
    totals: {
      calls,
      directCalls,
      proxiedCalls,
      fallbackCalls,
      directBlocked,
      directShare: ratio(directCalls, calls),
      allowlistDirectAttempts,
      allowlistDirectBlocked,
      proxiedShare: ratio(proxyTouchingCalls, calls),
      estimatedCostUsd,
      allProxiedCostUsd: calls * COST_PER_PROXIED_CALL_USD,
    },
  };
}
