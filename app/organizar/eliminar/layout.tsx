import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eliminar Páginas PDF Gratis Online — Borrar Hojas PDF Sin Registro',
  description:
    'Elimina páginas no deseadas de tus archivos PDF de forma rápida, precisa y 100% confidencial en tu navegador. Selecciona hojas con un clic, borra páginas pares o impares, detecta páginas en blanco o define rangos numéricos. Procesamiento local en RAM sin marcas de agua ni límites.',
  keywords: [
    'eliminar paginas pdf',
    'borrar paginas de un pdf',
    'quitar paginas pdf',
    'suprimir hojas pdf',
    'eliminar hojas de pdf gratis',
    'delete pdf pages online',
    'borrar hojas en blanco pdf',
    'eliminar paginas pares impares pdf',
    'quitar hojas de un pdf gratis',
    'eliminar paginas pdf sin limites',
    'depurar pdf online',
    'borrar pagina pdf confidencial',
    'como eliminar paginas de un archivo pdf',
    'eliminar paginas pdf local sin servidor',
    'reducir paginas pdf',
    'delete pages from pdf free',
    'herramienta para borrar hojas pdf',
    'eliminar paginas pdf navegador',
    'borrar paginas pdf sin subir archivos',
    'delete pdf pages zero knowledge',
  ],
  authors: [{ name: 'PDFBlack Team' }],
  category: 'productivity',
  alternates: {
    canonical: 'https://pdf-black.com/organizar/eliminar',
    languages: {
      'es-ES': 'https://pdf-black.com/organizar/eliminar',
      'en-US': 'https://pdf-black.com/organizar/eliminar',
    },
  },
  openGraph: {
    title: 'Eliminar Páginas PDF Gratis Online — Borrar Hojas PDF Sin Registro | PDFBlack',
    description:
      'Elimina páginas y hojas no deseadas de tus documentos PDF de forma rápida y 100% privada en la memoria local de tu navegador sin subir datos a servidores.',
    url: 'https://pdf-black.com/organizar/eliminar',
    siteName: 'PDFBlack',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://pdf-black.com/og-eliminar-pdf.png',
        width: 1200,
        height: 630,
        alt: 'Eliminar Páginas PDF Gratis Online con PDFBlack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eliminar Páginas PDF Gratis Online — Borrar Hojas PDF Sin Registro | PDFBlack',
    description:
      'Borra hojas de documentos PDF con previsualización interactiva, detección de hojas en blanco y supresión vectorial en RAM local sin registro.',
    images: ['https://pdf-black.com/og-eliminar-pdf.png'],
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

export default function EliminarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
