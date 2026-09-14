import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso del Servicio | PDFBlack',
  description:
    'Términos legales y condiciones de uso de las herramientas gratuitas de manipulación y edición de documentos PDF de PDFBlack.',
  keywords: ['terminos y condiciones pdfblack', 'terminos de uso pdf online'],
  alternates: { canonical: 'https://pdf-black.com/terminos' },
};

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
