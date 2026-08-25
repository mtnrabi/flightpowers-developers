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
