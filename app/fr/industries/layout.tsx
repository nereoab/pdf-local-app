import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Solutions PDF par Secteur Professionnel | PDFBlack',
  },
  description:
    'Découvrez comment les cabinets d’avocats, hôpitaux et experts-comptables traitent leurs PDF avec une confidentialité locale 100% sans téléversement.',
  alternates: {
    canonical: `${SITE_URL}/fr/industries`,
    languages: {
      es: `${SITE_URL}/industrias`,
      en: `${SITE_URL}/en/industries`,
      fr: `${SITE_URL}/fr/industries`,
      'x-default': `${SITE_URL}/en/industries`,
    },
  },
};

export default function FrenchIndustriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
