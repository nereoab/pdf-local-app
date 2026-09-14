import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PDF a JPG Gratis Online — Extraer Imágenes en Alta Calidad | PDFBlack',
  description:
    'Convierte cada página de tu documento PDF en una imagen JPG de alta definición (HD) online gratis. Rápido, nítido y descarga individual o en archivo ZIP.',
  keywords: [
    'convertir pdf a jpg',
    'pdf a jpg online gratis',
    'pasar pdf a foto',
    'extraer imagenes de pdf',
    'convertir paginas pdf a imagen',
    'pdf to jpg free',
    'pdf a jpeg hd',
    'transformar pdf en fotos gratis',
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
    canonical: `${SITE_URL}/convertir/pdf-jpg`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/pdf-jpg`,
      'en-US': `${SITE_URL}/convertir/pdf-jpg?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PDF a JPG Gratis Online — Extraer Imágenes HD | PDFBlack',
    description:
      'Convierte tus archivos PDF en imágenes JPG de alta calidad visual. Extrae páginas completas o elementos gráficos en segundos.',
    url: `${SITE_URL}/convertir/pdf-jpg`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-pdf-jpg.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir PDF a JPG Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PDF a JPG Gratis Online — Imágenes HD',
    description: 'Pasa páginas PDF a imágenes JPG de alta definición online gratis y sin límites.',
    images: [`${SITE_URL}/og-pdf-jpg.png`],
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

export default function PdfJpgLayout({ children }: { children: React.ReactNode }) {
  return children;
}
