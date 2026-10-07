import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('editar', 'pt');

export default function PortugueseEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
