import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('organizar', 'dividir', 'es');

export default function DividirPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
