import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes (FAQ) — Seguridad, Privacidad y Uso | PDFBlack',
  description:
    'Resuelve todas tus dudas sobre PDFBlack: cómo funciona el procesamiento local en memoria RAM, por qué es 100% gratuito, cumplimiento con RGPD e HIPAA, y compatibilidad de navegadores.',
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
