import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'PDFBlack — Free Online PDF Tools | Edit, Convert, Compress, Merge & Sign PDF',
  description:
    '100% free and private client-side PDF tool suite. Edit text, compress, merge, split, sign, OCR, and convert PDF to Word, Excel, and PowerPoint directly in your browser without uploading files.',
  keywords: [
    'free pdf tools',
    'online pdf editor',
    'merge pdf free',
    'compress pdf online',
    'convert pdf to word',
    'split pdf',
    'sign pdf free',
    'ocr pdf',
    'private pdf tools',
    'pdf utilities in browser',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      es: SITE_URL,
      en: `${SITE_URL}/en`,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    title: 'PDFBlack — Free Online PDF Tools | Edit, Convert, Compress & Merge',
    description:
      'All-in-one private browser PDF tools. Compress, merge, split, convert, and sign PDF files with zero file uploads.',
    url: `${SITE_URL}/en`,
    siteName: 'PDFBlack',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PDFBlack Free Online PDF Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFBlack — Free Online PDF Tools',
    description:
      'Edit, convert, compress, and organize PDF documents 100% privately in your browser.',
    images: [`${SITE_URL}/og-image.png`],
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

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
