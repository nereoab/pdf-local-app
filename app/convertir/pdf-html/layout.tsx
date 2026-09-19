import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'pdf-html', 'es');

export default function PdfHtmlLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
