import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Politique de Confidentialité et RGPD | PDFBlack',
  },
  description:
    'Découvrez notre politique de confidentialité : zéro téléversement, traitement 100% local en mémoire RAM dans votre navigateur et conformité stricte RGPD.',
  alternates: {
    canonical: `${SITE_URL}/fr/privacy`,
    languages: {
      es: `${SITE_URL}/privacidad`,
      en: `${SITE_URL}/en/privacy`,
      fr: `${SITE_URL}/fr/privacy`,
      'x-default': `${SITE_URL}/en/privacy`,
    },
  },
};

export default function FrenchPrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
