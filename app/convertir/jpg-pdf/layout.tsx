import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir JPG a PDF Gratis Online — Unir Fotos e Imágenes a PDF | PDFBlack',
  description:
    'Convierte y combina imágenes JPG, PNG o WebP en un único archivo PDF ordenado online gratis. Ajusta orientación, márgenes y calidad con facilidad.',
  keywords: [
    'convertir jpg a pdf',
    'jpg a pdf online gratis',
    'unir fotos en pdf',
    'pasar imagenes a pdf',
    'crear pdf con fotos',
    'jpg to pdf free',
    'convertir imagenes a documento pdf',
    'fotos a pdf sin perder calidad',
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
    canonical: `${SITE_URL}/convertir/jpg-pdf`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/jpg-pdf`,
      'en-US': `${SITE_URL}/convertir/jpg-pdf?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir JPG a PDF Gratis Online — Unir Fotos a PDF | PDFBlack',
    description:
      'Transforma tus imágenes JPG o fotos en un documento PDF estructurado. Reordena páginas y define márgenes fácilmente.',
    url: `${SITE_URL}/convertir/jpg-pdf`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-jpg-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir JPG a PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir JPG a PDF Gratis Online — Fotos a PDF',
    description: 'Combina y convierte fotos JPG a PDF en segundos online gratis y sin límites.',
    images: [`${SITE_URL}/og-jpg-pdf.png`],
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

export default function JpgPdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
