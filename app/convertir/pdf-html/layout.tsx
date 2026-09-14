import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PDF a HTML Gratis Online — Código Web Responsivo | PDFBlack',
  description:
    'Convierte páginas PDF en código web HTML responsivo y CSS online gratis. Facilita la publicación de manuales, artículos y catálogos en sitios web.',
  keywords: [
    'convertir pdf a html',
    'pdf a html online gratis',
    'pasar pdf a pagina web',
    'convertir pdf para web',
    'pdf to html free',
    'transformar pdf en codigo html',
    'extraer html de pdf',
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
    canonical: `${SITE_URL}/convertir/pdf-html`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/pdf-html`,
      'en-US': `${SITE_URL}/convertir/pdf-html?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PDF a HTML Gratis Online — Código Web Responsivo | PDFBlack',
    description:
      'Transforma documentos PDF en páginas web HTML y CSS semánticas listas para publicar en cualquier navegador.',
    url: `${SITE_URL}/convertir/pdf-html`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-pdf-html.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir PDF a HTML Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PDF a HTML Gratis Online — Web Responsivo',
    description: 'Convierte documentos PDF a código web HTML limpio y responsivo online gratis.',
    images: [`${SITE_URL}/og-pdf-html.png`],
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

export default function PdfHtmlLayout({ children }: { children: React.ReactNode }) {
  return children;
}
