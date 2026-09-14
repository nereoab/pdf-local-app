import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reconocimiento OCR en PDF Gratis Online — Hacer PDF Buscable y Seleccionable | PDFBlack',
  description:
    'Convierte documentos PDF escaneados, contratos, facturas y fotos en archivos PDF buscables con texto seleccionable. Reconocimiento óptico OCR con Tesseract v5.0 en WebAssembly, 100% local en tu navegador sin subir datos al servidor. Sin límites ni marcas de agua.',
  keywords: [
    'ocr pdf gratis',
    'reconocimiento ocr pdf',
    'hacer pdf buscable',
    'searchable pdf online',
    'convertir pdf escaneado a texto',
    'extraer texto pdf escaneado',
    'reconocimiento de texto en pdf',
    'pdf sandwich online',
    'ocr tesseract pdf',
    'ocr pdf sin servidor',
    'ocr pdf confidencial',
    'ocr pdf local',
    'ocr contratos pdf',
    'ocr facturas pdf',
    'reconocer caracteres pdf gratis',
    'convertir imagen pdf a texto seleccionable',
    'copiar texto de pdf escaneado',
    'ocr pdf sin registro',
    'ocr multilingue pdf',
    'ocr pdf espanol ingles',
    'ocr pdf open source',
    'tesseract wasm pdf',
    'ocr pdf seguro rgpd',
    'ocr pdf alta precision',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/editar/ocr',
    languages: {
      'es-ES': 'https://pdf-black.com/editar/ocr',
      'en-US': 'https://pdf-black.com/editar/ocr',
    },
  },
  openGraph: {
    title: 'Reconocimiento OCR en PDF Gratis Online — Hacer PDF Buscable | PDFBlack',
    description:
      'Transforma PDFs escaneados en documentos con texto 100% seleccionable e indexable con motor Tesseract en WebAssembly. Privacidad estricta en memoria RAM local sin subir tus archivos.',
    url: 'https://pdf-black.com/editar/ocr',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-ocr-pdf.png',
        width: 1200,
        height: 630,
        alt: 'Reconocimiento OCR en PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reconocimiento OCR en PDF Gratis Online — Hacer PDF Buscable | PDFBlack',
    description:
      'Reconocimiento óptico de caracteres (OCR) para PDF 100% local en el navegador. Haz tus PDFs escaneados buscables sin límites ni registros.',
    images: ['https://pdf-black.com/og-ocr-pdf.png'],
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

export default function OcrPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
