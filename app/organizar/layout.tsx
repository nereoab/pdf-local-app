import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('organizar', 'es');

export default function OrganizarHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
