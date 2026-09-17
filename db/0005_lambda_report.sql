-- MIRROR. The authoritative copy of this table is
-- `backend/ops/lane_metrics.sql` in mtnrabi/flight_rabbi, which is where the
-- flights rollup that writes it lives; mtnrabi/hotel_agent's
-- `ops/hotel_metrics.sql` carries the same definition for the two hotels
-- functions. It is duplicated here, BYTE FOR BYTE below this header, because
-- this site READS the table (/admin, src/lib/admin/lambda-report.ts) and a
-- reader that cannot show you the shape it depends on is a reader you have to
-- go and look up. If the copies ever diverge, flight_rabbi wins.
--
-- lambda_report_10m — the durable home for the CloudWatch REPORT line.
--
-- WHY THIS EXISTS
-- The REPORT line is the only place AWS states what a call actually used:
-- "Max Memory Used", "Memory Size" (the allocation), "Billed Duration", an
-- "Init Duration" when the call paid a cold start, and `Status: timeout` when
-- the Lambda was killed by its own timeout (this log group never prints "Task
-- timed out"; api-growth CLAUDE.md). Retention on the account is about a day,
-- so the question "is 1024 MB the right allocation" cannot be answered from
-- CloudWatch on a Monday about the Friday before. The same 20-minute rollups
-- that already read these log groups aggregate the REPORT lines into
-- ten-minute buckets under the same watermark and upsert them here.
--
-- THREE FUNCTIONS, ONE TABLE. `flyMyGApi` (flights, us-east-2) is written by
-- flight_rabbi; `hotelAgent` and `multipleHotelsAgent` (eu-central-1, a
-- different AWS identity) are written by hotel_agent. `function_name` is the
-- only thing that separates them, and it is free text on purpose: a new
-- function should turn up here as an unknown label rather than be dropped.
--
-- THE HISTOGRAMS. Same contract as `lane_metrics_10m.hist`, written out in
-- full in db/0004_lane_metrics.sql: 16 slots, half-open lower-inclusive
-- buckets, the last one unbounded, summed element-wise, and a percentile read
-- back as the UPPER EDGE of the bucket it lands in. A percentile that lands in
-- slot 16 CANNOT be stated as a number -- the dashboard renders it as
-- `> 2048 MB` / `> 90 s`, never as 2048 or 90000.
--
--   mem_hist edges (MB), 15 of them:
--     128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 896, 1024,
--     1536, 2048
--   dur_hist edges (ms): the same 15 as lane_metrics_10m.hist, so a Lambda
--     duration and a lane wall clock can be put side by side without an
--     asterisk:
--     250, 500, 1000, 2000, 3000, 5000, 8000, 12000, 16000, 20000, 25000,
--     30000, 40000, 60000, 90000
--
-- Buckets are REPLACED per run, never incremented, so re-reading an overlap
-- after the watermark produces the same row rather than double counting.
--
-- Apply with (the same Neon database the rest of /admin reads):
--
--   psql "$DATABASE_URL" -f db/0005_lambda_report.sql
--
-- Idempotent: IF NOT EXISTS, so re-running it is safe.

CREATE TABLE IF NOT EXISTS lambda_report_10m (
  bucket_ts     timestamptz NOT NULL,           -- 10-minute bucket, UTC
  function_name text        NOT NULL,           -- flyMyGApi | hotelAgent | multipleHotelsAgent
  invocations   bigint      NOT NULL DEFAULT 0, -- REPORT lines
  mem_sum_mb    bigint      NOT NULL DEFAULT 0, -- sum of "Max Memory Used" (MB)
  mem_max_mb    integer     NOT NULL DEFAULT 0, -- max of "Max Memory Used" in the bucket
  mem_size_mb   integer     NOT NULL DEFAULT 0, -- "Memory Size" seen last in the bucket (allocation)
  mem_hist      bigint[]    NOT NULL DEFAULT array_fill(0::bigint, ARRAY[16]) CHECK (cardinality(mem_hist) = 16),
  dur_sum_ms    bigint      NOT NULL DEFAULT 0, -- sum of "Duration"
  dur_hist      bigint[]    NOT NULL DEFAULT array_fill(0::bigint, ARRAY[16]) CHECK (cardinality(dur_hist) = 16),
  billed_ms_sum bigint      NOT NULL DEFAULT 0, -- sum of "Billed Duration" (cost = billed_ms/1000 × mem_size_mb/1024 × $0.0000166667)
  timeouts      integer     NOT NULL DEFAULT 0, -- REPORT lines with "Status: timeout"
  oom_kills     integer     NOT NULL DEFAULT 0, -- "Runtime exited with error: signal: killed" (no Max Memory line)
  init_count    integer     NOT NULL DEFAULT 0, -- REPORT lines carrying "Init Duration" (cold starts)
  PRIMARY KEY (bucket_ts, function_name)
);
