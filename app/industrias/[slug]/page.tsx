import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_INDUSTRY_SLUGS_ES, getIndustryData } from '@/lib/industries/data';
import {
  buildIndustryMetadata,
  buildIndustryServiceSchema,
  buildIndustryBreadcrumbSchema,
  buildFaqStructuredData,
} from '@/lib/seo-metadata';
import IndustryPageView from '@/components/IndustryPageView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_INDUSTRY_SLUGS_ES.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getIndustryData(slug, 'es');

  if (!data) {
    return {};
  }

  return buildIndustryMetadata(data, 'es');
}

export default async function IndustryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = getIndustryData(slug, 'es');

  if (!data) {
    notFound();
  }

  const serviceSchema = buildIndustryServiceSchema(data, 'es');
  const breadcrumbSchema = buildIndustryBreadcrumbSchema(data, 'es');
  const faqSchema = buildFaqStructuredData(data.faqs);

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PDFBlack',
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: data.metaDescription,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <IndustryPageView data={data} lang="es" />
    </>
  );
}
