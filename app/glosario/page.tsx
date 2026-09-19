import React from 'react';
import GlossaryIndexView from '@/components/GlossaryIndexView';
import { getAllGlossaryTerms } from '@/lib/glossary/data';
import { buildDefinedTermSetSchema } from '@/lib/seo-metadata';

export default function GlosarioPage() {
  const terms = getAllGlossaryTerms('es');
  const definedTermSetSchema = buildDefinedTermSetSchema(terms, 'es');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSetSchema) }}
      />
      <GlossaryIndexView lang="es" />
    </>
  );
}
