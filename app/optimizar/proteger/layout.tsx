import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proteger PDF con Contraseña — Cifrado AES-256 Seguro y Gratis | PDFBlack',
  description:
    'Protege y cifra tus documentos PDF con contraseñas seguras y algoritmos de grado militar AES-256 o RC4. Configura permisos de impresión, edición y copia. Cifrado ejecutado 100% en local en tu navegador con privacidad absoluta y sin subir archivos.',
  keywords: [
    'proteger pdf con contrasena',
    'poner clave a pdf',
    'cifrar pdf online gratis',
    'bloquear pdf con clave',
    'proteger pdf confidencial',
    'cifrado aes 256 pdf',
    'password protect pdf free',
    'encrypt pdf online',
    'proteger pdf sin registro',
    'restringir impresion pdf',
    'proteger pdf local',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/optimizar/proteger',
  },
  openGraph: {
    title: 'Proteger PDF con Contraseña — Cifrado AES-256 Seguro y Gratis | PDFBlack',
    description:
      'Cifra tus archivos PDF con contraseña de apertura y restricciones de permisos mediante WebAssembly local. Privacidad total garantizada.',
    url: 'https://pdf-black.com/optimizar/proteger',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Proteger PDF con Contraseña en PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proteger PDF con Contraseña — Cifrado AES-256 Seguro y Gratis | PDFBlack',
    description:
      'Añade contraseña y restricciones a tus PDFs en segundos con cifrado militar 100% en tu navegador.',
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

export default function ProtegerPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
