import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('editar', 'ocr', 'es');

export default function OcrPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
