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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdnjs.cloudflare.com https://cdn.syncfusion.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.syncfusion.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://www.google-analytics.com https://*.google-analytics.com",
              "connect-src 'self' https://cdnjs.cloudflare.com https://cdn.syncfusion.com https://cdn.jsdelivr.net https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
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
};

export default bundleAnalyzer(nextConfig);
