import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('organizar', 'reordenar', 'es');

export default function ReordenarPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
