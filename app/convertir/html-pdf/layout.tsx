import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'html-pdf', 'es');

export default function HtmlPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
