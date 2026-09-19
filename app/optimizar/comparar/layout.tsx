import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('optimizar', 'comparar', 'es');

export default function CompararPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
