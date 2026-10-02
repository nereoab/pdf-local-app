import { ImageResponse } from 'next/og';
import { getServerShareMetadata } from '@/lib/share-server';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Documento Compartido en PDFBlack';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;
  const meta = await getServerShareMetadata(shareId);

  const rawFilename = meta?.originalName || 'Documento.pdf';
  // Permitir hasta 60 caracteres para que nombres largos quepan perfectamente
  const filename = rawFilename.length > 60 ? rawFilename.substring(0, 57) + '...' : rawFilename;
  const formattedSize = meta?.formattedSize || 'PDF';
  const toolName = meta?.tool || 'Comprimir PDF';

  const isCompressed =
    toolName.toLowerCase().includes('comprim') || toolName.toLowerCase().includes('compress');

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#09090d',
        padding: '48px 56px',
        fontFamily: 'sans-serif',
        position: 'relative',
        border: '4px solid #1c1c24',
      }}
    >
      {/* Halo esmeralda sutil de privacidad */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* ── HEADER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Logo PDFBlack */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#FAF6EE',
              color: '#09090b',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(250, 246, 238, 0.3)',
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
              PDF<span style={{ color: '#FAF6EE' }}>BLACK</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#71717a',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Zero-Knowledge Privacy • 100% Local
            </span>
          </div>
        </div>

        {/* Badge Enlace Seguro */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '999px',
            backgroundColor: 'rgba(6, 78, 59, 0.75)',
            border: '1.5px solid rgba(52, 211, 153, 0.45)',
            color: '#6ee7b7',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#34d399',
              boxShadow: '0 0 8px #34d399',
            }}
          />
          <span>DESCARGA PRIVADA • EXPIRA EN 24H</span>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL: ICONO PDF 3D + DATOS DEL DOCUMENTO ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '36px',
          width: '100%',
          padding: '20px 0',
        }}
      >
        {/* Icono de Archivo PDF Tridimensional */}
        <div
          style={{
            width: '150px',
            height: '185px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow:
              '0 20px 40px rgba(239, 68, 68, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
            border: '2px solid rgba(254, 202, 202, 0.35)',
            flexShrink: 0,
          }}
        >
          {/* Pliegue de esquina */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40px',
              height: '40px',
              background:
                'linear-gradient(225deg, #7f1d1d 0%, #991b1b 50%, rgba(255,255,255,0.4) 100%)',
              borderBottomLeftRadius: '14px',
              borderTopRightRadius: '18px',
            }}
          />

          <span
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.02em',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            PDF
          </span>

          <div
            style={{
              width: '60px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '999px',
              marginTop: '10px',
            }}
          />
        </div>

        {/* Información del archivo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Nombre del archivo en grande */}
          <div
            style={{
              fontSize: filename.length > 28 ? '36px' : '44px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '16px',
              textShadow: '0 2px 15px rgba(0,0,0,0.6)',
            }}
          >
            {filename}
          </div>

          {/* Badges de Metadatos y Compresión */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Badge 1: Herramienta / Estado */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '10px',
                backgroundColor: isCompressed
                  ? 'rgba(234, 179, 8, 0.18)'
                  : 'rgba(59, 130, 246, 0.18)',
                border: isCompressed
                  ? '1.5px solid rgba(234, 179, 8, 0.45)'
                  : '1.5px solid rgba(59, 130, 246, 0.45)',
                color: isCompressed ? '#fef08a' : '#93c5fd',
                fontSize: '15px',
                fontWeight: 800,
              }}
            >
              <span>⚡</span>
              <span>{isCompressed ? 'PDF COMPRIMIDO' : toolName.toUpperCase()}</span>
            </div>

            {/* Badge 2: Peso del Archivo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '10px',
                backgroundColor: '#181822',
                border: '1.5px solid #2e2e3e',
                color: '#e4e4e7',
                fontSize: '15px',
                fontWeight: 800,
                fontFamily: 'monospace',
              }}
            >
              <span>💾</span>
              <span>{formattedSize}</span>
            </div>

            {/* Badge 3: Descarga Segura y Privada */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                color: '#a7f3d0',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              <span>🛡️</span>
              <span>Descarga Segura y Privada</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #1f242d',
          paddingTop: '16px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: '#a1a1aa',
            fontFamily: 'monospace',
          }}
        >
          <span>Listo para descargar</span>
          <span>•</span>
          <span>Cero registros en servidores</span>
          <span>•</span>
          <span>100% Confidencial en tu RAM</span>
        </div>

        <div
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: '#FAF6EE',
            fontFamily: 'monospace',
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
