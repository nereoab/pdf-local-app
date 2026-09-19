import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Aviso Legal e Información Corporativa | PDFBlack',
  description:
    'Aviso legal, titularidad del dominio, propiedad intelectual y condiciones generales de la plataforma PDFBlack.',
  keywords: ['aviso legal pdfblack', 'informacion legal pdf online'],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/aviso-legal`,
    languages: {
      es: `${SITE_URL}/aviso-legal`,
      en: `${SITE_URL}/en/legal-notice`,
      'x-default': `${SITE_URL}/aviso-legal`,
    },
  },
};

export default function AvisoLegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
