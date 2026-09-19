import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('optimizar', 'censurar', 'es');

export default function CensurarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
