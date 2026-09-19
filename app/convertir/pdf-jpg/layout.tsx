import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'pdf-jpg', 'es');

export default function PdfJpgLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
