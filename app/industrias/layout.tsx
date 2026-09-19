import type { Metadata } from 'next';
import { buildIndustryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildIndustryHubMetadata('es');

export default function IndustriasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
