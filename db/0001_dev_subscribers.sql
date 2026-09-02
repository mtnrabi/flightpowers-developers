-- The developer changelog list. One table, namespaced `fp_` so it can live
-- beside the consumer engine's schema in the same Neon database without any
-- chance of a name collision. Nothing in this site reads the engine's tables.
--
-- src/lib/subscribers.ts runs exactly this on first use (create-if-not-exists),
-- so applying it by hand is optional. It is committed because a schema that
-- only exists inside application code is a schema nobody can review.
--
-- Apply with:  psql "$DATABASE_URL" -f db/0001_dev_subscribers.sql

create table if not exists fp_dev_subscribers (
  id              bigserial primary key,
  email           text        not null,
  -- where the person opted in, e.g. `tool:cheapest-month`, `page:quickstart`
  source          text        not null default 'unknown',
  path            text,
  -- per-row secret for the unsubscribe link. Minted at insert, so the opt-out
  -- path exists before anything can be sent.
  unsub_token     text        not null unique,
  created_at      timestamptz not null default now(),
  -- reserved for double opt-in if we ever add it; unused today
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz
);

-- One row per address, case-insensitive. Also the conflict target the
-- insert upserts on.
create unique index if not exists fp_dev_subscribers_email_key
  on fp_dev_subscribers (lower(email));
