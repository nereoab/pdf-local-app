---
name: nextjs-worker-performance
description: >-
  Optimización de rendimiento, gestión de memoria y procesamiento asíncrono con Web Workers y API Routes en Next.js.
  Utilizar al manipular archivos PDF pesados, diseñar o depurar Web Workers en el navegador,
  o configurar timeouts y buffers en endpoints del servidor.
---

# Next.js & Web Worker Performance Mastery for PDF Processing

Esta skill establece las pautas para procesar documentos PDF de gran tamaño (100MB+, 100+ páginas) en **PDFBlack** manteniendo la interfaz fluida (60 FPS) y evitando errores de agotamiento de memoria (*Out of Memory*).

---

## 1. Arquitectura de Procesamiento en Cliente (Web Workers)

Toda operación pesada que involucre `pdf-lib` o `pdfjs-dist` en el navegador **debe ejecutarse dentro de un Web Worker** para no congelar el hilo principal de la UI:

### A. Ubicación de Workers
* Los workers residen en la carpeta `workers/`:
  * `workers/pdf-merge.worker.ts`: Unir múltiples PDFs en streaming.
  * `workers/pdf-split.worker.ts`: División y extracción de rangos de páginas.
  * `workers/pdf-edit.worker.ts`: Rotación, reordenamiento y eliminación de páginas.

### B. Patrón de Transferencia de Memoria (*Zero-Copy Transfer*)
Para evitar duplicar la memoria en el navegador al enviar buffers grandes entre el componente React y el Web Worker:
```typescript
// Enviar al worker transfiriendo la propiedad del ArrayBuffer (sin clonar en RAM):
const arrayBuffer = await file.arrayBuffer();
worker.postMessage({ type: 'PROCESS', buffer: arrayBuffer }, [arrayBuffer]);
```

### C. Limpieza de Recursos y Revocación de ObjectURLs
Siempre liberar las URLs de descarga creadas con `URL.createObjectURL` para evitar fugas de memoria (*memory leaks*):
```typescript
useEffect(() => {
  return () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  };
}, [downloadUrl]);
```

---

## 2. Endpoints de Servidor (Next.js API Routes)

Para operaciones de conversión profunda ejecutadas mediante procesos externos (`python`, `soffice` / LibreOffice, Word COM):

### A. Ejecución de Subprocesos Segura en Windows
Al invocar scripts en `server/`:
* Usar `spawn` de Node.js con `windowsHide: true` para no abrir ventanas emergentes de consola en la pantalla del usuario.
* Desactivar buffers innecesarios o silenciar salidas de depuración excesivas en Python para evitar bloqueos por buffer lleno en `stdout`/`stderr`.

### B. Timeouts Adaptativos
Nunca usar un timeout fijo pequeño (como 30s o 45s) en documentos que pueden tener 100+ páginas:
```typescript
// Calcular timeout proporcional al volumen de páginas con margen de seguridad
const timeoutDuration = Math.max(180000, (effectivePageCount || 40) * 3500);
```

### C. Limpieza Garantizada de Archivos Temporales
Siempre utilizar bloques `try / finally` en las rutas de API para borrar los archivos `.pdf` y `.docx` temporales generados en `os.tmpdir()`:
```typescript
finally {
  await Promise.allSettled([
    fs.promises.unlink(tempInputPath).catch(() => {}),
    fs.promises.unlink(tempOutputPath).catch(() => {}),
  ]);
}
```
