import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

/**
 * Parameterised share-card image: /og?title=<page title>.
 * Same departure-board design for every page, with the page's own headline.
 * Lives at /og (not /api/og) so robots.txt's Disallow: /api/ never applies.
 */
export function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('title') ?? 'Live fares, and the context to judge them';
  const title = raw.slice(0, 120);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 16 16">
            <path d="M1 9.2 15 2 9.6 15l-2-5.1L1 9.2Z" fill="none" stroke="#ffb020" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', color: '#4ade80', background: 'rgba(74,222,128,0.12)', borderRadius: 999, padding: '8px 26px', fontSize: 26 }}>
            low
          </div>
          <div style={{ display: 'flex', color: '#ffb020', background: 'rgba(255,176,32,0.12)', borderRadius: 999, padding: '8px 26px', fontSize: 26 }}>
            typical
          </div>
          <div style={{ display: 'flex', color: '#f87171', background: 'rgba(248,113,113,0.12)', borderRadius: 999, padding: '8px 26px', fontSize: 26 }}>
            high
          </div>
          <div style={{ color: '#7d8794', fontSize: 26, marginLeft: 'auto' }}>flightpowers.com</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    }
  );
}
