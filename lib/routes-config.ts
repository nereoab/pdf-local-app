/**
 * Configuración centralizada de rutas y equivalencias bilingües (Español ↔ Inglés)
 * para todas las 41 páginas de PDFBlack.
 */

export interface ToolRouteConfig {
  id: string;
  category: 'organizar' | 'optimizar' | 'editar' | 'convertir';
  categoryEn: 'organize' | 'optimize' | 'edit' | 'convert';
  slugEs: string;
  slugEn: string;
  pathEs: string;
  pathEn: string;
  clientType: 'organizar' | 'optimizar' | 'editar' | 'convertir';
  toolKey: string;
}

export const TOOLS_ROUTES: ToolRouteConfig[] = [
  // ── ORGANIZAR ──────────────────────────────────────────────
  {
    id: 'unir',
    category: 'organizar',
    categoryEn: 'organize',
    slugEs: 'unir',
    slugEn: 'merge-pdf',
    pathEs: '/organizar/unir',
    pathEn: '/en/merge-pdf',
    clientType: 'organizar',
    toolKey: 'unir',
  },
  {
    id: 'dividir',
    category: 'organizar',
    categoryEn: 'organize',
    slugEs: 'dividir',
    slugEn: 'split-pdf',
    pathEs: '/organizar/dividir',
    pathEn: '/en/split-pdf',
    clientType: 'organizar',
    toolKey: 'dividir',
  },
  {
    id: 'eliminar',
    category: 'organizar',
    categoryEn: 'organize',
    slugEs: 'eliminar',
    slugEn: 'delete-pdf-pages',
    pathEs: '/organizar/eliminar',
    pathEn: '/en/delete-pdf-pages',
    clientType: 'organizar',
    toolKey: 'eliminar',
  },
  {
    id: 'reordenar',
    category: 'organizar',
    categoryEn: 'organize',
    slugEs: 'reordenar',
    slugEn: 'reorder-pdf-pages',
    pathEs: '/organizar/reordenar',
    pathEn: '/en/reorder-pdf-pages',
    clientType: 'organizar',
    toolKey: 'reordenar',
  },
  {
    id: 'rotar',
    category: 'organizar',
    categoryEn: 'organize',
    slugEs: 'rotar',
    slugEn: 'rotate-pdf',
    pathEs: '/organizar/rotar',
    pathEn: '/en/rotate-pdf',
    clientType: 'organizar',
    toolKey: 'rotar',
  },
  {
    id: 'recortar',
    category: 'organizar',
    categoryEn: 'organize',
    slugEs: 'recortar',
    slugEn: 'crop-pdf',
    pathEs: '/organizar/recortar',
    pathEn: '/en/crop-pdf',
    clientType: 'organizar',
    toolKey: 'recortar',
  },

  // ── OPTIMIZAR ──────────────────────────────────────────────
  {
    id: 'comprimir',
    category: 'optimizar',
    categoryEn: 'optimize',
    slugEs: 'comprimir',
    slugEn: 'compress-pdf',
    pathEs: '/optimizar/comprimir',
    pathEn: '/en/compress-pdf',
    clientType: 'optimizar',
    toolKey: 'comprimir',
  },
  {
    id: 'reparar',
    category: 'optimizar',
    categoryEn: 'optimize',
    slugEs: 'reparar',
    slugEn: 'repair-pdf',
    pathEs: '/optimizar/reparar',
    pathEn: '/en/repair-pdf',
    clientType: 'optimizar',
    toolKey: 'reparar',
  },
  {
    id: 'proteger',
    category: 'optimizar',
    categoryEn: 'optimize',
    slugEs: 'proteger',
    slugEn: 'protect-pdf',
    pathEs: '/optimizar/proteger',
    pathEn: '/en/protect-pdf',
    clientType: 'optimizar',
    toolKey: 'proteger',
  },
  {
    id: 'desbloquear',
    category: 'optimizar',
    categoryEn: 'optimize',
    slugEs: 'desbloquear',
    slugEn: 'unlock-pdf',
    pathEs: '/optimizar/desbloquear',
    pathEn: '/en/unlock-pdf',
    clientType: 'optimizar',
    toolKey: 'desbloquear',
  },
  {
    id: 'censurar',
    category: 'optimizar',
    categoryEn: 'optimize',
    slugEs: 'censurar',
    slugEn: 'redact-pdf',
    pathEs: '/optimizar/censurar',
    pathEn: '/en/redact-pdf',
    clientType: 'optimizar',
    toolKey: 'censurar',
  },
  {
    id: 'comparar',
    category: 'optimizar',
    categoryEn: 'optimize',
    slugEs: 'comparar',
    slugEn: 'compare-pdf',
    pathEs: '/optimizar/comparar',
    pathEn: '/en/compare-pdf',
    clientType: 'optimizar',
    toolKey: 'comparar',
  },

  // ── EDITAR ─────────────────────────────────────────────────
  {
    id: 'texto',
    category: 'editar',
    categoryEn: 'edit',
    slugEs: 'texto',
    slugEn: 'edit-pdf',
    pathEs: '/editar/texto',
    pathEn: '/en/edit-pdf',
    clientType: 'editar',
    toolKey: 'texto',
  },
  {
    id: 'foliar',
    category: 'editar',
    categoryEn: 'edit',
    slugEs: 'foliar',
    slugEn: 'bates-numbering',
    pathEs: '/editar/foliar',
    pathEn: '/en/bates-numbering',
    clientType: 'editar',
    toolKey: 'foliar',
  },
  {
    id: 'marca-agua',
    category: 'editar',
    categoryEn: 'edit',
    slugEs: 'marca-agua',
    slugEn: 'watermark-pdf',
    pathEs: '/editar/marca-agua',
    pathEn: '/en/watermark-pdf',
    clientType: 'editar',
    toolKey: 'marca-agua',
  },
  {
    id: 'quitar-marca-agua',
    category: 'editar',
    categoryEn: 'edit',
    slugEs: 'quitar-marca-agua',
    slugEn: 'remove-watermark',
    pathEs: '/editar/quitar-marca-agua',
    pathEn: '/en/remove-watermark',
    clientType: 'editar',
    toolKey: 'quitar-marca-agua',
  },
  {
    id: 'firmar',
    category: 'editar',
    categoryEn: 'edit',
    slugEs: 'firmar',
    slugEn: 'sign-pdf',
    pathEs: '/editar/firmar',
    pathEn: '/en/sign-pdf',
    clientType: 'editar',
    toolKey: 'firmar',
  },
  {
    id: 'ocr',
    category: 'editar',
    categoryEn: 'edit',
    slugEs: 'ocr',
    slugEn: 'ocr-pdf',
    pathEs: '/editar/ocr',
    pathEn: '/en/ocr-pdf',
    clientType: 'editar',
    toolKey: 'ocr',
  },

  // ── CONVERTIR ──────────────────────────────────────────────
  {
    id: 'pdf-word',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'pdf-word',
    slugEn: 'pdf-to-word',
    pathEs: '/convertir/pdf-word',
    pathEn: '/en/pdf-to-word',
    clientType: 'convertir',
    toolKey: 'pdf-word',
  },
  {
    id: 'word-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'word-pdf',
    slugEn: 'word-to-pdf',
    pathEs: '/convertir/word-pdf',
    pathEn: '/en/word-to-pdf',
    clientType: 'convertir',
    toolKey: 'word-pdf',
  },
  {
    id: 'pdf-excel',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'pdf-excel',
    slugEn: 'pdf-to-excel',
    pathEs: '/convertir/pdf-excel',
    pathEn: '/en/pdf-to-excel',
    clientType: 'convertir',
    toolKey: 'pdf-excel',
  },
  {
    id: 'excel-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'excel-pdf',
    slugEn: 'excel-to-pdf',
    pathEs: '/convertir/excel-pdf',
    pathEn: '/en/excel-to-pdf',
    clientType: 'convertir',
    toolKey: 'excel-pdf',
  },
  {
    id: 'pdf-powerpoint',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'pdf-powerpoint',
    slugEn: 'pdf-to-powerpoint',
    pathEs: '/convertir/pdf-powerpoint',
    pathEn: '/en/pdf-to-powerpoint',
    clientType: 'convertir',
    toolKey: 'pdf-powerpoint',
  },
  {
    id: 'powerpoint-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'powerpoint-pdf',
    slugEn: 'powerpoint-to-pdf',
    pathEs: '/convertir/powerpoint-pdf',
    pathEn: '/en/powerpoint-to-pdf',
    clientType: 'convertir',
    toolKey: 'powerpoint-pdf',
  },
  {
    id: 'pdf-jpg',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'pdf-jpg',
    slugEn: 'pdf-to-jpg',
    pathEs: '/convertir/pdf-jpg',
    pathEn: '/en/pdf-to-jpg',
    clientType: 'convertir',
    toolKey: 'pdf-jpg',
  },
  {
    id: 'jpg-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'jpg-pdf',
    slugEn: 'jpg-to-pdf',
    pathEs: '/convertir/jpg-pdf',
    pathEn: '/en/jpg-to-pdf',
    clientType: 'convertir',
    toolKey: 'jpg-pdf',
  },
  {
    id: 'pdf-html',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'pdf-html',
    slugEn: 'pdf-to-html',
    pathEs: '/convertir/pdf-html',
    pathEn: '/en/pdf-to-html',
    clientType: 'convertir',
    toolKey: 'pdf-html',
  },
  {
    id: 'html-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'html-pdf',
    slugEn: 'html-to-pdf',
    pathEs: '/convertir/html-pdf',
    pathEn: '/en/html-to-pdf',
    clientType: 'convertir',
    toolKey: 'html-pdf',
  },
  {
    id: 'pdf-texto',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'pdf-texto',
    slugEn: 'pdf-to-txt',
    pathEs: '/convertir/pdf-texto',
    pathEn: '/en/pdf-to-txt',
    clientType: 'convertir',
    toolKey: 'pdf-texto',
  },
  {
    id: 'texto-pdf',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'texto-pdf',
    slugEn: 'txt-to-pdf',
    pathEs: '/convertir/texto-pdf',
    pathEn: '/en/txt-to-pdf',
    clientType: 'convertir',
    toolKey: 'texto-pdf',
  },
  {
    id: 'pdf-blanco-negro',
    category: 'convertir',
    categoryEn: 'convert',
    slugEs: 'pdf-blanco-negro',
    slugEn: 'convert-pdf-to-black-and-white',
    pathEs: '/convertir/pdf-blanco-negro',
    pathEn: '/en/convert-pdf-to-black-and-white',
    clientType: 'convertir',
    toolKey: 'pdf-blanco-negro',
  },
];

// ── HUBS Y PÁGINAS ESTÁTICAS ─────────────────────────────────
export const STATIC_ROUTES_MAP: Record<string, string> = {
  '/': '/en',
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

// Mapeos rápidos para búsquedas O(1)
const ES_TO_EN_MAP = new Map<string, string>();
const EN_TO_ES_MAP = new Map<string, string>();
const EN_SLUG_TO_TOOL = new Map<string, ToolRouteConfig>();

// Rellenar mapas
for (const [es, en] of Object.entries(STATIC_ROUTES_MAP)) {
  ES_TO_EN_MAP.set(es, en);
  EN_TO_ES_MAP.set(en, es);
}

for (const tool of TOOLS_ROUTES) {
  ES_TO_EN_MAP.set(tool.pathEs, tool.pathEn);
  EN_TO_ES_MAP.set(tool.pathEn, tool.pathEs);
  EN_SLUG_TO_TOOL.set(tool.slugEn, tool);
}

export const ALL_ENGLISH_TOOL_SLUGS = TOOLS_ROUTES.map((t) => t.slugEn);

/**
 * Obtiene la URL equivalente en inglés para una ruta en español.
 */
export function getEnglishUrlForSpanish(esPath: string): string {
  const normalized = esPath.replace(/\/$/, '') || '/';
  return ES_TO_EN_MAP.get(normalized) || (normalized === '/' ? '/en' : `/en${normalized}`);
}

/**
 * Obtiene la URL equivalente en español para una ruta en inglés.
 */
export function getSpanishUrlForEnglish(enPath: string): string {
  const normalized = enPath.replace(/\/$/, '') || '/';
  if (EN_TO_ES_MAP.has(normalized)) {
    return EN_TO_ES_MAP.get(normalized)!;
  }
  // Si comienza con /en, remover el prefijo
  return normalized.replace(/^\/en/, '') || '/';
}

/**
 * Obtiene la configuración de una herramienta por su slug en inglés.
 */
export function getToolBySlugEn(slugEn: string): ToolRouteConfig | undefined {
  return EN_SLUG_TO_TOOL.get(slugEn);
}
