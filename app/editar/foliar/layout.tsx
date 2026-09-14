import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Foliar PDF Gratis Online — Numerar Páginas de Documentos PDF | PDFBlack',
  description:
    'Herramienta profesional para foliar y numerar páginas de documentos PDF online. Formatos notariales, foliado judicial Bates, páginas enfrentadas para encuadernación y escudo protector. 100% privado en memoria RAM, sin marcas de agua.',
  keywords: [
    'foliar pdf',
    'numerar paginas pdf',
    'foliado de pdf online',
    'foliador pdf gratis',
    'foliado judicial bates',
    'numeracion bates pdf',
    'foliado notarial pdf',
    'numerar paginas pdf online gratis',
    'foliar expediente judicial',
    'foliar contrato pdf',
    'numerar pdf sin marcas de agua',
    'bates numbering online',
    'page numbering pdf free',
    'bates stamping pdf',
    'number pdf pages local in-browser',
    'foliado de documentos juridicos',
    'numerar hojas pdf gratis',
    'paginas enfrentadas pdf foliado',
    'foliado frente y vuelta pdf',
    'foliar expediente licitacion publica',
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
    canonical: `${SITE_URL}/editar/foliar`,
    languages: {
      'es-ES': `${SITE_URL}/editar/foliar`,
      'en-US': `${SITE_URL}/editar/foliar?lang=en`,
    },
  },
  openGraph: {
    title: 'Foliar PDF Gratis Online — Numeración Notarial y Bates | PDFBlack',
    description:
      'Folia y numera tus documentos PDF con estándares notariales, judiciales y empresariales. 100% local en memoria RAM, sin marcas de agua ni subida a servidores.',
    url: `${SITE_URL}/editar/foliar`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-foliar-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Foliar y Numerar Páginas de Documentos PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foliar PDF Gratis Online — Numeración Notarial y Bates',
    description:
      'Herramienta empresarial de foliado y numeración de páginas PDF en el navegador. 100% privado en RAM sin marcas de agua.',
    images: [`${SITE_URL}/og-foliar-pdf.png`],
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

export default function FoliarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
