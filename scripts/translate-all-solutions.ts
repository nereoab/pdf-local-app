import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import { LONG_TAIL_SOLUTIONS, LongTailSolution } from '../lib/long-tail-registry';
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

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const SLUG_PT_MAP: Record<string, string> = {
  'comprimir-pdf-a-200kb': 'comprimir-pdf-para-200kb',
  'comprimir-pdf-a-1mb': 'comprimir-pdf-para-1mb',
  'comprimir-pdf-a-100kb': 'comprimir-pdf-para-100kb',
  'quitar-marca-agua-camscanner': 'remover-marca-dagua-camscanner',
  'foliar-expediente-judicial': 'numerar-processo-judicial-pdf',
  'foliar-pdf-de-atras-hacia-adelante': 'numerar-pdf-de-tras-para-frente',
  'censurar-datos-personales-pdf': 'ocultar-dados-pessoais-pdf',
  'reparar-pdf-danado': 'reparar-pdf-corrompido',
  'editar-texto-pdf-sin-desconfigurar': 'editar-texto-pdf-sem-desconfigurar',
  'firmar-pdf-sin-imprimir': 'assinar-pdf-sem-imprimir',
  'convertir-pdf-a-word-editable': 'converter-pdf-para-word-editavel',
  'convertir-tabla-pdf-a-excel': 'converter-tabela-pdf-para-excel',
  // Organizar
  'unir-pdf-para-licitaciones-y-tramites': 'juntar-pdf-para-licitacoes-e-processos',
  'unir-capitulos-tesis-pdf': 'juntar-capitulos-tcc-tese-pdf',
  'extraer-paginas-pdf-separadas': 'extrair-paginas-pdf-separadas',
  'dividir-pdf-por-capitulos-rangos': 'dividir-pdf-por-capitulos-e-intervalos',
  'quitar-hojas-en-blanco-pdf': 'remover-paginas-em-branco-pdf',
  'invertir-orden-paginas-pdf': 'inverter-ordem-das-paginas-pdf',
  'rotar-planos-horizontales-pdf': 'girar-plantas-horizontais-pdf',
  'recortar-margenes-blancos-pdf': 'recortar-margens-brancas-pdf',
  'recortar-todas-las-paginas-pdf': 'recortar-todas-as-paginas-pdf',
  'recortar-pdf-para-kindle-y-tablet': 'recortar-pdf-para-kindle-e-tablet',
  // Optimizar
  'comprimir-pdf-para-correo-gmail': 'comprimir-pdf-para-email-gmail',
  'proteger-pdf-con-contrasena-sin-subir-a-nube': 'proteger-pdf-com-senha-sem-enviar-para-nuvem',
  'desbloquear-pdf-para-imprimir-o-copiar': 'desbloquear-pdf-para-imprimir-ou-copiar',
  'comparar-dos-versiones-contrato-pdf': 'comparar-duas-versoes-de-contrato-pdf',
  // Editar
  'convertir-pdf-escaneado-a-texto-seleccionable': 'converter-pdf-escaneado-para-texto-pesquisavel',
  'poner-marca-agua-borrador-confidencial': 'inserir-marca-dagua-rascunho-confidencial-pdf',
  // Convertir
  'convertir-docx-a-pdf-sin-mover-fuentes': 'converter-docx-para-pdf-sem-alterar-fontes',
  'ajustar-hoja-excel-a-una-pagina-pdf': 'ajustar-planilha-excel-para-uma-pagina-pdf',
  'unir-fotos-e-imagenes-en-un-solo-pdf': 'juntar-fotos-e-imagens-em-um-unico-pdf',
  'extraer-imagenes-pdf-alta-resolucion': 'extrair-imagens-pdf-em-alta-resolucao',
  'convertir-pdf-a-diapositivas-powerpoint': 'converter-pdf-para-slides-powerpoint',
  'guardar-presentacion-powerpoint-a-pdf': 'salvar-apresentacao-powerpoint-como-pdf',
  'extraer-texto-plano-de-pdf-sin-formato': 'extrair-texto-puro-de-pdf-sem-formatacao',
  'convertir-notas-txt-a-pdf-formateado': 'converter-notas-txt-para-pdf-formatado',
  'convertir-pdf-a-codigo-html-responsive': 'converter-pdf-para-codigo-html-responsivo',
  'guardar-pagina-web-o-codigo-html-en-pdf': 'salvar-pagina-web-ou-html-como-pdf',
  'unir-pdf-pesados-sin-limite': 'juntar-pdf-pesado-sem-limite-de-tamanho',
};

async function main() {
  console.log('🚀 Iniciando Traducción Masiva con Google Cloud Translation API...');
  console.log('Proyecto de facturación GCP: pdfblack-proy (878586961850)');

  const solutionsEs = Object.values(LONG_TAIL_SOLUTIONS);
  console.log(`Total de soluciones técnicas en español a procesar: ${solutionsEs.length}`);

  const resultsPt: Record<string, LongTailSolution> = {};
  const pairsEsToPt: Record<string, string> = {};
  const pairsPtToEs: Record<string, string> = {};

  for (let i = 0; i < solutionsEs.length; i++) {
    const s = solutionsEs[i];
    const ptSlug = SLUG_PT_MAP[s.slug] || s.slug;
    console.log(`\n[${i + 1}/${solutionsEs.length}] Procesando: ${s.slug} -> ${ptSlug}`);

    // Preparar lista lineal de textos para traducir en un solo batch
    const textsToTranslate: string[] = [];

    // [0] badge, [1] h1, [2] subtitle, [3] metaTitle, [4] metaDescription, [5] parentName
    textsToTranslate.push(s.badge);
    textsToTranslate.push(s.h1);
    textsToTranslate.push(s.subtitle);
    textsToTranslate.push(s.metaTitle);
    textsToTranslate.push(s.metaDescription);
    textsToTranslate.push(s.parentName);

    // Keywords
    const numKeywords = s.keywords.length;
    for (const kw of s.keywords) {
      textsToTranslate.push(kw);
    }

    // Specifications: feature, value, note
    const numSpecs = s.specifications.length;
    for (const spec of s.specifications) {
      textsToTranslate.push(spec.feature);
      textsToTranslate.push(spec.value);
      textsToTranslate.push(spec.note);
    }

    // Steps: title, desc
    const numSteps = s.steps.length;
    for (const step of s.steps) {
      textsToTranslate.push(step.title);
      textsToTranslate.push(step.desc);
    }

    // Benefits: title, desc
    const numBenefits = s.benefits.length;
    for (const b of s.benefits) {
      textsToTranslate.push(b.title);
      textsToTranslate.push(b.desc);
    }

    // FAQs: q, a
    const numFaqs = s.faqs.length;
    for (const faq of s.faqs) {
      textsToTranslate.push(faq.q);
      textsToTranslate.push(faq.a);
    }

    // Ejecutar traducción en Google Cloud Translation API
    const translated = await translateBatch(textsToTranslate, 'pt');

    // Reconstruir objeto traducido
    let ptr = 0;
    const ptBadge = translated[ptr++];
    const ptH1 = translated[ptr++];
    const ptSubtitle = translated[ptr++];
    const ptMetaTitle = translated[ptr++];
    const ptMetaDescription = translated[ptr++];
    const ptParentName = translated[ptr++];

    const ptKeywords: string[] = [];
    for (let k = 0; k < numKeywords; k++) {
      ptKeywords.push(translated[ptr++]);
    }

    const ptSpecs = [];
    for (let sp = 0; sp < numSpecs; sp++) {
      ptSpecs.push({
        feature: translated[ptr++],
        value: translated[ptr++],
        note: translated[ptr++],
      });
    }

    const ptSteps = [];
    for (let st = 0; st < numSteps; st++) {
      ptSteps.push({
        step: st + 1,
        title: translated[ptr++],
        desc: translated[ptr++],
      });
    }

    const ptBenefits = [];
    for (let bn = 0; bn < numBenefits; bn++) {
      ptBenefits.push({
        title: translated[ptr++],
        desc: translated[ptr++],
      });
    }

    const ptFaqs = [];
    for (let fq = 0; fq < numFaqs; fq++) {
      ptFaqs.push({
        q: translated[ptr++],
        a: translated[ptr++],
      });
    }

    const ptRelated = s.relatedSolutions.map((rel) => SLUG_PT_MAP[rel] || rel);
    const ptParentPath = getPortugueseUrlForSpanish(s.parentPath);

    resultsPt[ptSlug] = {
      slug: ptSlug,
      category: s.category,
      toolKey: s.toolKey,
      badge: ptBadge,
      h1: ptH1,
      subtitle: ptSubtitle,
      metaTitle: ptMetaTitle,
      metaDescription: ptMetaDescription,
      keywords: ptKeywords,
      parentPath: ptParentPath,
      parentName: ptParentName,
      specifications: ptSpecs,
      steps: ptSteps,
      benefits: ptBenefits,
      faqs: ptFaqs,
      relatedSolutions: ptRelated,
      esEquivalentSlug: s.slug,
      enEquivalentSlug: s.enEquivalentSlug,
    };

    pairsEsToPt[s.slug] = ptSlug;
    pairsPtToEs[ptSlug] = s.slug;

    console.log(`✓ Traducido con éxito. Caracteres acumulados: ${totalCharsSent}`);

    // Pausa preventiva de 100ms para evitar rate-limits
    await new Promise((r) => setTimeout(r, 100));
  }

  // Guardar archivo lib/long-tail-pt.ts
  const outputFilePath = path.join(__dirname, '..', 'lib', 'long-tail-pt.ts');
  const fileContent = `/**
 * Soluciones Long-tail en Portugués generadas con Google Cloud Translation API (GCP).
 * Proyecto: pdfblack-proy
 */
import { LongTailSolution } from './long-tail-registry';

export const LONG_TAIL_SOLUTIONS_PT: Record<string, LongTailSolution> = ${JSON.stringify(
    resultsPt,
    null,
    2,
  )};

export const SOLUTION_PAIRS_ES_TO_PT: Record<string, string> = ${JSON.stringify(
    pairsEsToPt,
    null,
    2,
  )};

export const SOLUTION_PAIRS_PT_TO_ES: Record<string, string> = ${JSON.stringify(
    pairsPtToEs,
    null,
    2,
  )};
`;

  fs.writeFileSync(outputFilePath, fileContent, 'utf8');
  console.log(`\n🎉 Archivo guardado con éxito en: ${outputFilePath}`);
  console.log(`📊 ESTADÍSTICAS FINALES DE CONSUMO GOOGLE CLOUD:`);
  console.log(`   - Peticiones API a translate.googleapis.com: ${totalApiCalls}`);
  console.log(
    `   - Caracteres traducidos y facturados a GCP: ${totalCharsSent.toLocaleString()} caracteres`,
  );
  console.log(`   - Soluciones generadas: ${Object.keys(resultsPt).length} páginas técnicas.`);
}

main().catch((err) => {
  console.error('Error fatal durante la traducción:', err);
  process.exit(1);
});
