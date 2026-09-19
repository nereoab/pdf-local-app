import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'word-pdf', 'es');

export default function WordPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
