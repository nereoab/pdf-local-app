import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('editar', 'en');

export default function EnglishEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
