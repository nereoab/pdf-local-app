import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Censurar y Redactar PDF Gratis — Ocultar Información Confidencial | PDFBlack',
  description:
    'Elimina de forma irreversible texto, números de cuentas, DNI, nombres y datos sensibles de tus documentos PDF. Sanitiza metadatos y purga capas de texto ocultas para evitar filtraciones. Procesamiento 100% privado en memoria RAM sin servidores.',
  keywords: [
    'censurar pdf gratis',
    'redactar pdf online',
    'ocultar texto pdf',
    'tapar datos sensibles pdf',
    'borrar datos confidenciales pdf',
    'redact pdf free',
    'sanitizar metadatos pdf',
    'censurar contratos pdf',
    'eliminar dni pdf',
    'censurar pdf local',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/optimizar/censurar',
  },
  openGraph: {
    title: 'Censurar y Redactar PDF Gratis — Ocultar Información Confidencial | PDFBlack',
    description:
      'Purga texto e imágenes confidenciales de PDFs de manera definitiva e irreversible en tu navegador. Cero fugas de información.',
    url: 'https://pdf-black.com/optimizar/censurar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Censurar y Redactar PDF Gratis en PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Censurar y Redactar PDF Gratis — Ocultar Información Confidencial | PDFBlack',
    description:
      'Oculta información privada en PDFs de forma irreversible y permanente sin subir tus archivos.',
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

export default function CensurarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
