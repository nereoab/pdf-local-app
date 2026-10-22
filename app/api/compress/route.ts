import { NextRequest, NextResponse } from 'next/server';
import {
  diagnosePdfWithGeminiArgon,
  compressPdfEnterpriseBackend,
  generateCompressionCertificate,
  EnterpriseBackendCompressOptions,
} from '@/lib/gemini-compress-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos para operaciones pesadas de IA

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const action = (formData.get('action') as string) || 'compress';
    const rawOptions = (formData.get('options') as string) || '{}';

    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo PDF.' },
        { status: 400 },
      );
    }

    const fileName = file.name || 'documento.pdf';
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (fileBuffer.length === 0) {
      return NextResponse.json(
        { error: 'El archivo PDF proporcionado está vacío.' },
        { status: 400 },
      );
    }

    let parsedOptions: EnterpriseBackendCompressOptions = {};
    try {
      parsedOptions = JSON.parse(rawOptions);
    } catch {
      // ignore
    }

    // ACCIÓN 1: DIAGNÓSTICO / AUDITORÍA CON GEMINI 4 ARGON
    if (action === 'diagnose') {
      const audit = await diagnosePdfWithGeminiArgon(fileBuffer, fileName);
      return NextResponse.json({
        success: true,
        action: 'diagnose',
        fileName,
        audit,
      });
    }

    // ACCIÓN 2: COMPRESIÓN EMPRESARIAL BACKEND (+ CERTIFICADO)
    if (action === 'compress' || action === 'certify') {
      const result = await compressPdfEnterpriseBackend(fileBuffer, fileName, parsedOptions);
      const certificate = generateCompressionCertificate(result, fileName);

      // Si el cliente solicitó el PDF binario directamente
      const acceptHeader = req.headers.get('accept') || '';
      const wantsBinary =
        formData.get('format') === 'binary' || acceptHeader.includes('application/pdf');

      if (wantsBinary) {
        const outName = `${fileName.replace(/\.[^/.]+$/, '')}_Optimizado.pdf`;
        return new NextResponse(new Uint8Array(result.compressedBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(outName)}"`,
            'X-Original-Size': String(result.originalSize),
            'X-Compressed-Size': String(result.compressedSize),
            'X-Reduction-Percent': String(result.reductionPercent),
            'X-Certificate-Id': certificate.certificateId,
          },
        });
      }

      // Respuesta JSON con base64 para integración fluida en la UI
      return NextResponse.json({
        success: true,
        action: 'compress',
        fileName,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        reductionPercent: result.reductionPercent,
        bytesSaved: result.bytesSaved,
        durationMs: result.durationMs,
        isPdfA: result.isPdfA,
        pagesCount: result.pagesCount,
        imagesOptimized: result.imagesOptimized,
        streamsOptimized: result.streamsOptimized,
        sha256Original: result.sha256Original,
        sha256Compressed: result.sha256Compressed,
        certificate,
        base64Pdf: result.compressedBuffer.toString('base64'),
      });
    }

    return NextResponse.json({ error: `Acción '${action}' no reconocida.` }, { status: 400 });
  } catch (error: any) {
    console.error('[API /api/compress] Error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Error interno durante el procesamiento de compresión.',
      },
      { status: 500 },
    );
  }
}
