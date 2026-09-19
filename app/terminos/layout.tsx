import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso del Servicio | PDFBlack',
  description:
    'Términos legales y condiciones de uso de las herramientas gratuitas de manipulación y edición de documentos PDF de PDFBlack.',
  keywords: ['terminos y condiciones pdfblack', 'terminos de uso pdf online'],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/terminos`,
    languages: {
      es: `${SITE_URL}/terminos`,
      en: `${SITE_URL}/en/terms`,
      'x-default': `${SITE_URL}/terminos`,
    },
  },
};

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
