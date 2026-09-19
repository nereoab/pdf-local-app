import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_GLOSSARY_SLUGS_EN, getGlossaryTerm } from '@/lib/glossary/data';
import {
  buildGlossaryTermMetadata,
  buildDefinedTermSchema,
  buildGlossaryBreadcrumbSchema,
  buildFaqStructuredData,
} from '@/lib/seo-metadata';
import GlossaryTermView from '@/components/GlossaryTermView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_GLOSSARY_SLUGS_EN.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTerm(slug, 'en');

  if (!term) {
    return {};
  }

  return buildGlossaryTermMetadata(term, 'en');
}

export default async function GlossaryDetailPageEn({ params }: PageProps) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug, 'en');

  if (!term) {
    notFound();
  }

  const termUrl = `${SITE_URL}/en/glossary/${term.slugEn}`;
  const glossaryUrl = `${SITE_URL}/en/glossary`;

  const definedTermSchema = buildDefinedTermSchema({
    term: term.termEn,
    definition: term.blufDefinition,
    url: termUrl,
    inDefinedTermSetUrl: glossaryUrl,
    lang: 'en',
  });

  const breadcrumbSchema = buildGlossaryBreadcrumbSchema(term, 'en');
  const faqSchema = buildFaqStructuredData(term.faqs);

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PDFBlack',
    url: SITE_URL,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: term.metaDescription,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
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
      <GlossaryTermView term={term} lang="en" />
    </>
  );
}
