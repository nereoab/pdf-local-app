import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('organizar', 'eliminar', 'es');

export default function EliminarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
