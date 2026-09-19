import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'powerpoint-pdf', 'es');

export default function PowerpointPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
