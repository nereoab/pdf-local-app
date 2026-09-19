import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Terms of Service | PDFBlack',
  description:
    'Terms of service, user rights, client-side responsibilities, and conditions of use for the PDFBlack online tool suite.',
  alternates: {
    canonical: `${SITE_URL}/en/terms`,
    languages: {
      es: `${SITE_URL}/terminos`,
      en: `${SITE_URL}/en/terms`,
      'x-default': `${SITE_URL}/terminos`,
    },
  },
};

export default function EnglishTermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
