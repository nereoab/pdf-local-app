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

const CLOUD_RUN_CONVERTER_URL =
  process.env.CONVERTER_API_URL ||
  process.env.NEXT_PUBLIC_CONVERTER_API_URL ||
  'https://pdfblack-converter-878586961850.us-central1.run.app';

/**
 * Invoca el microservicio de conversión de alta fidelidad alojado en Google Cloud Run.
 * Soporta 'pdf2docx' (Ultra HD), 'pymupdf' (instantáneo) y 'libreoffice' (red de seguridad).
 */
async function convertWithCloudRun(
  buffer: Buffer,
  engineType: 'pdf2docx' | 'pymupdf' | 'libreoffice' = 'pdf2docx',
): Promise<Buffer | null> {
  try {
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
    const cloudFormData = new FormData();
    cloudFormData.append('file', blob, 'document.pdf');
    cloudFormData.append('engine', engineType);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 95000);

    const targetUrl = `${CLOUD_RUN_CONVERTER_URL.replace(/\/$/, '')}/convert/pdf-to-docx`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      body: cloudFormData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer && arrayBuffer.byteLength > 1000) {
        return Buffer.from(arrayBuffer);
      }
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`[PDF-to-Word CloudRun] Error HTTP ${res.status}: ${errText.substring(0, 200)}`);
    }
  } catch (err: any) {
    console.warn(`[PDF-to-Word CloudRun] Fetch exception:`, err?.message || err);
  }
  return null;
}

async function extractSelectedPages(
  originalBuffer: Buffer,
  pagesStr: string | null,
): Promise<{ buffer: Buffer; pageCount: number; isSubSet: boolean }> {
  if (!pagesStr || !pagesStr.trim()) {
    return { buffer: originalBuffer, pageCount: 0, isSubSet: false };
  }
  try {
    const srcDoc = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
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

    // 1. Motor Gemini 4 Argon AI (Reconstrucción Cognitiva y Semántica desde Cero)
    if (engine === 'gemini') {
      try {
        console.log('[PDF-to-Word] Converting with Gemini 4 Argon Structural Engine...');
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
            'X-Conversion-Engine-Used': 'gemini-4-argon',
            'X-Fallback-Triggered': 'false',
          },
        });
      } catch (geminiErr: any) {
        console.warn(
          '[PDF-to-Word] Gemini 4 Argon failover initiated:',
          geminiErr?.message || geminiErr,
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

    // 2. Si el usuario seleccionó explícitamente Adobe Acrobat y hay credenciales
    if (engine === 'adobe' && hasAdobeCredentials) {
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
            'X-Conversion-Engine-Used': 'adobe',
            'X-Fallback-Triggered': 'false',
          },
        });
      } catch (adobeErr) {
        console.warn('[PDF-to-Word] Adobe API error, falling back:', adobeErr);
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
            'X-Conversion-Engine-Used': 'cloudconvert',
            'X-Fallback-Triggered': 'false',
          },
        });
      } catch (ccErr) {
        console.warn('[PDF-to-Word] CloudConvert API error, falling back:', ccErr);
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const canRunLocalPython = !isProduction || process.env.FORCE_LOCAL_PYTHON === 'true';

    // 4. Si estamos en PRODUCCIÓN (Cloud Run / Firebase SSR sin Python local):
    // Despachamos directamente al Microservicio dedicado Cloud Run Ultra Engine
    if (!canRunLocalPython) {
      console.log(
        `[PDF-to-Word] Running in Cloud Container. Delegating to Cloud Run Ultra Engine (${engine})...`,
      );
      const targetEngine = engine === 'local' ? 'pymupdf' : 'pdf2docx';
      const cloudRunDocxBuffer = await convertWithCloudRun(activeBuffer, targetEngine);
      if (cloudRunDocxBuffer) {
        return new NextResponse(new Uint8Array(cloudRunDocxBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${safeOutName}"`,
            'Content-Length': cloudRunDocxBuffer.length.toString(),
            'X-Conversion-Engine-Used': `${targetEngine}-cloudrun`,
            'X-Fallback-Triggered': engine !== targetEngine && engine !== 'auto' ? 'true' : 'false',
          },
        });
      }
      console.warn(
        '[PDF-to-Word] Primary Cloud Run conversion failed, proceeding to cascading fallbacks...',
      );
    }

    // 5. Entorno Local con Python instalado
    if (canRunLocalPython) {
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const tempDir = os.tmpdir();
      tempInputPath = path.join(tempDir, `pdf2docx_in_${uniqueId}.pdf`);
      tempOutputPath = path.join(tempDir, `pdf2docx_out_${uniqueId}.docx`);

      await fs.promises.writeFile(tempInputPath, activeBuffer);

      // Si layoutMode !== 'exact' y engine no es estrictamente 'local', intentamos el motor oficial Ultra HD
      if (layoutMode !== 'exact' && engine !== 'local') {
        try {
          console.log(
            '[PDF-to-Word] Converting with official pdf2docx (Local Python Visual Fidelity)...',
          );
          const officialScriptPath = path.join(
            process.cwd(),
            'server',
            'pdf2docx_official_convert.py',
          );
          const officialArgs = [officialScriptPath, tempInputPath, tempOutputPath];
          if (!isSubSet && pages && pages.trim().length > 0) {
            officialArgs.push('--pages', pages.trim());
          }

          const pyOfficialProcess = spawn('python', officialArgs, { windowsHide: true });
          let officialStderr = '';
          pyOfficialProcess.stderr.on('data', (data) => {
            officialStderr += data.toString();
          });

          const timeoutDuration = Math.max(300000, (effectivePageCount || 60) * 4000);
          const officialExitCode = await new Promise<number>((resolve) => {
            const timeout = setTimeout(() => {
              try {
                pyOfficialProcess.kill();
              } catch {}
              console.warn(`[PDF-to-Word] pdf2docx timed out after ${timeoutDuration / 1000}s`);
              resolve(1);
            }, timeoutDuration);

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
                'X-Conversion-Engine-Used': 'pdf2docx-local',
                'X-Fallback-Triggered':
                  engine !== 'pdf2docx' && engine !== 'auto' ? 'true' : 'false',
              },
            });
          } else {
            console.warn(
              'Official pdf2docx local conversion failed, falling back:',
              officialStderr,
            );
          }
        } catch (officialErr) {
          console.warn('Official pdf2docx execution error, falling back:', officialErr);
        }
      }

      // Motor Local PyMuPDF (Instantáneo)
      try {
        console.log('[PDF-to-Word] Converting with PyMuPDF Local Engine...');
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

        const pythonCmd = process.env.PYTHON_PATH || 'python';
        const pyProcess = spawn(pythonCmd, args, { windowsHide: true });

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
              'X-Conversion-Engine-Used': 'pymupdf-local',
              'X-Fallback-Triggered': engine !== 'local' ? 'true' : 'false',
            },
          });
        }
      } catch (localErr) {
        console.warn('Local PyMuPDF execution error, falling back:', localErr);
      }
    }

    // ── FALLBACKS EN CASCADA RESILIENTE (NIVEL EMPRESARIAL) ──

    // Fallback 1: Google Cloud Run Microservicio (pdf2docx Pro)
    console.log('[PDF-to-Word] Fallback: Delegating to Cloud Run Microservice (pdf2docx)...');
    const cloudRunFallbackBuffer = await convertWithCloudRun(activeBuffer, 'pdf2docx');
    if (cloudRunFallbackBuffer) {
      return new NextResponse(new Uint8Array(cloudRunFallbackBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeOutName}"`,
          'Content-Length': cloudRunFallbackBuffer.length.toString(),
          'X-Conversion-Engine-Used': 'pdf2docx-cloudrun',
          'X-Fallback-Triggered': 'true',
        },
      });
    }

    // Fallback 2: Adobe Acrobat si hay credenciales y no fue intentado
    if (hasAdobeCredentials && engine !== 'adobe') {
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
            'X-Conversion-Engine-Used': 'adobe',
            'X-Fallback-Triggered': 'true',
          },
        });
      } catch (adobeErr) {
        console.warn('[PDF-to-Word] Adobe fallback error:', adobeErr);
      }
    }

    // Fallback 3: CloudConvert si no fue intentado
    if (engine !== 'cloudconvert') {
      try {
        console.log('[PDF-to-Word] Fallback: Converting with CloudConvert API v2...');
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
            'X-Conversion-Engine-Used': 'cloudconvert',
            'X-Fallback-Triggered': 'true',
          },
        });
      } catch (ccErr) {
        console.warn('[PDF-to-Word] CloudConvert fallback error:', ccErr);
      }
    }

    // Fallback 4: Cloud Run LibreOffice (Red de rescate universal)
    console.log('[PDF-to-Word] Safety Net: Converting with Cloud Run LibreOffice engine...');
    const libreOfficeFallbackBuffer = await convertWithCloudRun(activeBuffer, 'libreoffice');
    if (libreOfficeFallbackBuffer) {
      return new NextResponse(new Uint8Array(libreOfficeFallbackBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeOutName}"`,
          'Content-Length': libreOfficeFallbackBuffer.length.toString(),
          'X-Conversion-Engine-Used': 'libreoffice-cloudrun',
          'X-Fallback-Triggered': 'true',
        },
      });
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
