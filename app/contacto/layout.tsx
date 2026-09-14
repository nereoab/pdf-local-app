import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto y Soporte Técnico | PDFBlack',
  description:
    'Contáctate con el equipo de soporte, ingeniería y desarrollo de PDFBlack para consultas, reporte de incidencias o alianzas empresariales.',
  keywords: ['contacto pdfblack', 'soporte pdfblack', 'ayuda pdf online'],
  alternates: { canonical: 'https://pdf-black.com/contacto' },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
