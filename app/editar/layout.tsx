import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('editar', 'es');

export default function EditarHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
