import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('convertir', 'pdf-powerpoint', 'es');

export default function PdfPowerpointLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
