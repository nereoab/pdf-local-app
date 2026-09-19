import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Contact Support & Feedback | PDFBlack',
  description:
    'Get in touch with the PDFBlack team. Inquiries, feature requests, bug reports, and partnership opportunities.',
  alternates: {
    canonical: `${SITE_URL}/en/contact`,
    languages: {
      es: `${SITE_URL}/contacto`,
      en: `${SITE_URL}/en/contact`,
      'x-default': `${SITE_URL}/contacto`,
    },
  },
};

export default function EnglishContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
