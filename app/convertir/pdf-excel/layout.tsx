import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convertir PDF a Excel Gratis Online — Tablas a XLSX | PDFBlack',
  description:
    'Convierte tablas y datos de PDF a hojas de cálculo Microsoft Excel (.xlsx) editables online gratis. Extracción precisa de filas, columnas y números sin errores.',
  keywords: [
    'convertir pdf a excel',
    'pdf a excel online gratis',
    'pdf a xlsx',
    'extraer tablas pdf a excel',
    'convertir tablas de pdf a excel',
    'pdf to excel converter free',
    'pasar pdf a excel con formulas',
    'convertidor de pdf a excel gratis',
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
    canonical: `${SITE_URL}/convertir/pdf-excel`,
    languages: {
      'es-ES': `${SITE_URL}/convertir/pdf-excel`,
      'en-US': `${SITE_URL}/convertir/pdf-excel?lang=en`,
    },
  },
  openGraph: {
    title: 'Convertir PDF a Excel Gratis Online — Tablas a XLSX | PDFBlack',
    description:
      'Convierte tablas financieras, balances y datos de PDF en hojas de cálculo Microsoft Excel (.xlsx) 100% editables.',
    url: `${SITE_URL}/convertir/pdf-excel`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-pdf-excel.png`,
        width: 1200,
        height: 630,
        alt: 'Convertir PDF a Excel Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convertir PDF a Excel Gratis Online — Tablas a XLSX',
    description:
      'Extrae tablas de PDF a hojas de cálculo de Excel (.xlsx) sin alterar columnas ni celdas.',
    images: [`${SITE_URL}/og-pdf-excel.png`],
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

export default function PdfExcelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
