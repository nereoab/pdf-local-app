import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { convertPdfToDocxWithAdobe } from '@/lib/adobe-converter-service';
import { convertPdfToDocxWithCloudConvert } from '@/lib/cloudconvert-service';
import { convertPdfToWordWithGemini } from '@/lib/gemini-converter-service';
import { PDFDocument } from 'pdf-lib';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max execution

async function extractSelectedPages(
  originalBuffer: Buffer,
  pagesStr: string | null,
): Promise<{ buffer: Buffer; pageCount: number; isSubSet: boolean }> {
  if (!pagesStr || !pagesStr.trim()) {
    return { buffer: originalBuffer, pageCount: 0, isSubSet: false };
  }
  try {
    const srcDoc = await PDFDocument.load(originalBuffer);
    const totalPages = srcDoc.getPageCount();
    const targetIndices: number[] = [];
    const parts = pagesStr.split(',');

    for (const part of parts) {
      const clean = part.trim();
      if (!clean) continue;
      if (clean.includes('-')) {
        const [sStr, eStr] = clean.split('-');
        const s = parseInt(sStr, 10);
        const e = parseInt(eStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          const start = Math.min(s, e);
          const end = Math.max(s, e);
          for (let p = start; p <= end; p++) {
            if (p >= 1 && p <= totalPages) targetIndices.push(p - 1);
          }
        }
      } else {
        const p = parseInt(clean, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          targetIndices.push(p - 1);
        }
      }
    }

    const uniqueIndices = Array.from(new Set(targetIndices)).sort((a, b) => a - b);
    if (uniqueIndices.length === 0 || uniqueIndices.length === totalPages) {
      return { buffer: originalBuffer, pageCount: totalPages, isSubSet: false };
    }

    const dstDoc = await PDFDocument.create();
    const copiedPages = await dstDoc.copyPages(srcDoc, uniqueIndices);
    copiedPages.forEach((cp) => dstDoc.addPage(cp));
    const slicedBytes = await dstDoc.save();

    console.log(
      `[PDF-to-Word] Sliced ${uniqueIndices.length} of ${totalPages} pages for conversion (reduced size: ${slicedBytes.length} bytes)`,
    );
    return {
      buffer: Buffer.from(slicedBytes),
      pageCount: uniqueIndices.length,
      isSubSet: true,
    };
  } catch (err) {
    console.warn('[PDF-to-Word] Page extraction error, using original buffer:', err);
    return { buffer: originalBuffer, pageCount: 0, isSubSet: false };
  }
}

export async function POST(req: NextRequest) {
  let tempInputPath = '';
  let tempOutputPath = '';

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pages = formData.get('pages') as string | null;
    const layoutMode = (formData.get('layoutMode') as string) || 'flowing';
    const includeImages = (formData.get('includeImages') as string) || 'true';
    const primaryFont = (formData.get('primaryFont') as string) || 'Calibri';
    const addPageBreaks = (formData.get('addPageBreaks') as string) || 'true';
    const engine = (formData.get('engine') as string) || 'auto';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const {
      buffer: activeBuffer,
      pageCount: activePageCount,
      isSubSet,
    } = await extractSelectedPages(rawBuffer, pages);
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}_Word.docx`;

    // 1. Motor Gemini AI (Reconstrucción Semántica de Tablas y Párrafos desde Cero)
    if (engine === 'gemini') {
      try {
        console.log('[PDF-to-Word] Converting with Gemini AI Structural Engine...');
        const geminiDocxBuffer = await convertPdfToWordWithGemini(activeBuffer, file.name, {
          pages: isSubSet ? undefined : pages || undefined,
        });
        return new NextResponse(new Uint8Array(geminiDocxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': geminiDocxBuffer.length.toString(),
          },
        });
      } catch (geminiErr: any) {
        console.error('[PDF-to-Word] Gemini AI error:', geminiErr);
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

    const effectivePageCount = isSubSet
      ? activePageCount
      : pages
        ? pages.split(',').filter(Boolean).length
        : 0;
    const hasAdobeCredentials = Boolean(
      process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET,
    );

    // 2. Si el usuario seleccionó Adobe (o auto con <= 200 págs) y hay credenciales de Adobe
    const preferAdobe =
      (engine === 'adobe' ||
        (engine === 'auto' && effectivePageCount > 0 && effectivePageCount <= 200)) &&
      hasAdobeCredentials;

    if (preferAdobe) {
      try {
        console.log('[PDF-to-Word] Converting with Adobe Acrobat Services...');
        const adobeDocxBuffer = await convertPdfToDocxWithAdobe(activeBuffer);
        return new NextResponse(new Uint8Array(adobeDocxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': adobeDocxBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn(
          '[PDF-to-Word] Adobe API error or page limit, falling back to next engine:',
          adobeErr,
        );
      }
    }

    // 3. Motor CloudConvert API v2 (Nube Privada)
    if (engine === 'cloudconvert') {
      try {
        console.log('[PDF-to-Word] Converting with CloudConvert API v2...');
        const cloudConvertDocxBuffer = await convertPdfToDocxWithCloudConvert(
          activeBuffer,
          file.name,
        );
        return new NextResponse(new Uint8Array(cloudConvertDocxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': cloudConvertDocxBuffer.length.toString(),
          },
        });
      } catch (ccErr) {
        console.warn(
          '[PDF-to-Word] CloudConvert API error or missing key, falling back to local engine:',
          ccErr,
        );
      }
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = os.tmpdir();
    tempInputPath = path.join(tempDir, `pdf2docx_in_${uniqueId}.pdf`);
    tempOutputPath = path.join(tempDir, `pdf2docx_out_${uniqueId}.docx`);

    await fs.promises.writeFile(tempInputPath, activeBuffer);

    // 4. Motor Local Avanzado: pdf2docx Oficial (Tablas complejas, columnas y maquetación nativa)
    if (engine === 'local' || engine === 'pdf2docx' || engine === 'auto') {
      try {
        console.log('[PDF-to-Word] Converting with official pdf2docx (Tables & Columns engine)...');
        const officialScriptPath = path.join(
          process.cwd(),
          'server',
          'pdf2docx_official_convert.py',
        );
        const officialArgs = [officialScriptPath, tempInputPath, tempOutputPath];
        // Si no se recortó previamente el archivo, pasar las páginas seleccionadas
        if (!isSubSet && pages && pages.trim().length > 0) {
          officialArgs.push('--pages', pages.trim());
        }

        const pyOfficialProcess = spawn('python', officialArgs, { windowsHide: true });
        let officialStderr = '';
        let officialStdout = '';

        pyOfficialProcess.stdout.on('data', (data) => {
          officialStdout += data.toString();
        });

        pyOfficialProcess.stderr.on('data', (data) => {
          officialStderr += data.toString();
        });

        const officialExitCode = await new Promise<number>((resolve) => {
          const timeout = setTimeout(() => {
            try {
              pyOfficialProcess.kill();
            } catch {}
            console.warn(
              '[PDF-to-Word] pdf2docx timed out after 45s, falling back to fast PyMuPDF engine',
            );
            resolve(1);
          }, 45000);

          pyOfficialProcess.on('close', (code) => {
            clearTimeout(timeout);
            resolve(code ?? 1);
          });
          pyOfficialProcess.on('error', (err) => {
            clearTimeout(timeout);
            console.error('pdf2docx spawn error:', err);
            resolve(1);
          });
        });

        if (
          officialExitCode === 0 &&
          fs.existsSync(tempOutputPath) &&
          (await fs.promises.stat(tempOutputPath)).size > 0
        ) {
          const docxBuffer = await fs.promises.readFile(tempOutputPath);
          return new NextResponse(new Uint8Array(docxBuffer), {
            status: 200,
            headers: {
              'Content-Type':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${safeOutName}"`,
              'Content-Length': docxBuffer.length.toString(),
            },
          });
        } else {
          console.warn(
            'Official pdf2docx conversion failed, falling back to local PyMuPDF engine:',
            officialStderr,
          );
        }
      } catch (officialErr) {
        console.warn('Official pdf2docx execution error, falling back:', officialErr);
      }
    }

    // 5. Motor Local Ultrarrápido de Alta Precisión (PyMuPDF - ~0.5s)
    const scriptPath = path.join(process.cwd(), 'server', 'pdf2docx_convert.py');
    const args = [
      scriptPath,
      tempInputPath,
      tempOutputPath,
      '--layout-mode',
      layoutMode,
      '--include-images',
      includeImages,
      '--primary-font',
      primaryFont,
      '--add-page-breaks',
      addPageBreaks,
    ];
    if (!isSubSet && pages && pages.trim().length > 0) {
      args.push('--pages', pages.trim());
    }

    try {
      const pythonCmd = process.env.PYTHON_PATH || 'python';
      const pyProcess = spawn(pythonCmd, args, {
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
        const timeout = setTimeout(() => {
          try {
            pyProcess.kill();
          } catch {}
          console.warn('[PDF-to-Word] PyMuPDF local engine timed out after 50s');
          resolve(1);
        }, 50000);

        pyProcess.on('close', (code) => {
          clearTimeout(timeout);
          resolve(code ?? 1);
        });
        pyProcess.on('error', (err) => {
          clearTimeout(timeout);
          console.error('Python spawn error:', err);
          resolve(1);
        });
      });

      if (exitCode === 0 && fs.existsSync(tempOutputPath)) {
        const docxBuffer = await fs.promises.readFile(tempOutputPath);
        return new NextResponse(new Uint8Array(docxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': docxBuffer.length.toString(),
          },
        });
      } else {
        console.warn(
          'Local Python conversion failed, attempting cloud fallback:',
          stderrData || stdoutData,
        );
      }
    } catch (localErr) {
      console.warn('Local engine execution error, falling back:', localErr);
    }

    // Fallback: Adobe Acrobat si no se había intentado
    if (!preferAdobe && hasAdobeCredentials) {
      try {
        console.log('[PDF-to-Word] Fallback: Converting with Adobe Acrobat Services...');
        const adobeDocxBuffer = await convertPdfToDocxWithAdobe(activeBuffer);
        return new NextResponse(new Uint8Array(adobeDocxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': adobeDocxBuffer.length.toString(),
          },
        });
      } catch (adobeErr) {
        console.warn('[PDF-to-Word] Adobe fallback error:', adobeErr);
      }
    }

    // Fallback Terciario: Google Cloud Run (Microservicio)
    const cloudRunUrl = process.env.CONVERTER_API_URL || process.env.NEXT_PUBLIC_CONVERTER_API_URL;
    if (cloudRunUrl) {
      try {
        const cloudFormData = new FormData();
        cloudFormData.append('file', file);
        if (pages) cloudFormData.append('pages', pages);
        cloudFormData.append('layoutMode', layoutMode);
        cloudFormData.append('includeImages', includeImages);

        const cloudRes = await fetch(`${cloudRunUrl.replace(/\/$/, '')}/convert/pdf-to-docx`, {
          method: 'POST',
          body: cloudFormData,
        });

        if (cloudRes.ok) {
          const docxArrayBuffer = await cloudRes.arrayBuffer();
          return new NextResponse(docxArrayBuffer, {
            status: 200,
            headers: {
              'Content-Type':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${safeOutName}"`,
              'Content-Length': docxArrayBuffer.byteLength.toString(),
            },
          });
        }
      } catch (cloudErr) {
        console.warn('Cloud Run service error:', cloudErr);
      }
    }

    return NextResponse.json(
      { error: 'No fue posible convertir el documento con los motores disponibles' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API pdf-to-word exception:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno durante la conversión' },
      { status: 500 },
    );
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
