import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editar PDF Gratis Online — Texto, Firma, OCR y Marcas de Agua | PDFBlack',
  description:
    'Edita documentos PDF directamente en tu navegador web: modifica texto, añade firmas digitales y sellos, numera folios, inserta marcas de agua y aplica OCR para hacer texto seleccionable. 100% privado en memoria RAM, gratis y sin límites.',
  keywords: [
    'editar pdf gratis',
    'editor pdf online',
    'firmar pdf gratis',
    'ocr pdf',
    'foliar paginas pdf',
    'marca de agua pdf',
    'modificar texto pdf',
    'edit pdf free online',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/editar',
  },
  openGraph: {
    title: 'Editar PDF Gratis Online — Texto, Firma y OCR | PDFBlack',
    description:
      'Herramientas avanzadas de edición y manipulación de PDFs en tu navegador sin subir archivos a servidores.',
    url: 'https://pdf-black.com/editar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Editar PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editar PDF Gratis Online — Texto, Firma y OCR | PDFBlack',
    description: 'Modifica texto, firma y añade marcas de agua a tus PDFs con privacidad total.',
    images: ['https://pdf-black.com/og-image.png'],
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

export default function EditarHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
