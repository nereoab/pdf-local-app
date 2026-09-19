import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'pdf-word', 'es');

export default function PdfWordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
