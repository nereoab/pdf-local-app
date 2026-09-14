import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Firmar PDF Gratis Online — Firma Digital, Rúbrica y Sello Legal | PDFBlack',
  description:
    'Firma documentos PDF online de forma 100% gratuita y privada. Crea firmas manuscritas, tipográficas o con sello de auditoría con hash SHA-256. Soporte para rúbricas multi-página (VoBo) sin subir tus archivos a la nube.',
  keywords: [
    'firmar pdf gratis online',
    'firma digital pdf online',
    'firmar pdf sin registrarse',
    'firma electronica pdf segura',
    'rubrica pdf varias paginas',
    'visto bueno vobo pdf',
    'firmar contratos pdf gratis',
    'sello digital pdf online',
    'firmar pdf sin subir a la nube',
    'sign pdf free online zero knowledge',
    'digital signature pdf pades',
    'firmar pdf ilovepdf alternativa gratis',
    'agregar firma a pdf online',
    'firmar documentos pdf confidenciales',
    'sello de agua con firma pdf',
    'firma biometrica pdf',
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
    canonical: `${SITE_URL}/editar/firmar`,
    languages: {
      'es-ES': `${SITE_URL}/editar/firmar`,
      'en-US': `${SITE_URL}/editar/firmar?lang=en`,
    },
  },
  openGraph: {
    title: 'Firmar PDF Gratis Online — Firma Digital, Rúbrica y Sello Legal | PDFBlack',
    description:
      'Firma documentos y contratos PDF en tu navegador sin subir tus datos a ningún servidor. Firmas manuscritas, tipográficas, sellos con hash SHA-256 y rúbricas en lote.',
    url: `${SITE_URL}/editar/firmar`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-firmar-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Firmar PDF Gratis Online con Firma Digital y Rúbricas — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Firmar PDF Gratis Online — Firma Digital, Rúbrica y Sello Legal',
    description:
      'Herramienta enterprise para firmar documentos PDF con máxima privacidad en memoria RAM. Manuscrito, sellos corporativos, VoBo y hash SHA-256.',
    images: [`${SITE_URL}/og-firmar-pdf.png`],
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

export default function FirmarPdfLayout({ children }: { children: React.ReactNode }) {
  return children;
}
