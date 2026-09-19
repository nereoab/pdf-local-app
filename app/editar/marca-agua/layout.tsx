import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('editar', 'marca-agua', 'es');

export default function MarcaAguaPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
