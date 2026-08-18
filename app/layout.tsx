import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { FirebaseAuthProvider } from '../context/FirebaseAuthContext';
import SharedLayout from '../components/SharedLayout';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';
const SITE_NAME = 'PDFBlack';

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  // ── Básico ──
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} ♠️ | Herramientas PDF Gratuitas, Privadas y Locales`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Edita, organiza, convierte y optimiza archivos PDF 100% gratis y sin registro. Procesamiento local en tu navegador — cero servidores, privacidad total.',
  keywords: [
    'PDF',
    'editar PDF',
    'comprimir PDF',
    'unir PDF',
    'convertir PDF',
    'firma digital',
    'OCR',
    'PDF gratis',
    'privacidad PDF',
    'procesamiento local',
    'sin servidores',
  ],
  authors: [{ name: 'PDFBlack', url: SITE_URL }],
  generator: 'Next.js',
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // ── Robots / Canonical ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      es: `${SITE_URL}/es`,
      en: `${SITE_URL}/en`,
    },
  },

  // ── Open Graph ──
  openGraph: {
    title: `${SITE_NAME} ♠️ | Herramientas PDF 100% Locales y Privadas`,
    description:
      'Edita, organiza, convierte y optimiza PDFs sin servidores. Privacidad total, procesamiento local en tu navegador. 24 herramientas gratis.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Herramientas PDF 100% Locales y Privadas`,
        type: 'image/png',
      },
    ],
  },

  // ── Twitter Cards ──
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} ♠️ | Herramientas PDF 100% Locales y Privadas`,
    description:
      'Edita, organiza, convierte y optimiza PDFs sin servidores. Privacidad total, procesamiento local en tu navegador. 24 herramientas gratis.',
    creator: '@pdfblack',
    images: [`${SITE_URL}/og-image.png`],
  },

  // ── Icons ──
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },

  // ── Verificación search engines ──
  verification: {
    google: undefined, // Agregar código de verificación cuando esté disponible
  },

  // ── App Links / Mobile ──
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" style={{ colorScheme: 'dark light' }} suppressHydrationWarning>
      <head>
        {/* Preconexiones para mejorar rendimiento de CDNs */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://cdn.syncfusion.com" />
        {/* CSP vía meta tag — respaldo confiable para desarrollo (Turbopack a veces ignora headers()) */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https://cdnjs.cloudflare.com https://cdn.syncfusion.com https://cdn.jsdelivr.net https://unpkg.com; " +
            "script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https://cdnjs.cloudflare.com https://cdn.syncfusion.com https://cdn.jsdelivr.net https://unpkg.com; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.syncfusion.com; " +
            "font-src 'self' data: https://fonts.gstatic.com; " +
            "img-src 'self' data: blob: https:; " +
            "connect-src 'self' blob: data: https://cdnjs.cloudflare.com https://cdn.syncfusion.com https://cdn.jsdelivr.net https://raw.githubusercontent.com https://unpkg.com; " +
            "frame-src 'self' blob:; " +
            "worker-src 'self' blob: data: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; " +
            "media-src 'self'; " +
            "object-src 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'"
          }
        />
      </head>
      <body
        className="bg-[var(--background)] text-[var(--foreground)] antialiased min-h-screen"
        suppressHydrationWarning
      >
        {/* SKIP-TO-CONTENT LINK — Accesibilidad WCAG 2.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-bold focus:text-sm focus:shadow-2xl focus:outline-none"
        >
          Saltar al contenido principal
        </a>

        <ThemeProvider>
          <LanguageProvider>
            <FirebaseAuthProvider>
              <SharedLayout>
                {children}
              </SharedLayout>
            </FirebaseAuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
