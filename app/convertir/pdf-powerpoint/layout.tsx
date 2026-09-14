import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PDF a PowerPoint Gratis Online — Presentación PPTX | PDFBlack',
  description:
    'Convierte tus diapositivas y páginas PDF a presentaciones Microsoft PowerPoint (.pptx) editables online gratis. Mantiene textos, imágenes y diseño visual.',
  keywords: [
    'convertir pdf a powerpoint',
    'pdf a pptx online gratis',
    'pasar pdf a diapositivas',
    'pdf to powerpoint converter free',
    'convertir pdf a presentacion editable',
    'transformar pdf en powerpoint',
    'pdf a ppt gratis',
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
    canonical: `${SITE_URL}/convertir/pdf-powerpoint`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/pdf-powerpoint`,
      'en-US': `${SITE_URL}/convertir/pdf-powerpoint?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PDF a PowerPoint Gratis Online — Presentación PPTX | PDFBlack',
    description:
      'Convierte documentos PDF en presentaciones Microsoft PowerPoint (.pptx) editables. Preserva textos, imágenes y relación de aspecto de diapositiva.',
    url: `${SITE_URL}/convertir/pdf-powerpoint`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-pdf-powerpoint.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir PDF a PowerPoint Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PDF a PowerPoint Gratis Online — PPTX Editable',
    description:
      'Pasa diapositivas PDF a presentaciones PowerPoint (.pptx) editables online gratis.',
    images: [`${SITE_URL}/og-pdf-powerpoint.png`],
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

export default function PdfPowerPointLayout({ children }: { children: React.ReactNode }) {
  return children;
}
