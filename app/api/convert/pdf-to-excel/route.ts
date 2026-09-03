import { NextRequest, NextResponse } from 'next/server';
import { convertPdfToExcelWithAdobe } from '@/lib/adobe-converter-service';
import { convertPdfToExcelWithCloudConvert } from '@/lib/cloudconvert-service';
import { convertPdfToExcelWithGemini } from '@/lib/gemini-converter-service';

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
    const safeOutName = `${encodeURIComponent(originalName)}_Excel.xlsx`;

    // 1. Motor Gemini AI (Reconstrucción de Tablas y Cuadros desde Cero)
    if (engine === 'gemini') {
      try {
        console.log('[PDF-to-Excel] Converting with Gemini AI Structural Engine...');
        const xlsxBuffer = await convertPdfToExcelWithGemini(buffer, file.name);
        return new NextResponse(new Uint8Array(xlsxBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': xlsxBuffer.length.toString(),
          },
        });
      } catch (geminiErr: any) {
        console.error('[PDF-to-Excel] Gemini error:', geminiErr);
        return NextResponse.json(
          {
            error:
              geminiErr?.message ||
              'Error en el motor Gemini AI. Asegúrate de configurar GEMINI_API_KEY.',
          },
          { status: 400 },
        );
      }
    }

    // 2. CloudConvert API v2
    if (engine === 'cloudconvert') {
      try {
        console.log('[PDF-to-Excel] Converting with CloudConvert API v2...');
        const xlsxBuffer = await convertPdfToExcelWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(xlsxBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': xlsxBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn('[PDF-to-Excel] CloudConvert API error, attempting Adobe fallback:', ccErr);
      }
    }

    // 3. Adobe Acrobat Services API
    if (process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET) {
      try {
        console.log('[PDF-to-Excel] Converting with Adobe Acrobat Services...');
        const xlsxBuffer = await convertPdfToExcelWithAdobe(buffer);
        return new NextResponse(new Uint8Array(xlsxBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': xlsxBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn('[PDF-to-Excel] Adobe API error, attempting CloudConvert fallback:', adobeErr);
      }
    }

    // 4. Fallback universal con Gemini / CloudConvert
    try {
      const xlsxBuffer = await convertPdfToExcelWithGemini(buffer, file.name);
      return new NextResponse(new Uint8Array(xlsxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${safeOutName}"`,
          'Content-Length': xlsxBuffer.length.toString(),
        },
      });
    } catch (ccErr2) {
      console.warn('[PDF-to-Excel] Final fallback error:', ccErr2);
    }

    return NextResponse.json(
      { error: 'Servicio de conversión no disponible temporalmente' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API pdf-to-excel error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
