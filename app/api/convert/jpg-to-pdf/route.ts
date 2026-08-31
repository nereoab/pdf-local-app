import { NextRequest, NextResponse } from 'next/server';
import { convertImageToPdfWithAdobe } from '@/lib/adobe-converter-service';
import { convertJpgToPdfWithCloudConvert } from '@/lib/cloudconvert-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const engine = (formData.get('engine') as string) || 'auto';

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo de imagen' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}.pdf`;

    // 1. CloudConvert API v2
    if (engine === 'cloudconvert') {
      try {
        console.log('[JPG-to-PDF] Converting with CloudConvert API v2...');
        const pdfBuffer = await convertJpgToPdfWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn('[JPG-to-PDF] CloudConvert API error, attempting Adobe fallback:', ccErr);
      }
    }

    // 2. Adobe Acrobat Services API
    if (process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET) {
      try {
        console.log('[JPG-to-PDF] Converting with Adobe Acrobat Services...');
        const pdfBuffer = await convertImageToPdfWithAdobe(buffer, file.type || 'image/jpeg');
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn('[JPG-to-PDF] Adobe API error, attempting fallback:', adobeErr);
      }
    }

    // Fallback CloudConvert
    if (engine !== 'cloudconvert') {
      try {
        const pdfBuffer = await convertJpgToPdfWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (ccErr2) {
        console.warn('[JPG-to-PDF] CloudConvert fallback error:', ccErr2);
      }
    }

    return NextResponse.json(
      { error: 'Servicio de conversión no disponible temporalmente' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API jpg-to-pdf error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
