import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Desbloquear PDF Online Gratis — Quitar Contraseña y Permisos de PDF | PDFBlack',
  description:
    'Elimina la contraseña de apertura y restricciones de edición, impresión y copia de tus archivos PDF al instante. Desbloqueo 100% privado y seguro ejecutado en tu navegador en memoria RAM sin subir documentos a internet. Gratis y sin límites.',
  keywords: [
    'desbloquear pdf gratis',
    'quitar contrasena pdf',
    'eliminar clave pdf online',
    'desbloquear pdf protegido',
    'quitar restricciones pdf',
    'desbloquear pdf para imprimir',
    'unlock pdf free online',
    'remove pdf password',
    'desbloquear pdf sin registro',
    'desencriptar pdf local',
    'desbloquear pdf confidencial',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/optimizar/desbloquear',
  },
  openGraph: {
    title: 'Desbloquear PDF Online Gratis — Quitar Contraseña de PDF | PDFBlack',
    description:
      'Quita la contraseña y restricciones de tus documentos PDF de forma segura y privada en tu navegador. Cero servidores, 100% local.',
    url: 'https://pdf-black.com/optimizar/desbloquear',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Desbloquear PDF Online Gratis con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Desbloquear PDF Online Gratis — Quitar Contraseña de PDF | PDFBlack',
    description:
      'Elimina restricciones y contraseñas de PDFs en segundos con privacidad total y sin subir archivos.',
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

export default function DesbloquearPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
