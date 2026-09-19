import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('optimizar', 'en');

export default function EnglishOptimizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
