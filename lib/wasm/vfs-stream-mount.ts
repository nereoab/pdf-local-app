/**
 * @fileoverview Sistema de Montaje Zero-RAM (WORKERFS) y Lectura Paginada para WebAssembly.
 * Diseñado por Gemini 4 Argon para PDFBlack.
 * Permite procesar archivos de gran tamaño con una huella de RAM controlada O(1).
 */

export interface EmscriptenModuleWithFS {
  FS: {
    mkdir(path: string): void;
    mount(
      type: unknown,
      opts: { files?: File[]; blobs?: Array<{ name: string; data: Blob }> },
      mountpoint: string,
    ): void;
    unmount(mountpoint: string): void;
    rmdir(path: string): void;
    analyzePath(path: string): { exists: boolean };
  };
  WORKERFS: unknown;
  HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(ptr: number): void;
}

export class WasmLargeFileController {
  private static readonly MOUNT_DIR = '/mnt_zero_copy';

  /**
   * Monta un objeto File/Blob nativo directamente en el sistema de archivos POSIX de C++ (Emscripten)
   * sin copiar un solo byte a la memoria RAM (HEAPU8). C++ leerá del disco vía llamadas síncronas paginadas.
   */
  public static mountFileZeroCopy(wasmModule: EmscriptenModuleWithFS, file: File): string {
    const { FS, WORKERFS } = wasmModule;

    if (!FS || !WORKERFS) {
      throw new Error(
        '[WasmLargeFileController] El módulo WASM no tiene habilitado el sistema de archivos WORKERFS.',
      );
    }

    if (!FS.analyzePath(this.MOUNT_DIR).exists) {
      try {
        FS.mkdir(this.MOUNT_DIR);
      } catch {
        // Carpeta ya existente
      }
    } else {
      // Asegurar que no haya montajes previos colgados
      try {
        FS.unmount(this.MOUNT_DIR);
      } catch {
        // No-op
      }
    }

    // Montaje directo: Emscripten traduce internamente fread() a FileReaderSync.readAsArrayBuffer(blob.slice())
    FS.mount(WORKERFS, { files: [file] }, this.MOUNT_DIR);

    return `${this.MOUNT_DIR}/${file.name}`;
  }

  /**
   * Desmonta el archivo virtual liberando los descriptores del sistema operativo.
   */
  public static unmountFile(wasmModule: EmscriptenModuleWithFS): void {
    const { FS } = wasmModule;
    if (!FS) return;

    try {
      if (FS.analyzePath(this.MOUNT_DIR).exists) {
        FS.unmount(this.MOUNT_DIR);
        FS.rmdir(this.MOUNT_DIR);
      }
    } catch (error) {
      console.warn('[WasmLargeFileController] Fallo no crítico al desmontar VFS:', error);
    }
  }

  /**
   * Alternativa para motores WASM sin soporte WORKERFS (ej. compilaciones Rust wasm-bindgen puras):
   * Streaming en ventanas deslizantes (Sliding Window) de 4MB con reutilización de puntero en Heap.
   */
  public static async processInSlidingWindows(
    wasmModule: EmscriptenModuleWithFS,
    blob: Blob,
    chunkSize = 4 * 1024 * 1024, // 4MB por ventana
    onChunkLoaded: (heapPtr: number, actualBytes: number, isLast: boolean) => void | Promise<void>,
  ): Promise<void> {
    // Reservamos UN SOLO bloque fijo de 4MB en el Heap de C++
    const ptr = wasmModule._malloc(chunkSize);
    if (ptr === 0) throw new Error('WASM_OOM: Incapaz de reservar ventana de 4MB en Heap.');

    const totalSize = blob.size;
    let offset = 0;

    try {
      while (offset < totalSize) {
        const end = Math.min(offset + chunkSize, totalSize);
        const slice = blob.slice(offset, end);
        const buffer = await slice.arrayBuffer();
        const uint8Chunk = new Uint8Array(buffer);

        // Copiamos los 4MB dentro del puntero reutilizable
        wasmModule.HEAPU8.set(uint8Chunk, ptr);

        const isLast = end >= totalSize;
        await onChunkLoaded(ptr, uint8Chunk.byteLength, isLast);

        // Limpiamos el chunk temporal de JS
        uint8Chunk.fill(0);
        offset = end;
      }
    } finally {
      // Zeroization de la ventana en WASM antes de hacer free()
      wasmModule.HEAPU8.fill(0, ptr, ptr + chunkSize);
      wasmModule._free(ptr);
    }
  }
}
