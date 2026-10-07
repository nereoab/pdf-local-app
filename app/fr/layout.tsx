import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    default: 'PDFBlack — Outils PDF en Ligne Gratuits et Privés',
    template: '%s | PDFBlack',
  },
  description:
    'Outils PDF 100% gratuits et privés dans votre navigateur. Modifiez, compressez, fusionnez et convertissez vos PDF sans téléversement. Conforme RGPD.',
  keywords: [
    'outils pdf gratuits',
    'fusionner pdf',
    'compresser pdf',
    'convertir pdf en word',
    'diviser pdf',
    'signer pdf en ligne',
    'modifier pdf gratuit',
    'pdf en excel',
    'outils pdf securises rgpd',
    'pdfblack france',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/fr`,
    languages: {
      es: `${SITE_URL}/es`,
      en: `${SITE_URL}/en`,
      pt: `${SITE_URL}/pt`,
      fr: `${SITE_URL}/fr`,
      'x-default': `${SITE_URL}/en`,
    },
  },
  openGraph: {
    title: 'PDFBlack — Outils PDF en Ligne Gratuits | Fusionner, Compresser et Convertir',
    description:
      'Tous vos outils PDF au même endroit. Fusionnez, compressez, divisez et convertissez des PDF avec une confidentialité totale et un traitement 100% local.',
    url: `${SITE_URL}/fr`,
    siteName: 'PDFBlack',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PDFBlack Outils PDF en Ligne Gratuits',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFBlack — Outils PDF en Ligne Gratuits',
    description:
      'Modifiez, convertissez, compressez et organisez vos PDF de manière 100% privée dans votre navigateur.',
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

export default function FrenchRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
