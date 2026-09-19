import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('editar', 'foliar', 'es');

export default function FoliarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
