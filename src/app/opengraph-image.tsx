import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MIRA — AI Business Representative';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-180px',
            left: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
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
              letterSpacing: '-0.04em',
            }}
          >
            M
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0B1220', letterSpacing: '-0.02em' }}>
              MIRA
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              AI Representative
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '76px',
              fontWeight: 800,
              color: '#0B1220',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: '900px',
              display: 'flex',
            }}
          >
            Recover revenue in{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #22C55E 0%, #06B6D4 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginLeft: '20px',
              }}
            >
              your voice.
            </span>
          </div>
          <div
            style={{
              fontSize: '26px',
              color: '#475569',
              marginTop: '24px',
              maxWidth: '780px',
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            MIRA follows up on overdue invoices in a tone that sounds like you.
            Warm, direct, available 24/7.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '40px',
              fontSize: '12px',
              color: '#94A3B8',
              fontWeight: 600,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            A WHITEMIRROR PRODUCT
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
