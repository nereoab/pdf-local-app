/**
 * Helper ligero para envío de eventos de micro-conversión y señales de satisfacción a GA4.
 * Cero dependencias externas — ejecuta en el navegador únicamente si gtag está inicializado.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackToolEvent(
  toolName: string,
  action: 'file_loaded' | 'tool_completed' | 'file_downloaded' | 'file_shared' | 'opened_in_tool',
  extraParams?: Record<string, any>,
) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  try {
    window.gtag('event', action, {
      tool_name: toolName,
      event_category: 'tool_interaction',
      event_label: `${toolName}:${action}`,
      ...extraParams,
    });
  } catch {
    // Silencioso para no interferir con la experiencia del usuario
  }
}

/**
 * Infiere el identificador semántico de la herramienta a partir de la ruta URL actual.
 * Cubre silos en español, inglés, francés y rutas satélites de SEO.
 */
export function inferToolNameFromPath(pathname?: string): string {
  if (typeof window === 'undefined' && !pathname) return 'workspace';
  const path = (pathname || window.location.pathname || '').toLowerCase();

  // Eliminar prefijos de idioma internacional (/es/, /en/, /fr/, etc.)
  const cleanPath = path.replace(/^\/(es|en|fr|pt|de|it)(\/|$)/, '/');

  if (cleanPath.includes('foliar-expediente') || cleanPath.includes('bates'))
    return 'foliar_expediente';
  if (cleanPath.includes('foliar')) return 'foliar';
  if (cleanPath.includes('comprimir') || cleanPath.includes('compress')) return 'comprimir';
  if (cleanPath.includes('unir') || cleanPath.includes('merge')) return 'unir';
  if (cleanPath.includes('dividir') || cleanPath.includes('split')) return 'dividir';
  if (cleanPath.includes('rotar') || cleanPath.includes('rotate')) return 'rotar';
  if (
    cleanPath.includes('reordenar') ||
    cleanPath.includes('reorder') ||
    cleanPath.includes('organizar')
  )
    return 'reordenar';
  if (cleanPath.includes('eliminar') || cleanPath.includes('delete-pages'))
    return 'eliminar_paginas';
  if (cleanPath.includes('marca-agua') && cleanPath.includes('quitar')) return 'quitar_marca_agua';
  if (cleanPath.includes('marca-agua') || cleanPath.includes('watermark')) return 'marca_agua';
  if (cleanPath.includes('ocr')) return 'ocr';
  if (cleanPath.includes('crop') || cleanPath.includes('recortar')) return 'recortar';
  if (cleanPath.includes('black-and-white') || cleanPath.includes('blanco-y-negro'))
    return 'blanco_y_negro';
  if (cleanPath.includes('comparar') || cleanPath.includes('compare')) return 'comparar';
  if (cleanPath.includes('proteger') || cleanPath.includes('protect')) return 'proteger';
  if (cleanPath.includes('desbloquear') || cleanPath.includes('unlock')) return 'desbloquear';
  if (cleanPath.includes('redact') || cleanPath.includes('redactar')) return 'redactar';
  if (cleanPath.includes('firmar') || cleanPath.includes('sign')) return 'firmar';
  if (cleanPath.includes('reparar') || cleanPath.includes('repair')) return 'reparar';
  if (
    cleanPath.includes('pdf-word') ||
    cleanPath.includes('word-to-pdf') ||
    cleanPath.includes('pdf2word')
  )
    return 'pdf_word';
  if (cleanPath.includes('pdf-excel') || cleanPath.includes('excel-to-pdf')) return 'pdf_excel';
  if (cleanPath.includes('pdf-powerpoint') || cleanPath.includes('powerpoint-to-pdf'))
    return 'pdf_powerpoint';
  if (cleanPath.includes('pdf-jpg') || cleanPath.includes('jpg-to-pdf')) return 'pdf_jpg';
  if (cleanPath.includes('edit') || cleanPath.includes('texto')) return 'editar_texto';
  if (cleanPath.includes('share')) return 'share_viewer';

  const segments = cleanPath.split('/').filter(Boolean);
  return segments.pop() || 'workspace';
}

// Cache de huella en memoria con TTL: previene duplicar eventos si React re-renderiza o reasigna stores
const recentlyTrackedFiles = new Map<string, number>();

/**
 * Dispara el evento GA4 'file_loaded' con deduplicación inteligente y contexto de la herramienta activa.
 */
export function trackFileLoaded(files: File | File[] | null | undefined, customToolName?: string) {
  if (!files) return;

  const fileList = Array.isArray(files) ? files : [files];
  if (fileList.length === 0) return;

  const now = Date.now();
  const toolName = customToolName || inferToolNameFromPath();

  // Filtrar archivos que ya hayan sido trackeados en los últimos 4 segundos
  const freshFiles = fileList.filter((f) => {
    if (!f || !f.name) return false;
    const key = `${f.name}_${f.size}_${f.lastModified}`;
    const lastTime = recentlyTrackedFiles.get(key);
    if (lastTime && now - lastTime < 4000) {
      return false;
    }
    recentlyTrackedFiles.set(key, now);
    return true;
  });

  // Limpiar entradas antiguas del cache
  if (recentlyTrackedFiles.size > 80) {
    for (const [k, timestamp] of recentlyTrackedFiles.entries()) {
      if (now - timestamp > 8000) {
        recentlyTrackedFiles.delete(k);
      }
    }
  }

  if (freshFiles.length === 0) return;

  const totalBytes = freshFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const firstFile = freshFiles[0];

  trackToolEvent(toolName, 'file_loaded', {
    file_count: freshFiles.length,
    total_bytes: totalBytes,
    file_name: firstFile.name,
    file_type: firstFile.type || 'application/pdf',
    source: customToolName ? 'component_direct' : 'store_central',
  });
}
