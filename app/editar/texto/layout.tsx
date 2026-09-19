import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('editar', 'texto', 'es');

export default function EditarTextoPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
