import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: {
    default:
      'PDFBlack — Ferramentas de PDF Online Grátis | Editar, Converter, Comprimir e Juntar PDF',
    template: '%s | PDFBlack',
  },
  description:
    'Ferramentas de PDF 100% gratuitas e privadas que rodam no seu navegador. Edite texto, comprima, junte, divida, assine e converta PDF para Word e Excel sem enviar arquivos para a nuvem. Em conformidade com a LGPD.',
  keywords: [
    'ferramentas pdf gratis',
    'juntar pdf',
    'comprimir pdf',
    'converter pdf para word',
    'dividir pdf',
    'assinar pdf online',
    'editar pdf gratis',
    'pdf para excel',
    'ferramentas pdf seguras lgpd',
    'pdfblack brasil',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/pt`,
    languages: {
      es: `${SITE_URL}/es`,
      en: `${SITE_URL}/en`,
      pt: `${SITE_URL}/pt`,
      'x-default': `${SITE_URL}/en`,
    },
  },
  openGraph: {
    title: 'PDFBlack — Ferramentas de PDF Online Grátis | Juntar, Comprimir e Converter',
    description:
      'Todas as ferramentas de PDF em um só lugar. Junte, comprima, divida e converta PDFs com privacidade total e processamento local.',
    url: `${SITE_URL}/pt`,
    siteName: 'PDFBlack',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PDFBlack Ferramentas de PDF Online Grátis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFBlack — Ferramentas de PDF Online Grátis',
    description: 'Edite, converta, comprima e organize PDFs 100% privado no seu navegador.',
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

export default function PortugueseRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
