import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Organize PDF Files Online for Free — Merge, Split, Rotate & Reorder | PDFBlack',
  description:
    'Free client-side tools to organize your PDF documents. Merge, split, delete, rotate, crop, and reorder pages 100% privately in your browser without file size limits.',
  keywords: [
    'organize pdf',
    'merge pdf free',
    'split pdf online',
    'delete pdf pages',
    'rotate pdf',
    'reorder pdf pages',
    'crop pdf',
    'private pdf tools',
  ],
  alternates: {
    canonical: `${SITE_URL}/en/organize`,
    languages: {
      es: `${SITE_URL}/organizar`,
      en: `${SITE_URL}/en/organize`,
      'x-default': `${SITE_URL}/organizar`,
    },
  },
  openGraph: {
    title: 'Organize PDF Files Online for Free | PDFBlack',
    description:
      'Merge, split, delete, rotate, and reorder PDF pages locally in your browser with zero file uploads.',
    url: `${SITE_URL}/en/organize`,
    siteName: 'PDFBlack',
    locale: 'en_US',
    type: 'website',
  },
};

export default function EnglishOrganizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
