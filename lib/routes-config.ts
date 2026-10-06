/**
 * Configuración centralizada de rutas y equivalencias multilingües (Español ↔ Inglés ↔ Portugués)
 * para todas las herramientas de PDFBlack.
 */

export interface ToolRouteConfig {
  id: string;
  category: 'organizar' | 'optimizar' | 'editar' | 'convertir';
  categoryEn: 'organize' | 'optimize' | 'edit' | 'convert';
  categoryPt: 'organizar' | 'otimizar' | 'editar' | 'converter';
  slugEs: string;
  slugEn: string;
  slugPt: string;
  pathEs: string;
  pathEn: string;
  pathPt: string;
  clientType: 'organizar' | 'optimizar' | 'editar' | 'convertir';
  toolKey: string;
}

export const TOOLS_ROUTES: ToolRouteConfig[] = [
  // ── ORGANIZAR ──────────────────────────────────────────────
  {
    id: 'unir',
    category: 'organizar',
    categoryEn: 'organize',
    categoryPt: 'organizar',
    slugEs: 'unir',
    slugEn: 'merge-pdf',
    slugPt: 'juntar-pdf',
    pathEs: '/organizar/unir',
    pathEn: '/en/merge-pdf',
    pathPt: '/pt/juntar-pdf',
    clientType: 'organizar',
    toolKey: 'unir',
  },
  {
    id: 'dividir',
    category: 'organizar',
    categoryEn: 'organize',
    categoryPt: 'organizar',
    slugEs: 'dividir',
    slugEn: 'split-pdf',
    slugPt: 'dividir-pdf',
    pathEs: '/organizar/dividir',
    pathEn: '/en/split-pdf',
    pathPt: '/pt/dividir-pdf',
    clientType: 'organizar',
    toolKey: 'dividir',
  },
  {
    id: 'eliminar',
    category: 'organizar',
    categoryEn: 'organize',
    categoryPt: 'organizar',
    slugEs: 'eliminar',
    slugEn: 'delete-pdf-pages',
    slugPt: 'excluir-paginas-pdf',
    pathEs: '/organizar/eliminar',
    pathEn: '/en/delete-pdf-pages',
    pathPt: '/pt/excluir-paginas-pdf',
    clientType: 'organizar',
    toolKey: 'eliminar',
  },
  {
    id: 'reordenar',
    category: 'organizar',
    categoryEn: 'organize',
    categoryPt: 'organizar',
    slugEs: 'reordenar',
    slugEn: 'reorder-pdf-pages',
    slugPt: 'organizar-paginas-pdf',
    pathEs: '/organizar/reordenar',
    pathEn: '/en/reorder-pdf-pages',
    pathPt: '/pt/organizar-paginas-pdf',
    clientType: 'organizar',
    toolKey: 'reordenar',
  },
  {
    id: 'rotar',
    category: 'organizar',
    categoryEn: 'organize',
    categoryPt: 'organizar',
    slugEs: 'rotar',
    slugEn: 'rotate-pdf',
    slugPt: 'girar-pdf',
    pathEs: '/organizar/rotar',
    pathEn: '/en/rotate-pdf',
    pathPt: '/pt/girar-pdf',
    clientType: 'organizar',
    toolKey: 'rotar',
  },
  {
    id: 'recortar',
    category: 'organizar',
    categoryEn: 'organize',
    categoryPt: 'organizar',
    slugEs: 'recortar',
    slugEn: 'crop-pdf',
    slugPt: 'recortar-pdf',
    pathEs: '/organizar/recortar',
    pathEn: '/en/crop-pdf',
    pathPt: '/pt/recortar-pdf',
    clientType: 'organizar',
    toolKey: 'recortar',
  },

  // ── OPTIMIZAR ──────────────────────────────────────────────
  {
    id: 'comprimir',
    category: 'optimizar',
    categoryEn: 'optimize',
    categoryPt: 'otimizar',
    slugEs: 'comprimir',
    slugEn: 'compress-pdf',
    slugPt: 'comprimir-pdf',
    pathEs: '/optimizar/comprimir',
    pathEn: '/en/compress-pdf',
    pathPt: '/pt/comprimir-pdf',
    clientType: 'optimizar',
    toolKey: 'comprimir',
  },
  {
    id: 'reparar',
    category: 'optimizar',
    categoryEn: 'optimize',
    categoryPt: 'otimizar',
    slugEs: 'reparar',
    slugEn: 'repair-pdf',
    slugPt: 'reparar-pdf',
    pathEs: '/optimizar/reparar',
    pathEn: '/en/repair-pdf',
    pathPt: '/pt/reparar-pdf',
    clientType: 'optimizar',
    toolKey: 'reparar',
  },
  {
    id: 'proteger',
    category: 'optimizar',
    categoryEn: 'optimize',
    categoryPt: 'otimizar',
    slugEs: 'proteger',
    slugEn: 'protect-pdf',
    slugPt: 'proteger-pdf',
    pathEs: '/optimizar/proteger',
    pathEn: '/en/protect-pdf',
    pathPt: '/pt/proteger-pdf',
    clientType: 'optimizar',
    toolKey: 'proteger',
  },
  {
    id: 'desbloquear',
    category: 'optimizar',
    categoryEn: 'optimize',
    categoryPt: 'otimizar',
    slugEs: 'desbloquear',
    slugEn: 'unlock-pdf',
    slugPt: 'desbloquear-pdf',
    pathEs: '/optimizar/desbloquear',
    pathEn: '/en/unlock-pdf',
    pathPt: '/pt/desbloquear-pdf',
    clientType: 'optimizar',
    toolKey: 'desbloquear',
  },
  {
    id: 'censurar',
    category: 'optimizar',
    categoryEn: 'optimize',
    categoryPt: 'otimizar',
    slugEs: 'censurar',
    slugEn: 'redact-pdf',
    slugPt: 'ocultar-texto-pdf',
    pathEs: '/optimizar/censurar',
    pathEn: '/en/redact-pdf',
    pathPt: '/pt/ocultar-texto-pdf',
    clientType: 'optimizar',
    toolKey: 'censurar',
  },
  {
    id: 'comparar',
    category: 'optimizar',
    categoryEn: 'optimize',
    categoryPt: 'otimizar',
    slugEs: 'comparar',
    slugEn: 'compare-pdf',
    slugPt: 'comparar-pdf',
    pathEs: '/optimizar/comparar',
    pathEn: '/en/compare-pdf',
    pathPt: '/pt/comparar-pdf',
    clientType: 'optimizar',
    toolKey: 'comparar',
  },

  // ── EDITAR ─────────────────────────────────────────────────
  {
    id: 'texto',
    category: 'editar',
    categoryEn: 'edit',
    categoryPt: 'editar',
    slugEs: 'texto',
    slugEn: 'edit-pdf',
    slugPt: 'editar-pdf',
    pathEs: '/editar/texto',
    pathEn: '/en/edit-pdf',
    pathPt: '/pt/editar-pdf',
    clientType: 'editar',
    toolKey: 'texto',
  },
  {
    id: 'foliar',
    category: 'editar',
    categoryEn: 'edit',
    categoryPt: 'editar',
    slugEs: 'foliar',
    slugEn: 'bates-numbering',
    slugPt: 'numerar-paginas-pdf',
    pathEs: '/editar/foliar',
    pathEn: '/en/bates-numbering',
    pathPt: '/pt/numerar-paginas-pdf',
    clientType: 'editar',
    toolKey: 'foliar',
  },
  {
    id: 'marca-agua',
    category: 'editar',
    categoryEn: 'edit',
    categoryPt: 'editar',
    slugEs: 'marca-agua',
    slugEn: 'watermark-pdf',
    slugPt: 'marca-dagua-pdf',
    pathEs: '/editar/marca-agua',
    pathEn: '/en/watermark-pdf',
    pathPt: '/pt/marca-dagua-pdf',
    clientType: 'editar',
    toolKey: 'marca-agua',
  },
  {
    id: 'quitar-marca-agua',
    category: 'editar',
    categoryEn: 'edit',
    categoryPt: 'editar',
    slugEs: 'quitar-marca-agua',
    slugEn: 'remove-watermark',
    slugPt: 'remover-marca-dagua-pdf',
    pathEs: '/editar/quitar-marca-agua',
    pathEn: '/en/remove-watermark',
    pathPt: '/pt/remover-marca-dagua-pdf',
    clientType: 'editar',
    toolKey: 'quitar-marca-agua',
  },
  {
    id: 'firmar',
    category: 'editar',
    categoryEn: 'edit',
    categoryPt: 'editar',
    slugEs: 'firmar',
    slugEn: 'sign-pdf',
    slugPt: 'assinar-pdf',
    pathEs: '/editar/firmar',
    pathEn: '/en/sign-pdf',
    pathPt: '/pt/assinar-pdf',
    clientType: 'editar',
    toolKey: 'firmar',
  },
  {
    id: 'ocr',
    category: 'editar',
    categoryEn: 'edit',
    categoryPt: 'editar',
    slugEs: 'ocr',
    slugEn: 'ocr-pdf',
    slugPt: 'ocr-pdf',
    pathEs: '/editar/ocr',
    pathEn: '/en/ocr-pdf',
    pathPt: '/pt/ocr-pdf',
    clientType: 'editar',
    toolKey: 'ocr',
  },

  // ── CONVERTIR ──────────────────────────────────────────────
  {
    id: 'pdf-word',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'pdf-word',
    slugEn: 'pdf-to-word',
    slugPt: 'pdf-para-word',
    pathEs: '/convertir/pdf-word',
    pathEn: '/en/pdf-to-word',
    pathPt: '/pt/pdf-para-word',
    clientType: 'convertir',
    toolKey: 'pdf-word',
  },
  {
    id: 'word-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'word-pdf',
    slugEn: 'word-to-pdf',
    slugPt: 'word-para-pdf',
    pathEs: '/convertir/word-pdf',
    pathEn: '/en/word-to-pdf',
    pathPt: '/pt/word-para-pdf',
    clientType: 'convertir',
    toolKey: 'word-pdf',
  },
  {
    id: 'pdf-excel',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'pdf-excel',
    slugEn: 'pdf-to-excel',
    slugPt: 'pdf-para-excel',
    pathEs: '/convertir/pdf-excel',
    pathEn: '/en/pdf-to-excel',
    pathPt: '/pt/pdf-para-excel',
    clientType: 'convertir',
    toolKey: 'pdf-excel',
  },
  {
    id: 'excel-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'excel-pdf',
    slugEn: 'excel-to-pdf',
    slugPt: 'excel-para-pdf',
    pathEs: '/convertir/excel-pdf',
    pathEn: '/en/excel-to-pdf',
    pathPt: '/pt/excel-para-pdf',
    clientType: 'convertir',
    toolKey: 'excel-pdf',
  },
  {
    id: 'pdf-powerpoint',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'pdf-powerpoint',
    slugEn: 'pdf-to-powerpoint',
    slugPt: 'pdf-para-powerpoint',
    pathEs: '/convertir/pdf-powerpoint',
    pathEn: '/en/pdf-to-powerpoint',
    pathPt: '/pt/pdf-para-powerpoint',
    clientType: 'convertir',
    toolKey: 'pdf-powerpoint',
  },
  {
    id: 'powerpoint-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'powerpoint-pdf',
    slugEn: 'powerpoint-to-pdf',
    slugPt: 'powerpoint-para-pdf',
    pathEs: '/convertir/powerpoint-pdf',
    pathEn: '/en/powerpoint-to-pdf',
    pathPt: '/pt/powerpoint-para-pdf',
    clientType: 'convertir',
    toolKey: 'powerpoint-pdf',
  },
  {
    id: 'pdf-jpg',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'pdf-jpg',
    slugEn: 'pdf-to-jpg',
    slugPt: 'pdf-para-jpg',
    pathEs: '/convertir/pdf-jpg',
    pathEn: '/en/pdf-to-jpg',
    pathPt: '/pt/pdf-para-jpg',
    clientType: 'convertir',
    toolKey: 'pdf-jpg',
  },
  {
    id: 'jpg-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'jpg-pdf',
    slugEn: 'jpg-to-pdf',
    slugPt: 'jpg-para-pdf',
    pathEs: '/convertir/jpg-pdf',
    pathEn: '/en/jpg-to-pdf',
    pathPt: '/pt/jpg-para-pdf',
    clientType: 'convertir',
    toolKey: 'jpg-pdf',
  },
  {
    id: 'pdf-html',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'pdf-html',
    slugEn: 'pdf-to-html',
    slugPt: 'pdf-para-html',
    pathEs: '/convertir/pdf-html',
    pathEn: '/en/pdf-to-html',
    pathPt: '/pt/pdf-para-html',
    clientType: 'convertir',
    toolKey: 'pdf-html',
  },
  {
    id: 'html-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'html-pdf',
    slugEn: 'html-to-pdf',
    slugPt: 'html-para-pdf',
    pathEs: '/convertir/html-pdf',
    pathEn: '/en/html-to-pdf',
    pathPt: '/pt/html-para-pdf',
    clientType: 'convertir',
    toolKey: 'html-pdf',
  },
  {
    id: 'pdf-texto',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'pdf-texto',
    slugEn: 'pdf-to-txt',
    slugPt: 'pdf-para-txt',
    pathEs: '/convertir/pdf-texto',
    pathEn: '/en/pdf-to-txt',
    pathPt: '/pt/pdf-para-txt',
    clientType: 'convertir',
    toolKey: 'pdf-texto',
  },
  {
    id: 'texto-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'texto-pdf',
    slugEn: 'txt-to-pdf',
    slugPt: 'txt-para-pdf',
    pathEs: '/convertir/texto-pdf',
    pathEn: '/en/txt-to-pdf',
    pathPt: '/pt/txt-para-pdf',
    clientType: 'convertir',
    toolKey: 'texto-pdf',
  },
  {
    id: 'pdf-blanco-negro',
    category: 'convertir',
    categoryEn: 'convert',
    categoryPt: 'converter',
    slugEs: 'pdf-blanco-negro',
    slugEn: 'convert-pdf-to-black-and-white',
    slugPt: 'pdf-preto-e-branco',
    pathEs: '/convertir/pdf-blanco-negro',
    pathEn: '/en/convert-pdf-to-black-and-white',
    pathPt: '/pt/pdf-preto-e-branco',
    clientType: 'convertir',
    toolKey: 'pdf-blanco-negro',
  },
];

// ── HUBS Y PÁGINAS ESTÁTICAS ─────────────────────────────────
export const STATIC_ROUTES_MAP: Record<string, string> = {
  '/': '/en',
  '/es': '/en',
  '/organizar': '/en/organize',
  '/optimizar': '/en/optimize',
  '/editar': '/en/edit',
  '/convertir': '/en/convert',
  '/faq': '/en/faq',
  '/privacidad': '/en/privacy',
  '/terminos': '/en/terms',
  '/contacto': '/en/contact',
  '/aviso-legal': '/en/legal-notice',
  '/dpa': '/en/dpa',
};

export const STATIC_ROUTES_PT_MAP: Record<string, string> = {
  '/': '/pt',
  '/es': '/pt',
  '/organizar': '/pt/organizar',
  '/optimizar': '/pt/otimizar',
  '/editar': '/pt/editar',
  '/convertir': '/pt/converter',
  '/faq': '/pt/faq',
  '/privacidad': '/pt/privacidade',
  '/terminos': '/pt/termos',
  '/contacto': '/pt/contato',
  '/aviso-legal': '/pt/aviso-legal',
  '/dpa': '/pt/dpa',
};

// Mapeos rápidos para búsquedas O(1)
const ES_TO_EN_MAP = new Map<string, string>();
const EN_TO_ES_MAP = new Map<string, string>();
const EN_SLUG_TO_TOOL = new Map<string, ToolRouteConfig>();

const ES_TO_PT_MAP = new Map<string, string>();
const PT_TO_ES_MAP = new Map<string, string>();
const PT_SLUG_TO_TOOL = new Map<string, ToolRouteConfig>();

// Rellenar mapas
for (const [es, en] of Object.entries(STATIC_ROUTES_MAP)) {
  ES_TO_EN_MAP.set(es, en);
  EN_TO_ES_MAP.set(en, es);
}

for (const [es, pt] of Object.entries(STATIC_ROUTES_PT_MAP)) {
  ES_TO_PT_MAP.set(es, pt);
  PT_TO_ES_MAP.set(pt, es);
}

for (const tool of TOOLS_ROUTES) {
  ES_TO_EN_MAP.set(tool.pathEs, tool.pathEn);
  EN_TO_ES_MAP.set(tool.pathEn, tool.pathEs);
  EN_SLUG_TO_TOOL.set(tool.slugEn, tool);

  ES_TO_PT_MAP.set(tool.pathEs, tool.pathPt);
  PT_TO_ES_MAP.set(tool.pathPt, tool.pathEs);
  PT_SLUG_TO_TOOL.set(tool.slugPt, tool);
}

export const ALL_ENGLISH_TOOL_SLUGS = TOOLS_ROUTES.map((t) => t.slugEn);
export const ALL_PORTUGUESE_TOOL_SLUGS = TOOLS_ROUTES.map((t) => t.slugPt);

/**
 * Obtiene la URL equivalente en inglés para una ruta en español.
 */
export function getEnglishUrlForSpanish(esPath: string): string {
  const normalized = esPath.replace(/\/$/, '') || '/';
  if (normalized === '/' || normalized === '/es') {
    return '/en';
  }
  return ES_TO_EN_MAP.get(normalized) || (normalized === '/' ? '/en' : `/en${normalized}`);
}

/**
 * Obtiene la URL equivalente en portugués para una ruta en español.
 */
export function getPortugueseUrlForSpanish(esPath: string): string {
  const normalized = esPath.replace(/\/$/, '') || '/';
  if (normalized === '/' || normalized === '/es') {
    return '/pt';
  }
  return ES_TO_PT_MAP.get(normalized) || (normalized === '/' ? '/pt' : `/pt${normalized}`);
}

/**
 * Obtiene la URL equivalente según el idioma.
 */
export function getUrlForLanguage(esPath: string, lang: 'es' | 'en' | 'pt' | 'zh' = 'es'): string {
  if (lang === 'en') return getEnglishUrlForSpanish(esPath);
  if (lang === 'pt') return getPortugueseUrlForSpanish(esPath);
  return esPath;
}

/**
 * Obtiene la URL equivalente en español para una ruta en inglés.
 */
export function getSpanishUrlForEnglish(enPath: string): string {
  const normalized = enPath.replace(/\/$/, '') || '/';
  if (normalized === '/en') {
    return '/es';
  }
  if (EN_TO_ES_MAP.has(normalized)) {
    return EN_TO_ES_MAP.get(normalized)!;
  }
  return normalized.replace(/^\/en/, '') || '/es';
}

/**
 * Obtiene la configuración de una herramienta por su slug en inglés.
 */
export function getToolBySlugEn(slugEn: string): ToolRouteConfig | undefined {
  return EN_SLUG_TO_TOOL.get(slugEn);
}

/**
 * Obtiene la URL equivalente en español para una ruta en portugués.
 */
export function getSpanishUrlForPortuguese(ptPath: string): string {
  const normalized = ptPath.replace(/\/$/, '') || '/';
  if (normalized === '/pt') {
    return '/es';
  }
  if (PT_TO_ES_MAP.has(normalized)) {
    return PT_TO_ES_MAP.get(normalized)!;
  }
  return normalized.replace(/^\/pt/, '') || '/es';
}

/**
 * Obtiene la configuración de una herramienta por su slug en portugués.
 */
export function getToolBySlugPt(slugPt: string): ToolRouteConfig | undefined {
  return PT_SLUG_TO_TOOL.get(slugPt);
}

/**
 * Obtiene la URL correspondiente al cambiar de idioma desde cualquier ruta activa (ES, EN o PT).
 */
export function getLanguageSwitchUrl(currentPath: string, targetLang: 'es' | 'en' | 'pt'): string {
  const normalized = currentPath.replace(/\/$/, '') || '/';

  // 1. Resolver la ruta canónica en español base
  let esPath = normalized;
  if (normalized.startsWith('/en')) {
    esPath = getSpanishUrlForEnglish(normalized);
  } else if (normalized.startsWith('/pt')) {
    esPath = getSpanishUrlForPortuguese(normalized);
  }

  // 2. Proyectar al idioma destino
  if (targetLang === 'en') {
    return getEnglishUrlForSpanish(esPath);
  }
  if (targetLang === 'pt') {
    return getPortugueseUrlForSpanish(esPath);
  }
  // Si targetLang === 'es'
  return esPath === '/es' ? '/' : esPath;
}
