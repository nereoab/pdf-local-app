import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Contacto y Soporte Técnico | PDFBlack',
  description:
    'Contáctate con el equipo de soporte, ingeniería y desarrollo de PDFBlack para consultas, reporte de incidencias o alianzas empresariales.',
  keywords: ['contacto pdfblack', 'soporte pdfblack', 'ayuda pdf online'],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/contacto`,
    languages: {
      es: `${SITE_URL}/contacto`,
      en: `${SITE_URL}/en/contact`,
      'x-default': `${SITE_URL}/contacto`,
    },
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
