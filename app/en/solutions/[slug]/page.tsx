import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_LONG_TAIL_SLUGS_EN, getSolutionBySlugEn } from '@/lib/long-tail-registry';
import OptimizarToolClient from '@/components/OptimizarToolClient';
import EditarToolClient from '@/components/EditarToolClient';
import ConverterToolClient from '@/components/ConverterToolClient';
import OrganizarToolClient from '@/components/OrganizarToolClient';
import LongTailEditorialSectionEn from '@/components/LongTailEditorialSectionEn';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_LONG_TAIL_SLUGS_EN.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolutionBySlugEn(slug);

  if (!solution) {
    return {};
  }

  const canonicalUrl = `${SITE_URL}/en/solutions/${solution.slug}`;
  const spanishUrl = solution.esEquivalentSlug
    ? `${SITE_URL}/soluciones/${solution.esEquivalentSlug}`
    : undefined;

  return {
    title: solution.metaTitle,
    description: solution.metaDescription,
    keywords: solution.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalUrl,
        ...(spanishUrl ? { es: spanishUrl } : {}),
        'x-default': canonicalUrl,
      },
    },
    openGraph: {
      title: solution.metaTitle,
      description: solution.metaDescription,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: solution.metaTitle,
      description: solution.metaDescription,
    },
  };
}

export default async function LongTailSolutionEnPage({ params }: PageProps) {
  const { slug } = await params;
  const solution = getSolutionBySlugEn(slug);

  if (!solution) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/en/solutions/${solution.slug}`;
  const parentFullUrl = `${SITE_URL}${solution.parentPath}`;

  // ─── STRUCTURED DATA SCHEMAS (JSON-LD) ───
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: solution.h1,
    url: canonicalUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1340',
      bestRating: '5',
      worstRating: '1',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/en`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: solution.parentName,
        item: parentFullUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: solution.h1.split('—')[0].trim(),
        item: canonicalUrl,
      },
    ],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: solution.h1,
    description: solution.subtitle,
    step: solution.steps.map((s) => ({
      '@type': 'HowToStep',
      position: s.step,
      name: s.title,
      text: s.desc,
    })),
  };

  const faqSchema =
    solution.faqs && solution.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: solution.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.a,
            },
          })),
        }
      : null;

  const renderToolComponent = () => {
    switch (solution.category) {
      case 'optimizar':
        return <OptimizarToolClient toolKey={solution.toolKey} />;
      case 'editar':
        return <EditarToolClient toolKey={solution.toolKey} />;
      case 'convertir':
        return <ConverterToolClient toolKey={solution.toolKey} />;
      case 'organizar':
        return <OrganizarToolClient toolKey={solution.toolKey} />;
      default:
        return <OptimizarToolClient toolKey={solution.toolKey} />;
    }
  };

  return (
    <>
      {/* ─── STRUCTURED DATA (RICH SNIPPETS) ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* ─── PRIMARY INTERACTIVE TOOL (IN-BROWSER WASM) ─── */}
      <div className="w-full">{renderToolComponent()}</div>

      {/* ─── ENRICHED EDITORIAL SECTION (SPECS, STEP-BY-STEP, FAQS, CLUSTER) ─── */}
      <LongTailEditorialSectionEn solution={solution} />
    </>
  );
}
