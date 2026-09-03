import { ImageResponse } from 'next/og';
import { OG_ROBOT } from './og-robot';

/**
 * The share card, and the two functions that name it.
 *
 * The card itself is unchanged: the same departure-board design, with the
 * page's own headline. What changed is WHERE it lives, and why.
 *
 * WHY THE URL CARRIES THE TITLE IN ITS PATH. `/og?title=…` is a dynamic route
 * handler: Next has to invoke the function to answer it, every time the CDN
 * does not already hold that exact response in that exact region. The site has
 * 362 URLs in its sitemap and therefore up to 362 distinct cards, each one
 * fetched a handful of times by crawlers and then not again for weeks. That is
 * the worst possible shape for an LRU edge cache — nothing is popular enough to
 * stay resident — and it showed up as 102 renders per 12 hours at ~314 ms of
 * Active CPU each, which was 82% of this project's CPU on a team that is at
 * 75% of the Hobby cap.
 *
 * Moving the title into the path makes each card a distinct ROUTE rather than a
 * distinct query on one route, which lets the handler be `force-static`. A
 * force-static route handler renders once and is stored in the durable full
 * route cache, served from every region afterwards with no invocation at all,
 * and with `dynamicParams` a title nobody has asked for yet still renders on
 * first request instead of 404ing. So the steady state is zero renders, and the
 * one-off cost is one render per distinct title, ever.
 *
 * The title is base64url so the segment is safe: real titles contain `/`
 * ("24/7"), `&`, `:` and non-ASCII punctuation, none of which survives a path
 * segment intact. Nobody reads these URLs; a crawler does.
 */

export const DEFAULT_TITLE = 'Scan deals 24/7 with real-time flight and hotel data';

/** The og:image path for a page title. The inverse of `titleFromCard`. */
export function ogImagePath(title: string): string {
  return `/og/${Buffer.from(title, 'utf8').toString('base64url')}.png`;
}

/** Read a title back out of a card segment. Returns null if it is not one. */
export function titleFromCard(card: string): string | null {
  const encoded = card.endsWith('.png') ? card.slice(0, -4) : card;
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const title = Buffer.from(encoded, 'base64url').toString('utf8');
    return title.length > 0 && !title.includes('�') ? title : null;
  } catch {
    return null;
  }
}

/** One year, and the response never changes for a given path. */
export const OG_CACHE_CONTROL =
  'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, immutable';

export function renderCard(raw: string): ImageResponse {
  // Strip "FlightPowers - " prefix if present (og:site_name already carries it)
  const cleaned = raw.replace(/^FlightPowers\s*-\s*/i, '');
  const title = cleaned.slice(0, 120);
  const fontSize = title.length > 70 ? 46 : title.length > 45 ? 56 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #07080a 55%, #171207 100%)',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={OG_ROBOT} width={60} height={72} alt="" />
          <div style={{ color: '#e8edf2', fontSize: 40, fontWeight: 700 }}>FlightPowers</div>
        </div>

        <div
          style={{
            color: '#e8edf2',
            fontSize,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            maxWidth: 1010,
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ color: '#7d8794', fontSize: 26 }}>flightpowers.com</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'cache-control': OG_CACHE_CONTROL },
    }
  );
}
