import type { NextConfig } from 'next';

// ─── Bundle Analyzer (solo en ANALYZE=true) ───
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ── Standalone output solo para Docker cuando se define BUILD_STANDALONE ──
  ...(process.env.BUILD_STANDALONE === 'true' ? { output: 'standalone' } : {}),

  // ── Headers de seguridad + Caché ──
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdnjs.cloudflare.com https://cdn.syncfusion.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.syncfusion.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://www.google-analytics.com https://*.google-analytics.com https://*.clarity.ms",
              "connect-src 'self' https://cdnjs.cloudflare.com https://cdn.syncfusion.com https://cdn.jsdelivr.net https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.clarity.ms https://*.bing.com",
              "frame-src 'self' blob:",
              "worker-src 'self' blob:",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },

      // Headers para archivos comprimidos de WebViewer (Brotli y Gzip WASM/JS/MEM)
      {
        source: '/webviewer/:path*.br.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Content-Encoding', value: 'br' },
        ],
      },
      {
        source: '/webviewer/:path*.br.mem',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'Content-Encoding', value: 'br' },
        ],
      },
      {
        source: '/webviewer/:path*.br.js.mem',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Content-Encoding', value: 'br' },
        ],
      },
      {
        source: '/webviewer/:path*.gz.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Content-Encoding', value: 'gzip' },
        ],
      },
      {
        source: '/webviewer/:path*.gz.mem',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'Content-Encoding', value: 'gzip' },
        ],
      },
      {
        source: '/webviewer/:path*.gz.js.mem',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Content-Encoding', value: 'gzip' },
        ],
      },
      // No cachear API routes
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
    ];
  },

  // ── Redirecciones 301 Canónicas Anti-Canibalización SEO ──
  async redirects() {
    return [
      {
        source: '/desbloquear',
        destination: '/optimizar/desbloquear',
        permanent: true,
      },
      {
        source: '/desbloquear-pdf',
        destination: '/optimizar/desbloquear',
        permanent: true,
      },
      {
        source: '/optimizar/comprimir-pdf',
        destination: '/optimizar/comprimir',
        permanent: true,
      },
      {
        source: '/optimizar/desbloquear-pdf',
        destination: '/optimizar/desbloquear',
        permanent: true,
      },
      {
        source: '/optimizar/proteger-pdf',
        destination: '/optimizar/proteger',
        permanent: true,
      },
      {
        source: '/editar/firma',
        destination: '/editar/firmar',
        permanent: true,
      },

      // ── Redirecciones 301 Bilingües: Rutas legadas /en/[español] ➜ Slugs Nativos /en/[inglés] ──
      // Hubs
      { source: '/en/organizar', destination: '/en/organize', permanent: true },
      { source: '/en/optimizar', destination: '/en/optimize', permanent: true },
      { source: '/en/editar', destination: '/en/edit', permanent: true },
      { source: '/en/convertir', destination: '/en/convert', permanent: true },

      // Organizar
      { source: '/en/organizar/unir', destination: '/en/merge-pdf', permanent: true },
      { source: '/en/organizar/dividir', destination: '/en/split-pdf', permanent: true },
      { source: '/en/organizar/eliminar', destination: '/en/delete-pdf-pages', permanent: true },
      { source: '/en/organizar/reordenar', destination: '/en/reorder-pdf-pages', permanent: true },
      { source: '/en/organizar/rotar', destination: '/en/rotate-pdf', permanent: true },
      { source: '/en/organizar/recortar', destination: '/en/crop-pdf', permanent: true },

      // Optimizar
      { source: '/en/optimizar/comprimir', destination: '/en/compress-pdf', permanent: true },
      { source: '/en/optimizar/reparar', destination: '/en/repair-pdf', permanent: true },
      { source: '/en/optimizar/proteger', destination: '/en/protect-pdf', permanent: true },
      { source: '/en/optimizar/desbloquear', destination: '/en/unlock-pdf', permanent: true },
      { source: '/en/optimizar/censurar', destination: '/en/redact-pdf', permanent: true },
      { source: '/en/optimizar/comparar', destination: '/en/compare-pdf', permanent: true },

      // Editar
      { source: '/en/editar/texto', destination: '/en/edit-pdf', permanent: true },
      { source: '/en/editar/foliar', destination: '/en/bates-numbering', permanent: true },
      { source: '/en/editar/marca-agua', destination: '/en/watermark-pdf', permanent: true },
      {
        source: '/en/editar/quitar-marca-agua',
        destination: '/en/remove-watermark',
        permanent: true,
      },
      { source: '/en/editar/firmar', destination: '/en/sign-pdf', permanent: true },
      { source: '/en/editar/ocr', destination: '/en/ocr-pdf', permanent: true },

      // Convertir
      { source: '/en/convertir/pdf-word', destination: '/en/pdf-to-word', permanent: true },
      { source: '/en/convertir/word-pdf', destination: '/en/word-to-pdf', permanent: true },
      { source: '/en/convertir/pdf-excel', destination: '/en/pdf-to-excel', permanent: true },
      { source: '/en/convertir/excel-pdf', destination: '/en/excel-to-pdf', permanent: true },
      {
        source: '/en/convertir/pdf-powerpoint',
        destination: '/en/pdf-to-powerpoint',
        permanent: true,
      },
      {
        source: '/en/convertir/powerpoint-pdf',
        destination: '/en/powerpoint-to-pdf',
        permanent: true,
      },
      { source: '/en/convertir/pdf-jpg', destination: '/en/pdf-to-jpg', permanent: true },
      { source: '/en/convertir/jpg-pdf', destination: '/en/jpg-to-pdf', permanent: true },
      { source: '/en/convertir/pdf-html', destination: '/en/pdf-to-html', permanent: true },
      { source: '/en/convertir/html-pdf', destination: '/en/html-to-pdf', permanent: true },
      { source: '/en/convertir/pdf-texto', destination: '/en/pdf-to-txt', permanent: true },
      { source: '/en/convertir/texto-pdf', destination: '/en/txt-to-pdf', permanent: true },

      // Legales / Institucionales
      { source: '/en/privacidad', destination: '/en/privacy', permanent: true },
      { source: '/en/terminos', destination: '/en/terms', permanent: true },
      { source: '/en/contacto', destination: '/en/contact', permanent: true },
      { source: '/en/aviso-legal', destination: '/en/legal-notice', permanent: true },
    ];
  },
};

export default bundleAnalyzer(nextConfig);
