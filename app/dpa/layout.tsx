import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Acuerdo de Procesamiento de Datos (DPA) | PDFBlack',
  description:
    'Data Processing Agreement (DPA) de PDFBlack. Cumplimiento con RGPD (GDPR) y estándares internacionales de protección y no retención de datos personales.',
  keywords: ['dpa pdfblack', 'data processing agreement pdf', 'rgpd proteccion de datos'],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/dpa`,
    languages: {
      es: `${SITE_URL}/dpa`,
      en: `${SITE_URL}/en/dpa`,
      'x-default': `${SITE_URL}/dpa`,
    },
  },
};

export default function DpaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
