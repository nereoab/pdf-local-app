import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('editar', 'firmar', 'es');

export default function FirmarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
