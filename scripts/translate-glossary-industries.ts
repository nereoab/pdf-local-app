import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import { GLOSSARY_TERMS_ES } from '../lib/glossary/data';
import { INDUSTRIES_DATA } from '../lib/industries/data';
import { IndustryPageData } from '../lib/industries/types';
import { getPortugueseUrlForSpanish } from '../lib/routes-config';

function getAccessToken(): string {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Firebase tools config not found at: ${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  if (!token) {
    throw new Error('No access_token found in firebase-tools.json');
  }
  return token;
}

let totalCharsSent = 0;
let totalApiCalls = 0;

async function translateBatch(texts: string[], targetLang = 'pt'): Promise<string[]> {
  if (texts.length === 0) return [];
  const token = getAccessToken();
  const body = JSON.stringify({
    q: texts,
    target: targetLang,
    format: 'text',
  });

  const chars = texts.reduce((acc, t) => acc + (t ? t.length : 0), 0);
  totalCharsSent += chars;
  totalApiCalls++;

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://translation.googleapis.com/language/translate/v2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Goog-User-Project': 'pdfblack-proy',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const results = parsed.data.translations.map((t: any) => t.translatedText);
              resolve(results);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`GCP Translate API Error HTTP ${res.statusCode}: ${data}`));
          }
        });
      },
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function translateIndustries() {
  console.log('\n🏛️ Traduciendo Hubs de Industria a Portugués con Google Cloud...');
  const industryEntries = Object.values(INDUSTRIES_DATA);
  const industriesPt: Record<string, any> = {};

  for (const ind of industryEntries) {
    console.log(`- Industria: ${ind.slug}`);
    const texts: string[] = [
      ind.name,
      ind.heroBadge,
      ind.h1,
      ind.subtitle,
      ind.metaTitle,
      ind.metaDescription,
    ];

    // Keywords
    const numKw = ind.keywords.length;
    for (const kw of ind.keywords) texts.push(kw);

    // Compliance standards
    const numStandards = ind.complianceStandards.length;
    for (const std of ind.complianceStandards) {
      texts.push(std.name);
      texts.push(std.badge);
      texts.push(std.description);
      texts.push(std.authority);
    }

    // Challenges
    const numChallenges = ind.challenges.length;
    for (const c of ind.challenges) {
      texts.push(c.problem);
      texts.push(c.risk);
      texts.push(c.solution);
    }

    // Key benefits
    const numBenefits = ind.keyBenefits.length;
    for (const b of ind.keyBenefits) {
      texts.push(b.title);
      texts.push(b.desc);
    }

    // Recommended tools (name, badge, reason)
    const numTools = ind.recommendedTools.length;
    for (const t of ind.recommendedTools) {
      texts.push(t.name);
      texts.push(t.badge);
      texts.push(t.reason);
    }

    // FAQs
    const numFaqs = ind.faqs.length;
    for (const f of ind.faqs) {
      texts.push(f.q);
      texts.push(f.a);
    }

    // Stats
    const numStats = ind.stats.length;
    for (const st of ind.stats) {
      texts.push(st.label);
    }

    const translated = await translateBatch(texts, 'pt');
    let ptr = 0;
    const name = translated[ptr++];
    const heroBadge = translated[ptr++];
    const h1 = translated[ptr++];
    const subtitle = translated[ptr++];
    const metaTitle = translated[ptr++];
    const metaDescription = translated[ptr++];

    const keywords = [];
    for (let k = 0; k < numKw; k++) keywords.push(translated[ptr++]);

    const complianceStandards = [];
    for (let s = 0; s < numStandards; s++) {
      complianceStandards.push({
        name: translated[ptr++],
        badge: translated[ptr++],
        description: translated[ptr++],
        authority: translated[ptr++],
      });
    }

    const challenges = [];
    for (let c = 0; c < numChallenges; c++) {
      challenges.push({
        problem: translated[ptr++],
        risk: translated[ptr++],
        solution: translated[ptr++],
      });
    }

    const keyBenefits = [];
    for (let b = 0; b < numBenefits; b++) {
      keyBenefits.push({
        title: translated[ptr++],
        desc: translated[ptr++],
      });
    }

    const recommendedTools = [];
    for (let t = 0; t < numTools; t++) {
      const origTool = ind.recommendedTools[t];
      const tName = translated[ptr++];
      const tBadge = translated[ptr++];
      const tReason = translated[ptr++];
      recommendedTools.push({
        name: tName,
        nameEn: origTool.nameEn,
        pathEs: origTool.pathEs,
        pathEn: origTool.pathEn,
        pathPt: getPortugueseUrlForSpanish(origTool.pathEs),
        badge: tBadge,
        reason: tReason,
        reasonEn: origTool.reasonEn,
      });
    }

    const faqs = [];
    for (let f = 0; f < numFaqs; f++) {
      faqs.push({ q: translated[ptr++], a: translated[ptr++] });
    }

    const stats = [];
    for (let st = 0; st < numStats; st++) {
      const origStat = ind.stats[st] as any;
      stats.push({
        value: origStat.value,
        label: translated[ptr++],
        labelEn: origStat.labelEn,
      });
    }

    industriesPt[ind.slug] = {
      slug: ind.slug,
      slugEn: ind.slugEn,
      name,
      nameEn: ind.nameEn,
      heroBadge,
      h1,
      h1En: ind.h1En,
      subtitle,
      subtitleEn: ind.subtitleEn,
      metaTitle,
      metaTitleEn: ind.metaTitleEn,
      metaDescription,
      metaDescriptionEn: ind.metaDescriptionEn,
      keywords,
      keywordsEn: ind.keywordsEn,
      complianceStandards,
      challenges,
      challengesEn: ind.challengesEn,
      keyBenefits,
      keyBenefitsEn: ind.keyBenefitsEn,
      recommendedTools,
      faqs,
      faqsEn: ind.faqsEn,
      stats,
    };
  }

  const outPath = path.join(__dirname, '..', 'lib', 'industries', 'data-pt.ts');
  fs.writeFileSync(
    outPath,
    `import { IndustryPageData } from './types';\n\nexport const INDUSTRIES_DATA_PT: Record<string, IndustryPageData> = ${JSON.stringify(
      industriesPt,
      null,
      2,
    )};\n`,
    'utf8',
  );
  console.log(`✓ Hubs de Industria en Portugués guardados en: ${outPath}`);
}

async function run() {
  await translateIndustries();
  console.log(`\n🎉 TRADUCCIÓN DE INDUSTRIAS COMPLETADA.`);
  console.log(`   - Peticiones API adicionales: ${totalApiCalls}`);
  console.log(`   - Caracteres enviados a GCP: ${totalCharsSent.toLocaleString()}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
