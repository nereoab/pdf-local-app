import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { convertPdfToExcelWithAdobe } from '@/lib/adobe-converter-service';
import { convertPdfToExcelWithCloudConvert } from '@/lib/cloudconvert-service';
import { convertPdfToExcelWithGemini } from '@/lib/gemini-converter-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  let tempInputPath = '';
  let tempOutputPath = '';

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const engine = (formData.get('engine') as string) || 'local';
    const pages = formData.get('pages') as string | null;
    const sheetStructure = (formData.get('sheetStructure') as string) || 'per_page';
    const theme = (formData.get('theme') as string) || 'corporate_blue';
    const autoFormat = formData.get('autoFormat') !== 'false';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}_Excel.xlsx`;

    // 1. Motor Gemini AI (si fue explícitamente solicitado)
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

    // 2. CloudConvert API v2 (si fue explícitamente solicitado)
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
        console.warn('[PDF-to-Excel] CloudConvert API error, attempting fallback:', ccErr);
      }
    }

    // 3. Adobe Acrobat Services API (si fue explícitamente solicitado y hay credenciales)
    if (
      engine === 'adobe' &&
      process.env.PDF_SERVICES_CLIENT_ID &&
      process.env.PDF_SERVICES_CLIENT_SECRET
    ) {
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
        console.warn('[PDF-to-Excel] Adobe API error, attempting local fallback:', adobeErr);
      }
    }

    // 4. MOTOR LOCAL PDFBLACK HIGH-FIDELITY (Predeterminado, 100% Offline y Privado)
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = os.tmpdir();
    tempInputPath = path.join(tempDir, `pdf2xlsx_in_${uniqueId}.pdf`);
    tempOutputPath = path.join(tempDir, `pdf2xlsx_out_${uniqueId}.xlsx`);

    await fs.promises.writeFile(tempInputPath, buffer);

    console.log('[PDF-to-Excel] Converting with local PDFBlack High-Fidelity Python engine...');
    const localScriptPath = path.join(process.cwd(), 'server', 'pdf2xlsx_convert.py');
    const scriptArgs = [
      localScriptPath,
      tempInputPath,
      tempOutputPath,
      '--sheet-structure',
      sheetStructure,
      '--theme',
      theme,
    ];

    if (pages && pages.trim().length > 0) {
      scriptArgs.push('--pages', pages.trim());
    }

    if (!autoFormat) {
      scriptArgs.push('--no-auto-format');
    }

    const pyProcess = spawn('python', scriptArgs, { windowsHide: true });
    let pyStderr = '';
    let pyStdout = '';

    pyProcess.stdout.on('data', (data) => {
      pyStdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      pyStderr += data.toString();
    });

    const pageCountEstimate = pages ? pages.split(',').length : 30;
    const timeoutDuration = Math.max(180000, pageCountEstimate * 3500);

    const exitCode = await new Promise<number>((resolve) => {
      const timeout = setTimeout(() => {
        try {
          pyProcess.kill();
        } catch {}
        console.warn(`[PDF-to-Excel] Local engine timed out after ${timeoutDuration / 1000}s`);
        resolve(1);
      }, timeoutDuration);

      pyProcess.on('close', (code) => {
        clearTimeout(timeout);
        resolve(code ?? 1);
      });

      pyProcess.on('error', (err) => {
        clearTimeout(timeout);
        console.error('[PDF-to-Excel] spawn error:', err);
        resolve(1);
      });
    });

    if (exitCode === 0 && fs.existsSync(tempOutputPath)) {
      const stats = await fs.promises.stat(tempOutputPath);
      if (stats.size > 0) {
        const xlsxBuffer = await fs.promises.readFile(tempOutputPath);
        return new NextResponse(new Uint8Array(xlsxBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': xlsxBuffer.length.toString(),
          },
        });
      }
    }

    console.warn('[PDF-to-Excel] Local Python engine failed:', pyStderr);

    // 5. Fallback con Gemini si está configurado
    try {
      if (process.env.GEMINI_API_KEY) {
        console.log('[PDF-to-Excel] Fallback to Gemini AI Structural Engine...');
        const xlsxBuffer = await convertPdfToExcelWithGemini(buffer, file.name);
        return new NextResponse(new Uint8Array(xlsxBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': xlsxBuffer.length.toString(),
          },
        });
      }
    } catch (fallbackErr) {
      console.warn('[PDF-to-Excel] Fallback error:', fallbackErr);
    }

    return NextResponse.json(
      {
        error: `Error en la conversión a Excel: ${pyStderr || 'Fallo interno en el motor local.'}`,
      },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API pdf-to-excel error:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  } finally {
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      fs.promises.unlink(tempInputPath).catch(() => {});
    }
    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      fs.promises.unlink(tempOutputPath).catch(() => {});
    }
  }
}
