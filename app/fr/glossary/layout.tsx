import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Glossaire Technique PDF — Normes ISO & Concepts | PDFBlack',
  },
  description:
    'Glossaire technique PDF : numérotation Bates, norme PDF/A, chiffrement AES-256, caviardage forensique et sécurité 100% locale sans serveur.',
  alternates: {
    canonical: `${SITE_URL}/fr/glossary`,
    languages: {
      es: `${SITE_URL}/glosario`,
      en: `${SITE_URL}/en/glossary`,
      fr: `${SITE_URL}/fr/glossary`,
      'x-default': `${SITE_URL}/en/glossary`,
    },
  },
};

export default function FrenchGlossaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
