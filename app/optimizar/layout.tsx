import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optimizar PDF Gratis — Comprimir, Desbloquear, Proteger y Reparar | PDFBlack',
  description:
    'Suite completa de herramientas para optimizar archivos PDF gratis: reduce tamaño, desbloquea permisos, protege con contraseña AES-256, censura datos confidenciales y repara archivos dañados. 100% local en tu navegador con privacidad absoluta.',
  keywords: [
    'optimizar pdf gratis',
    'comprimir pdf',
    'desbloquear pdf',
    'proteger pdf',
    'censurar pdf',
    'reparar pdf',
    'comparar pdf',
    'herramientas optimizar pdf',
    'optimize pdf free',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/optimizar',
  },
  openGraph: {
    title: 'Optimizar PDF Gratis — Comprimir, Proteger y Reparar | PDFBlack',
    description:
      'Comprime, protege, desbloquea y repara tus archivos PDF sin subirlos a la nube. Máxima seguridad y rendimiento.',
    url: 'https://pdf-black.com/optimizar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Optimizar PDF Gratis con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optimizar PDF Gratis — Comprimir, Proteger y Reparar | PDFBlack',
    description:
      'Suite de herramientas para optimizar documentos PDF con privacidad total en memoria RAM.',
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

export default function OptimizarHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
