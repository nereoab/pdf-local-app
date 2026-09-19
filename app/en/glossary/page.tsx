import React from 'react';
import GlossaryIndexView from '@/components/GlossaryIndexView';
import { getAllGlossaryTerms } from '@/lib/glossary/data';
import { buildDefinedTermSetSchema } from '@/lib/seo-metadata';

export default function GlossaryIndexPageEn() {
  const terms = getAllGlossaryTerms('en');
  const definedTermSetSchema = buildDefinedTermSetSchema(terms, 'en');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSetSchema) }}
      />
      <GlossaryIndexView lang="en" />
    </>
  );
}
