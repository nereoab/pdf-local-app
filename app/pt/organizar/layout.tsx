import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('organizar', 'pt');

export default function PortugueseOrganizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
