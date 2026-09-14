import type { Metadata } from 'next';

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
  alternates: { canonical: 'https://pdf-black.com/privacidad' },
};

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
