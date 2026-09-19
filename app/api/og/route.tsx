import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Herramientas PDF Gratuitas y Privadas';
    const badge = searchParams.get('badge') || '100% LOCAL & PRIVADO';
    const category = searchParams.get('category') || 'PDFBLACK';
    const lang = searchParams.get('lang') || 'es';
    const isEs = lang === 'es';

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
        {/* Brillo de fondo sutil */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          }}
        />

        {/* CABECERA SUPERIOR: LOGO Y BADGE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Logo de PDFBlack */}
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

          {/* Badge Pill */}
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

        {/* CUERPO CENTRAL: TÍTULO Y DESCRIPCIÓN */}
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
            {category} • {isEs ? 'PROCESAMIENTO CLIENT-SIDE' : 'CLIENT-SIDE EXECUTION'}
          </div>

          <h1
            style={{
              fontSize: title.length > 55 ? '44px' : '52px',
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
              fontSize: '20px',
              color: '#a1a1aa',
              lineHeight: 1.4,
              margin: 0,
              display: 'flex',
            }}
          >
            {isEs
              ? 'Edita, organiza, convierte y optimiza sin subir archivos a la nube. Cero servidores, privacidad total.'
              : 'Edit, organize, convert, and optimize PDFs locally in your browser. Zero cloud uploads, total privacy.'}
          </p>
        </div>

        {/* PIE DE TARJETA: CARACTERÍSTICAS Y DOMINIO */}
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
              <span>{isEs ? '100% Memoria Local' : '100% Local RAM'}</span>
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
              <span>{isEs ? 'Sin Registro Ni Límites' : 'No Signup or Limits'}</span>
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
              <span>ISO 32000</span>
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
        width: 1200,
        height: 630,
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
