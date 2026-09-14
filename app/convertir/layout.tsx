import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PDF Gratis Online — Word, Excel, PowerPoint, JPG | PDFBlack',
  description:
    'Convierte archivos PDF a Word, Excel, PowerPoint, imágenes JPG, HTML y Texto online gratis. Motor de conversión de alta fidelidad sin registros ni marcas de agua.',
  keywords: [
    'convertir pdf gratis',
    'convertir pdf a word',
    'convertir word a pdf',
    'convertir pdf a excel',
    'convertir excel a pdf',
    'convertir pdf a powerpoint',
    'convertir powerpoint a pdf',
    'convertir pdf a jpg',
    'convertir jpg a pdf',
    'convertir pdf a texto',
    'convertir texto a pdf',
    'convertir pdf a html',
    'convertir html a pdf',
    'pdf converter free online',
    'convertidor de pdf',
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
    canonical: `${SITE_URL}/convertir`,
    languages: {
      'es-ES': `${SITE_URL}/convertir`,
      'en-US': `${SITE_URL}/convertir?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PDF Gratis Online — Word, Excel, PowerPoint, JPG | PDFBlack',
    description:
      'Herramientas profesionales de conversión PDF bidireccional: Word, Excel, PowerPoint, imágenes y texto con máxima precisión tipográfica y de tablas.',
    url: `${SITE_URL}/convertir`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-convertir-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Convertidor de PDF Gratis Online — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PDF Gratis Online — Word, Excel, PowerPoint, JPG | PDFBlack',
    description:
      'Convierte archivos PDF a Word, Excel, PowerPoint, JPG, HTML y Texto online gratis y sin límites.',
    images: [`${SITE_URL}/og-convertir-pdf.png`],
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

export default function ConvertirLayout({ children }: { children: React.ReactNode }) {
  return children;
}
