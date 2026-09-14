import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unir PDF Gratis Online — Combinar y Juntar Archivos PDF Sin Límites',
  description:
    'Une y combina múltiples archivos PDF en un único documento de forma rápida, segura y 100% confidencial en tu navegador. Genera índice corporativo (TOC), añade foliado Bates, prepara para impresión dúplex y descarga sin límites ni marcas de agua.',
  keywords: [
    'unir pdf',
    'combinar pdf',
    'juntar pdf',
    'unir archivos pdf gratis',
    'merge pdf online',
    'combinar documentos pdf',
    'unir pdf sin limite',
    'unir pdf confidencial',
    'fusionar pdf',
    'juntar pdf online',
    'combinar pdf sin registro',
    'unir pdf seguro',
    'unir pdf con indice',
    'foliar pdf al unir',
    'unir pdf bates',
    'unir pdf doble cara duplex',
    'pegar pdf en uno',
    'unir dos pdf en uno solo',
    'unir pdf rapido',
    'merge pdf zero knowledge',
    'unir pdf local',
    'unir planos cad pdf',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/organizar/unir',
    languages: {
      'es-ES': 'https://pdf-black.com/organizar/unir',
      'en-US': 'https://pdf-black.com/organizar/unir',
    },
  },
  openGraph: {
    title: 'Unir PDF Gratis Online — Combinar y Juntar Archivos PDF Sin Límites | PDFBlack',
    description:
      'Combina múltiples archivos PDF en un único documento con índice automático, foliado Bates y máxima privacidad local en RAM sin subir datos a servidores.',
    url: 'https://pdf-black.com/organizar/unir',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-unir-pdf.png',
        width: 1200,
        height: 630,
        alt: 'Unir PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unir PDF Gratis Online — Combinar y Juntar Archivos PDF Sin Límites | PDFBlack',
    description:
      'Une y combina múltiples archivos PDF en un solo documento con índice automático y 100% de privacidad local sin límites ni registro.',
    images: ['https://pdf-black.com/og-unir-pdf.png'],
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

export default function UnirPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
