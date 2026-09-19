import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('organizar', 'recortar', 'es');

export default function RecortarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
