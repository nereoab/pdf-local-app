import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    default: 'Herramientas PDF Gratuitas y Privadas',
    template: '%s | PDFBlack',
  },
  description:
    'Edita, organiza, convierte y optimiza archivos PDF 100% gratis y sin registro. Procesamiento local en tu navegador — cero servidores, privacidad total.',
  alternates: {
    canonical: `${SITE_URL}/es`,
    languages: {
      es: `${SITE_URL}/es`,
      en: `${SITE_URL}/en`,
      'x-default': `${SITE_URL}/en`,
    },
  },
  openGraph: {
    title: 'PDFBlack ♠️ | Herramientas PDF 100% Locales y Privadas',
    description:
      'Edita, organiza, convierte y optimiza PDFs sin servidores. Privacidad total, procesamiento local en tu navegador. 24 herramientas gratis.',
    url: `${SITE_URL}/es`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PDFBlack — Herramientas PDF 100% Locales y Privadas',
      },
    ],
  },
};

export default function SpanishRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
