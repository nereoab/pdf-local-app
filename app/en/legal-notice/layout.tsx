import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Legal Notice & Intellectual Property | PDFBlack',
  description:
    'Legal notice, company information, disclaimer of liability, and copyright policies for PDFBlack.',
  alternates: {
    canonical: `${SITE_URL}/en/legal-notice`,
    languages: {
      es: `${SITE_URL}/aviso-legal`,
      en: `${SITE_URL}/en/legal-notice`,
      'x-default': `${SITE_URL}/aviso-legal`,
    },
  },
};

export default function EnglishLegalNoticeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
