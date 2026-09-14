import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dividir PDF Gratis Online — Separar y Extraer Páginas PDF Sin Límites',
  description:
    'Separa, corta y extrae páginas de tus archivos PDF de forma rápida, precisa y 100% confidencial en tu navegador. Divide por rangos personalizados, extrae páginas pares o impares, genera bloques de páginas fijos y descarga en PDF o ZIP sin marcas de agua ni límites.',
  keywords: [
    'dividir pdf',
    'separar pdf',
    'extraer paginas pdf',
    'cortar pdf',
    'partir pdf online',
    'separar hojas de un pdf',
    'dividir pdf gratis',
    'split pdf online',
    'dividir pdf sin limites',
    'extraer paginas de pdf gratis',
    'separar paginas pdf online gratis',
    'dividir pdf por rangos',
    'separar pdf en hojas individuales',
    'como dividir un archivo pdf',
    'recortar paginas pdf',
    'dividir pdf confidencial',
    'dividir pdf local sin servidor',
    'separar pdf pares e impares',
    'dividir pdf bloques fijos',
    'descargar paginas pdf separadas zip',
    'split pdf zero knowledge',
    'dividir pdf en movil',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/organizar/dividir',
    languages: {
      'es-ES': 'https://pdf-black.com/organizar/dividir',
      'en-US': 'https://pdf-black.com/organizar/dividir',
    },
  },
  openGraph: {
    title: 'Dividir PDF Gratis Online — Separar y Extraer Páginas PDF Sin Límites | PDFBlack',
    description:
      'Separa, corta y extrae páginas de tus archivos PDF de forma rápida, precisa y 100% confidencial en memoria local RAM sin subir datos a servidores.',
    url: 'https://pdf-black.com/organizar/dividir',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-dividir-pdf.png',
        width: 1200,
        height: 630,
        alt: 'Dividir PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dividir PDF Gratis Online — Separar y Extraer Páginas PDF Sin Límites | PDFBlack',
    description:
      'Separa y extrae páginas de documentos PDF por rangos, pares/impares o bloques fijos con 100% de privacidad local sin registro ni límites.',
    images: ['https://pdf-black.com/og-dividir-pdf.png'],
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

export default function DividirPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
