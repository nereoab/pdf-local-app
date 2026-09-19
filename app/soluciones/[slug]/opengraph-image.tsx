import { ImageResponse } from 'next/og';
import { getSolutionBySlug } from '@/lib/long-tail-registry';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);

  const title = solution?.h1.split('—')[0].trim() || 'Solución PDF Especializada';
  const badge = solution?.badge || 'TRÁMITE OFICIAL';
  const category = solution?.category ? solution.category.toUpperCase() : 'OPTIMIZAR';
  const subtitle =
    solution?.subtitle ||
    'Procesamiento 100% local en tu navegador con privacidad total y sin servidores.';

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#09090b',
        padding: '50px 60px',
        fontFamily: 'sans-serif',
        position: 'relative',
        border: '6px solid #27272a',
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        }}
      />

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
            }}
          >
            ♠
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ffffff',
              }}
            >
              PDF<span style={{ color: '#d4d4d8' }}>BLACK</span>
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#71717a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Zero-Knowledge Engine
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '999px',
            backgroundColor: 'rgba(6, 78, 59, 0.8)',
            border: '1.5px solid rgba(52, 211, 153, 0.4)',
            color: '#6ee7b7',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span>●</span>
          <span>{badge}</span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxWidth: '1050px',
          margin: 'auto 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#10b981',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          SOLUCIÓN {category} • 100% GRATIS Y SIN LÍMITES
        </div>

        <h1
          style={{
            fontSize: title.length > 55 ? '42px' : '50px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            margin: 0,
            display: 'flex',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: '19px',
            color: '#a1a1aa',
            lineHeight: 1.4,
            margin: 0,
            display: 'flex',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* FOOTER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingTop: '20px',
          borderTop: '1.5px solid #27272a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#e4e4e7',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#10b981' }}>✓</span>
            <span>100% Memoria Local</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#e4e4e7',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#10b981' }}>✓</span>
            <span>Sin Servidores Externos</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#e4e4e7',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#10b981' }}>✓</span>
            <span>Estándar ISO 32000</span>
          </div>
        </div>

        <div
          style={{
            fontSize: '16px',
            fontWeight: 800,
            fontFamily: 'monospace',
            color: '#ffffff',
            letterSpacing: '0.05em',
          }}
        >
          pdf-black.com
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
