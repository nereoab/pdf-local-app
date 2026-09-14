import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PDF a Word Gratis Online — DOCX 100% Editable | PDFBlack',
  description:
    'Convierte documentos PDF a Microsoft Word (.docx) editables al 100% online gratis. Conserva tablas, columnas, fuentes y formato original con precisión milimétrica.',
  keywords: [
    'convertir pdf a word',
    'pdf a docx online gratis',
    'pasar pdf a word editable',
    'convertir pdf a word sin perder formato',
    'pdf to word free',
    'convert pdf to word editable',
    'transformar pdf en word',
    'pdf a word sin registro',
    'convertidor de pdf a word',
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
    canonical: `${SITE_URL}/convertir/pdf-word`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/pdf-word`,
      'en-US': `${SITE_URL}/convertir/pdf-word?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PDF a Word Gratis Online — DOCX 100% Editable | PDFBlack',
    description:
      'Transforma tus documentos PDF en archivos Microsoft Word (.docx) editables al 100%. Reconstruye fuentes, maquetación y tablas con precisión.',
    url: `${SITE_URL}/convertir/pdf-word`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-pdf-word.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir PDF a Word Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PDF a Word Gratis Online — DOCX Editable',
    description:
      'Convierte documentos PDF a Microsoft Word (.docx) editables al 100% online gratis y con máxima fidelidad.',
    images: [`${SITE_URL}/og-pdf-word.png`],
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

export default function PdfWordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
