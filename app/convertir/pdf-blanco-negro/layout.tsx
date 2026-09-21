import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'pdf-blanco-negro', 'es');

export default function PdfBlancoNegroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
