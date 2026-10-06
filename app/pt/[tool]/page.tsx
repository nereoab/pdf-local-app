import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_PORTUGUESE_TOOL_SLUGS, getToolBySlugPt } from '@/lib/routes-config';
import { buildToolMetadata } from '@/lib/seo-metadata';
import OrganizarToolClient from '@/components/OrganizarToolClient';
import OptimizarToolClient from '@/components/OptimizarToolClient';
import EditarToolClient from '@/components/EditarToolClient';
import ConverterToolClient from '@/components/ConverterToolClient';

interface PageProps {
  params: Promise<{ tool: string }>;
}

export async function generateStaticParams() {
  return ALL_PORTUGUESE_TOOL_SLUGS.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tool } = await params;
  const config = getToolBySlugPt(tool);
  if (!config) {
    return {};
  }
  return buildToolMetadata(config.category, config.slugEs, 'pt');
}

export default async function PortugueseToolPage({ params }: PageProps) {
  const { tool } = await params;
  const config = getToolBySlugPt(tool);

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
