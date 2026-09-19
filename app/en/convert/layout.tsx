import type { Metadata } from 'next';
import { buildCategoryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildCategoryHubMetadata('convertir', 'en');

export default function EnglishConvertLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
