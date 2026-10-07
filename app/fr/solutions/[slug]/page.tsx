import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ALL_LONG_TAIL_SLUGS_FR,
  getSolutionBySlugFr,
  getEquivalentSlug,
} from '@/lib/long-tail-registry';
import { formatMetaTitle, formatMetaDescription } from '@/lib/seo-metadata';
import OptimizarToolClient from '@/components/OptimizarToolClient';
import EditarToolClient from '@/components/EditarToolClient';
import ConverterToolClient from '@/components/ConverterToolClient';
import OrganizarToolClient from '@/components/OrganizarToolClient';
import LongTailEditorialSectionFr from '@/components/LongTailEditorialSectionFr';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_LONG_TAIL_SLUGS_FR.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolutionBySlugFr(slug);

  if (!solution) {
    return {};
  }

  const canonicalUrl = `${SITE_URL}/fr/solutions/${solution.slug}`;
  const spanishUrl = solution.esEquivalentSlug
    ? `${SITE_URL}/soluciones/${solution.esEquivalentSlug}`
    : undefined;
  const englishUrl = solution.enEquivalentSlug
    ? `${SITE_URL}/en/solutions/${solution.enEquivalentSlug}`
    : undefined;
  const ptSlug = getEquivalentSlug(solution.slug, 'fr', 'pt');
  const portugueseUrl = ptSlug ? `${SITE_URL}/pt/solutions/${ptSlug}` : undefined;

  const absoluteTitle = formatMetaTitle(solution.metaTitle);
  const safeDescription = formatMetaDescription(solution.metaDescription);

  return {
    title: {
      absolute: absoluteTitle,
    },
    description: safeDescription,
    keywords: solution.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        fr: canonicalUrl,
        ...(spanishUrl ? { es: spanishUrl } : {}),
        ...(englishUrl ? { en: englishUrl } : {}),
        ...(portugueseUrl ? { pt: portugueseUrl } : {}),
        'x-default': englishUrl || canonicalUrl,
      },
    },
    openGraph: {
      title: absoluteTitle,
      description: safeDescription,
      url: canonicalUrl,
      siteName: 'PDFBlack',
      locale: 'fr_FR',
      type: 'article',
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent(
            absoluteTitle.split('—')[0].trim(),
          )}&badge=${encodeURIComponent(solution.badge)}&category=${solution.category}&lang=fr`,
          width: 1200,
          height: 630,
          alt: absoluteTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: absoluteTitle,
      description: safeDescription,
      images: [
        `${SITE_URL}/api/og?title=${encodeURIComponent(
          absoluteTitle.split('—')[0].trim(),
        )}&badge=${encodeURIComponent(solution.badge)}&category=${solution.category}&lang=fr`,
      ],
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

export default async function FrenchSolutionPage({ params }: PageProps) {
  const { slug } = await params;
  const solution = getSolutionBySlugFr(slug);

  if (!solution) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/fr/solutions/${solution.slug}`;

  // Schemas JSON-LD
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `PDFBlack — ${solution.h1.split('—')[0].trim()}`,
    operatingSystem: 'Any (Web Browser)',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    description: solution.metaDescription,
    featureList: solution.specifications?.map((s) => `${s.feature}: ${s.value}`).join(', '),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: solution.h1,
    description: solution.subtitle,
    step: solution.steps.map((st) => ({
      '@type': 'HowToStep',
      position: st.step,
      name: st.title,
      text: st.desc,
      url: `${canonicalUrl}#step-${st.step}`,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: solution.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
        {solution.category === 'organizar' && <OrganizarToolClient toolKey={solution.toolKey} />}
        {solution.category === 'optimizar' && <OptimizarToolClient toolKey={solution.toolKey} />}
        {solution.category === 'editar' && <EditarToolClient toolKey={solution.toolKey} />}
        {solution.category === 'convertir' && <ConverterToolClient toolKey={solution.toolKey} />}

        <LongTailEditorialSectionFr solution={solution} />
      </main>
    </>
  );
}
