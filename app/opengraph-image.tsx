import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PDFBlack — Herramientas PDF Gratuitas, Privadas y 100% Locales';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
      {/* Halo de luz de fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '600px',
          height: '600px',
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
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 900,
              boxShadow: '0 0 25px rgba(255, 255, 255, 0.25)',
            }}
          >
            ♠
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ffffff',
              }}
            >
              PDF<span style={{ color: '#d4d4d8' }}>BLACK</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#71717a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Zero-Knowledge Privacy Engine
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
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
          <span>24 HERRAMIENTAS 100% GRATIS</span>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
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
          WEBASSEMBLY & WEB WORKERS MULTIHILO
        </div>

        <h1
          style={{
            fontSize: '56px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            margin: 0,
            display: 'flex',
          }}
        >
          Herramientas PDF Locales y Privadas en tu Navegador
        </h1>

        <p
          style={{
            fontSize: '22px',
            color: '#a1a1aa',
            lineHeight: 1.4,
            margin: 0,
            display: 'flex',
          }}
        >
          Edita, organiza, convierte, firma y optimiza sin servidores. Cero riesgo de filtración,
          privacidad absoluta.
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#e4e4e7',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#10b981' }}>✓</span>
            <span>Procesamiento 100% en RAM</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#e4e4e7',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#10b981' }}>✓</span>
            <span>Cero Subidas a Servidores</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#e4e4e7',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#10b981' }}>✓</span>
            <span>Cumplimiento RGPD & HIPAA</span>
          </div>
        </div>

        <div
          style={{
            fontSize: '17px',
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
