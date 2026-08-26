import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'FlightPowers — live flight & hotel pricing APIs with a price verdict';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ color: '#e8edf2', fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 980 }}>
            Live fares, and the context to judge them
          </div>
          <div style={{ color: '#a3adba', fontSize: 30, maxWidth: 900 }}>
            Google&apos;s price band + a low | typical | high verdict on every result. For developers and AI agents.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              color: '#4ade80',
              background: 'rgba(74,222,128,0.12)',
              borderRadius: 999,
              padding: '8px 26px',
              fontSize: 26,
            }}
          >
            low
          </div>
          <div
            style={{
              display: 'flex',
              color: '#ffb020',
              background: 'rgba(255,176,32,0.12)',
              borderRadius: 999,
              padding: '8px 26px',
              fontSize: 26,
            }}
          >
            typical
          </div>
          <div
            style={{
              display: 'flex',
              color: '#f87171',
              background: 'rgba(248,113,113,0.12)',
              borderRadius: 999,
              padding: '8px 26px',
              fontSize: 26,
            }}
          >
            high
          </div>
          <div style={{ color: '#7d8794', fontSize: 26, marginLeft: 'auto', fontFamily: 'monospace' }}>flightpowers.com</div>
        </div>
      </div>
    ),
    size
  );
}
