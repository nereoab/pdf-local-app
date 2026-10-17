/**
 * @fileoverview Bus de Mensajería Inter-Hilos de Costo O(1) (Zero-Copy Transferable Enforcer).
 * Diseñado por Gemini 4 Argon para PDFBlack.
 * Garantiza que los buffers no se clonen en el Hilo Principal, manteniendo 60 FPS estables.
 */

export type WorkerOperation =
  | 'COMPRESS_PDF'
  | 'MERGE_PDF'
  | 'SPLIT_PDF'
  | 'ROTATE_PDF'
  | 'REDACT_PDF'
  | 'WATERMARK_PDF'
  | 'OCR_PDF'
  | 'EXTRACT_PAGES'
  | 'GENERIC_TASK';

export interface ZeroCopyTaskPayload {
  taskId: string;
  operation: WorkerOperation;
  buffers: ArrayBuffer[]; // Obligatoriamente ArrayBuffers puros para transferencia
  metadata?: Record<string, string | number | boolean>;
}

export interface ZeroCopyWorkerResponse {
  taskId: string;
  status: 'SUCCESS' | 'ERROR';
  resultBuffer?: ArrayBuffer;
  errorMessage?: string;
  wasmHeapByteLength: number; // Telemetría de memoria interna para el supervisor
}

export class ZeroCopyBus {
  /**
   * Envía datos desde el Hilo Principal al Worker transfiriendo la propiedad física de la memoria en < 0.1ms.
   * NOTA: Los buffers originales en el hilo emisor quedarán con byteLength === 0 (detached) tras esta llamada.
   */
  public static dispatchToWorker(worker: Worker, payload: ZeroCopyTaskPayload): void {
    const transferList: Transferable[] = [];

    for (const buf of payload.buffers) {
      if (buf.byteLength === 0) {
        throw new Error(
          `[ZeroCopyBus] Violación de Memoria: El ArrayBuffer para la tarea ${payload.taskId} ya está detached o vacío.`,
        );
      }
      transferList.push(buf);
    }

    // Transferencia O(1) sin clonación estructurada
    worker.postMessage(payload, transferList);
  }

  /**
   * Envía el resultado desde el Worker de vuelta al Hilo Principal con costo O(1).
   */
  public static replyFromWorker(response: ZeroCopyWorkerResponse): void {
    const transferList: Transferable[] = [];
    if (response.resultBuffer && response.resultBuffer.byteLength > 0) {
      transferList.push(response.resultBuffer);
    }

    // En el contexto de un Worker
    if (
      typeof self !== 'undefined' &&
      typeof (self as unknown as Worker).postMessage === 'function'
    ) {
      (self as unknown as Worker).postMessage(response, transferList);
    }
  }

  /**
   * Extrae un ArrayBuffer transferible limpio desde una vista (Uint8Array).
   * Si la vista apunta a un buffer mayor (como wasmModule.HEAPU8),
   * extrae únicamente el segmento necesario para no transferir la memoria completa del motor C++.
   */
  public static extractTransferableBuffer(view: Uint8Array): ArrayBuffer {
    if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) {
      return view.buffer as ArrayBuffer;
    }
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
  }
}
