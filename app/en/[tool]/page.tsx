import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_ENGLISH_TOOL_SLUGS, getToolBySlugEn } from '@/lib/routes-config';
import { buildToolMetadata, buildFullToolSchemas } from '@/lib/seo-metadata';
import OrganizarToolClient from '@/components/OrganizarToolClient';
import OptimizarToolClient from '@/components/OptimizarToolClient';
import EditarToolClient from '@/components/EditarToolClient';
import ConverterToolClient from '@/components/ConverterToolClient';
import RelatedLongTailSolutions from '@/components/RelatedLongTailSolutions';

interface PageProps {
  params: Promise<{ tool: string }>;
}

export async function generateStaticParams() {
  return ALL_ENGLISH_TOOL_SLUGS.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tool } = await params;
  const config = getToolBySlugEn(tool);
  if (!config) {
    return {};
  }
  return buildToolMetadata(config.category, config.slugEs, 'en');
}

export default async function EnglishToolPage({ params }: PageProps) {
  const { tool } = await params;
  const config = getToolBySlugEn(tool);

  if (!config) {
    notFound();
  }

  const schemas = buildFullToolSchemas({
    category: config.category,
    toolSlug: config.slugEs,
    lang: 'en',
  });

  const renderClientComponent = () => {
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
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.webApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.howTo) }}
      />
      {schemas.faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.faq) }}
        />
      )}
      {renderClientComponent()}
      <RelatedLongTailSolutions toolKey={config.toolKey} lang="en" />
    </>
  );
}
