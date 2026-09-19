export interface ComplianceStandard {
  name: string;
  badge: string;
  description: string;
  authority: string;
}

export interface IndustryChallengeItem {
  problem: string;
  risk: string;
  solution: string;
}

export interface IndustryRecommendedTool {
  name: string;
  nameEn: string;
  pathEs: string;
  pathEn: string;
  badge: string;
  reason: string;
  reasonEn: string;
}

export interface IndustryPageData {
  slug: string;
  slugEn: string;
  name: string;
  nameEn: string;
  heroBadge: string;
  h1: string;
  h1En: string;
  subtitle: string;
  subtitleEn: string;
  metaTitle: string;
  metaTitleEn: string;
  metaDescription: string;
  metaDescriptionEn: string;
  keywords: string[];
  keywordsEn: string[];
  complianceStandards: ComplianceStandard[];
  challenges: IndustryChallengeItem[];
  challengesEn: IndustryChallengeItem[];
  keyBenefits: Array<{
    title: string;
    desc: string;
  }>;
  keyBenefitsEn: Array<{
    title: string;
    desc: string;
  }>;
  recommendedTools: IndustryRecommendedTool[];
  faqs: Array<{
    q: string;
    a: string;
  }>;
  faqsEn: Array<{
    q: string;
    a: string;
  }>;
  stats: Array<{
    value: string;
    label: string;
    labelEn: string;
  }>;
}
