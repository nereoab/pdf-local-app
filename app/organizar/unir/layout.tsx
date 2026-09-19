import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('organizar', 'unir', 'es');

export default function UnirPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
