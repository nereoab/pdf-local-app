import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('organizar', 'rotar', 'es');

export default function RotarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
