import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PowerPoint a PDF Gratis Online — PPTX a PDF | PDFBlack',
  description:
    'Convierte presentaciones de PowerPoint (.pptx, .ppt) a PDF de alta resolución online gratis. Conserva fuentes vectoriales, gráficos y orden de diapositivas.',
  keywords: [
    'convertir powerpoint a pdf',
    'powerpoint a pdf online gratis',
    'pptx a pdf',
    'presentacion a pdf',
    'powerpoint to pdf converter free',
    'guardar diapositivas como pdf',
    'transformar pptx a pdf gratis',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  creator: 'PDFBlack',
  publisher: 'PDFBlack',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/convertir/powerpoint-pdf`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/powerpoint-pdf`,
      'en-US': `${SITE_URL}/convertir/powerpoint-pdf?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PowerPoint a PDF Gratis Online — PPTX a PDF | PDFBlack',
    description:
      'Pasa tus presentaciones de PowerPoint (.pptx) a documentos PDF listos para proyectar, imprimir o enviar por correo con total fidelidad.',
    url: `${SITE_URL}/convertir/powerpoint-pdf`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-powerpoint-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir PowerPoint a PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PowerPoint a PDF Gratis Online — PPTX a PDF',
    description:
      'Convierte diapositivas de PowerPoint a PDF vectorial en alta definición online gratis.',
    images: [`${SITE_URL}/og-powerpoint-pdf.png`],
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

export default function PowerPointPdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
