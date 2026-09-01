import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { OG_ROBOT } from './og-robot';

/**
 * Parameterised share-card image: /og?title=<page title>.
 * Same departure-board design for every page, with the page's own headline.
 * Lives at /og (not /api/og) so robots.txt's Disallow: /api/ never applies.
 */
export function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('title') ?? 'Scan deals 24/7 with real-time flight and hotel data';
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
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    }
  );
}
