import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'excel-pdf', 'es');

export default function ExcelPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
