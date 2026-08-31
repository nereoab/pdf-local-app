export async function convertWithApi(
  endpoint: string,
  file: File,
  extraParams?: Record<string, string>,
  onProgress?: (pct: number, msg: string) => void,
): Promise<Blob> {
  const engineName =
    extraParams?.engine === 'cloudconvert'
      ? 'CloudConvert'
      : extraParams?.engine === 'adobe'
        ? 'Adobe Acrobat'
        : 'el motor seleccionado';
  onProgress?.(10, `Subiendo archivo a ${engineName}...`);

  const formData = new FormData();
  formData.append('file', file);
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => formData.append(k, v));
  }

  let progress = 15;
  const progressInterval = setInterval(() => {
    if (progress < 85) {
      progress += Math.floor(Math.random() * 8) + 5;
      if (progress > 85) progress = 85;

      let msg = `Procesando con ${engineName}...`;
      if (progress > 45 && progress <= 70) {
        msg = 'Reconstruyendo tablas, vectores y capas estructuradas...';
      } else if (progress > 70) {
        msg = 'Generando documento final de alta fidelidad...';
      }

      onProgress?.(progress, msg);
    }
  }, 400);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Error del servidor (${res.status})`);
    }

    onProgress?.(95, 'Descargando archivo final...');
    const blob = await res.blob();
    onProgress?.(100, '¡Conversión completada con éxito!');
    return blob;
  } catch (err) {
    clearInterval(progressInterval);
    throw err;
  }
}
