import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Poner Marca de Agua en PDF Gratis Online — Sello de Agua | PDFBlack',
  description:
    'Inserta sellos de agua y marcas de texto o imagen en tus documentos PDF online. Formatos confidenciales, patrón en mosaico anti-fugas, logotipos y opacidad personalizada. 100% privado en memoria RAM.',
  keywords: [
    'poner marca de agua pdf',
    'marca de agua pdf online',
    'sello de agua pdf',
    'insertar marca de agua pdf gratis',
    'sello confidencial pdf',
    'poner logo en pdf',
    'marca de agua mosaico pdf',
    'watermark pdf free',
    'add watermark to pdf online',
    'pdf watermark tool local in-browser',
    'sellar pdf online gratis',
    'marca de agua borrador pdf',
    'marca de agua expediente judicial',
    'watermark pdf zero-knowledge',
    'estampado de documentos pdf',
    'marca de agua diagonal pdf',
    'proteger pdf con marca de agua',
    'insertar logotipo en pdf',
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
    canonical: `${SITE_URL}/editar/marca-agua`,
    languages: {
      'es-ES': `${SITE_URL}/editar/marca-agua`,
      'en-US': `${SITE_URL}/editar/marca-agua?lang=en`,
    },
  },
  openGraph: {
    title: 'Poner Marca de Agua en PDF Gratis Online — Sellos y Logotipos | PDFBlack',
    description:
      'Estampa marcas de agua confidenciales, sellos notariales y logotipos empresariales con soporte para patrón mosaico y compensación de giro. 100% en tu navegador en memoria RAM.',
    url: `${SITE_URL}/editar/marca-agua`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-marca-agua-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Poner Marca de Agua en Documentos PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Poner Marca de Agua en PDF Gratis Online — Sello de Agua',
    description:
      'Herramienta empresarial para estampar sellos confidenciales y logotipos en PDF. 100% privado en RAM sin marcas de agua de terceros.',
    images: [`${SITE_URL}/og-marca-agua-pdf.png`],
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

export default function MarcaAguaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
