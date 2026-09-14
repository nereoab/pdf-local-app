import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rotar PDF Gratis Online — Girar Páginas y Cambiar Orientación PDF',
  description:
    'Gira y cambia la orientación de páginas PDF de forma rápida, visual y 100% privada en tu navegador. Rota hojas individuales o todo el documento a 90°, 180° o 270°, normaliza páginas horizontales apaisadas y descarga tu PDF orientado sin marcas de agua ni límites.',
  keywords: [
    'rotar pdf',
    'girar pdf',
    'cambiar orientacion pdf',
    'rotar paginas pdf online',
    'rotar pdf gratis',
    'girar hojas de un pdf',
    'rotate pdf online free',
    'rotar pdf 90 grados',
    'rotar pdf 180 grados',
    'normalizar pdf apaisado horizontal',
    'rotar pdf sin limites',
    'girar pagina pdf individual',
    'como girar un archivo pdf',
    'rotar pdf confidencial',
    'rotar pdf local sin subir archivos',
    'rotar pdf en movil',
    'cambiar orientacion vertical horizontal pdf',
    'rotate pdf pages permanently',
    'girar hojas pdf guardado permanente',
    'rotate pdf zero knowledge',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/organizar/rotar',
    languages: {
      'es-ES': 'https://pdf-black.com/organizar/rotar',
      'en-US': 'https://pdf-black.com/organizar/rotar',
    },
  },
  openGraph: {
    title: 'Rotar PDF Gratis Online — Girar Páginas y Cambiar Orientación PDF | PDFBlack',
    description:
      'Gira y orienta páginas de documentos PDF individualmente o en lote a 90°, 180° o 270° con procesamiento 100% privado en memoria RAM local sin subir datos a la nube.',
    url: 'https://pdf-black.com/organizar/rotar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-rotar-pdf.png',
        width: 1200,
        height: 630,
        alt: 'Rotar Páginas PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rotar PDF Gratis Online — Girar Páginas y Cambiar Orientación PDF | PDFBlack',
    description:
      'Gira y reorienta hojas de documentos PDF con visualización interactiva en tiempo real y preservación de vectores nativos en memoria local.',
    images: ['https://pdf-black.com/og-rotar-pdf.png'],
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

export default function RotarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
