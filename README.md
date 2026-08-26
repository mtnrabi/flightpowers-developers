# flightpowers.com — the FlightPowers marketing site

The apex marketing site for the FlightPowers travel-data APIs (live Google Flights +
Booking.com pricing). Built to the blueprint in the ops workspace's
`state/gtm/SITE_SPEC.md` (2026-08-26). Currently deployed on the Vercel project
`flightpowers-developers` (serving developers.flightpowers.com and the project's
*.vercel.app URL); it becomes `flightpowers.com` via the apex-swap runbook below.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript, React 19 |
| Rendering | Static-first — every marketing page is prerendered HTML (`force-static`); only `/api/*` is dynamic |
| Styling | Tailwind CSS v4, CSS-first tokens in `src/app/globals.css`. Dark-only by design. No component library |
| Fonts | Inter (body), Space Grotesk (display), JetBrains Mono — via `next/font`, self-hosted at build |
| Content | TSX pages + MDX (guides, changelog) |
| Sitemap | `src/app/sitemap.ts` walks the route tree; dynamic segments enumerated from their datasets |
| Hosting | Vercel, deployed by CLI (`npx vercel@latest --prod`). No git auto-deploy |

## Architecture

```
src/lib/
  site.ts        SINGLE source of truth: counts, links (verified 2026-08-26), UTM builder
  pricing.ts     plan tables read from the live listings (READ_ON stamp); perThousand math
  diff.ts        the six verified differentiators — the only feature claims allowed weight
  fixtures.ts    + fixtures/*.json — REAL captured API responses (dated); all canned UI
                 renders from these and is labelled "captured run"
  matrix.ts      the {agent}×{task} dataset behind /integrations/<agent>/<task> (~42 pages)
  snippets.ts    cURL/Python/Node builders for the ApiUpsellCard (key always $RAPIDAPI_KEY)
  demo/
    budget.ts    spend controls (see below)
    upstream.ts  the ONLY module that reads FP_DEMO_KEY ('server-only')
    shapes.ts    the fixed set of query shapes a visitor can trigger
    intent.ts    hero chat: free text → one of the fixed shapes (rule-based, no LLM)
src/app/api/
  demo/          THE one spend route (agent chat + tools share it → shared counters)
  verify-key/    relays a visitor's own key to GET /v1/verify; never logs it
  e/             first-party event beacon → structured lines in the function log
```

### Demo spend controls (the key is a spend surface)

Order of checks in `/api/demo`: same-origin → response cache (repeats are free) →
per-IP daily cap → global daily budget. Costs are priced per shape *before* anything is
spent (a sampled month-scan = ~10 upstream calls and is charged as such). Live results are
cached by `(shape, params)`; cached hits are labelled and free.

Honest limitation: counters are in-memory per serverless instance. All spend goes through
the single `/api/demo` function precisely so its instances share fate, but N warm
instances still mean up to N× the nominal caps. The numbers are conservative and the demo
key's own plan quota is the final backstop. If the demo ever needs exact accounting, move
the counters to a durable store (Vercel KV/Redis) — the `budget.ts` interface is already
shaped for it.

- `DEMO_PER_IP_DAILY` (default 12) — backend calls per visitor per day
- `DAILY_BACKEND_CALL_BUDGET` (default 400) — global daily ceiling per instance
- Exceeding either → HTTP 429 with honest copy and the RapidAPI CTA. Verified by test.

### Environment variables (names only — values live in Vercel envs, never in the repo)

| Name | Purpose |
|---|---|
| `FP_DEMO_KEY` | RapidAPI key the demo/tools spend server-side. NEVER in the repo, client bundles, logs, or error messages. Only `src/lib/demo/upstream.ts` reads it |
| `DAILY_BACKEND_CALL_BUDGET` | global daily demo budget (mrabi's dial) |
| `DEMO_PER_IP_DAILY` | per-visitor daily cap |
| `NEXT_PUBLIC_SITE_URL` | canonical origin override (defaults to https://flightpowers.com) |

### Honesty rules enforced in code

- Every number renders from `lib/` config; `npm run check-pricing` re-parses the live
  RapidAPI listings, filters `visibility === "PUBLIC"`, fails on drift, and fails FATALLY
  if a non-public plan name ever appears in the committed table.
- Every canned demo renders from a dated captured fixture and carries a "captured run"
  badge; the live demo labels live/cached/capped states explicitly.
- No uptime/latency/customer-count claims anywhere. No testimonials (we have none we can
  attribute). `llms.txt` is generated from the same config as the pages.

## Commands

```
npm run dev            # local dev
npm run build          # must pass clean before any deploy
npm run check-pricing  # live-listing drift check (run before deploying)
npm run predeploy      # check-pricing + build
npx vercel@latest --prod   # deploy (from the repo root; project is linked)
```

## Deviation log (where this build departs from SITE_SPEC.md, and why)

1. **Pricing table source**: the spec wants a build-time parse of the listings' RSC
   payload. Networked builds fail unpredictably, so the render source is the committed
   `lib/pricing.ts` (last-good values) and `scripts/check-pricing.mjs` is the drift/leak
   gate run before deploys. Same guarantees, deterministic builds.
2. **`/blog` does not 301 to demo.**: the spec's redirect map sends `/blog` to the
   consumer blog on demo., but §2 also defines the new apex blog at `/blog`. Both can't
   hold; the 6 old consumer POST slugs 301 to demo. (in `next.config.mjs`) and `/blog`
   itself is the new developer blog.
3. **Tool 5 (Fare Watch by Email) not shipped**: it needs an email store + sender we don't
   have provisioned. Publishing a gate you can't open costs trust (the spec's own Postiz
   lesson), so the site lists four tools and doesn't mention the fifth until it exists.
4. **Demo month-scan samples ~10 dates** instead of 30, labelled on-page — budget control;
   the canned example shows a real full 30-day capture, and "the full scan is what the API
   is for" is the upsell.
5. **`/api/agent` merged into `/api/demo`**: separate route files are separate Vercel
   functions with separate in-memory budget counters; one spend route keeps one counter set.
6. **Analytics**: no GA/PostHog account exists, so events go to a first-party beacon
   (`/api/e`) that writes structured `[fp-event]` lines to the function log (drain later).
   The `api_upsell_click` vocabulary matches the spec so a real sink can be swapped in.
7. **verify-key box discloses cost**: measured 2026-08-26 — `GET /v1/verify` debits one
   request from the key's hotels plan. The spec's pre-launch gate assumed it might be
   free; it isn't, so the box says so instead of hiding it.
8. **/about ships without a photo** — none exists in the workspace and fabricating one is
   off the table. Add a real photo when mrabi supplies it.
9. **use_fallback is not marketed** anywhere: the live listing itself now documents it as
   currently having no effect.
10. **Matrix agents**: Make and Zapier are excluded from the agent×task matrix and the
    integrations hub cards (in review / private); the hub carries the honest one-liner the
    spec prescribes.

## Pre-launch measurements (internal only — never on the site)

Demo-path latency measured 2026-08-26 over the capture calls (n≈44 against
api.flightpowers.com): oneway p50 ≈ 3.9s, p95 ≈ 13s, max 15.5s; roundtrip 5–17s (retries
dominate); hotels by-name 7–27s. Conclusion: synchronous UX with honest progress copy +
generous timeouts (30s oneway / 45s roundtrip+hotels, `maxDuration: 60`), degrade to
captured runs on timeout. `/v1/verify`: debits 1 hotels-plan request per call (measured).

## Apex swap runbook (for the orchestrator — site builder touches NO DNS/domains)

State at hand-off: this project serves `developers.flightpowers.com` + its `*.vercel.app`
domain. The OLD apex (`flightpowers.com`) serves the consumer engine from a different
Vercel project. `demo.flightpowers.com` does not resolve yet.

1. **Add `demo.flightpowers.com` to the consumer-engine project** (Vercel → that project →
   Domains → add). Wait for cert issuance; verify the engine answers identically on demo.
   while the apex still serves it. Zero downtime possible in this step.
2. Update the engine's self-references (canonicals, OG URLs, its sitemap/robots) to
   demo.flightpowers.com — engine-repo work, not this repo.
3. **Full QA of THIS site** on developers.flightpowers.com / the vercel.app URL (it is
   already deployed to production on this project).
4. **Move the apex**: in Vercel, remove `flightpowers.com` (+ `www` if present) from the
   consumer-engine project and add `flightpowers.com` to `flightpowers-developers`.
   Same-account domain move: DNS unchanged, cutover is seconds. The engine is already live
   on demo., so it never goes dark.
5. **Verify immediately** (all should pass within a minute):
   - `curl -s https://flightpowers.com/ | grep "<h1"` → the new hero
   - `curl -sI https://flightpowers.com/blog/flex-dates-cheaper-flights` → 301 to
     `https://demo.flightpowers.com/blog/flex-dates-cheaper-flights` (and the other 5 slugs)
   - `curl -s https://demo.flightpowers.com/` → the consumer engine (no more `000`)
   - `curl -s https://flightpowers.com/robots.txt` and `/sitemap.xml` and `/llms.txt` → 200
   - the homepage demo chips work (canned) and one live query works (typed)
6. **Same day**: submit the new sitemap to GSC + Bing for flightpowers.com; submit demo.'s
   sitemap separately. Optionally set `NEXT_PUBLIC_SITE_URL=https://flightpowers.com`
   (it's already the default in `site.ts`) — nothing to change.
7. **developers.flightpowers.com**: keep serving this same project (harmless duplicate
   host) until the docs plan lands, then either 308 it to the apex from Vercel domain
   settings or point it at a real docs site. Canonical tags on every page already point at
   flightpowers.com, so search engines resolve the duplication correctly.
8. **Rollback** (if anything is wrong): move `flightpowers.com` back to the consumer-engine
   project in Vercel Domains — the engine still runs there untouched; the whole swap is
   reversible in under a minute. The 301s to demo. only ever fire on the new project, so
   rollback restores the exact prior state.

## Rendering contract

Crawlers with JavaScript off must see complete pages: H1s, body copy, FAQ text, code
snippets. Client components are allowed only for interactions (the agent demo, tool forms,
code-tab switching, the key checker) and always hydrate on top of server-rendered copy.
After `npm run build`, every content route must be `○ (Static)`; only `/api/*` is `ƒ`.
