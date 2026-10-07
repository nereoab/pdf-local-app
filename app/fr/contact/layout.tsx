import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Contact & Support Technique | PDFBlack',
  },
  description:
    'Contactez l’équipe PDFBlack. Demandes d’assistance, suggestions, signalement de bugs et partenariats professionnels.',
  alternates: {
    canonical: `${SITE_URL}/fr/contact`,
    languages: {
      es: `${SITE_URL}/contacto`,
      en: `${SITE_URL}/en/contact`,
      fr: `${SITE_URL}/fr/contact`,
      'x-default': `${SITE_URL}/en/contact`,
    },
  },
};

export default function FrenchContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
