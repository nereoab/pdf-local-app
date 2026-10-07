import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Questions Fréquentes (FAQ) et Sécurité | PDFBlack',
  },
  description:
    'Réponses aux questions sur PDFBlack : traitement 100% local en mémoire RAM, gratuit sans limite, conforme RGPD et sans téléversement sur serveur.',
  alternates: {
    canonical: `${SITE_URL}/fr/faq`,
    languages: {
      es: `${SITE_URL}/faq`,
      en: `${SITE_URL}/en/faq`,
      fr: `${SITE_URL}/fr/faq`,
      'x-default': `${SITE_URL}/en/faq`,
    },
  },
};

export default function FrenchFaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
