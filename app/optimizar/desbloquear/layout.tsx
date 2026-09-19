import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = buildToolMetadata('optimizar', 'desbloquear', 'es');

export default function DesbloquearPdfLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
