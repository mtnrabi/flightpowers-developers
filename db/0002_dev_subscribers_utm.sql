-- Campaign attribution for the developer changelog list.
--
-- `source` already records WHERE on the site someone opted in (`tool:cheapest-month`).
-- It cannot record WHERE THEY CAME FROM, so a signup produced by a Reddit post
-- and one produced by a Google result were the same row. This adds the
-- first-touch campaign labels the visitor arrived with, and nothing else.
--
-- Values are copied verbatim from the `utm_*` query parameters in the URL that
-- was clicked. They are campaign labels, not identifiers: `reddit`, `social`,
-- `2026-09-11-sideproject-flight-api-gates`. Null for anyone who arrived
-- without a tagged link, which will be most people.
--
-- Apply with:  psql "$DATABASE_URL" -f db/0002_dev_subscribers_utm.sql
-- src/lib/subscribers.ts also runs these on first use, so applying by hand is
-- optional. Committed because a schema that only exists in application code is
-- a schema nobody can review.

alter table fp_dev_subscribers add column if not exists utm_source   text;
alter table fp_dev_subscribers add column if not exists utm_medium   text;
alter table fp_dev_subscribers add column if not exists utm_campaign text;

-- The report groups by source over a date window.
create index if not exists fp_dev_subscribers_utm_source_idx
  on fp_dev_subscribers (utm_source, created_at);
