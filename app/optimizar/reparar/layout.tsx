import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reparar PDF Dañado o Corrupto Online Gratis — Recuperar Archivo PDF | PDFBlack',
  description:
    'Repara y recupera archivos PDF corruptos, dañados o que no abren en Adobe Acrobat. Reconstruye tablas XREF, diccionarios de páginas y flujos de contenido corruptos directamente en tu navegador sin subir el archivo a servidores. Gratis y privado.',
  keywords: [
    'reparar pdf danado gratis',
    'recuperar pdf corrupto',
    'arreglar pdf que no abre',
    'reparar archivo pdf online',
    'repair pdf free online',
    'reconstruir xref pdf',
    'recuperar texto pdf danado',
    'reparar pdf sin registro',
    'reparador de pdf local',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/optimizar/reparar',
  },
  openGraph: {
    title: 'Reparar PDF Dañado o Corrupto Online Gratis | PDFBlack',
    description:
      'Recupera documentos PDF rotos o corruptos con algoritmos avanzados de reconstrucción de objetos y tablas XREF locales.',
    url: 'https://pdf-black.com/optimizar/reparar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Reparar PDF Dañado o Corrupto Gratis en PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reparar PDF Dañado o Corrupto Online Gratis | PDFBlack',
    description:
      'Reconstruye archivos PDF dañados al instante en tu navegador con privacidad total.',
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

export default function RepararPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
