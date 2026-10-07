import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    absolute: 'Política de Privacidad — Seguridad Zero-Knowledge | PDFBlack',
  },
  description:
    'Conoce la privacidad de PDFBlack: procesamiento 100% en tu navegador, cero almacenamiento en disco, cero servidores y cumplimiento estricto del RGPD.',
  keywords: [
    'politica de privacidad pdf',
    'privacidad pdf local',
    'rgpd pdf',
    'zero knowledge pdf',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/privacidad`,
    languages: {
      es: `${SITE_URL}/privacidad`,
      en: `${SITE_URL}/en/privacy`,
      'x-default': `${SITE_URL}/privacidad`,
    },
  },
};

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
