import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { convertPowerPointToPdfWithAdobe } from '@/lib/adobe-converter-service';
import { convertPowerPointToPdfWithCloudConvert } from '@/lib/cloudconvert-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface LocalConversionResult {
  buffer: Buffer;
  engineUsed: string;
}

async function runLocalPptxToPdf(
  buffer: Buffer,
  originalFilename: string,
  aspectRatio: string = '16:9',
  preferredSubEngine: 'auto' | 'com' | 'libreoffice' | 'python-pptx' = 'auto',
): Promise<LocalConversionResult | null> {
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
      [
        scriptPath,
        tempInputPath,
        tempOutputPath,
        '--aspect-ratio',
        aspectRatio,
        '--engine',
        preferredSubEngine,
      ],
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

    // Timeout de seguridad de 45 segundos para evitar cuelgues del proceso COM o LibreOffice
    const timeoutPromise = new Promise<number>((resolve) => {
      const timer = setTimeout(() => {
        try {
          pyProcess.kill();
        } catch {}
        console.warn('[PowerPoint-to-PDF] Local python process timed out after 45s');
        resolve(-1);
      }, 45000);

      pyProcess.on('close', (code) => {
        clearTimeout(timer);
        resolve(code ?? 1);
      });
      pyProcess.on('error', (err) => {
        clearTimeout(timer);
        console.error('[PowerPoint-to-PDF] Python pptx spawn error:', err);
        resolve(1);
      });
    });

    const exitCode = await timeoutPromise;

    if (
      exitCode === 0 &&
      fs.existsSync(tempOutputPath) &&
      (await fs.promises.stat(tempOutputPath)).size > 0
    ) {
      const pdfOutBuffer = await fs.promises.readFile(tempOutputPath);
      let engineName = 'Local Native Engine';
      try {
        const jsonMatch = stdoutData.match(/\{"status":\s*"success",\s*"engine":\s*"([^"]+)"/);
        if (jsonMatch && jsonMatch[1]) {
          engineName = jsonMatch[1];
        }
      } catch {}

      return { buffer: pdfOutBuffer, engineUsed: engineName };
    } else {
      console.warn(
        `[PowerPoint-to-PDF] Local Python conversion failed (exit code ${exitCode}):`,
        stderrData || stdoutData,
      );
      return null;
    }
  } catch (err) {
    console.error('[PowerPoint-to-PDF] runLocalPptxToPdf exception:', err);
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
    const requestedEngine = (formData.get('engine') as string) || 'auto';
    const aspectRatio = (formData.get('aspectRatio') as string) || '16:9';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isPptx = file.name.toLowerCase().endsWith('.pptx');
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const safeOutName = `${encodeURIComponent(originalName)}.pdf`;

    const hasAdobeCredentials = Boolean(
      process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET,
    );
    const hasCloudConvertCredentials = Boolean(
      process.env.CLOUDCONVERT_API_KEY ||
      process.env.NEXT_PUBLIC_CLOUDCONVERT_API_KEY ||
      process.env.NEXT_PUBLIC_CONVERTAPI_SECRET,
    );

    const makePdfResponse = (pdfBuffer: Buffer, engineName: string) => {
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${originalName.replace(/["\\]/g, '')}.pdf"; filename*=UTF-8''${safeOutName}`,
          'Content-Length': pdfBuffer.length.toString(),
          'X-Conversion-Engine': engineName,
        },
      });
    };

    // ── ESTRATEGIA CASCADA MULTI-MOTOR EMPRESARIAL ──

    // 1. CASO A: El usuario solicitó específicamente ADOBE ACROBAT
    if (requestedEngine === 'adobe' && hasAdobeCredentials) {
      try {
        console.log('[PowerPoint-to-PDF] Converting with requested Adobe Acrobat Services...');
        const adobePdf = await convertPowerPointToPdfWithAdobe(buffer, isPptx);
        return makePdfResponse(adobePdf, 'Adobe Acrobat Services API');
      } catch (adobeErr) {
        console.warn(
          '[PowerPoint-to-PDF] Adobe API failed, cascading to Local Native Engine:',
          adobeErr,
        );
      }
    }

    // 2. CASO B: El usuario solicitó específicamente CLOUDCONVERT
    if (requestedEngine === 'cloudconvert' && hasCloudConvertCredentials) {
      try {
        console.log('[PowerPoint-to-PDF] Converting with requested CloudConvert API v2...');
        const ccPdf = await convertPowerPointToPdfWithCloudConvert(buffer, file.name);
        return makePdfResponse(ccPdf, 'CloudConvert API v2');
      } catch (ccErr) {
        console.warn(
          '[PowerPoint-to-PDF] CloudConvert API failed, cascading to Local Native Engine:',
          ccErr,
        );
      }
    }

    // 3. CASO C: Modo 'auto' (Inteligente) o 'local'
    // En entornos locales o cuando se pide local, intentamos primero el motor nativo de alta precisión
    if (requestedEngine === 'local' || requestedEngine === 'auto') {
      console.log(
        '[PowerPoint-to-PDF] Attempting Tier-1: Local Native Engine (COM / LibreOffice / python-pptx)...',
      );
      const localResult = await runLocalPptxToPdf(buffer, file.name, aspectRatio, 'auto');
      if (localResult) {
        console.log(`[PowerPoint-to-PDF] Success with ${localResult.engineUsed}`);
        return makePdfResponse(localResult.buffer, localResult.engineUsed);
      }
    }

    // 4. FAILOVER TIER-2: Adobe Acrobat Services API (si no se ejecutó antes y hay credenciales)
    if (requestedEngine !== 'adobe' && hasAdobeCredentials) {
      try {
        console.log('[PowerPoint-to-PDF] Cascading to Tier-2: Adobe Acrobat Services API...');
        const adobePdf = await convertPowerPointToPdfWithAdobe(buffer, isPptx);
        return makePdfResponse(adobePdf, 'Adobe Acrobat Services API (Failover)');
      } catch (adobeErr) {
        console.warn('[PowerPoint-to-PDF] Tier-2 Adobe API failed:', adobeErr);
      }
    }

    // 5. FAILOVER TIER-3: CloudConvert API v2 (si no se ejecutó antes y hay credenciales)
    if (requestedEngine !== 'cloudconvert' && hasCloudConvertCredentials) {
      try {
        console.log('[PowerPoint-to-PDF] Cascading to Tier-3: CloudConvert API v2...');
        const ccPdf = await convertPowerPointToPdfWithCloudConvert(buffer, file.name);
        return makePdfResponse(ccPdf, 'CloudConvert API v2 (Failover)');
      } catch (ccErr) {
        console.warn('[PowerPoint-to-PDF] Tier-3 CloudConvert API failed:', ccErr);
      }
    }

    // 6. FAILOVER TIER-4 (Último recurso garantizado): python-pptx / OpenXML Pure Engine
    console.log(
      '[PowerPoint-to-PDF] Cascading to Tier-4: Guaranteed python-pptx Fallback Engine...',
    );
    const resilientResult = await runLocalPptxToPdf(buffer, file.name, aspectRatio, 'python-pptx');
    if (resilientResult) {
      console.log(`[PowerPoint-to-PDF] Success with ${resilientResult.engineUsed}`);
      return makePdfResponse(resilientResult.buffer, resilientResult.engineUsed);
    }

    return NextResponse.json(
      {
        error:
          'No se pudo procesar la presentación PowerPoint tras intentar todos los motores disponibles (Local, Adobe y Cloud). Por favor verifica que el archivo no tenga contraseña o esté corrupto.',
      },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('API powerpoint-to-pdf unhandled error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
