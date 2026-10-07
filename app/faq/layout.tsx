import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Preguntas Frecuentes — Seguridad y Privacidad | PDFBlack',
  },
  description:
    'Resuelve tus dudas sobre PDFBlack: procesamiento 100% en RAM local, sin límites de tamaño, gratis y con estricto cumplimiento RGPD e HIPAA.',
  keywords: [
    'faq pdfblack',
    'preguntas frecuentes pdf',
    'seguridad pdfblack',
    'privacidad pdf local',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/faq`,
    languages: {
      es: `${SITE_URL}/faq`,
      en: `${SITE_URL}/en/faq`,
      'x-default': `${SITE_URL}/faq`,
    },
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
