import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir Word a PDF Gratis Online — DOCX y DOC a PDF | PDFBlack',
  description:
    'Convierte documentos Microsoft Word (.docx, .doc) a formato PDF de alta resolución online gratis. Preserva tipografía, márgenes, tablas e hipervínculos.',
  keywords: [
    'convertir word a pdf',
    'word a pdf online gratis',
    'docx a pdf',
    'doc a pdf online',
    'pasar docx a pdf',
    'word to pdf converter free',
    'transformar word a pdf sin marcas',
    'convertir documento word a pdf gratis',
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
    canonical: `${SITE_URL}/convertir/word-pdf`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/word-pdf`,
      'en-US': `${SITE_URL}/convertir/word-pdf?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir Word a PDF Gratis Online — DOCX y DOC a PDF | PDFBlack',
    description:
      'Pasa documentos Microsoft Word (.docx) a PDF conservando el formato visual, fuentes y maquetación de página intactos.',
    url: `${SITE_URL}/convertir/word-pdf`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-word-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir Word a PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir Word a PDF Gratis Online — DOCX a PDF',
    description:
      'Convierte documentos Microsoft Word a PDF con máxima calidad vectorial online gratis.',
    images: [`${SITE_URL}/og-word-pdf.png`],
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

export default function WordPdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
