/**
 * @fileoverview Cortafuegos de Sanitización de Telemetría y Red (Zero-Knowledge Engine).
 * Diseñado por Gemini 4 Argon para PDFBlack.
 * Intercepta y purga cualquier vector de PII o contenido de documentos antes de que abandone el cliente.
 */

const SENSITIVE_PATTERNS = {
  FILE_PATHS: /(?:[a-zA-Z]:\\|\/(?:Users|home|var|tmp)\/)[^\s"']+/gi,
  PDF_FILENAMES: /[a-zA-Z0-9_\-\u00C0-\u017F]+\.pdf\b/gi,
  BASE64_BLOBS: /(?:data:application\/pdf;base64,|[A-Za-z0-9+/]{64,}={0,2})/g,
  MEM_ADDRESSES: /0x[0-9a-fA-F]{8,16}/g,
  EMAILS: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
};

export class PrivacyGuard {
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.monkeyPatchConsole();
    this.installGlobalErrorBoundary();
    this.isInitialized = true;
    if (process.env.NODE_ENV === 'development') {
      console.info('[PrivacyGuard] Cortafuegos Zero-Knowledge de Telemetría activado.');
    }
  }

  /**
   * Purga recursivamente objetos de error, eventos de Sentry/Clarity o payloads de analítica.
   */
  public static scrub<T>(payload: T): T {
    if (!payload) return payload;

    if (typeof payload === 'string') {
      let str: string = payload;
      str = str.replace(SENSITIVE_PATTERNS.FILE_PATHS, '[REDACTED_PATH]');
      str = str.replace(SENSITIVE_PATTERNS.PDF_FILENAMES, '[REDACTED_FILE.pdf]');
      str = str.replace(SENSITIVE_PATTERNS.BASE64_BLOBS, '[REDACTED_BINARY_PAYLOAD]');
      str = str.replace(SENSITIVE_PATTERNS.EMAILS, '[REDACTED_PII]');
      return str as unknown as T;
    }

    if (payload instanceof Error) {
      const sanitizedError = new Error(this.scrub(payload.message));
      sanitizedError.name = payload.name;
      sanitizedError.stack = payload.stack ? this.scrub(payload.stack) : undefined;
      return sanitizedError as unknown as T;
    }

    if (Array.isArray(payload)) {
      return payload.map((item) => this.scrub(item)) as unknown as T;
    }

    if (typeof payload === 'object') {
      // Destruir referencias a ArrayBuffers o Vistas tipadas inmediatamente
      if (
        ArrayBuffer.isView(payload) ||
        payload instanceof ArrayBuffer ||
        payload instanceof Blob
      ) {
        return '[REDACTED_MEMORY_BUFFER]' as unknown as T;
      }

      const scrubbedObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        // Bloquear claves que típicamente contienen datos de usuario en DOM Events
        if (['value', 'files', 'textContent', 'innerText', 'innerHTML'].includes(key)) {
          scrubbedObj[key] = '[REDACTED_DOM_CONTENT]';
        } else {
          scrubbedObj[key] = this.scrub(value);
        }
      }
      return scrubbedObj as T;
    }

    return payload;
  }

  private static monkeyPatchConsole(): void {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: unknown[]) => {
      originalError.apply(
        console,
        args.map((arg) => this.scrub(arg)),
      );
    };

    console.warn = (...args: unknown[]) => {
      originalWarn.apply(
        console,
        args.map((arg) => this.scrub(arg)),
      );
    };
  }

  private static installGlobalErrorBoundary(): void {
    window.addEventListener(
      'error',
      (event: ErrorEvent) => {
        if (event.error) {
          event.error.message = this.scrub(event.error.message);
          if (event.error.stack) {
            event.error.stack = this.scrub(event.error.stack);
          }
        }
      },
      { capture: true }, // Fase de captura: se ejecuta ANTES que los listeners de Sentry/Clarity/Analytics
    );

    window.addEventListener(
      'unhandledrejection',
      (event: PromiseRejectionEvent) => {
        if (event.reason instanceof Error) {
          event.reason.message = this.scrub(event.reason.message);
          if (event.reason.stack) {
            event.reason.stack = this.scrub(event.reason.stack);
          }
        }
      },
      { capture: true },
    );
  }
}
