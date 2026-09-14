import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir HTML a PDF Gratis Online — Páginas Web a PDF | PDFBlack',
  description:
    'Convierte código HTML, plantillas web o páginas completas a documentos PDF vectoriales online gratis. Respeta fuentes web, maquetación CSS y tablas.',
  keywords: [
    'convertir html a pdf',
    'html a pdf online gratis',
    'guardar pagina web como pdf',
    'pagina web a pdf',
    'html to pdf free',
    'descargar web en pdf',
    'convertir codigo html a pdf',
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
    canonical: `${SITE_URL}/convertir/html-pdf`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/html-pdf`,
      'en-US': `${SITE_URL}/convertir/html-pdf?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir HTML a PDF Gratis Online — Páginas Web a PDF | PDFBlack',
    description:
      'Convierte archivos HTML, código CSS y páginas web a documentos PDF con renderizado vectorial nítido.',
    url: `${SITE_URL}/convertir/html-pdf`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-html-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir HTML a PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir HTML a PDF Gratis Online — Web a PDF',
    description: 'Pasa código HTML y páginas web a documentos PDF profesionales online gratis.',
    images: [`${SITE_URL}/og-html-pdf.png`],
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

export default function HtmlPdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
