import type { Metadata } from 'next';
import { buildGlossaryIndexMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildGlossaryIndexMetadata('en');

export default function GlossaryLayoutEn({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
