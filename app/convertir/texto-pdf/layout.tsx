import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir Texto a PDF Gratis Online — TXT a Documento PDF | PDFBlack',
  description:
    'Convierte notas, archivos de texto plano (.txt) o código en documentos PDF profesionales y formateados online gratis. Tipografía nítida y saltos de página limpios.',
  keywords: [
    'convertir texto a pdf',
    'txt a pdf online gratis',
    'crear pdf desde texto',
    'pasar notas a pdf',
    'text to pdf free',
    'convertir archivo txt a pdf',
    'generar pdf desde texto plano',
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
    canonical: `${SITE_URL}/convertir/texto-pdf`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/texto-pdf`,
      'en-US': `${SITE_URL}/convertir/texto-pdf?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir Texto a PDF Gratis Online — TXT a Documento PDF | PDFBlack',
    description:
      'Transforma archivos de texto (.txt) en documentos PDF de alta resolución con tipografía profesional y formato estructurado.',
    url: `${SITE_URL}/convertir/texto-pdf`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-texto-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir Texto a PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir Texto a PDF Gratis Online — TXT a PDF',
    description: 'Convierte notas y archivos TXT a documentos PDF formateados online gratis.',
    images: [`${SITE_URL}/og-texto-pdf.png`],
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

export default function TextoPdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
