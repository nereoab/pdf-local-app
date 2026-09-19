import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'texto-pdf', 'es');

export default function TextoPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
