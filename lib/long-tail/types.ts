export interface SpecificationItem {
  feature: string;
  value: string;
  note: string;
}

export interface HowToStep {
  step: number;
  title: string;
  desc: string;
}

export interface BenefitItem {
  title: string;
  desc: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LongTailSolution {
  slug: string;
  category: 'optimizar' | 'editar' | 'convertir' | 'organizar';
  toolKey: string;
  badge: string;
  h1: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  parentPath: string;
  parentName: string;
  specifications: SpecificationItem[];
  steps: HowToStep[];
  benefits: BenefitItem[];
  faqs: FaqItem[];
  relatedSolutions: string[];
  esEquivalentSlug?: string;
  enEquivalentSlug?: string;
}
