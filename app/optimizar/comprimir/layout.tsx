import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('optimizar', 'comprimir', 'es');

export default function ComprimirPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
