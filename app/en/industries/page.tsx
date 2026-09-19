import React from 'react';
import IndustryHubView from '@/components/IndustryHubView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function IndustriesPageEn() {
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
        name: 'B2B Enterprise Industries & Compliance',
        item: `${SITE_URL}/en/industries`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <IndustryHubView lang="en" />
    </>
  );
}
