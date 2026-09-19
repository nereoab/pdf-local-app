import type { Metadata } from 'next';
import { buildGlossaryIndexMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildGlossaryIndexMetadata('es');

export default function GlosarioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
