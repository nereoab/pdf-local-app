import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('organizar', 'en');

export default function EnglishOrganizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
