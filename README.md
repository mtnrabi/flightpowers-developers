# flightpowers-developers

Developer marketing site for the FlightPowers travel-data APIs — live flight and hotel
pricing over REST. Deployed at **https://developers.flightpowers.com**.

This is a separate site from `flightpowers.com` (the consumer flight-search product) and
from `api.flightpowers.com` (the API itself). Nothing here touches either.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Rendering | Static by default — every content page is prerendered to HTML at build time |
| Styling | Tailwind CSS v4, CSS-first config in `src/app/globals.css`. No component library |
| Content | MDX via `@next/mdx` (`pageExtensions` includes `.mdx`) |
| Sitemap | Generated: `src/app/sitemap.ts` walks the route tree — no hand-maintained URL list |
| Hosting | Vercel |

## Rendering contract

The important pages must be readable by a crawler with JavaScript switched off. That means:

- Content pages are server components. `export const dynamic = 'force-static'`.
- After `npm run build`, the build output must mark every content route `○ (Static)`.
- Client components are allowed **only** for genuinely interactive widgets, and they must
  hydrate on top of server-rendered copy — never replace it.

## Environment

Copy `.env.example` to `.env.local`. Nothing in this repo may contain a live credential.

- `RAPIDAPI_KEY` — server-side only. Read exclusively inside route handlers under
  `src/app/api/`, which run on the server. It is never prefixed `NEXT_PUBLIC_`, never
  imported into a client component, and therefore never reaches the browser bundle.
- `NEXT_PUBLIC_SITE_URL` — canonical origin, used by `sitemap.ts`, `robots.ts` and
  `metadataBase`. Not a secret.

## Commands

```bash
npm install
npm run dev
npm run build      # then check the route table for ○ (Static)
npm run typecheck
```

## Editorial rules

1. **No invented metrics.** No uptime, latency, error rate, customer count or "trusted by N
   developers" figures. A claim is publishable only if it is traceable to the API source, to
   a live marketplace listing, or to a measurement whose sample size is stated on the page.
2. Response field names in copy must match the API exactly.
3. Negative claims about other products are scoped to what was actually checked and dated.

## Deploying

The Vercel project does not exist yet, and it cannot be created without one action only the
account owner can take.

**Blocker.** The Vercel account (mtnrabi) signs in with Google and has **no GitHub login
connection** — Settings → Authentication shows GitHub as "Connect your GitHub account". Without
it, `vercel.com/new` cannot read this repository: framework detection never resolves and the
import fails with *"The repository couldn't be found."* The Vercel **GitHub App** has already
been granted access to this repo (Settings → Applications → Vercel → Repository access), so
that half is done; the missing piece is the account-level login connection, which is an OAuth
grant.

Once GitHub is connected:

1. `vercel.com/new` → import `mtnrabi/flightpowers-developers`.
2. Confirm the Application Preset resolves to **Next.js**. A project created with
   `framework: null` returns 404 on every route; fix with
   `PATCH /v9/projects/flightpowers-developers {"framework":"next"}`.
3. Project → Settings → Domains → add `developers.flightpowers.com`. The DNS record is already
   in place: `developers.flightpowers.com CNAME cname.vercel-dns.com`, in the Netlify-managed
   `flightpowers.com` zone, matching every other FlightPowers subdomain.
4. Project → Settings → Environment Variables → add `RAPIDAPI_KEY` (Production + Preview) when
   a route handler needs it. Nothing on the site reads it yet.
5. Submit `https://developers.flightpowers.com/sitemap.xml` to Google Search Console and Bing
   Webmaster Tools.

Until step 3 completes, `developers.flightpowers.com` resolves but no Vercel project claims it,
so it serves Vercel's not-found page. Nothing links to it.
