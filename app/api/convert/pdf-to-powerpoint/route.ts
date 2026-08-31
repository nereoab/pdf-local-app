import { NextRequest, NextResponse } from 'next/server';
import { convertPdfToPowerPointWithAdobe } from '@/lib/adobe-converter-service';
import { convertPdfToPowerPointWithCloudConvert } from '@/lib/cloudconvert-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const engine = (formData.get('engine') as string) || 'auto';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}_PowerPoint.pptx`;

    // 1. CloudConvert API v2
    if (engine === 'cloudconvert') {
      try {
        console.log('[PDF-to-PowerPoint] Converting with CloudConvert API v2...');
        const pptxBuffer = await convertPdfToPowerPointWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(pptxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pptxBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn(
          '[PDF-to-PowerPoint] CloudConvert API error, attempting Adobe fallback:',
          ccErr,
        );
      }
    }

    // 2. Adobe Acrobat Services API
    if (process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET) {
      try {
        console.log('[PDF-to-PowerPoint] Converting with Adobe Acrobat Services...');
        const pptxBuffer = await convertPdfToPowerPointWithAdobe(buffer);
        return new NextResponse(new Uint8Array(pptxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pptxBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn(
          '[PDF-to-PowerPoint] Adobe API error, attempting CloudConvert fallback:',
          adobeErr,
        );
      }
    }

    // Fallback: CloudConvert
    if (engine !== 'cloudconvert') {
      try {
        const pptxBuffer = await convertPdfToPowerPointWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(pptxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pptxBuffer.length.toString(),
          },
        });
      } catch (ccErr2) {
        console.warn('[PDF-to-PowerPoint] CloudConvert fallback error:', ccErr2);
      }
    }

    return NextResponse.json(
      { error: 'Servicio de conversión no disponible temporalmente' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API pdf-to-powerpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
