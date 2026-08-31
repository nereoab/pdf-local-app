import { NextRequest, NextResponse } from 'next/server';
import { convertPdfToImagesWithAdobe } from '@/lib/adobe-converter-service';
import { convertPdfToJpgWithCloudConvert } from '@/lib/cloudconvert-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string | null) || 'jpeg';
    const engine = (formData.get('engine') as string) || 'auto';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}_Imagenes.zip`;

    // 1. CloudConvert API v2
    if (engine === 'cloudconvert') {
      try {
        console.log('[PDF-to-Images] Converting with CloudConvert API v2...');
        const imageBuffer = await convertPdfToJpgWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(imageBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}_1.jpg"`,
            'Content-Length': imageBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn('[PDF-to-Images] CloudConvert API error, attempting Adobe fallback:', ccErr);
      }
    }

    // 2. Adobe Acrobat Services API
    if (process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET) {
      try {
        console.log('[PDF-to-Images] Converting with Adobe Acrobat Services...');
        const zipBuffer = await convertPdfToImagesWithAdobe(
          buffer,
          format === 'png' ? 'png' : 'jpeg',
        );
        return new NextResponse(new Uint8Array(zipBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': zipBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn('[PDF-to-Images] Adobe API error, attempting fallback:', adobeErr);
      }
    }

    // Fallback CloudConvert
    if (engine !== 'cloudconvert') {
      try {
        const imageBuffer = await convertPdfToJpgWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(imageBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}_1.jpg"`,
            'Content-Length': imageBuffer.length.toString(),
          },
        });
      } catch (ccErr2) {
        console.warn('[PDF-to-Images] CloudConvert fallback error:', ccErr2);
      }
    }

    return NextResponse.json(
      { error: 'Servicio de conversión no disponible temporalmente' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API pdf-to-jpg error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
