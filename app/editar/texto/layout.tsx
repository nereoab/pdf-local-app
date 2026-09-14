import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Editar PDF Gratis Online — Modificar Texto e Imágenes en PDF',
  description:
    'Modifica texto existente, añade párrafos, inserta imágenes, firmas y formas en documentos PDF directamente en tu navegador. 100% privado en memoria RAM, sin marcas de agua ni límites.',
  keywords: [
    'editar pdf',
    'editar texto pdf',
    'modificar texto pdf',
    'editor de pdf gratis',
    'editar pdf online gratis',
    'cambiar texto en pdf',
    'insertar imagenes en pdf',
    'editar imagenes pdf',
    'editar pdf sin marcas de agua',
    'editor pdf privado',
    'modificar pdf sin registro',
    'edit pdf online free',
    'edit pdf text',
    'modify pdf text and images',
    'free pdf editor without watermark',
    'pdf editor local in-browser',
    'agregar texto a pdf',
    'anotar pdf gratis',
    'editor de texto pdf profesional',
    'pdf editor zero-knowledge',
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
    canonical: `${SITE_URL}/editar/texto`,
    languages: {
      'es-ES': `${SITE_URL}/editar/texto`,
      'en-US': `${SITE_URL}/editar/texto?lang=en`,
    },
  },
  openGraph: {
    title: 'Editar PDF Gratis Online — Modificar Texto e Imágenes en PDF | PDFBlack',
    description:
      'Modifica texto existente, añade párrafos, inserta imágenes y formas en tu PDF directamente en tu navegador. 100% local en RAM, sin marcas de agua ni subida a servidores.',
    url: `${SITE_URL}/editar/texto`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-editar-texto-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Editar Texto e Imágenes de Documentos PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editar PDF Gratis Online — Modificar Texto e Imágenes en PDF',
    description:
      'Editor de PDF 100% en tu navegador: modifica texto, inserta imágenes y añade firmas sin subir archivos a la nube ni marcas de agua.',
    images: [`${SITE_URL}/og-editar-texto-pdf.png`],
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

export default function EditarTextoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
