import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('convertir', 'es');

export default function ConvertirLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
