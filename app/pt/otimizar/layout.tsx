import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('optimizar', 'pt');

export default function PortugueseOptimizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
