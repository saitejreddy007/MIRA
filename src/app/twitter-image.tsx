import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MIRA — AI Business Representative';
export const size = { width: 1200, height: 675 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #FAFAF7 0%, #F0FDF4 100%)',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(180deg, #22C55E 0%, #15803D 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '36px',
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#0B1220',
              letterSpacing: '-0.02em',
              display: 'flex',
            }}
          >
            MIRA
          </div>
        </div>

        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#0B1220',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginTop: '160px',
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          Recover revenue in your voice.
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#475569',
            marginTop: '24px',
            maxWidth: '780px',
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          AI follow-ups that sound like you. Warmer than a template. Faster than a human.
        </div>
      </div>
    ),
    { ...size }
  );
}
