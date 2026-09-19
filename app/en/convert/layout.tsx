import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Convert PDF to Word, Excel, PPT, JPG & HTML Online for Free | PDFBlack',
  description:
    'Convert PDF documents to and from Word, Excel, PowerPoint, JPG, HTML, and Text. 100% client-side conversion preserving formatting, tables, and vectors without server uploads.',
  keywords: [
    'convert pdf',
    'pdf to word free',
    'pdf to excel',
    'pdf to powerpoint',
    'pdf to jpg',
    'word to pdf',
    'excel to pdf',
    'free pdf converter',
  ],
  alternates: {
    canonical: `${SITE_URL}/en/convert`,
    languages: {
      es: `${SITE_URL}/convertir`,
      en: `${SITE_URL}/en/convert`,
      'x-default': `${SITE_URL}/convertir`,
    },
  },
  openGraph: {
    title: 'Convert PDF Online for Free | PDFBlack',
    description:
      'High-fidelity bidirectional PDF conversions: Word, Excel, PowerPoint, JPG, HTML, and Text processed 100% in your browser.',
    url: `${SITE_URL}/en/convert`,
    siteName: 'PDFBlack',
    locale: 'en_US',
    type: 'website',
  },
};

export default function EnglishConvertLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
