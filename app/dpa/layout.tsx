import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acuerdo de Procesamiento de Datos (DPA) | PDFBlack',
  description:
    'Data Processing Agreement (DPA) de PDFBlack. Cumplimiento con RGPD (GDPR) y estándares internacionales de protección y no retención de datos personales.',
  keywords: ['dpa pdfblack', 'data processing agreement pdf', 'rgpd proteccion de datos'],
  alternates: { canonical: 'https://pdf-black.com/dpa' },
};

export default function DpaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
