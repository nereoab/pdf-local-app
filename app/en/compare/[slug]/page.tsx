import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ALL_COMPARISON_SLUGS_EN,
  getComparisonData,
  getEquivalentComparisonSlug,
} from '@/lib/comparisons/data';
import ComparisonEditorialSection from '@/components/ComparisonEditorialSection';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_COMPARISON_SLUGS_EN.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getComparisonData(slug, 'en');

  if (!data) {
    return {};
  }

  const canonicalUrl = `${SITE_URL}/en/compare/${data.slug}`;
  const esSlug = getEquivalentComparisonSlug(data.slug, 'en');
  const esUrl = `${SITE_URL}/comparar/${esSlug}`;

  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(
    data.h1.split(':')[0].trim(),
  )}&badge=${encodeURIComponent(data.badge)}&category=organizar&lang=en`;

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: esUrl,
        en: canonicalUrl,
        'x-default': esUrl,
      },
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: 'en_US',
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: data.metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.metaTitle,
      description: data.metaDescription,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function EnglishComparePage({ params }: PageProps) {
  const { slug } = await params;
  const data = getComparisonData(slug, 'en');

  if (!data) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/en/compare/${data.slug}`;

  // ── JSON-LD SCHEMAS ──
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PDFBlack',
    url: `${SITE_URL}/en`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: data.metaDescription,
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
        name: 'Compare',
        item: `${SITE_URL}/en/compare/pdfblack-vs-ilovepdf`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.h1.split(':')[0].trim(),
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ComparisonEditorialSection data={data} lang="en" />
    </>
  );
}
