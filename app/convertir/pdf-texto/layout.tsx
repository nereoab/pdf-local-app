import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'pdf-texto', 'es');

export default function PdfTextoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
