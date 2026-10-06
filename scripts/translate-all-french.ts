import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import { LONG_TAIL_SOLUTIONS, LongTailSolution } from '../lib/long-tail-registry';
import { GLOSSARY_TERMS_ES } from '../lib/glossary/data';
import { PORTUGUESE_TOOL_METADATA } from '../lib/seo-metadata';

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

async function translateBatch(texts: string[], targetLang = 'fr'): Promise<string[]> {
  if (texts.length === 0) return [];
  const token = getAccessToken();
  const body = JSON.stringify({
    q: texts,
    target: targetLang,
    format: 'text',
  });

  const chars = texts.reduce((acc, t) => acc + t.length, 0);
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

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

// Mapa de rutas de herramientas Español -> Francés
const ES_TO_FR_TOOL_PATH: Record<string, string> = {
  '/organizar/unir': '/fr/fusionner-pdf',
  '/organizar/dividir': '/fr/diviser-pdf',
  '/organizar/eliminar': '/fr/supprimer-pages-pdf',
  '/organizar/reordenar': '/fr/organiser-pages-pdf',
  '/organizar/rotar': '/fr/pivoter-pdf',
  '/organizar/recortar': '/fr/recadrer-pdf',
  '/optimizar/comprimir': '/fr/compresser-pdf',
  '/optimizar/proteger': '/fr/proteger-pdf',
  '/optimizar/desbloquear': '/fr/deverrouiller-pdf',
  '/optimizar/reparar': '/fr/reparer-pdf',
  '/optimizar/censurar': '/fr/caviarder-pdf',
  '/optimizar/comparar': '/fr/comparer-pdf',
  '/editar/texto': '/fr/editer-pdf',
  '/editar/foliar': '/fr/numeroter-pages-pdf',
  '/editar/marca-agua': '/fr/ajouter-filigrane-pdf',
  '/editar/quitar-marca-agua': '/fr/supprimer-filigrane-pdf',
  '/editar/firma': '/fr/signer-pdf',
  '/editar/firmar': '/fr/signer-pdf',
  '/editar/ocr': '/fr/ocr-pdf',
  '/convertir/pdf-word': '/fr/convertir-pdf-en-word',
  '/convertir/word-pdf': '/fr/convertir-word-en-pdf',
  '/convertir/pdf-excel': '/fr/convertir-pdf-en-excel',
  '/convertir/excel-pdf': '/fr/convertir-excel-en-pdf',
  '/convertir/pdf-powerpoint': '/fr/convertir-pdf-en-powerpoint',
  '/convertir/powerpoint-pdf': '/fr/convertir-powerpoint-en-pdf',
  '/convertir/pdf-jpg': '/fr/convertir-pdf-en-jpg',
  '/convertir/jpg-pdf': '/fr/convertir-jpg-en-pdf',
  '/convertir/pdf-texto': '/fr/extraire-texte-pdf',
  '/convertir/texto-pdf': '/fr/convertir-txt-en-pdf',
  '/convertir/pdf-html': '/fr/convertir-pdf-en-html',
  '/convertir/html-pdf': '/fr/convertir-html-en-pdf',
  '/convertir/pdf-blanco-negro': '/fr/convertir-pdf-en-noir-et-blanc',
};

// Slugs en francés para las 43 soluciones
const FRENCH_SOLUTION_SLUGS: Record<string, string> = {
  'comprimir-pdf-a-200kb': 'compresser-pdf-a-200ko',
  'comprimir-pdf-a-1mb': 'compresser-pdf-a-1mo',
  'comprimir-pdf-a-100kb': 'compresser-pdf-a-100ko',
  'quitar-marca-agua-camscanner': 'supprimer-filigrane-camscanner',
  'foliar-expediente-judicial': 'numeroter-dossier-judiciaire-pdf',
  'foliar-pdf-de-atras-hacia-adelante': 'numeroter-pdf-ordre-inverse',
  'censurar-datos-personales-pdf': 'caviarder-donnees-personnelles-pdf',
  'reparar-pdf-danado': 'reparer-pdf-endommage',
  'editar-texto-pdf-sin-desconfigurar': 'modifier-texte-pdf-sans-deformer',
  'firmar-pdf-sin-imprimir': 'signer-pdf-sans-imprimer',
  'convertir-pdf-a-word-editable': 'convertir-pdf-en-word-modifiable',
  'convertir-tabla-pdf-a-excel': 'convertir-tableau-pdf-en-excel',
  'unir-pdf-para-licitaciones-y-tramites': 'fusionner-pdf-appels-offres-demarches',
  'unir-capitulos-tesis-pdf': 'fusionner-chapitres-these-pdf',
  'unir-pdf-pesados-sin-limite-de-tamano': 'fusionner-gros-pdf-sans-limite-taille',
  'extraer-paginas-pdf-separadas': 'extraire-pages-pdf-separees',
  'dividir-pdf-por-capitulos-e-intervalos': 'diviser-pdf-par-chapitres-intervalles',
  'eliminar-paginas-en-blanco-pdf': 'supprimer-pages-blanches-pdf',
  'invertir-orden-de-paginas-pdf': 'inverser-ordre-pages-pdf',
  'rotar-planos-arquitectonicos-horizontales-pdf': 'pivoter-plans-architecturaux-pdf',
  'recortar-margenes-blancos-pdf': 'recadrer-marges-blanches-pdf',
  'recortar-todas-las-paginas-pdf': 'recadrer-toutes-pages-pdf',
  'recortar-pdf-para-kindle-y-tablet': 'recadrer-pdf-pour-liseuse-tablette',
  'comprimir-pdf-para-correo-gmail': 'compresser-pdf-pour-email-gmail',
  'proteger-pdf-con-contrasena-sin-subir-a-la-nube': 'proteger-pdf-mot-de-passe-sans-cloud',
  'desbloquear-pdf-para-imprimir-o-copiar': 'deverrouiller-pdf-pour-imprimer-ou-copier',
  'comparar-dos-versiones-de-contrato-pdf': 'comparer-deux-versions-contrat-pdf',
  'bajarle-el-peso-a-un-pdf': 'reduire-taille-un-pdf',
  'comprimir-pdf-a-500kb': 'compresser-pdf-a-500ko',
  'convertir-pdf-escaneado-a-texto-buscable': 'convertir-pdf-scanne-texte-recherchable',
  'poner-marca-de-agua-borrador-confidencial-pdf': 'ajouter-filigrane-confidentiel-brouillon-pdf',
  'borrar-marca-de-agua-pdf-online': 'effacer-filigrane-pdf-en-ligne',
  'foliar-expediente-judicial-pdf': 'folioter-dossier-judiciaire-pdf',
  'convertir-docx-a-pdf-sin-mover-formato': 'convertir-docx-en-pdf-sans-changer-mise-en-page',
  'ajustar-tabla-excel-a-una-sola-pagina-pdf': 'ajuster-tableau-excel-une-seule-page-pdf',
  'juntar-fotos-e-imagenes-en-un-solo-pdf': 'regrouper-photos-images-en-un-seul-pdf',
  'extraer-todas-las-imagenes-de-un-pdf': 'extraire-toutes-images-un-pdf',
  'convertir-pdf-a-diapositivas-powerpoint': 'convertir-pdf-en-diapositives-powerpoint',
  'guardar-presentacion-powerpoint-como-pdf': 'enregistrer-presentation-powerpoint-en-pdf',
  'extraer-texto-puro-de-un-pdf': 'extraire-texte-brut-un-pdf',
  'convertir-notas-txt-a-pdf-con-formato': 'convertir-notes-txt-en-pdf-formate',
  'convertir-pdf-a-codigo-html-responsive': 'convertir-pdf-en-code-html-responsive',
  'guardar-pagina-web-o-html-como-pdf': 'enregistrer-page-web-html-en-pdf',
};

async function run() {
  console.log('🚀 Iniciando traducción masiva al Francés con Google Cloud Translation API...');
  console.log('Proyecto GCP: pdfblack-proy (878586961850)');

  // 1. TRADUCIR LAS 31 HERRAMIENTAS
  console.log('\n--- 1. Traduciendo metadatos de las 31 herramientas principales a Francés ---');
  const toolKeys = Object.keys(PORTUGUESE_TOOL_METADATA);
  const frenchToolMetadata: Record<string, any> = {};

  for (const k of toolKeys) {
    const orig = PORTUGUESE_TOOL_METADATA[k];
    const textsToTranslate = [orig.title, orig.desc, ...orig.keywords];
    const translated = await translateBatch(textsToTranslate, 'fr');
    frenchToolMetadata[k] = {
      title: translated[0],
      desc: translated[1],
      keywords: translated.slice(2),
    };
    process.stdout.write('.');
  }
  console.log(`\n✓ 31 herramientas traducidas. Caracteres consumidos en GCP: ${totalCharsSent}`);

  // 2. TRADUCIR LAS 43 SOLUCIONES LONG-TAIL
  console.log('\n--- 2. Traduciendo las 43 soluciones técnicas a Francés ---');
  const frenchSolutions: Record<string, LongTailSolution> = {};
  const solutionsEs = Object.values(LONG_TAIL_SOLUTIONS);

  for (let i = 0; i < solutionsEs.length; i++) {
    const s = solutionsEs[i];
    const frSlug = FRENCH_SOLUTION_SLUGS[s.slug] || s.slug;

    const textsToTranslate: string[] = [];
    textsToTranslate.push(s.badge);
    textsToTranslate.push(s.h1);
    textsToTranslate.push(s.subtitle);
    textsToTranslate.push(s.metaTitle);
    textsToTranslate.push(s.metaDescription);
    textsToTranslate.push(s.parentName);

    const numKeywords = s.keywords.length;
    for (const kw of s.keywords) textsToTranslate.push(kw);

    const numSpecs = s.specifications.length;
    for (const spec of s.specifications) {
      textsToTranslate.push(spec.feature);
      textsToTranslate.push(spec.value);
      textsToTranslate.push(spec.note);
    }

    const numSteps = s.steps.length;
    for (const step of s.steps) {
      textsToTranslate.push(step.title);
      textsToTranslate.push(step.desc);
    }

    const numBenefits = s.benefits.length;
    for (const b of s.benefits) {
      textsToTranslate.push(b.title);
      textsToTranslate.push(b.desc);
    }

    const numFaqs = s.faqs.length;
    for (const faq of s.faqs) {
      textsToTranslate.push(faq.q);
      textsToTranslate.push(faq.a);
    }

    const translated = await translateBatch(textsToTranslate, 'fr');
    let ptr = 0;

    const frBadge = translated[ptr++];
    const frH1 = translated[ptr++];
    const frSubtitle = translated[ptr++];
    const frMetaTitle = translated[ptr++];
    const frMetaDescription = translated[ptr++];
    const frParentName = translated[ptr++];

    const frKeywords: string[] = [];
    for (let k = 0; k < numKeywords; k++) frKeywords.push(translated[ptr++]);

    const frSpecs = [];
    for (let sp = 0; sp < numSpecs; sp++) {
      frSpecs.push({
        feature: translated[ptr++],
        value: translated[ptr++],
        note: translated[ptr++],
      });
    }

    const frSteps = [];
    for (let st = 0; st < numSteps; st++) {
      frSteps.push({
        step: st + 1,
        title: translated[ptr++],
        desc: translated[ptr++],
      });
    }

    const frBenefits = [];
    for (let bn = 0; bn < numBenefits; bn++) {
      frBenefits.push({
        title: translated[ptr++],
        desc: translated[ptr++],
      });
    }

    const frFaqs = [];
    for (let fq = 0; fq < numFaqs; fq++) {
      frFaqs.push({
        q: translated[ptr++],
        a: translated[ptr++],
      });
    }

    const frRelated = s.relatedSolutions.map((rel) => FRENCH_SOLUTION_SLUGS[rel] || rel);
    const frParentPath = ES_TO_FR_TOOL_PATH[s.parentPath] || `/fr${s.parentPath}`;

    frenchSolutions[frSlug] = {
      slug: frSlug,
      category: s.category,
      toolKey: s.toolKey,
      badge: frBadge,
      h1: frH1,
      subtitle: frSubtitle,
      metaTitle: frMetaTitle,
      metaDescription: frMetaDescription,
      keywords: frKeywords,
      parentPath: frParentPath,
      parentName: frParentName,
      specifications: frSpecs,
      steps: frSteps,
      benefits: frBenefits,
      faqs: frFaqs,
      relatedSolutions: frRelated,
      esEquivalentSlug: s.slug,
      enEquivalentSlug: s.enEquivalentSlug,
    };

    process.stdout.write('.');
  }
  console.log(
    `\n✓ 43 soluciones técnicas traducidas. Caracteres consumidos en GCP: ${totalCharsSent}`,
  );

  // 3. TRADUCIR EL GLOSARIO TÉCNICO (6 TÉRMINOS)
  console.log('\n--- 3. Traduciendo Glosario Técnico a Francés ---');
  const glossaryFr: Record<string, any> = {};
  const glossarySlugs = Object.keys(GLOSSARY_TERMS_ES).slice(0, 6);

  for (const slug of glossarySlugs) {
    const term = GLOSSARY_TERMS_ES[slug];
    const textsToTranslate = [
      term.term,
      term.categoryLabel,
      term.badge,
      term.metaTitle,
      term.metaDescription,
      ...term.keywords,
      term.blufDefinition,
      term.fullExplanation,
      ...term.specifications.flatMap((s) => [s.label, s.value]),
      term.practicalApplication.title,
      term.practicalApplication.description,
      ...term.practicalApplication.useCases,
      ...(term.commonPitfalls || []),
      ...term.faqs.flatMap((f) => [f.q, f.a]),
    ];

    const translated = await translateBatch(textsToTranslate, 'fr');
    let ptr = 0;

    const termFr = translated[ptr++];
    const categoryLabel = translated[ptr++];
    const badge = translated[ptr++];
    const metaTitle = translated[ptr++];
    const metaDescription = translated[ptr++];

    const keywords = [];
    for (let k = 0; k < term.keywords.length; k++) keywords.push(translated[ptr++]);

    const blufDefinition = translated[ptr++];
    const fullExplanation = translated[ptr++];

    const specifications = term.specifications.map(() => ({
      label: translated[ptr++],
      value: translated[ptr++],
    }));

    const practicalApplication = {
      title: translated[ptr++],
      description: translated[ptr++],
      useCases: term.practicalApplication.useCases.map(() => translated[ptr++]),
    };

    const commonPitfalls = (term.commonPitfalls || []).map(() => translated[ptr++]);

    const faqs = term.faqs.map(() => ({
      q: translated[ptr++],
      a: translated[ptr++],
    }));

    glossaryFr[slug] = {
      slug: term.slug,
      slugEn: term.slugEn,
      term: termFr,
      termEn: term.termEn,
      category: term.category,
      categoryLabel,
      badge,
      metaTitle,
      metaDescription,
      keywords,
      blufDefinition,
      standardReference: term.standardReference,
      fullExplanation,
      specifications,
      practicalApplication,
      commonPitfalls,
      faqs,
      relatedTool: {
        name: term.relatedTool?.name || 'Outil PDF',
        slug: term.relatedTool?.slug || '',
        path: '/fr',
        desc: 'Outil 100% prive et securise sans televersement.',
      },
      relatedTerms: term.relatedTerms,
    };
    process.stdout.write('.');
  }
  console.log(`\n✓ 6 términos de Glosario traducidos.`);

  // Guardar archivos
  const frSolutionsFile = path.join(__dirname, '..', 'lib', 'long-tail-fr.ts');
  const frGlossaryFile = path.join(__dirname, '..', 'lib', 'glossary', 'data-fr.ts');
  const frMetadataFile = path.join(__dirname, '..', 'lib', 'french-tool-metadata.json');

  const fileHeader = `// Generated automatically via Google Cloud Translation API (Project: pdfblack-proy)\n// Characters processed on GCP: ${totalCharsSent}\nimport { LongTailSolution } from './long-tail-registry';\n\n`;

  fs.writeFileSync(
    frSolutionsFile,
    fileHeader +
      `export const LONG_TAIL_SOLUTIONS_FR: Record<string, LongTailSolution> = ` +
      JSON.stringify(frenchSolutions, null, 2) +
      `;\n`,
  );

  fs.writeFileSync(
    frGlossaryFile,
    `import { GlossaryTerm } from './types';\n\nexport const GLOSSARY_TERMS_FR: Record<string, GlossaryTerm> = ` +
      JSON.stringify(glossaryFr, null, 2) +
      `;\n`,
  );

  fs.writeFileSync(frMetadataFile, JSON.stringify(frenchToolMetadata, null, 2));

  // Generar pares de rutas para sitemap
  const routesFr = Object.keys(frenchSolutions).map((slug) => `/fr/solutions/${slug}`);
  const pairsEsToFr: Record<string, string> = {};
  for (const [slugFr, sol] of Object.entries(frenchSolutions)) {
    if (sol.esEquivalentSlug) {
      pairsEsToFr[`/soluciones/${sol.esEquivalentSlug}`] = `/fr/solutions/${slugFr}`;
    }
  }

  const routesJsonPath = path.join(__dirname, '..', 'lib', 'long-tail', 'fr-solutions-routes.json');
  fs.writeFileSync(
    routesJsonPath,
    JSON.stringify({ routes: routesFr, pairs: pairsEsToFr }, null, 2),
  );

  console.log(`\n🎉 Finalizado con éxito!`);
  console.log(`📊 Métricas de consumo de Google Cloud:`);
  console.log(`   - Llamadas a la API: ${totalApiCalls}`);
  console.log(`   - Caracteres enviados a GCP: ${totalCharsSent}`);
  console.log(`   - Archivos guardados en:`);
  console.log(`     - lib/long-tail-fr.ts`);
  console.log(`     - lib/glossary/data-fr.ts`);
  console.log(`     - lib/french-tool-metadata.json`);
  console.log(`     - lib/long-tail/fr-solutions-routes.json`);
}

run().catch((err) => {
  console.error('\n❌ Error ejecutando script:', err);
  process.exit(1);
});
