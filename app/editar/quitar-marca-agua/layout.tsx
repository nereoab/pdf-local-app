import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('editar', 'quitar-marca-agua', 'es');

export default function QuitarMarcaAguaPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
