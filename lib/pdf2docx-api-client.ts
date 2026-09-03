export interface ApiConversionOptions {
  pages?: number[];
  layoutMode?: 'exact' | 'flowing';
  includeImages?: boolean;
  primaryFont?: string;
  addPageBreaks?: boolean;
  engine?: 'adobe' | 'local' | 'pdf2docx' | 'cloudconvert' | 'gemini' | 'auto';
  onProgress?: (pct: number, msg: string) => void;
}

/**
 * Convierte un archivo PDF a Word (.docx) usando el motor seleccionado (Adobe, CloudConvert, Gemini, Local o pdf2docx)
 */
export async function convertPdfToWordWithApi(
  file: File,
  options?: ApiConversionOptions,
): Promise<Blob> {
  const onProgress = options?.onProgress;
  const initialMsg =
    options?.engine === 'gemini'
      ? 'Iniciando reconstrucción semántica con Gemini AI...'
      : options?.engine === 'adobe'
        ? 'Enviando a Adobe Acrobat Services...'
        : options?.engine === 'cloudconvert'
          ? 'Enviando a CloudConvert API v2 (Nube Privada)...'
          : options?.engine === 'pdf2docx'
            ? 'Iniciando motor pdf2docx (análisis de tablas y columnas)...'
            : 'Enviando documento al motor de conversión...';
  onProgress?.(10, initialMsg);

  const formData = new FormData();
  formData.append('file', file);
  if (options?.pages && options.pages.length > 0) {
    formData.append('pages', options.pages.join(','));
  }
  if (options?.layoutMode) {
    formData.append('layoutMode', options.layoutMode);
  }
  if (options?.includeImages !== undefined) {
    formData.append('includeImages', options.includeImages ? 'true' : 'false');
  }
  if (options?.primaryFont) {
    formData.append('primaryFont', options.primaryFont);
  }
  if (options?.addPageBreaks !== undefined) {
    formData.append('addPageBreaks', options.addPageBreaks ? 'true' : 'false');
  }
  if (options?.engine) {
    formData.append('engine', options.engine);
  }

  // Progreso simulado fluido durante el análisis estructural
  let progress = 15;
  const progressInterval = setInterval(() => {
    if (progress < 85) {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress > 85) progress = 85;

      let msg = 'Analizando jerarquía tipográfica y estructura...';
      if (progress > 35 && progress <= 60) {
        msg = 'Reconstruyendo tablas, bordes y columnas de texto...';
      } else if (progress > 60) {
        msg = 'Generando documento nativo OpenXML (.docx)...';
      }

      onProgress?.(progress, msg);
    }
  }, 400);

  try {
    const response = await fetch('/api/convert/pdf-to-word', {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `Error del servidor (${response.status})`);
    }

    onProgress?.(95, 'Finalizando descarga del documento Word...');
    const blob = await response.blob();
    onProgress?.(100, '¡Conversión completada!');
    return blob;
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}
