import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recortar PDF Gratis Online — Ajustar Márgenes y Crop PDF Sin Límites',
  description:
    'Recorta los márgenes de documentos PDF de forma visual, interactiva y 100% privada en tu navegador. Ajusta bordes blancos, elimina cabeceras o pies de página en milímetros con precisión CropBox vectorial, sin subir tus archivos a servidores externos ni marcas de agua.',
  keywords: [
    'recortar pdf',
    'crop pdf online',
    'ajustar margenes pdf',
    'recortar bordes blancos pdf',
    'recortar paginas pdf gratis',
    'cortar margenes de un pdf',
    'recortar cabecera y pie de pagina pdf',
    'recortar planos pdf',
    'recortar hojas pdf en lote',
    'crop pdf free no limits',
    'quitar bordes negros escaneo pdf',
    'ajustar tamaño de pagina pdf',
    'recortar pdf online sin marca de agua',
    'recortar pdf local privado',
    'recortar pdf sin subir a internet',
    'cropbox pdf editor online',
    'recortar pdf en milimetros',
    'recorte vectorial pdf sin perdida de calidad',
    'recortar documentos pdf confidenciales',
    'crop pdf zero knowledge',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/organizar/recortar',
    languages: {
      'es-ES': 'https://pdf-black.com/organizar/recortar',
      'en-US': 'https://pdf-black.com/organizar/recortar',
    },
  },
  openGraph: {
    title: 'Recortar PDF Gratis Online — Ajustar Márgenes y Crop PDF Sin Límites | PDFBlack',
    description:
      'Recorta bordes blancos, cabeceras y márgenes de documentos PDF con visor interactivo o ajuste milimétrico en lote con procesamiento 100% en tu navegador.',
    url: 'https://pdf-black.com/organizar/recortar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-recortar-pdf.png',
        width: 1200,
        height: 630,
        alt: 'Recortar Márgenes de Documentos PDF con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recortar PDF Gratis Online — Ajustar Márgenes y Crop PDF Sin Límites | PDFBlack',
    description:
      'Herramienta profesional para recortar márgenes de archivos PDF en tiempo real. Conservación vectorial nativa y privacidad total sin servidores.',
    images: ['https://pdf-black.com/og-recortar-pdf.png'],
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

export default function RecortarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
