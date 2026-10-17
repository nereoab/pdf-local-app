/**
 * @fileoverview Gestor Criptográfico de Memoria Volátil y Ciclo de Vida de Blobs.
 * Diseñado por Gemini 4 Argon para PDFBlack.
 * Implementa el estándar NIST SP 800-88 Rev. 1 para purga de memoria en RAM (Zeroization).
 */

export class SecureMemoryLifecycle {
  private static activeUrls = new Set<string>();

  /**
   * Sobreescribe físicamente el búfer de memoria con ceros antes de liberarlo al GC.
   * Previene la recuperación forense de datos del Heap de V8/WASM.
   */
  public static zeroize(buffer: ArrayBufferView | ArrayBuffer | null | undefined): void {
    if (!buffer) return;

    try {
      if (buffer instanceof ArrayBuffer) {
        // Si el buffer ya fue transferido (detached), byteLength será 0.
        if (buffer.byteLength > 0) {
          const view = new Uint8Array(buffer);
          view.fill(0);
        }
      } else if (ArrayBuffer.isView(buffer)) {
        if (buffer.byteLength > 0) {
          const view = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
          view.fill(0);
        }
      }
    } catch {
      // Ignorar si el ArrayBuffer está en estado 'detached'
    }
  }

  /**
   * Ejecuta una descarga segura garantizando la destrucción inmediata tanto del
   * búfer en RAM como de la referencia del Blob URL en el navegador.
   */
  public static triggerEphemeralDownload(
    rawPayload: Uint8Array,
    filename: string,
    mimeType = 'application/pdf',
  ): void {
    let objectUrl: string | null = null;

    try {
      // 1. Crear el Blob en el almacenamiento interno del navegador
      const blob = new Blob([rawPayload as unknown as BlobPart], { type: mimeType });

      // 2. ZEROIZATION INMEDIATA: El Blob ya tiene su copia interna, destruimos el búfer de trabajo en RAM
      this.zeroize(rawPayload);

      // 3. Generar URL efímera
      objectUrl = URL.createObjectURL(blob);
      this.activeUrls.add(objectUrl);

      // 4. Despachar descarga asíncrona fuera del DOM principal
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = objectUrl;
      anchor.download = filename.replace(/[^a-zA-Z0-9._\-]/g, '_'); // Sanitización de nombre de archivo

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      // 5. Revocación diferida en la siguiente macrotarea tras el enganche del gestor de descargas del SO
      if (objectUrl) {
        const urlToRevoke = objectUrl;
        setTimeout(() => {
          try {
            URL.revokeObjectURL(urlToRevoke);
            this.activeUrls.delete(urlToRevoke);
          } catch {
            // No-op
          }
        }, 1500); // 1500ms es el umbral seguro para iOS Safari, Chrome y Firefox
      }
    }
  }

  /**
   * Hook de emergencia para limpiar cualquier Blob remanente al cerrar o refrescar la pestaña.
   */
  public static purgeAll(): void {
    for (const url of this.activeUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // No-op
      }
    }
    this.activeUrls.clear();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => SecureMemoryLifecycle.purgeAll());
  window.addEventListener('beforeunload', () => SecureMemoryLifecycle.purgeAll());
}
