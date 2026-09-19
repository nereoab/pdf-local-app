import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Privacy Policy — 100% Client-Side Private Processing | PDFBlack',
  description:
    'Learn about our zero-knowledge, zero-upload privacy architecture. PDFBlack processes all documents locally in your browser memory without cloud servers.',
  alternates: {
    canonical: `${SITE_URL}/en/privacy`,
    languages: {
      es: `${SITE_URL}/privacidad`,
      en: `${SITE_URL}/en/privacy`,
      'x-default': `${SITE_URL}/privacidad`,
    },
  },
};

export default function EnglishPrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
