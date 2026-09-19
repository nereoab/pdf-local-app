import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Optimize & Secure PDF Files Online for Free | Compress, Protect & Repair | PDFBlack',
  description:
    'Optimize, compress, repair, protect, and redact your PDF files directly in your browser. 100% private, client-side execution with zero file uploads.',
  keywords: [
    'optimize pdf',
    'compress pdf free',
    'repair pdf online',
    'protect pdf password',
    'unlock pdf',
    'redact pdf confidential',
    'compare pdf',
  ],
  alternates: {
    canonical: `${SITE_URL}/en/optimize`,
    languages: {
      es: `${SITE_URL}/optimizar`,
      en: `${SITE_URL}/en/optimize`,
      'x-default': `${SITE_URL}/optimizar`,
    },
  },
  openGraph: {
    title: 'Optimize & Secure PDF Files Online for Free | PDFBlack',
    description:
      'Compress, repair, password-protect, and redact sensitive information from your PDF files with zero server uploads.',
    url: `${SITE_URL}/en/optimize`,
    siteName: 'PDFBlack',
    locale: 'en_US',
    type: 'website',
  },
};

export default function EnglishOptimizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
