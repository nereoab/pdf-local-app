export interface ComparisonFeature {
  name: string;
  category: 'privacidad' | 'rendimiento' | 'coste' | 'seguridad';
  pdfblack: string | boolean;
  competitor: string | boolean;
  highlight?: boolean;
  description?: string;
}

export interface KeyDifference {
  title: string;
  pdfblack: string;
  competitor: string;
  benefit: string;
}

export interface RecommendedTool {
  name: string;
  slug: string;
  path: string;
  desc: string;
  category: string;
}

export interface ComparisonPageData {
  slug: string;
  slugEn: string;
  type: 'comparativa' | 'alternativa';
  competitorName: 'iLovePDF' | 'Smallpdf';
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  badge: string;
  h1: string;
  subtitle: string;
  executiveSummary: string;
  verdictTitle: string;
  verdictText: string;
  keyDifferences: KeyDifference[];
  features: ComparisonFeature[];
  whySwitchReasons: Array<{
    title: string;
    desc: string;
  }>;
  faqs: Array<{
    q: string;
    a: string;
  }>;
  recommendedTools: RecommendedTool[];
}
