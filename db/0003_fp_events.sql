-- The sink for the `/api/e` event beacon.
--
-- Until this table existed, the beacon's only output was
-- `console.log("[fp-event] {...}")`. On 2026-09-02 the Vercel API was checked
-- end to end and there is no way to read those lines back: the project logs
-- endpoint 404s, the deployment events API returns build lines only (a
-- live-tail test with three real beacon POSTs in flight returned zero runtime
-- lines), and log drains -- the one mechanism that persists runtime output --
-- are a paid feature with none configured. So every event the site had ever
-- recorded was already gone, and the instrumentation was decorative.
--
-- Rows are counts, not people. No IP, no user agent, no cookie, no id of any
-- kind. `us`/`um`/`uc` are the campaign labels that were already in the URL
-- the visitor clicked; `ref` is a referrer hostname, never a full URL.
--
-- Apply with:  psql "$DATABASE_URL" -f db/0003_fp_events.sql
-- src/lib/events.ts also runs this on first use, so applying by hand is
-- optional. Committed because a schema that only exists inside application
-- code is a schema nobody can review.

create table if not exists fp_events (
  id      bigserial   primary key,
  t       timestamptz not null default now(),
  -- session_start | demo_run | upsell_view | api_upsell_click | email_submit
  -- | outbound | verify_key
  e       text        not null,
  tool    text,
  action  text,
  target  text,
  medium  text,
  mode    text,
  path    text,
  -- utm_source, e.g. reddit | x | threads
  us      text,
  -- utm_medium, e.g. social
  um      text,
  -- utm_campaign, the post slug, e.g. 2026-09-11-sideproject
  uc      text,
  -- referrer HOSTNAME only
  ref     text
);

create index if not exists fp_events_t_idx  on fp_events (t);
create index if not exists fp_events_us_idx on fp_events (us, t);
create index if not exists fp_events_e_idx  on fp_events (e, t);
