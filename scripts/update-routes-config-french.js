const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'lib', 'routes-config.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update ToolRouteConfig interface
content = content.replace(
  `  categoryPt: 'organizar' | 'otimizar' | 'editar' | 'converter';`,
  `  categoryPt: 'organizar' | 'otimizar' | 'editar' | 'converter';\n  categoryFr?: 'organiser' | 'optimiser' | 'editer' | 'convertir';`,
);

content = content.replace(`  slugPt: string;`, `  slugPt: string;\n  slugFr?: string;`);

content = content.replace(`  pathPt: string;`, `  pathPt: string;\n  pathFr?: string;`);

// 2. Mappings for each tool id
const FR_TOOLS = {
  unir: { slugFr: 'fusionner-pdf', pathFr: '/fr/fusionner-pdf', categoryFr: 'organiser' },
  dividir: { slugFr: 'diviser-pdf', pathFr: '/fr/diviser-pdf', categoryFr: 'organiser' },
  eliminar: {
    slugFr: 'supprimer-pages-pdf',
    pathFr: '/fr/supprimer-pages-pdf',
    categoryFr: 'organiser',
  },
  reordenar: {
    slugFr: 'organiser-pages-pdf',
    pathFr: '/fr/organiser-pages-pdf',
    categoryFr: 'organiser',
  },
  rotar: { slugFr: 'pivoter-pdf', pathFr: '/fr/pivoter-pdf', categoryFr: 'organiser' },
  recortar: { slugFr: 'recadrer-pdf', pathFr: '/fr/recadrer-pdf', categoryFr: 'organiser' },
  comprimir: { slugFr: 'compresser-pdf', pathFr: '/fr/compresser-pdf', categoryFr: 'optimiser' },
  reparar: { slugFr: 'reparer-pdf', pathFr: '/fr/reparer-pdf', categoryFr: 'optimiser' },
  proteger: { slugFr: 'proteger-pdf', pathFr: '/fr/proteger-pdf', categoryFr: 'optimiser' },
  desbloquear: {
    slugFr: 'deverrouiller-pdf',
    pathFr: '/fr/deverrouiller-pdf',
    categoryFr: 'optimiser',
  },
  censurar: { slugFr: 'caviarder-pdf', pathFr: '/fr/caviarder-pdf', categoryFr: 'optimiser' },
  comparar: { slugFr: 'comparer-pdf', pathFr: '/fr/comparer-pdf', categoryFr: 'optimiser' },
  texto: { slugFr: 'editer-pdf', pathFr: '/fr/editer-pdf', categoryFr: 'editer' },
  foliar: {
    slugFr: 'numeroter-pages-pdf',
    pathFr: '/fr/numeroter-pages-pdf',
    categoryFr: 'editer',
  },
  'marca-agua': {
    slugFr: 'ajouter-filigrane-pdf',
    pathFr: '/fr/ajouter-filigrane-pdf',
    categoryFr: 'editer',
  },
  'quitar-marca-agua': {
    slugFr: 'supprimer-filigrane-pdf',
    pathFr: '/fr/supprimer-filigrane-pdf',
    categoryFr: 'editer',
  },
  firmar: { slugFr: 'signer-pdf', pathFr: '/fr/signer-pdf', categoryFr: 'editer' },
  ocr: { slugFr: 'ocr-pdf', pathFr: '/fr/ocr-pdf', categoryFr: 'editer' },
  'pdf-word': {
    slugFr: 'convertir-pdf-en-word',
    pathFr: '/fr/convertir-pdf-en-word',
    categoryFr: 'convertir',
  },
  'word-pdf': {
    slugFr: 'convertir-word-en-pdf',
    pathFr: '/fr/convertir-word-en-pdf',
    categoryFr: 'convertir',
  },
  'pdf-excel': {
    slugFr: 'convertir-pdf-en-excel',
    pathFr: '/fr/convertir-pdf-en-excel',
    categoryFr: 'convertir',
  },
  'excel-pdf': {
    slugFr: 'convertir-excel-en-pdf',
    pathFr: '/fr/convertir-excel-en-pdf',
    categoryFr: 'convertir',
  },
  'pdf-powerpoint': {
    slugFr: 'convertir-pdf-en-powerpoint',
    pathFr: '/fr/convertir-pdf-en-powerpoint',
    categoryFr: 'convertir',
  },
  'powerpoint-pdf': {
    slugFr: 'convertir-powerpoint-en-pdf',
    pathFr: '/fr/convertir-powerpoint-en-pdf',
    categoryFr: 'convertir',
  },
  'pdf-jpg': {
    slugFr: 'convertir-pdf-en-jpg',
    pathFr: '/fr/convertir-pdf-en-jpg',
    categoryFr: 'convertir',
  },
  'jpg-pdf': {
    slugFr: 'convertir-jpg-en-pdf',
    pathFr: '/fr/convertir-jpg-en-pdf',
    categoryFr: 'convertir',
  },
  'pdf-html': {
    slugFr: 'convertir-pdf-en-html',
    pathFr: '/fr/convertir-pdf-en-html',
    categoryFr: 'convertir',
  },
  'html-pdf': {
    slugFr: 'convertir-html-en-pdf',
    pathFr: '/fr/convertir-html-en-pdf',
    categoryFr: 'convertir',
  },
  'pdf-texto': {
    slugFr: 'extraire-texte-pdf',
    pathFr: '/fr/extraire-texte-pdf',
    categoryFr: 'convertir',
  },
  'texto-pdf': {
    slugFr: 'convertir-txt-en-pdf',
    pathFr: '/fr/convertir-txt-en-pdf',
    categoryFr: 'convertir',
  },
  'pdf-blanco-negro': {
    slugFr: 'convertir-pdf-en-noir-et-blanc',
    pathFr: '/fr/convertir-pdf-en-noir-et-blanc',
    categoryFr: 'convertir',
  },
};

for (const [id, frInfo] of Object.entries(FR_TOOLS)) {
  const targetSnippet = `id: '${id}',`;
  const idx = content.indexOf(targetSnippet);
  if (idx !== -1) {
    // Find clientType after this id
    const clientTypeIdx = content.indexOf('clientType:', idx);
    if (clientTypeIdx !== -1) {
      const insertion = `categoryFr: '${frInfo.categoryFr}',\n    slugFr: '${frInfo.slugFr}',\n    pathFr: '${frInfo.pathFr}',\n    `;
      content = content.slice(0, clientTypeIdx) + insertion + content.slice(clientTypeIdx);
    }
  }
}

// 3. Add STATIC_ROUTES_FR_MAP and French helper maps
const frStaticMapSnippet = `
export const STATIC_ROUTES_FR_MAP: Record<string, string> = {
  '/': '/fr',
  '/es': '/fr',
  '/organizar': '/fr',
  '/optimizar': '/fr',
  '/editar': '/fr',
  '/convertir': '/fr',
  '/faq': '/fr/faq',
  '/privacidad': '/fr/confidentialite',
  '/terminos': '/fr/conditions',
  '/contacto': '/fr/contact',
  '/aviso-legal': '/fr/mentions-legales',
  '/dpa': '/fr/dpa',
};

const ES_TO_FR_MAP = new Map<string, string>();
const FR_TO_ES_MAP = new Map<string, string>();
const FR_SLUG_TO_TOOL = new Map<string, ToolRouteConfig>();
`;

content = content.replace(
  '// Mapeos rápidos para búsquedas O(1)',
  frStaticMapSnippet + '\n// Mapeos rápidos para búsquedas O(1)',
);

// 4. Fill French maps
const loopSnippet = `
for (const [es, fr] of Object.entries(STATIC_ROUTES_FR_MAP)) {
  ES_TO_FR_MAP.set(es, fr);
  FR_TO_ES_MAP.set(fr, es);
}
`;
content = content.replace(
  'for (const [es, pt] of Object.entries(STATIC_ROUTES_PT_MAP)) {',
  loopSnippet + '\nfor (const [es, pt] of Object.entries(STATIC_ROUTES_PT_MAP)) {',
);

const toolLoopSnippet = `
  if (tool.pathFr && tool.slugFr) {
    ES_TO_FR_MAP.set(tool.pathEs, tool.pathFr);
    FR_TO_ES_MAP.set(tool.pathFr, tool.pathEs);
    FR_SLUG_TO_TOOL.set(tool.slugFr, tool);
  }
`;
content = content.replace(
  'PT_SLUG_TO_TOOL.set(tool.slugPt, tool);',
  'PT_SLUG_TO_TOOL.set(tool.slugPt, tool);\n' + toolLoopSnippet,
);

content = content.replace(
  'export const ALL_PORTUGUESE_TOOL_SLUGS = TOOLS_ROUTES.map((t) => t.slugPt);',
  `export const ALL_PORTUGUESE_TOOL_SLUGS = TOOLS_ROUTES.map((t) => t.slugPt);\nexport const ALL_FRENCH_TOOL_SLUGS = TOOLS_ROUTES.map((t) => t.slugFr!).filter(Boolean);`,
);

// 5. Add French helper functions
const frHelpers = `
/**
 * Obtiene la URL equivalente en francés para una ruta en español.
 */
export function getFrenchUrlForSpanish(esPath: string): string {
  const normalized = esPath.replace(/\\/$/, '') || '/';
  if (normalized === '/' || normalized === '/es') {
    return '/fr';
  }
  return ES_TO_FR_MAP.get(normalized) || (normalized === '/' ? '/fr' : \`/fr\${normalized}\`);
}

/**
 * Obtiene la URL equivalente en español para una ruta en francés.
 */
export function getSpanishUrlForFrench(frPath: string): string {
  const normalized = frPath.replace(/\\/$/, '') || '/';
  if (normalized === '/fr') {
    return '/es';
  }
  if (FR_TO_ES_MAP.has(normalized)) {
    return FR_TO_ES_MAP.get(normalized)!;
  }
  return normalized.replace(/^\\/fr/, '') || '/es';
}

/**
 * Obtiene la configuración de una herramienta por su slug en francés.
 */
export function getToolBySlugFr(slugFr: string): ToolRouteConfig | undefined {
  return FR_SLUG_TO_TOOL.get(slugFr);
}
`;

content = content.replace(
  '/**\n * Obtiene la URL equivalente en inglés para una ruta en español.',
  frHelpers + '\n/**\n * Obtiene la URL equivalente en inglés para una ruta en español.',
);

// 6. Update getLanguageSwitchUrl
content = content.replace(
  `export function getLanguageSwitchUrl(currentPath: string, targetLang: 'es' | 'en' | 'pt'): string {`,
  `export function getLanguageSwitchUrl(currentPath: string, targetLang: 'es' | 'en' | 'pt' | 'fr'): string {`,
);

content = content.replace(
  `} else if (normalized.startsWith('/pt')) {
    esPath = getSpanishUrlForPortuguese(normalized);
  }`,
  `} else if (normalized.startsWith('/pt')) {
    esPath = getSpanishUrlForPortuguese(normalized);
  } else if (normalized.startsWith('/fr')) {
    esPath = getSpanishUrlForFrench(normalized);
  }`,
);

content = content.replace(
  `  if (targetLang === 'pt') {
    return getPortugueseUrlForSpanish(esPath);
  }`,
  `  if (targetLang === 'pt') {
    return getPortugueseUrlForSpanish(esPath);
  }
  if (targetLang === 'fr') {
    return getFrenchUrlForSpanish(esPath);
  }`,
);

fs.writeFileSync(targetFile, content);
console.log('Successfully updated routes-config.ts with French routing!');
