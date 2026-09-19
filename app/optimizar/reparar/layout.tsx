import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('optimizar', 'reparar', 'es');

export default function RepararPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
