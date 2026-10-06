import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_FRENCH_TOOL_SLUGS, getToolBySlugFr } from '@/lib/routes-config';
import { buildToolMetadata } from '@/lib/seo-metadata';
import OrganizarToolClient from '@/components/OrganizarToolClient';
import OptimizarToolClient from '@/components/OptimizarToolClient';
import EditarToolClient from '@/components/EditarToolClient';
import ConverterToolClient from '@/components/ConverterToolClient';

interface PageProps {
  params: Promise<{ tool: string }>;
}

export async function generateStaticParams() {
  return ALL_FRENCH_TOOL_SLUGS.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tool } = await params;
  const config = getToolBySlugFr(tool);
  if (!config) {
    return {};
  }
  return buildToolMetadata(config.category, config.slugEs, 'fr');
}

export default async function FrenchToolPage({ params }: PageProps) {
  const { tool } = await params;
  const config = getToolBySlugFr(tool);

  if (!config) {
    notFound();
  }

  switch (config.clientType) {
    case 'organizar':
      return <OrganizarToolClient toolKey={config.toolKey} />;
    case 'optimizar':
      return <OptimizarToolClient toolKey={config.toolKey} />;
    case 'editar':
      return <EditarToolClient toolKey={config.toolKey} />;
    case 'convertir':
      return <ConverterToolClient toolKey={config.toolKey} />;
    default:
      notFound();
  }
}
