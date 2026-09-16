-- MIRROR. The authoritative copy of this file is
-- `backend/ops/lane_metrics.sql` in mtnrabi/flight_rabbi, which is where the
-- flights writer lives. It is duplicated here, BYTE FOR BYTE below this
-- header, because this site READS these tables (/admin, src/lib/admin/*) and a
-- reader that cannot show you the shape it depends on is a reader you have to
-- go and look up. If the two ever diverge, flight_rabbi wins.
--
-- It creates EVERYTHING the dashboard reads -- the flights tables and the
-- hotels ones -- so `psql -f` on either copy sets up the whole thing and the
-- setup step cannot be half-done.
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

-- ===========================================================================
-- THE HISTOGRAM CONTRACT — every writer of a `hist` column implements THIS
-- ===========================================================================
--
-- Both `lane_metrics_10m` and `hotel_metrics_10m` carry a `hist bigint[]`, and
-- the whole point of them sharing one definition is that a flights p50 and a
-- hotels p50 mean the same thing. They are written by two different pipelines
-- in two different repositories, so the rule is written out here once, in full,
-- and neither side gets to paraphrase it.
--
-- EDGES (milliseconds), 15 of them, in this order:
--
--     250, 500, 1000, 2000, 3000, 5000, 8000, 12000,
--     16000, 20000, 25000, 30000, 40000, 60000, 90000
--
-- BUCKETS: 16. Fifteen bounded, then one unbounded overflow.
--
-- THE RULE IS HALF-OPEN, LOWER-INCLUSIVE, UPPER-EXCLUSIVE.
-- Writing it three ways so there is nothing left to interpret:
--
--   * A sample of `ms` goes in the FIRST bucket whose edge is STRICTLY
--     GREATER than `ms`.
--   * In 1-based SQL array terms: hist[1] counts `0 <= ms < 250`,
--     hist[2] counts `250 <= ms < 500`, ... hist[15] counts
--     `60000 <= ms < 90000`, and hist[16] counts `ms >= 90000`.
--   * In 0-based code terms with `edges` as above and `edges[-1]` read as 0:
--     bucket i (0 <= i <= 14) counts `edges[i-1] <= ms < edges[i]`;
--     bucket 15 counts `ms >= edges[14]`.
--
-- Worked examples, because off-by-one here is silent:
--     0    -> hist[1]      249  -> hist[1]      250  -> hist[2]
--     499  -> hist[2]      500  -> hist[3]      1999 -> hist[4]
--     2000 -> hist[5]      89999 -> hist[15]    90000 -> hist[16]
--     900000 -> hist[16]
--
-- ARRAY LENGTH is always 16. A shorter array is a bug, not a compact encoding.
--
-- SUMMING is element-wise: hist[i] of a range is the sum of hist[i] over the
-- rows in it. That is the only reason percentiles work over arbitrary ranges --
-- a stored median could not be re-aggregated, since the median of a day is not
-- the average of 144 ten-minute medians.
--
-- READING A PERCENTILE back out: walk the cumulative counts and take the UPPER
-- EDGE of the bucket the percentile lands in. It is a ceiling, not an
-- interpolation -- with 250 ms as the finest edge, interpolating would invent
-- precision the storage does not have. IF IT LANDS IN hist[16], THE PERCENTILE
-- CANNOT BE STATED AS A NUMBER: that bucket has no upper bound, so the honest
-- answer is ">90000", never "90000".
--
-- The reference implementation is `HISTOGRAM_EDGES_MS`, `histogram_index` and
-- `percentile_from_histogram` in backend/ops/lane_metrics_rollup.py, and the
-- reader is src/lib/admin/lane-metrics.ts in mtnrabi/flightpowers-developers.
--
-- CHANGING ANY OF THIS needs a new column and a migration, never an edit in
-- place: every row already written only means what it means because these
-- values have not moved.
--
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

  -- Fixed-edge histogram of elapsed_total_ms. See THE HISTOGRAM CONTRACT at
  -- the top of this file -- any writer of this column must implement it
  -- exactly, or rows from two writers cannot be summed.
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

-- ===========================================================================
-- HOTELS. Same idea, a different product and a different writer.
-- ===========================================================================
--
-- These three tables are created here so that ONE migration sets up the whole
-- admin dashboard, but nothing in THIS repo writes them. The hotels Lambdas
-- (`hotelAgent`, `multipleHotelsAgent`) live in eu-central-1 under a different
-- AWS identity, so their rollup is a workflow in mtnrabi/hotel_agent with its
-- own credentials, pointing at the same Neon database. The site's /admin page
-- reads both halves and puts them behind two tabs.
--
-- If that rollup is not built yet, these tables simply stay empty and the
-- Booking tab says so. An empty table is a much better failure than a page
-- that 500s because a relation does not exist.

-- ---------------------------------------------------------------------------
-- Per 10-minute bucket x tool x source x outcome.
-- ---------------------------------------------------------------------------
--
-- `source` is the attribution tag every hotels log line has carried since
-- 2026-09-13 (#36/#38/#39). It is the difference between "124 calls" and "79
-- of those were one bulk listing fanning out to itself" -- which is the exact
-- mistake that was made on 2026-09-12, so it is a first-class dimension here
-- rather than something to be worked out later.
--
-- `outcome` splits `available_false` out from `ok` on purpose. A hotel search
-- that answers 200 with nothing available is not an error and not a success;
-- folding it into either one hides the thing worth watching.
--
-- `hist` uses THE SAME EDGES as lane_metrics_10m (see HISTOGRAM_EDGES_MS in
-- backend/ops/lane_metrics_rollup.py). Sixteen buckets, same boundaries, so
-- one percentile routine serves both products and a flights number and a
-- hotels number can be put side by side without an asterisk.
CREATE TABLE IF NOT EXISTS hotel_metrics_10m (
  bucket_ts   timestamptz NOT NULL,
  -- `search` | `by_name` | `bulk`
  tool        text        NOT NULL,
  -- `rapidapi` | `bulk` | `apify` | `lulu` | `api-front`
  source      text        NOT NULL,
  -- `ok` | `available_false` | `error_4xx` | `error_5xx`
  outcome     text        NOT NULL,

  calls       bigint      NOT NULL DEFAULT 0,
  sum_ms      bigint      NOT NULL DEFAULT 0,
  -- Same 16 fixed edges as lane_metrics_10m.hist.
  hist        bigint[]    NOT NULL DEFAULT ARRAY[]::bigint[],

  updated_at  timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (bucket_ts, tool, source, outcome)
);

CREATE INDEX IF NOT EXISTS hotel_metrics_10m_bucket_idx
  ON hotel_metrics_10m (bucket_ts DESC);

-- ---------------------------------------------------------------------------
-- Who is calling. One row per day per caller per source.
-- ---------------------------------------------------------------------------
--
-- DAILY, not ten-minutely, and that is the privacy line: at a ten-minute grain
-- a single caller in a quiet bucket is a timestamped record of what one person
-- did, which is why lane_metrics_10m has no user column at all. A daily count
-- answers "who are our heaviest hotel users" without becoming a session log.
--
-- `user_name` rather than `user`: `user` is a reserved word in Postgres and
-- every query touching it would need quoting forever.
--
-- The value is whatever the log line's `user=` carried -- X-FP-User, then
-- _fp_user, then x-rapidapi-user, then `-` for an unattributed call. `-` is
-- stored like any other value: "we do not know who this was" is a real and
-- important row, and dropping it would make the totals here disagree with
-- hotel_metrics_10m for no visible reason.
CREATE TABLE IF NOT EXISTS hotel_top_users_daily (
  day         date        NOT NULL,
  user_name   text        NOT NULL,
  source      text        NOT NULL,
  calls       bigint      NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (day, user_name, source)
);

CREATE INDEX IF NOT EXISTS hotel_top_users_daily_day_idx
  ON hotel_top_users_daily (day DESC, calls DESC);

-- ---------------------------------------------------------------------------
-- The hotels rollup's watermark shares lane_metrics_state, under its own key.
-- ---------------------------------------------------------------------------
-- The flights rollup uses key 'rollup'; the hotels one should use
-- 'hotel_rollup'. One table, two independent watermarks, no second schema.
