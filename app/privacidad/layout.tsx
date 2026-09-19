import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Política de Privacidad — Arquitectura Zero-Knowledge en RAM | PDFBlack',
  description:
    'Conoce la política de privacidad estricta de PDFBlack. Procesamiento 100% en el navegador del usuario: cero almacenamiento en discos, cero servidores de terceros y cumplimiento estricto del RGPD.',
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
