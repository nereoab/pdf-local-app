import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso Legal e Información Corporativa | PDFBlack',
  description:
    'Aviso legal, titularidad del dominio, propiedad intelectual y condiciones generales de la plataforma PDFBlack.',
  keywords: ['aviso legal pdfblack', 'informacion legal pdf online'],
  alternates: { canonical: 'https://pdf-black.com/aviso-legal' },
};

export default function AvisoLegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
