import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) — Security, Privacy & Usage | PDFBlack',
  description:
    'Find answers about PDFBlack: how client-side in-memory processing works, why it is 100% free, GDPR compliance, and zero server storage architecture.',
  keywords: [
    'faq pdfblack',
    'pdf questions answers',
    'pdf privacy security',
    'local browser pdf processing',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/en/faq`,
    languages: {
      es: `${SITE_URL}/faq`,
      en: `${SITE_URL}/en/faq`,
      'x-default': `${SITE_URL}/faq`,
    },
  },
};

export default function EnglishFaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
