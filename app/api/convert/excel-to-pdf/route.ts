import { NextRequest, NextResponse } from 'next/server';
import { convertExcelToPdfWithAdobe } from '@/lib/adobe-converter-service';
import { convertExcelToPdfWithCloudConvert } from '@/lib/cloudconvert-service';
import { convertExcelToPdfWithGemini } from '@/lib/gemini-converter-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const engine = (formData.get('engine') as string) || 'auto';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}.pdf`;

    // 1. Motor Gemini AI (Reconstructor de Tablas y Cuadros)
    if (engine === 'gemini') {
      try {
        console.log('[Excel-to-PDF] Converting with Gemini AI Structural Engine...');
        const pdfBuffer = await convertExcelToPdfWithGemini(buffer, file.name);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (geminiErr) {
        console.warn('[Excel-to-PDF] Gemini error, falling back to CloudConvert:', geminiErr);
      }
    }

    // 2. CloudConvert API v2
    if (engine === 'cloudconvert') {
      try {
        console.log('[Excel-to-PDF] Converting with CloudConvert API v2...');
        const pdfBuffer = await convertExcelToPdfWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn('[Excel-to-PDF] CloudConvert API error, attempting Adobe fallback:', ccErr);
      }
    }

    // 3. Adobe Acrobat Services API
    if (process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET) {
      try {
        console.log('[Excel-to-PDF] Converting with Adobe Acrobat Services...');
        const pdfBuffer = await convertExcelToPdfWithAdobe(buffer, isXlsx);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn('[Excel-to-PDF] Adobe API error, attempting CloudConvert fallback:', adobeErr);
      }
    }

    // 4. Fallback general
    try {
      const pdfBuffer = await convertExcelToPdfWithGemini(buffer, file.name);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeOutName}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (finalErr) {
      console.warn('[Excel-to-PDF] Final fallback error:', finalErr);
    }

    return NextResponse.json(
      { error: 'Servicio de conversión no disponible temporalmente' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API excel-to-pdf error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
