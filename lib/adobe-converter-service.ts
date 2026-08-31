import { Readable } from 'stream';

function getAdobeClient() {
  const clientId = process.env.PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.PDF_SERVICES_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de Adobe PDF Services no configuradas en el entorno');
  }

  const {
    ServicePrincipalCredentials,
    PDFServices,
    MimeType,
    ExportPDFJob,
    ExportPDFParams,
    ExportPDFTargetFormat,
    ExportPDFResult,
    CreatePDFJob,
    CreatePDFResult,
    ExportPDFToImagesJob,
    ExportPDFToImagesParams,
    ExportPDFToImagesTargetFormat,
    ExportPDFToImagesResult,
  } = require('@adobe/pdfservices-node-sdk');

  const credentials = new ServicePrincipalCredentials({
    clientId,
    clientSecret,
  });

  const pdfServices = new PDFServices({ credentials });

  return {
    pdfServices,
    MimeType,
    ExportPDFJob,
    ExportPDFParams,
    ExportPDFTargetFormat,
    ExportPDFResult,
    CreatePDFJob,
    CreatePDFResult,
    ExportPDFToImagesJob,
    ExportPDFToImagesParams,
    ExportPDFToImagesTargetFormat,
    ExportPDFToImagesResult,
  };
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err: Error) => reject(err));
  });
}

/**
 * 1. PDF ➔ DOCX (Word)
 */
export async function convertPdfToDocxWithAdobe(pdfBuffer: Buffer): Promise<Buffer> {
  const {
    pdfServices,
    MimeType,
    ExportPDFJob,
    ExportPDFParams,
    ExportPDFTargetFormat,
    ExportPDFResult,
  } = getAdobeClient();
  const readStream = Readable.from(pdfBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: MimeType.PDF,
  });

  const params = new ExportPDFParams({
    targetFormat: ExportPDFTargetFormat.DOCX,
  });

  const job = new ExportPDFJob({ inputAsset, params });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: ExportPDFResult,
  });

  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}

/**
 * 2. Word (DOCX/DOC) ➔ PDF
 */
export async function convertWordToPdfWithAdobe(docBuffer: Buffer, isDocx = true): Promise<Buffer> {
  const { pdfServices, MimeType, CreatePDFJob, CreatePDFResult } = getAdobeClient();
  const readStream = Readable.from(docBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: isDocx ? MimeType.DOCX : MimeType.DOC,
  });

  const job = new CreatePDFJob({ inputAsset });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: CreatePDFResult,
  });

  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}

/**
 * 3. PDF ➔ XLSX (Excel)
 */
export async function convertPdfToExcelWithAdobe(pdfBuffer: Buffer): Promise<Buffer> {
  const {
    pdfServices,
    MimeType,
    ExportPDFJob,
    ExportPDFParams,
    ExportPDFTargetFormat,
    ExportPDFResult,
  } = getAdobeClient();
  const readStream = Readable.from(pdfBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: MimeType.PDF,
  });

  const params = new ExportPDFParams({
    targetFormat: ExportPDFTargetFormat.XLSX,
  });

  const job = new ExportPDFJob({ inputAsset, params });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: ExportPDFResult,
  });

  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}

/**
 * 4. Excel (XLSX/XLS) ➔ PDF
 */
export async function convertExcelToPdfWithAdobe(
  xlsBuffer: Buffer,
  isXlsx = true,
): Promise<Buffer> {
  const { pdfServices, MimeType, CreatePDFJob, CreatePDFResult } = getAdobeClient();
  const readStream = Readable.from(xlsBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: isXlsx ? MimeType.XLSX : MimeType.XLS,
  });

  const job = new CreatePDFJob({ inputAsset });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: CreatePDFResult,
  });

  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}

/**
 * 5. PDF ➔ PPTX (PowerPoint)
 */
export async function convertPdfToPowerPointWithAdobe(pdfBuffer: Buffer): Promise<Buffer> {
  const {
    pdfServices,
    MimeType,
    ExportPDFJob,
    ExportPDFParams,
    ExportPDFTargetFormat,
    ExportPDFResult,
  } = getAdobeClient();
  const readStream = Readable.from(pdfBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: MimeType.PDF,
  });

  const params = new ExportPDFParams({
    targetFormat: ExportPDFTargetFormat.PPTX,
  });

  const job = new ExportPDFJob({ inputAsset, params });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: ExportPDFResult,
  });

  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}

/**
 * 6. PowerPoint (PPTX/PPT) ➔ PDF
 */
export async function convertPowerPointToPdfWithAdobe(
  pptBuffer: Buffer,
  isPptx = true,
): Promise<Buffer> {
  const { pdfServices, MimeType, CreatePDFJob, CreatePDFResult } = getAdobeClient();
  const readStream = Readable.from(pptBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: isPptx ? MimeType.PPTX : MimeType.PPT,
  });

  const job = new CreatePDFJob({ inputAsset });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: CreatePDFResult,
  });

  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}

/**
 * 7. PDF ➔ Imágenes (JPG / PNG en ZIP)
 */
export async function convertPdfToImagesWithAdobe(
  pdfBuffer: Buffer,
  format: 'jpeg' | 'png' = 'jpeg',
): Promise<Buffer> {
  const {
    pdfServices,
    MimeType,
    ExportPDFToImagesJob,
    ExportPDFToImagesParams,
    ExportPDFToImagesTargetFormat,
    ExportPDFToImagesResult,
  } = getAdobeClient();
  const readStream = Readable.from(pdfBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: MimeType.PDF,
  });

  const params = new ExportPDFToImagesParams({
    targetFormat:
      format === 'png' ? ExportPDFToImagesTargetFormat.PNG : ExportPDFToImagesTargetFormat.JPEG,
  });

  const job = new ExportPDFToImagesJob({ inputAsset, params });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: ExportPDFToImagesResult,
  });

  const resultAsset = pdfServicesResponse.result.assets[0];
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}

/**
 * 8. Imagen (JPG / PNG) ➔ PDF
 */
export async function convertImageToPdfWithAdobe(
  imgBuffer: Buffer,
  mime: 'image/jpeg' | 'image/png' | string,
): Promise<Buffer> {
  const { pdfServices, MimeType, CreatePDFJob, CreatePDFResult } = getAdobeClient();
  const readStream = Readable.from(imgBuffer);

  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: mime.includes('png') ? MimeType.PNG : MimeType.JPEG,
  });

  const job = new CreatePDFJob({ inputAsset });
  const pollingURL = await pdfServices.submit({ job });

  const pdfServicesResponse = await pdfServices.getJobResult({
    pollingURL,
    resultType: CreatePDFResult,
  });

  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({ asset: resultAsset });
  return await streamToBuffer(streamAsset.readStream);
}
