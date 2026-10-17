/**
 * @fileoverview Cargador en Streaming con Verificación Criptográfica y Caché Persistente para Binarios WASM.
 * Diseñado por Gemini 4 Argon para PDFBlack.
 * Desacopla la descarga de binarios pesados del Largest Contentful Paint (LCP) y garantiza 0ms de red en visitas recurrentes.
 */

export interface WasmBinaryManifest {
  url: string;
  version: string;
  expectedSha384?: string; // Formato base64 estándar SRI (sin prefijo 'sha384-')
}

export class WasmStreamLoader {
  private static readonly CACHE_PREFIX = 'pdfblack-wasm-vault-';
  private static compiledModules = new Map<string, WebAssembly.Module>();

  /**
   * Programa la pre-descarga y pre-compilación del motor WASM únicamente cuando el navegador
   * ha terminado de pintar la UI (Post-LCP) y la CPU está en reposo (Idle).
   */
  public static scheduleIdleWarmup(manifest: WasmBinaryManifest): void {
    if (typeof window === 'undefined') return;

    const triggerWarmup = () => {
      const idleCallback =
        typeof window.requestIdleCallback !== 'undefined'
          ? window.requestIdleCallback
          : (cb: () => void, _opts?: { timeout: number }) => setTimeout(cb, 2000);

      idleCallback(
        () => {
          this.loadAndCompileModule(manifest).catch((err) => {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[WasmStreamLoader] Pre-calentamiento en segundo plano pospuesto:', err);
            }
          });
        },
        { timeout: 5000 },
      );
    };

    if (document.readyState === 'complete') {
      triggerWarmup();
    } else {
      window.addEventListener('load', triggerWarmup, { once: true });
    }
  }

  /**
   * Obtiene, verifica opcionalmente la integridad criptográfica y compila el binario WASM en streaming.
   */
  public static async loadAndCompileModule(
    manifest: WasmBinaryManifest,
  ): Promise<WebAssembly.Module> {
    const cacheKey = `${manifest.url}?v=${manifest.version}`;

    // 1. Retorno instantáneo si ya está compilado en memoria durante esta sesión
    if (this.compiledModules.has(cacheKey)) {
      return this.compiledModules.get(cacheKey)!;
    }

    const currentCacheName = `${this.CACHE_PREFIX}${manifest.version}`;
    let response: Response | undefined;

    // 2. Intentar recuperar desde Cache API persistente (0ms de red)
    if (typeof caches !== 'undefined') {
      try {
        await this.evictOutdatedCaches(currentCacheName);
        const cache = await caches.open(currentCacheName);
        response = await cache.match(cacheKey);
      } catch {
        // Fallback a red si Cache API falla
      }
    }

    // 3. Si no está en caché, descargar por red
    if (!response) {
      const fetchOpts: RequestInit = {
        credentials: 'same-origin',
      };
      if (manifest.expectedSha384) {
        fetchOpts.integrity = `sha384-${manifest.expectedSha384}`;
      }

      const netResponse = await fetch(manifest.url, fetchOpts);
      if (!netResponse.ok) {
        throw new Error(
          `[WasmStreamLoader] Fallo HTTP ${netResponse.status} al cargar ${manifest.url}`,
        );
      }

      const headers = new Headers(netResponse.headers);
      headers.set('Content-Type', 'application/wasm');

      const buffer = await netResponse.arrayBuffer();

      if (manifest.expectedSha384 && typeof crypto !== 'undefined' && crypto.subtle) {
        await this.verifyIntegrityHash(buffer, manifest.expectedSha384);
      }

      response = new Response(buffer, { status: 200, headers });

      if (typeof caches !== 'undefined') {
        try {
          const cache = await caches.open(currentCacheName);
          await cache.put(cacheKey, response.clone());
        } catch {
          // No-op si el almacenamiento está restringido
        }
      }
    }

    // 4. Compilación en Streaming (V8 Liftoff -> TurboFan)
    const module = await WebAssembly.compileStreaming(response);
    this.compiledModules.set(cacheKey, module);
    return module;
  }

  private static async verifyIntegrityHash(
    buffer: ArrayBuffer,
    expectedBase64Hash: string,
  ): Promise<void> {
    const hashBuffer = await crypto.subtle.digest('SHA-384', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedBase64 = btoa(String.fromCharCode(...hashArray));

    if (calculatedBase64 !== expectedBase64Hash) {
      throw new Error(
        `[VIOLACIÓN CRIPTOGRÁFICA] El hash SHA-384 del binario WASM no coincide con el manifiesto firmado. Ejecución abortada.`,
      );
    }
  }

  private static async evictOutdatedCaches(activeCacheName: string): Promise<void> {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(this.CACHE_PREFIX) && key !== activeCacheName)
        .map((key) => caches.delete(key)),
    );
  }
}
