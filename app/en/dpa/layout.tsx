import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Data Processing Agreement (DPA) | PDFBlack',
  description:
    'PDFBlack Data Processing Agreement (DPA). Compliance with GDPR Article 28 and international data non-retention standards.',
  keywords: ['dpa pdfblack', 'data processing agreement pdf', 'gdpr data protection'],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/en/dpa`,
    languages: {
      es: `${SITE_URL}/dpa`,
      en: `${SITE_URL}/en/dpa`,
      'x-default': `${SITE_URL}/dpa`,
    },
  },
};

export default function EnglishDpaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
