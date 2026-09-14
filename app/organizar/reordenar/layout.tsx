import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organizar PDF Gratis Online — Ordenar, Unir, Rotar y Eliminar Páginas',
  description:
    'Organiza las páginas de tus archivos PDF como quieras de forma visual, interactiva y 100% confidencial en tu navegador. Arrastra y suelta para ordenar hojas, rota páginas individuales, elimina lo que no necesites, combina múltiples PDFs o añade páginas en blanco sin subir archivos a servidores externos ni marcas de agua.',
  keywords: [
    'organizar pdf',
    'organizar pdf online',
    'ordenar paginas pdf',
    'organize pdf online free',
    'reordenar paginas pdf',
    'organizar pdf gratis',
    'mover hojas pdf',
    'ilovepdf organizar pdf alternativa',
    'cambiar orden paginas pdf',
    'reorganizar paginas de un pdf',
    'combinar y ordenar pdf',
    'rotar y ordenar pdf',
    'eliminar y mover hojas pdf',
    'intercalar paginas pdf duplex',
    'insertar pagina en blanco pdf',
    'organizador de pdf online sin limites',
    'organizar pdf en memoria ram local',
    'organizar pdf confidencial',
    'organize pdf pages drag and drop',
    'organizar pdf sin subir archivos',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/organizar/reordenar',
    languages: {
      'es-ES': 'https://pdf-black.com/organizar/reordenar',
      'en-US': 'https://pdf-black.com/organizar/reordenar',
    },
  },
  openGraph: {
    title: 'Organizar PDF Gratis Online — Ordenar, Unir, Rotar y Eliminar Páginas | PDFBlack',
    description:
      'Organiza, une, reordena, rota y elimina páginas de documentos PDF mediante mesa de montaje interactiva 100% privada en la memoria local de tu navegador sin servidores.',
    url: 'https://pdf-black.com/organizar/reordenar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-organizar-pdf.png',
        width: 1200,
        height: 630,
        alt: 'Organizar Páginas PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organizar PDF Gratis Online — Ordenar, Unir, Rotar y Eliminar Páginas | PDFBlack',
    description:
      'Herramienta profesional estilo iLovePDF para organizar, ordenar, rotar y fusionar hojas de múltiples archivos PDF con privacidad Zero-Knowledge.',
    images: ['https://pdf-black.com/og-organizar-pdf.png'],
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

export default function ReordenarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
