import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Edit PDF Online for Free — Text, Watermark, OCR, Bates Numbering & Sign | PDFBlack',
  description:
    'Full-featured in-browser PDF editor. Edit text, add Bates numbering, remove watermarks, sign documents, and run OCR directly on your device with 100% privacy.',
  keywords: [
    'edit pdf online',
    'edit pdf free',
    'remove watermark pdf',
    'bates numbering pdf',
    'sign pdf online',
    'ocr pdf free',
    'add watermark to pdf',
  ],
  alternates: {
    canonical: `${SITE_URL}/en/edit`,
    languages: {
      es: `${SITE_URL}/editar`,
      en: `${SITE_URL}/en/edit`,
      'x-default': `${SITE_URL}/editar`,
    },
  },
  openGraph: {
    title: 'Edit PDF Online for Free | PDFBlack',
    description:
      'Add text, sign, remove watermarks, stamp Bates numbering, and perform OCR on PDFs privately in your browser.',
    url: `${SITE_URL}/en/edit`,
    siteName: 'PDFBlack',
    locale: 'en_US',
    type: 'website',
  },
};

export default function EnglishEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
