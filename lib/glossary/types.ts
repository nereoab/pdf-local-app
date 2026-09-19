export type GlossaryCategory = 'legal' | 'seguridad' | 'estandares' | 'tecnologia';

export interface GlossarySpecificationItem {
  label: string;
  value: string;
}

export interface GlossaryTerm {
  slug: string;
  slugEn: string;
  term: string;
  termEn: string;
  category: GlossaryCategory;
  categoryLabel: string;
  badge: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  // AEO / Answer Engine Optimization: Respuesta concisa y directa de 25-45 palabras (BLUF)
  blufDefinition: string;
  standardReference?: string; // ej. ISO 32000-1, ISO 19005-1, NIST SP 800-38A
  fullExplanation: string;
  specifications: GlossarySpecificationItem[];
  practicalApplication: {
    title: string;
    description: string;
    useCases: string[];
  };
  commonPitfalls?: string[];
  faqs: Array<{
    q: string;
    a: string;
  }>;
  relatedTool: {
    name: string;
    slug: string;
    path: string;
    desc: string;
  };
  relatedTerms: string[];
}
