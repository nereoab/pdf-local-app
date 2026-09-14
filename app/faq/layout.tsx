import type { Metadata } from 'next';

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
  alternates: { canonical: 'https://pdf-black.com/faq' },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
