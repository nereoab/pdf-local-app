import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_GLOSSARY_SLUGS_ES, getGlossaryTerm } from '@/lib/glossary/data';
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
  return ALL_GLOSSARY_SLUGS_ES.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTerm(slug, 'es');

  if (!term) {
    return {};
  }

  return buildGlossaryTermMetadata(term, 'es');
}

export default async function GlossaryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug, 'es');

  if (!term) {
    notFound();
  }

  const termUrl = `${SITE_URL}/glosario/${term.slug}`;
  const glossaryUrl = `${SITE_URL}/glosario`;

  const definedTermSchema = buildDefinedTermSchema({
    term: term.term,
    definition: term.blufDefinition,
    url: termUrl,
    inDefinedTermSetUrl: glossaryUrl,
    lang: 'es',
  });

  const breadcrumbSchema = buildGlossaryBreadcrumbSchema(term, 'es');
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
      <GlossaryTermView term={term} lang="es" />
    </>
  );
}
