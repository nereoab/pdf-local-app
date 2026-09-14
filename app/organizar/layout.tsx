import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organizar PDF Gratis — Unir, Dividir, Rotar, Recortar y Reordenar | PDFBlack',
  description:
    'Reestructura y organiza tus documentos PDF al instante: une múltiples archivos, divide por páginas, gira la orientación, recorta márgenes y elimina hojas innecesarias. Procesamiento 100% privado en tu navegador sin registro.',
  keywords: [
    'organizar pdf gratis',
    'unir pdf',
    'dividir pdf',
    'rotar pdf',
    'recortar pdf',
    'eliminar paginas pdf',
    'reordenar paginas pdf',
    'organize pdf free online',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/organizar',
  },
  openGraph: {
    title: 'Organizar PDF Gratis — Unir, Dividir, Rotar y Reordenar | PDFBlack',
    description:
      'Gestiona las páginas y la estructura de tus archivos PDF con herramientas visuales interactivas y privacidad total.',
    url: 'https://pdf-black.com/organizar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Organizar PDF Gratis con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organizar PDF Gratis — Unir, Dividir, Rotar y Reordenar | PDFBlack',
    description:
      'Une, divide, gira y organiza páginas PDF en tu navegador sin límites ni marcas de agua.',
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

export default function OrganizarHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
