import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir Excel a PDF Gratis Online — XLSX y XLS a PDF | PDFBlack',
  description:
    'Convierte libros y hojas de cálculo de Excel (.xlsx, .xls) a documentos PDF listos para imprimir online gratis. Ajuste de página, cuadrículas y formato intacto.',
  keywords: [
    'convertir excel a pdf',
    'excel a pdf online gratis',
    'xlsx a pdf',
    'guardar excel como pdf',
    'excel to pdf converter free',
    'ajustar excel a pdf en una sola pagina',
    'convertir xls a pdf',
    'transformar excel a pdf gratis',
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
    canonical: `${SITE_URL}/convertir/excel-pdf`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/excel-pdf`,
      'en-US': `${SITE_URL}/convertir/excel-pdf?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir Excel a PDF Gratis Online — XLSX y XLS a PDF | PDFBlack',
    description:
      'Transforma hojas de cálculo Microsoft Excel (.xlsx) a documentos PDF profesionales manteniendo la orientación de página y el formato de datos.',
    url: `${SITE_URL}/convertir/excel-pdf`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-excel-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir Excel a PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir Excel a PDF Gratis Online — XLSX a PDF',
    description:
      'Convierte hojas de cálculo de Excel a PDF de alta resolución online gratis y sin perder columnas.',
    images: [`${SITE_URL}/og-excel-pdf.png`],
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

export default function ExcelPdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
