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
  action: 'file_loaded' | 'tool_completed' | 'file_downloaded' | 'file_shared',
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
