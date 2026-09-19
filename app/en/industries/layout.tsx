import type { Metadata } from 'next';
import { buildIndustryHubMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildIndustryHubMetadata('en');

export default function IndustriesLayoutEn({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
