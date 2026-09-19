import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'jpg-pdf', 'es');

export default function JpgPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
