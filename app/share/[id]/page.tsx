import { Metadata } from 'next';
import SharedDocView from '@/components/SharedDocView';
import { getServerShareMetadata } from '@/lib/share-server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;
  const meta = await getServerShareMetadata(shareId);

  const filename = meta?.originalName || 'Documento PDF';
  const sizeText = meta?.formattedSize ? ` (${meta.formattedSize})` : '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';
  const ogImageUrl = `${siteUrl}/share/${shareId}/opengraph-image`;

  const pageTitle = `📄 ${filename}${sizeText} | PDFBlack`;
  const pageDescription = `Descarga o previsualiza ${filename}${sizeText} de forma rápida, segura y privada a través de PDFBlack. Almacenamiento temporal protegido con cifrado en tránsito (expira en 24h).`;

  return {
    title: {
      absolute: pageTitle,
    },
    description: pageDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${siteUrl}/share/${shareId}`,
    },
    openGraph: {
      title: `📄 ${filename}${sizeText} • PDFBlack`,
      description: pageDescription,
      url: `${siteUrl}/share/${shareId}`,
      siteName: 'PDFBlack',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${filename} en PDFBlack`,
          type: 'image/png',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `📄 ${filename}${sizeText} • PDFBlack`,
      description: pageDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function SharedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const shareId = resolvedParams.id;

  return <SharedDocView shareId={shareId} />;
}
