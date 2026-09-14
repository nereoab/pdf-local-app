import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export const metadata: Metadata = {
  title: 'Quitar Marca de Agua de PDF Gratis Online — Eliminar Sellos | PDFBlack',
  description:
    'Elimina marcas de agua, sellos de fondo y textos confidenciales o de borrador de documentos PDF online. Depuración vectorial inteligente sin alterar tus textos ni imágenes. 100% privado en memoria RAM.',
  keywords: [
    'quitar marca de agua pdf',
    'eliminar marca de agua pdf online gratis',
    'remover sello de agua pdf',
    'quitar sello de agua pdf online',
    'eliminar texto confidencial pdf',
    'quitar marca de agua camscanner pdf',
    'remove watermark from pdf free',
    'delete pdf watermark online',
    'limpiar pdf marcas de agua',
    'eliminar fondo marca de agua pdf',
    'quitar marca de agua apryse pdf',
    'quitar marca ilovepdf',
    'borrar sello pdf',
    'pdf watermark remover zero-knowledge',
    'depurar marcas de agua en pdf',
    'quitar marcas de agua sin perder calidad',
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
    canonical: `${SITE_URL}/editar/quitar-marca-agua`,
    languages: {
      'es-ES': `${SITE_URL}/editar/quitar-marca-agua`,
      'en-US': `${SITE_URL}/editar/quitar-marca-agua?lang=en`,
    },
  },
  openGraph: {
    title: 'Quitar Marca de Agua de PDF Gratis Online — Eliminar Sellos | PDFBlack',
    description:
      'Depura y elimina marcas de agua de texto, sellos de fondo y marcas comerciales de tus PDFs sin alterar imágenes ni tipografías. 100% local en RAM.',
    url: `${SITE_URL}/editar/quitar-marca-agua`,
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'article',
    images: [
      {
        url: `${SITE_URL}/og-quitar-marca-agua-pdf.png`,
        width: 1200,
        height: 630,
        alt: 'Quitar Marca de Agua de Documentos PDF Online Gratis — PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quitar Marca de Agua de PDF Gratis Online — Eliminar Sellos',
    description:
      'Herramienta forense para eliminar marcas de agua y sellos de fondo en PDF directamente en el navegador. 100% privado en memoria RAM.',
    images: [`${SITE_URL}/og-quitar-marca-agua-pdf.png`],
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

export default function QuitarMarcaAguaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
