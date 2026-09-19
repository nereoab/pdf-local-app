import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('optimizar', 'es');

export default function OptimizarHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
