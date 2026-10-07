import React from 'react';
import IndustryHubView from '@/components/IndustryHubView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdf-black.com';

export default function IndustriesPageFr() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: `${SITE_URL}/fr`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Solutions PDF par Secteur d’Activité',
        item: `${SITE_URL}/fr/industries`,
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
