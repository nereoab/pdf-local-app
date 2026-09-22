import { Metadata } from 'next';
import SharedDocView from '@/components/SharedDocView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;

  return {
    title: 'Documento Compartido | PDFBlack',
    description:
      'Descarga y visualiza este documento de forma rápida, segura y privada a través de PDFBlack.',
    openGraph: {
      title: 'Documento PDF Seguro | PDFBlack',
      description:
        'Haz clic para previsualizar o descargar este documento compartido a través de PDFBlack.',
      url: `https://pdf-black.com/share/${shareId}`,
      siteName: 'PDFBlack Suite',
      images: [
        {
          url: 'https://pdf-black.com/icon.png',
          width: 512,
          height: 512,
          alt: 'PDFBlack Documento',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Documento Compartido | PDFBlack',
      description: 'Descarga este documento compartido a través de PDFBlack.',
    },
  };
}

export default async function SharedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;

  return <SharedDocView shareId={shareId} />;
}
