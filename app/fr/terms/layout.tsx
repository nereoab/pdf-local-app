import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Conditions d’Utilisation | PDFBlack',
  },
  description:
    'Conditions d’utilisation de la suite d’outils PDF en ligne PDFBlack. Droits, responsabilités et fonctionnement 100% côté client.',
  alternates: {
    canonical: `${SITE_URL}/fr/terms`,
    languages: {
      es: `${SITE_URL}/terminos`,
      en: `${SITE_URL}/en/terms`,
      fr: `${SITE_URL}/fr/terms`,
      'x-default': `${SITE_URL}/en/terms`,
    },
  },
};

export default function FrenchTermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
