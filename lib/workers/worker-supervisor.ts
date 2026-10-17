/**
 * @fileoverview Supervisor Adaptativo de Hilos con Reciclaje de Heap WASM y Watchdog Anti-Bloqueos.
 * Diseñado por Gemini 4 Argon para PDFBlack.
 * Previene la saturación de CPU en móviles y evita fugas de memoria en la memoria lineal de WebAssembly.
 */

import {
  ZeroCopyBus,
  ZeroCopyTaskPayload,
  ZeroCopyWorkerResponse,
  WorkerOperation,
} from './zero-copy-bus';

interface ManagedWorker {
  id: string;
  instance: Worker;
  isBusy: boolean;
  lastReportedHeapSize: number;
}

interface QueuedTask {
  payload: ZeroCopyTaskPayload;
  timeoutMs: number;
  resolve: (buffer: ArrayBuffer) => void;
  reject: (err: Error) => void;
}

export class AdaptiveWorkerSupervisor {
  private pool: ManagedWorker[] = [];
  private taskQueue: QueuedTask[] = [];
  private readonly maxConcurrency: number;
  private readonly workerScriptUrl: string;

  // Umbral crítico: 256MB. Si el Heap de WASM supera esto, se destruye al terminar la tarea para liberar memoria física al SO.
  private static readonly HEAP_RECYCLE_THRESHOLD_BYTES = 256 * 1024 * 1024;
  private static readonly DEFAULT_WATCHDOG_TIMEOUT_MS = 30_000;

  constructor(workerScriptUrl = '/workers/pdf-engine.worker.js') {
    this.workerScriptUrl = workerScriptUrl;

    // Heurística de Concurrencia Adaptativa:
    // Reservamos 2 hilos físicos (1 para Main Thread UI + 1 para Compositor GPU / IO del navegador).
    // Tope máximo de 6 workers para evitar contención de bus de memoria RAM.
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    this.maxConcurrency = Math.max(1, Math.min(cores - 2, 6));
  }

  public executeTask(
    operation: WorkerOperation,
    buffers: ArrayBuffer[],
    metadata?: Record<string, string | number | boolean>,
    timeoutMs = AdaptiveWorkerSupervisor.DEFAULT_WATCHDOG_TIMEOUT_MS,
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const taskId = crypto.randomUUID();
      this.taskQueue.push({
        payload: { taskId, operation, buffers, metadata },
        timeoutMs,
        resolve,
        reject,
      });
      this.scheduleNext();
    });
  }

  private scheduleNext(): void {
    if (this.taskQueue.length === 0) return;

    // 1. Buscar un worker libre existente
    let targetWorker = this.pool.find((w) => !w.isBusy);

    // 2. Si no hay libres pero aún no alcanzamos el límite de hardware, instanciamos uno nuevo bajo demanda
    if (!targetWorker && this.pool.length < this.maxConcurrency) {
      targetWorker = this.spawnWorker();
    }

    // 3. Si todos los núcleos asignados están ocupados, la tarea aguarda en la cola
    if (!targetWorker) return;

    const task = this.taskQueue.shift()!;
    this.runTaskOnWorker(targetWorker, task);
  }

  private spawnWorker(): ManagedWorker {
    const worker = new Worker(this.workerScriptUrl, { type: 'module' });
    const managed: ManagedWorker = {
      id: crypto.randomUUID(),
      instance: worker,
      isBusy: false,
      lastReportedHeapSize: 0,
    };
    this.pool.push(managed);
    return managed;
  }

  private runTaskOnWorker(managedWorker: ManagedWorker, task: QueuedTask): void {
    managedWorker.isBusy = true;

    // Watchdog Timer contra bucles infinitos en C++ (PDFs corruptos o referencias cíclicas)
    const watchdogTimer = setTimeout(() => {
      this.terminateAndRemoveWorker(managedWorker.id);
      task.reject(
        new Error(
          `[Watchdog Timeout] La operación ${task.payload.operation} excedió el límite de ${task.timeoutMs}ms. El hilo fue aniquilado por seguridad.`,
        ),
      );
      this.scheduleNext();
    }, task.timeoutMs);

    const cleanupListeners = () => {
      clearTimeout(watchdogTimer);
      managedWorker.instance.onmessage = null;
      managedWorker.instance.onerror = null;
    };

    managedWorker.instance.onmessage = (event: MessageEvent<ZeroCopyWorkerResponse>) => {
      const response = event.data;
      if (response.taskId !== task.payload.taskId) return;

      cleanupListeners();
      managedWorker.lastReportedHeapSize = response.wasmHeapByteLength;

      // RECICLAJE DE MEMORIA WASM:
      // Si el motor C++ expandió su memoria lineal más allá de 256MB, matamos el worker
      // para forzar la devolución de páginas de memoria física al SO.
      if (
        managedWorker.lastReportedHeapSize > AdaptiveWorkerSupervisor.HEAP_RECYCLE_THRESHOLD_BYTES
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.info(
            `[Supervisor] Reciclando Worker ${managedWorker.id} (Heap: ${(
              managedWorker.lastReportedHeapSize / 1048576
            ).toFixed(1)}MB > 256MB)`,
          );
        }
        this.terminateAndRemoveWorker(managedWorker.id);
      } else {
        managedWorker.isBusy = false;
      }

      if (response.status === 'SUCCESS' && response.resultBuffer) {
        task.resolve(response.resultBuffer);
      } else {
        task.reject(new Error(response.errorMessage || 'Fallo desconocido en el motor WASM.'));
      }

      this.scheduleNext();
    };

    managedWorker.instance.onerror = (error: ErrorEvent) => {
      cleanupListeners();
      this.terminateAndRemoveWorker(managedWorker.id);
      task.reject(new Error(`[Worker Crash] Fallo catastrófico en hilo aislado: ${error.message}`));
      this.scheduleNext();
    };

    // Despacho Zero-Copy O(1)
    try {
      ZeroCopyBus.dispatchToWorker(managedWorker.instance, task.payload);
    } catch (err) {
      cleanupListeners();
      managedWorker.isBusy = false;
      task.reject(err instanceof Error ? err : new Error(String(err)));
      this.scheduleNext();
    }
  }

  private terminateAndRemoveWorker(workerId: string): void {
    const idx = this.pool.findIndex((w) => w.id === workerId);
    if (idx !== -1) {
      this.pool[idx].instance.terminate(); // Destrucción inmediata a nivel SO
      this.pool.splice(idx, 1);
    }
  }

  public shutdownPool(): void {
    for (const w of this.pool) {
      w.instance.terminate();
    }
    this.pool = [];
    this.taskQueue = [];
  }
}
