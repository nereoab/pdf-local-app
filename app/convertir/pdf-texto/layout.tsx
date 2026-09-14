import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PDF a Texto Gratis Online — Extraer Texto TXT | PDFBlack',
  description:
    'Extrae todo el contenido de texto de tu documento PDF y expórtalo a formato de texto plano (.txt) online gratis. Rápido, limpio y sin caracteres extraños.',
  keywords: [
    'convertir pdf a texto',
    'pdf a txt online gratis',
    'extraer texto de pdf',
    'copiar texto de pdf',
    'pdf to text free',
    'pasar pdf a texto plano',
    'convertidor pdf a txt',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  creator: 'PDFBlack',
  publisher: 'PDFBlack',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/convertir/pdf-texto`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/pdf-texto`,
      'en-US': `${SITE_URL}/convertir/pdf-texto?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PDF a Texto Gratis Online — Extraer Texto TXT | PDFBlack',
    description:
      'Extrae párrafos, listas y contenido textual de documentos PDF directamente a archivos TXT editables y ligeros.',
    url: `${SITE_URL}/convertir/pdf-texto`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-pdf-texto.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir PDF a Texto Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PDF a Texto Gratis Online — PDF a TXT',
    description: 'Extrae texto limpio de cualquier PDF online gratis sin caracteres corruptos.',
    images: [`${SITE_URL}/og-pdf-texto.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function PdfTextoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
