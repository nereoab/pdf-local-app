import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('optimizar', 'proteger', 'es');

export default function ProtegerPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
