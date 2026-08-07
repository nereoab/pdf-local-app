import type { NextConfig } from 'next';

// ─── Bundle Analyzer (solo en ANALYZE=true) ───
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ── Standalone output para Docker / Vercel ──
  output: 'standalone',

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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.syncfusion.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.syncfusion.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://cdnjs.cloudflare.com https://cdn.syncfusion.com",
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
      // Caché agresiva para assets estáticos
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
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
