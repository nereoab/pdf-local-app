import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { convertWordToPdfWithAdobe } from '@/lib/adobe-converter-service';
import { convertWordToPdfWithCloudConvert } from '@/lib/cloudconvert-service';
import { convertWordToPdfWithGemini } from '@/lib/gemini-converter-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let tempInputPath = '';
  let tempOutputPath = '';

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const engine = (formData.get('engine') as string) || 'auto';
    const pageSize = (formData.get('pageSize') as string) || 'a4';
    const orientation = (formData.get('orientation') as string) || 'portrait';
    const margin = (formData.get('margin') as string) || 'normal';
    const pdfFontFamily = (formData.get('pdfFontFamily') as string) || 'helvetica';
    const pdfFontSize = (formData.get('pdfFontSize') as string) || '11';
    const pdfLineSpacing = (formData.get('pdfLineSpacing') as string) || '1.35';
    const addPageNumbers = (formData.get('addPageNumbers') as string) || 'true';
    const includeWordDocHeader = (formData.get('includeWordDocHeader') as string) || 'false';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo Word' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}.pdf`;

    // 1. Motor Gemini AI (Reconstructor Estructural)
    if (engine === 'gemini') {
      try {
        console.log('[Word-to-PDF] Converting with Gemini AI Engine...');
        const pdfBuffer = await convertWordToPdfWithGemini(buffer, file.name);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (geminiErr) {
        console.warn('[Word-to-PDF] Gemini AI error, attempting next engine:', geminiErr);
      }
    }

    const hasAdobeCredentials = Boolean(
      process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET,
    );
    const preferAdobe = engine === 'adobe' && hasAdobeCredentials;

    // 2. CloudConvert API v2
    if (engine === 'cloudconvert') {
      try {
        console.log('[Word-to-PDF] Converting with CloudConvert API v2...');
        const pdfBuffer = await convertWordToPdfWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn(
          '[Word-to-PDF] CloudConvert API error, attempting local engine fallback:',
          ccErr,
        );
      }
    }

    // 3. Adobe Acrobat Services API (si se solicita específicamente o en auto)
    if (preferAdobe) {
      try {
        console.log('[Word-to-PDF] Converting with Adobe Acrobat Services...');
        const pdfBuffer = await convertWordToPdfWithAdobe(buffer, isDocx);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn('[Word-to-PDF] Adobe API error, attempting local engine fallback:', adobeErr);
      }
    }

    // 4. Motor Local Python de Alto Rendimiento
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = os.tmpdir();
    const ext = isDocx ? '.docx' : '.doc';
    tempInputPath = path.join(tempDir, `word2pdf_in_${uniqueId}${ext}`);
    tempOutputPath = path.join(tempDir, `word2pdf_out_${uniqueId}.pdf`);

    await fs.promises.writeFile(tempInputPath, buffer);

    const scriptPath = path.join(process.cwd(), 'server', 'docx2pdf_convert.py');
    const args = [
      scriptPath,
      tempInputPath,
      tempOutputPath,
      '--page-size',
      pageSize,
      '--orientation',
      orientation,
      '--margin',
      margin,
      '--font-family',
      pdfFontFamily,
      '--font-size',
      pdfFontSize,
      '--line-spacing',
      pdfLineSpacing,
      '--add-page-numbers',
      addPageNumbers,
      '--include-header',
      includeWordDocHeader,
    ];

    try {
      const pyProcess = spawn('python', args, {
        windowsHide: true,
      });

      let stderrData = '';
      let stdoutData = '';

      pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      const exitCode = await new Promise<number>((resolve) => {
        pyProcess.on('close', (code) => {
          resolve(code ?? 1);
        });
        pyProcess.on('error', (err) => {
          console.error('Python spawn error:', err);
          resolve(1);
        });
      });

      if (exitCode === 0 && fs.existsSync(tempOutputPath)) {
        const pdfOutBuffer = await fs.promises.readFile(tempOutputPath);
        return new NextResponse(new Uint8Array(pdfOutBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfOutBuffer.length.toString(),
          },
        });
      } else {
        console.warn(
          'Local Python word conversion error, attempting Adobe fallback:',
          stderrData || stdoutData,
        );
      }
    } catch (localErr) {
      console.warn('Local engine execution error, falling back:', localErr);
    }

    // Fallback a Adobe si no se había intentado
    if (!preferAdobe && hasAdobeCredentials) {
      try {
        console.log('[Word-to-PDF] Fallback: Converting with Adobe Acrobat Services...');
        const pdfBuffer = await convertWordToPdfWithAdobe(buffer, isDocx);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn('[Word-to-PDF] Adobe fallback error:', adobeErr);
      }
    }

    return NextResponse.json(
      { error: 'No fue posible convertir el documento Word con los motores disponibles' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API word-to-pdf error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  } finally {
    try {
      if (tempInputPath && fs.existsSync(tempInputPath)) {
        await fs.promises.unlink(tempInputPath);
      }
      if (tempOutputPath && fs.existsSync(tempOutputPath)) {
        await fs.promises.unlink(tempOutputPath);
      }
    } catch (cleanupErr) {
      console.warn('Temp cleanup warning:', cleanupErr);
    }
  }
}
