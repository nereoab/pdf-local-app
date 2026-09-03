/**
 * Servicio de Conversión en la Nube con CloudConvert API v2
 * Soporta conversión universal entre PDF, Word, Excel, PowerPoint, Imágenes y HTML.
 */

export async function convertWithCloudConvert(
  inputBuffer: Buffer,
  fileName = 'document.pdf',
  outputFormat: string,
  options?: { engine?: string; pages?: string },
): Promise<Buffer> {
  const apiKey =
    process.env.CLOUDCONVERT_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDCONVERT_API_KEY ||
    process.env.NEXT_PUBLIC_CONVERTAPI_SECRET;

  if (!apiKey) {
    throw new Error(
      'CLOUDCONVERT_API_KEY no está configurada en las variables de entorno (.env.local)',
    );
  }

  const convertOptions: Record<string, any> = {
    operation: 'convert',
    input: 'import-file',
    output_format: outputFormat.toLowerCase(),
  };

  if (options?.engine) {
    convertOptions.engine = options.engine;
  }

  // 1. Crear el Trabajo (Job) con las 3 tareas necesarias: import -> convert -> export
  const createJobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tasks: {
        'import-file': {
          operation: 'import/upload',
        },
        'convert-file': convertOptions,
        'export-file': {
          operation: 'export/url',
          input: 'convert-file',
          inline: false,
          archive_multiple_files: false,
        },
      },
    }),
  });

  if (!createJobRes.ok) {
    const errText = await createJobRes.text();
    throw new Error(`Error al crear trabajo en CloudConvert (${createJobRes.status}): ${errText}`);
  }

  const jobData = await createJobRes.json();
  const tasks = jobData?.data?.tasks || [];
  const uploadTask = tasks.find((t: any) => t.operation === 'import/upload');
  const jobId = jobData?.data?.id;

  if (!uploadTask || !uploadTask.result?.form?.url) {
    throw new Error('No se recibió la URL de carga para CloudConvert');
  }

  // 2. Subir el archivo al formulario firmado de CloudConvert
  const uploadUrl = uploadTask.result.form.url;
  const formParameters = uploadTask.result.form.parameters || {};

  const formData = new FormData();
  for (const [key, value] of Object.entries(formParameters)) {
    formData.append(key, value as string);
  }

  const blob = new Blob([new Uint8Array(inputBuffer)]);
  formData.append('file', blob, fileName);

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.text();
    throw new Error(`Error en la subida a CloudConvert (${uploadRes.status}): ${uploadErr}`);
  }

  // 3. Esperar la finalización del trabajo de conversión en la nube
  const waitJobRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}/wait`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!waitJobRes.ok) {
    throw new Error(`Error al esperar conversión en CloudConvert (${waitJobRes.status})`);
  }

  const finishedJob = await waitJobRes.json();
  if (finishedJob?.data?.status !== 'finished') {
    throw new Error(
      `El trabajo en CloudConvert no finalizó correctamente: ${finishedJob?.data?.status}`,
    );
  }

  const exportTask = finishedJob.data.tasks.find((t: any) => t.operation === 'export/url');
  const downloadFile = exportTask?.result?.files?.[0];

  if (!downloadFile || !downloadFile.url) {
    throw new Error('No se encontró el enlace de descarga del archivo convertido en CloudConvert');
  }

  // 4. Descargar el archivo resultante
  const downloadRes = await fetch(downloadFile.url);
  if (!downloadRes.ok) {
    throw new Error(
      `Error al descargar el archivo generado por CloudConvert (${downloadRes.status})`,
    );
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helpers específicos por formato
export async function convertPdfToDocxWithCloudConvert(
  pdfBuffer: Buffer,
  fileName = 'document.pdf',
) {
  return convertWithCloudConvert(pdfBuffer, fileName, 'docx');
}

export async function convertPdfToExcelWithCloudConvert(
  pdfBuffer: Buffer,
  fileName = 'document.pdf',
) {
  return convertWithCloudConvert(pdfBuffer, fileName, 'xlsx');
}

export async function convertPdfToPowerPointWithCloudConvert(
  pdfBuffer: Buffer,
  fileName = 'document.pdf',
) {
  return convertWithCloudConvert(pdfBuffer, fileName, 'pptx');
}

export async function convertPdfToJpgWithCloudConvert(
  pdfBuffer: Buffer,
  fileName = 'document.pdf',
) {
  return convertWithCloudConvert(pdfBuffer, fileName, 'jpg');
}

export async function convertPdfToHtmlWithCloudConvert(
  pdfBuffer: Buffer,
  fileName = 'document.pdf',
) {
  return convertWithCloudConvert(pdfBuffer, fileName, 'html');
}

export async function convertExcelToPdfWithCloudConvert(
  excelBuffer: Buffer,
  fileName = 'document.xlsx',
) {
  return convertWithCloudConvert(excelBuffer, fileName, 'pdf', { engine: 'office' });
}

export async function convertPowerPointToPdfWithCloudConvert(
  pptxBuffer: Buffer,
  fileName = 'document.pptx',
) {
  return convertWithCloudConvert(pptxBuffer, fileName, 'pdf', { engine: 'office' });
}

export async function convertWordToPdfWithCloudConvert(
  docxBuffer: Buffer,
  fileName = 'document.docx',
) {
  return convertWithCloudConvert(docxBuffer, fileName, 'pdf', { engine: 'office' });
}

export async function convertJpgToPdfWithCloudConvert(jpgBuffer: Buffer, fileName = 'image.jpg') {
  return convertWithCloudConvert(jpgBuffer, fileName, 'pdf');
}

export async function convertHtmlToPdfWithCloudConvert(
  htmlBuffer: Buffer,
  fileName = 'document.html',
) {
  return convertWithCloudConvert(htmlBuffer, fileName, 'pdf');
}
