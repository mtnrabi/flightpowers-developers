-- MIRROR. The authoritative copy of this file is
-- `backend/ops/lane_metrics.sql` in mtnrabi/flight_rabbi, which is where the
-- writer lives. It is duplicated here because this site READS these tables
-- (/admin, src/lib/admin/lane-metrics.ts) and a reader that cannot show you
-- the shape it depends on is a reader you have to go and look up. If the two
-- ever diverge, flight_rabbi wins.
--
-- lane_metrics — the durable home for the `[lane]` log line.
--
-- WHY THIS EXISTS
-- CloudWatch Logs retention on this account is about one day (a deliberate
-- cost decision, api-growth CLAUDE.md rule 16). Every question Matan asked on
-- 2026-09-16 -- how many calls went down each lane, how many direct attempts
-- were blocked, what the average and the median execution time were for the
-- direct transport versus the proxied one -- needs a window longer than that,
-- and medians need the samples, not just a running mean. So the aggregation
-- has to happen INSIDE the retention window and the result has to land
-- somewhere permanent.
--
-- The Lambda itself does not write here. At ~170k calls a day a per-call
-- INSERT would add a connection and a round trip to the hot path for data
-- nobody reads in real time. Instead `.github/workflows/lane-metrics-rollup.yml`
-- runs every 20 minutes, reads the `[lane]` lines CloudWatch still holds, and
-- upserts the aggregate.
--
-- Apply with (the URL is the same Neon database flightpowers-developers uses,
-- and it is also what the LANE_METRICS_DATABASE_URL repo secret holds):
--
--   psql "$DATABASE_URL" -f backend/ops/lane_metrics.sql
--
-- It is idempotent: every statement is IF NOT EXISTS, so re-running it after a
-- schema addition is safe.

-- ---------------------------------------------------------------------------
-- The aggregate. One row per 10-minute bucket x lane x transport x outcome.
-- ---------------------------------------------------------------------------
--
-- GRAIN. Ten minutes is the finest the dashboard ever draws, and it is short
-- enough that a 20-minute rollup run usually touches two or three buckets.
-- Hourly and daily views are SUMs over these rows, so there is exactly one
-- stored resolution and no second pipeline to keep consistent.
--
-- WHY A HISTOGRAM AND NOT PERCENTILES. A stored p50 cannot be re-aggregated:
-- the median of a day is not the average of 144 ten-minute medians. Storing
-- the fixed-edge histogram instead means any range -- an hour, a week, one
-- lane, one outcome -- gets its p50 and p90 from summing the bucket vectors
-- and walking the cumulative counts. The edges are fixed in the code
-- (`lane_metrics_rollup.HISTOGRAM_EDGES_MS`) and must never be changed without
-- a new column: old rows would silently mean something different.
--
-- WHY sum_ms AND sum_direct_ms AND sum_proxied_ms ALL EXIST. `sum_ms` is the
-- wall clock the caller experienced (`elapsed_total_ms`). On a
-- `direct_then_proxied` row that is the direct attempt PLUS the proxied one,
-- so it answers "what did the customer wait", while the two split sums answer
-- "how fast is each transport" -- which is the actual direct-first decision.
CREATE TABLE IF NOT EXISTS lane_metrics_10m (
  -- Start of the 10-minute bucket, UTC, always a multiple of 10 minutes.
  bucket_ts       timestamptz NOT NULL,
  -- `secret` or `general`. Free text on purpose: a lane added in the backend
  -- should show up here as an unknown label rather than be dropped.
  lane            text        NOT NULL,
  -- `direct` | `proxied` | `direct_then_proxied`.
  transport_used  text        NOT NULL,
  -- `ok` | `no_results` | `degraded` | `error`.
  outcome         text        NOT NULL,

  calls           bigint      NOT NULL DEFAULT 0,
  -- Calls whose direct attempt came back blocked (Google's /unsupported page,
  -- a 403/429, or an empty shell). On a `direct_then_proxied` row this is the
  -- reason the row exists.
  direct_blocked  bigint      NOT NULL DEFAULT 0,

  -- Milliseconds, summed. Divide by the matching count for an average.
  sum_ms          bigint      NOT NULL DEFAULT 0,
  sum_direct_ms   bigint      NOT NULL DEFAULT 0,
  sum_proxied_ms  bigint      NOT NULL DEFAULT 0,
  -- How many lines actually carried each split figure, so the averages divide
  -- by the right denominator instead of by `calls`.
  n_direct_ms     bigint      NOT NULL DEFAULT 0,
  n_proxied_ms    bigint      NOT NULL DEFAULT 0,

  -- Fixed-edge histogram of elapsed_total_ms. 16 buckets, edges in ms:
  --   250 500 1000 2000 3000 5000 8000 12000 16000 20000 25000 30000 40000
  --   60000 90000  (+ one overflow bucket for anything above 90 s)
  -- hist[i] counts samples with edges[i-1] <= ms < edges[i]; the last entry is
  -- the overflow. Summing two rows is element-wise addition.
  hist            bigint[]    NOT NULL DEFAULT ARRAY[]::bigint[],

  updated_at      timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (bucket_ts, lane, transport_used, outcome)
);

-- The dashboard's only access pattern is "everything in a time range", then
-- group in SQL. bucket_ts leads the primary key already, but a standalone
-- index keeps a range scan cheap once the table has months of rows.
CREATE INDEX IF NOT EXISTS lane_metrics_10m_bucket_idx
  ON lane_metrics_10m (bucket_ts DESC);

-- ---------------------------------------------------------------------------
-- The watermark.
-- ---------------------------------------------------------------------------
--
-- One row, key `rollup`. `watermark_ts` is the timestamp of the newest log
-- event the last successful run consumed; the next run reads from there.
--
-- The run deliberately re-reads a small overlap before the watermark, because
-- CloudWatch can make an event visible after events with a later timestamp
-- have already been returned. Re-reading is harmless: a bucket is REPLACED,
-- never incremented, so re-aggregating the same minute twice produces the same
-- row. That is the whole reason the rollup recomputes a bucket from scratch
-- instead of doing `calls = calls + n`.
CREATE TABLE IF NOT EXISTS lane_metrics_state (
  key           text PRIMARY KEY,
  watermark_ts  timestamptz NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  -- Free-form note from the last run: event count, window, dry-run flag.
  note          text
);
