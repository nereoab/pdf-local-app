import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comparar dos PDFs Online Gratis — Detectar Diferencias de Texto y Diseño | PDFBlack',
  description:
    'Compara dos versiones de un documento PDF lado a lado y resalta automáticamente cambios en texto, tipografía, párrafos y elementos gráficos. Comparación de alta precisión píxel a píxel y vectorial ejecutada localmente en tu navegador.',
  keywords: [
    'comparar dos pdf gratis',
    'comparar versiones de pdf online',
    'detectar diferencias en pdf',
    'resaltar cambios pdf',
    'compare pdf files free online',
    'comparar contratos pdf',
    'diferencias entre dos pdf',
    'comparador de pdf local',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/optimizar/comparar',
  },
  openGraph: {
    title: 'Comparar dos PDFs Online Gratis — Detectar Diferencias | PDFBlack',
    description:
      'Compara dos documentos PDF visualmente o por capas de texto con resalte de cambios. 100% privado en memoria RAM.',
    url: 'https://pdf-black.com/optimizar/comparar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Comparar dos PDFs Online Gratis con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comparar dos PDFs Online Gratis — Detectar Diferencias | PDFBlack',
    description:
      'Compara contratos y versiones de documentos PDF en paralelo sin subir tus archivos.',
    images: ['https://pdf-black.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function CompararPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
