import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_INDUSTRY_SLUGS_EN, getIndustryData } from '@/lib/industries/data';
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
  return ALL_INDUSTRY_SLUGS_EN.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getIndustryData(slug, 'en');

  if (!data) {
    return {};
  }

  return buildIndustryMetadata(data, 'en');
}

export default async function IndustryDetailPageEn({ params }: PageProps) {
  const { slug } = await params;
  const data = getIndustryData(slug, 'en');

  if (!data) {
    notFound();
  }

  const serviceSchema = buildIndustryServiceSchema(data, 'en');
  const breadcrumbSchema = buildIndustryBreadcrumbSchema(data, 'en');
  const faqSchema = buildFaqStructuredData(data.faqsEn);

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
    description: data.metaDescriptionEn,
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
      <IndustryPageView data={data} lang="en" />
    </>
  );
}
