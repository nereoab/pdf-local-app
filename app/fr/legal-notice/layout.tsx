import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Mentions Légales et Propriété | PDFBlack',
  },
  description:
    'Mentions légales, informations sur l’éditeur, limitation de responsabilité et politique de propriété intellectuelle de PDFBlack.',
  alternates: {
    canonical: `${SITE_URL}/fr/legal-notice`,
    languages: {
      es: `${SITE_URL}/aviso-legal`,
      en: `${SITE_URL}/en/legal-notice`,
      fr: `${SITE_URL}/fr/legal-notice`,
      'x-default': `${SITE_URL}/en/legal-notice`,
    },
  },
};

export default function FrenchLegalNoticeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
