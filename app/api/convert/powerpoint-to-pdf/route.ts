import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { convertPowerPointToPdfWithAdobe } from '@/lib/adobe-converter-service';
import { convertPowerPointToPdfWithCloudConvert } from '@/lib/cloudconvert-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function runLocalPptxToPdf(
  buffer: Buffer,
  originalFilename: string,
  aspectRatio: string = '16:9',
): Promise<Buffer | null> {
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const tempDir = os.tmpdir();
  const ext = originalFilename.toLowerCase().endsWith('.ppt') ? '.ppt' : '.pptx';
  const tempInputPath = path.join(tempDir, `pptx2pdf_in_${uniqueId}${ext}`);
  const tempOutputPath = path.join(tempDir, `pptx2pdf_out_${uniqueId}.pdf`);

  try {
    await fs.promises.writeFile(tempInputPath, buffer);
    const scriptPath = path.join(process.cwd(), 'server', 'pptx2pdf_convert.py');

    const pyProcess = spawn(
      'python',
      [scriptPath, tempInputPath, tempOutputPath, '--aspect-ratio', aspectRatio],
      {
        windowsHide: true,
      },
    );

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
        console.error('Python pptx spawn error:', err);
        resolve(1);
      });
    });

    if (
      exitCode === 0 &&
      fs.existsSync(tempOutputPath) &&
      (await fs.promises.stat(tempOutputPath)).size > 0
    ) {
      const pdfOutBuffer = await fs.promises.readFile(tempOutputPath);
      return pdfOutBuffer;
    } else {
      console.warn('Local Python pptx conversion error:', stderrData || stdoutData);
      return null;
    }
  } catch (err) {
    console.error('runLocalPptxToPdf exception:', err);
    return null;
  } finally {
    try {
      if (fs.existsSync(tempInputPath)) await fs.promises.unlink(tempInputPath);
      if (fs.existsSync(tempOutputPath)) await fs.promises.unlink(tempOutputPath);
    } catch {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const engine = (formData.get('engine') as string) || 'local';
    const aspectRatio = (formData.get('aspectRatio') as string) || '16:9';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isPptx = file.name.toLowerCase().endsWith('.pptx');
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}.pdf`;

    // 1. Motor Local Nativo (Prioritario si se solicita 'local', 'auto' o predeterminado en entorno local)
    if (engine === 'local' || engine === 'auto') {
      console.log('[PowerPoint-to-PDF] Converting with Local Native Office/PyMuPDF Engine...');
      const localPdf = await runLocalPptxToPdf(buffer, file.name, aspectRatio);
      if (localPdf) {
        return new NextResponse(new Uint8Array(localPdf), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${originalName.replace(/["\\]/g, '')}.pdf"; filename*=UTF-8''${safeOutName}`,
            'Content-Length': localPdf.length.toString(),
          },
        });
      }
    }

    // 2. Adobe Acrobat Services API (si se seleccionó específicamente y hay credenciales)
    if (
      engine === 'adobe' &&
      process.env.PDF_SERVICES_CLIENT_ID &&
      process.env.PDF_SERVICES_CLIENT_SECRET
    ) {
      try {
        console.log('[PowerPoint-to-PDF] Converting with Adobe Acrobat Services...');
        const pdfBuffer = await convertPowerPointToPdfWithAdobe(buffer, isPptx);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${originalName.replace(/["\\]/g, '')}.pdf"; filename*=UTF-8''${safeOutName}`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn(
          '[PowerPoint-to-PDF] Adobe API error/timeout, falling back to Local Native Engine:',
          adobeErr,
        );
      }
    }

    // 3. CloudConvert API v2 (si se seleccionó específicamente)
    if (engine === 'cloudconvert') {
      try {
        console.log('[PowerPoint-to-PDF] Converting with CloudConvert API v2...');
        const pdfBuffer = await convertPowerPointToPdfWithCloudConvert(buffer, file.name);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${originalName.replace(/["\\]/g, '')}.pdf"; filename*=UTF-8''${safeOutName}`,
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn(
          '[PowerPoint-to-PDF] CloudConvert API error, falling back to Local Native Engine:',
          ccErr,
        );
      }
    }

    // 4. Fallback Seguro Garantizado: Motor Local Nativo (Office COM / PyMuPDF)
    console.log('[PowerPoint-to-PDF] Executing guaranteed Local Native Engine...');
    const localPdfFallback = await runLocalPptxToPdf(buffer, file.name, aspectRatio);
    if (localPdfFallback) {
      return new NextResponse(new Uint8Array(localPdfFallback), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${originalName.replace(/["\\]/g, '')}.pdf"; filename*=UTF-8''${safeOutName}`,
          'Content-Length': localPdfFallback.length.toString(),
        },
      });
    }

    return NextResponse.json(
      { error: 'No se pudo procesar la presentación PowerPoint' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API powerpoint-to-pdf error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
