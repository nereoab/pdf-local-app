import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('convertir', 'pt');

export default function PortugueseConvertLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
