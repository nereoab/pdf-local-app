import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comprimir PDF Gratis Online — Reducir Tamaño de PDF sin Perder Calidad | PDFBlack',
  description:
    'Reduce el tamaño de tus archivos PDF de forma drástica y gratuita sin perder nitidez visual ni legibilidad. 3 niveles de compresión inteligente (extrema, recomendada y baja). Procesamiento 100% local en tu navegador con privacidad total y sin límites.',
  keywords: [
    'comprimir pdf gratis',
    'reducir tamano pdf',
    'comprimir pdf online',
    'bajar peso pdf',
    'comprimir pdf sin perder calidad',
    'reducir mb de pdf',
    'comprimir pdf para enviar por correo',
    'comprimir pdf sin limites',
    'compresion inteligente pdf',
    'reducir tamano pdf sin registro',
    'comprimir pdf privado',
    'comprimir pdf local',
    'compress pdf free online',
    'reduce pdf file size',
    'optimizador de pdf gratis',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/optimizar/comprimir',
    languages: {
      es: 'https://pdf-black.com/optimizar/comprimir',
      en: 'https://pdf-black.com/en/optimizar/comprimir',
      'x-default': 'https://pdf-black.com/optimizar/comprimir',
    },
  },
  openGraph: {
    title: 'Comprimir PDF Gratis Online — Reducir Tamaño sin Perder Calidad | PDFBlack',
    description:
      'Comprime archivos PDF pesados en segundos sin subirlos a servidores. Privacidad total en memoria RAM y compresión de alta fidelidad.',
    url: 'https://pdf-black.com/optimizar/comprimir',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Comprimir PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comprimir PDF Gratis Online — Reducir Tamaño sin Perder Calidad | PDFBlack',
    description:
      'Reduce el peso de tus PDFs al instante sin perder calidad visual. 100% local, seguro y sin registros.',
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

export default function ComprimirPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
