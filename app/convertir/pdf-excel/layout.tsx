import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'pdf-excel', 'es');

export default function PdfExcelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
