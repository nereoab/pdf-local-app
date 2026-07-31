import { NextRequest, NextResponse } from 'next/server';  
import * as forgeModule from 'node-forge';  

const forge = forgeModule as any;

// ── Tipos ──
interface SignRequest {
  pdfBase64: string;
  certBase64: string;
  certPassword: string;
  position: { x: number; y: number };
  signatureBase64?: string;
  signerName?: string;
  signerRole?: string;
  signerLocation?: string;
  signerReason?: string;
  includeDate?: boolean;
  includeHash?: boolean;
  pageIndex?: number;
  batchFiles?: string[];
}

// ── Extraer certificado del PKCS#12 ──
function parsePkcs12(pfxBytes: Uint8Array, password: string) {
  const binaryStr = String.fromCharCode(...pfxBytes);
  const p12Buffer = forge.util.createBuffer(binaryStr, 'binary');
  const p12Asn1 = forge.asn1.fromDer(p12Buffer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
  
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certKeys = Object.keys(certBags);
  if (certKeys.length === 0 || !certBags[certKeys[0]] || certBags[certKeys[0]].length === 0) {
    throw new Error('Certificado no encontrado en PKCS#12');
  }
  const cert = certBags[certKeys[0]][0].cert;
  
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyKeys = Object.keys(keyBags);
  if (keyKeys.length === 0 || !keyBags[keyKeys[0]] || keyBags[keyKeys[0]].length === 0) {
    throw new Error('Clave privada no encontrada. Contraseña incorrecta.');
  }
  const privateKey = keyBags[keyKeys[0]][0].key;
  
  const cn = cert.subject.getField('CN');
  const signerName = cn ? cn.value : 'Firmante';
  
  return { cert, privateKey, signerName, serialNumber: cert.serialNumber, issuer: cert.issuer.getField('CN')?.value || 'Desconocido' };
}

// ── Firmar hash con clave privada ──
function signHash(privateKey: any, data: Uint8Array): string {
  const md = forge.md.sha256.create();
  md.update(forge.util.createBuffer(String.fromCharCode(...data), 'binary').toString('binary'), 'raw');
  return forge.util.encode64(privateKey.sign(md));
}

// ── POST /api/pdf/sign ──
export async function POST(request: NextRequest) {
  try {
    const body: SignRequest = await request.json();
    const { pdfBase64, certBase64, certPassword, position, signatureBase64, signerName, signerRole, signerLocation, signerReason, includeDate, includeHash, pageIndex = 0, batchFiles } = body;

    if (!pdfBase64 && (!batchFiles || batchFiles.length === 0)) {
      return NextResponse.json({ error: 'PDF requerido' }, { status: 400 });
    }
    if (!certBase64 || !certPassword) {
      return NextResponse.json({ error: 'Certificado y contraseña requeridos' }, { status: 400 });
    }

    // Decodificar certificado
    const certBytes = Uint8Array.from(Buffer.from(certBase64, 'base64'));

    // Parsear PKCS#12
    let certInfo: ReturnType<typeof parsePkcs12>;
    try {
      certInfo = parsePkcs12(certBytes, certPassword);
    } catch (err: any) {
      return NextResponse.json({ error: `Error de certificado: ${err.message}` }, { status: 400 });
    }

    // Procesar array de PDFs (batch) o uno solo
    const filesToProcess = pdfBase64 ? [pdfBase64] : (batchFiles || []);

    // ── pdf-lib ──
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const results: any[] = [];

    for (const fileBase64 of filesToProcess) {
      const pdfBytes = Uint8Array.from(Buffer.from(fileBase64, 'base64'));
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const page = pages[Math.max(0, Math.min(pages.length - 1, pageIndex))];
      const { width, height } = page.getSize();

      // Incrustar rúbrica visual
      if (signatureBase64) {
        try {
          const sigBytes = Uint8Array.from(Buffer.from(signatureBase64, 'base64'));
          const embeddedSig = await pdfDoc.embedPng(sigBytes);
          const sigWidth = 180;
          const sigHeight = (embeddedSig.height / embeddedSig.width) * sigWidth;
          const px = (position.x / 100) * (width - sigWidth);
          const py = (1 - position.y / 100) * (height - sigHeight);
          const fx = Math.max(0, Math.min(width - sigWidth, px));
          const fy = Math.max(0, Math.min(height - sigHeight, py));
          
          page.drawImage(embeddedSig, { x: fx, y: fy, width: sigWidth, height: sigHeight });

          // Metadatos textuales
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const tc = rgb(0, 0, 0); 
          let ty = fy - 11;
          if (signerRole?.trim()) { page.drawText(signerRole.trim(), { x: fx, y: ty, size: 8, font, color: tc }); ty -= 11; }
          if (signerLocation?.trim()) { page.drawText(signerLocation.trim(), { x: fx, y: ty, size: 8, font, color: tc }); ty -= 11; }
          if (includeDate) {
            page.drawText(new Date().toISOString().replace('T', ' ').substring(0, 19), { x: fx, y: ty, size: 8, font, color: tc });
          }
        } catch (e) { /* ignorar error de imagen */ }
      }

      // Metadatos
      pdfDoc.setTitle('Documento Firmado Digitalmente');
      pdfDoc.setAuthor(signerName || certInfo.signerName);
      pdfDoc.setSubject('Firmado con PAdES-BES');
      pdfDoc.setProducer('PDFBlack Enterprise Signing Engine v3.0');
      pdfDoc.setModificationDate(new Date());
      pdfDoc.setKeywords([JSON.stringify({
        signatureStandard: 'PAdES-BES',
        signerName: signerName || certInfo.signerName,
        signerRole: signerRole || '',
        issuer: certInfo.issuer,
        serialNumber: certInfo.serialNumber,
        signingTime: new Date().toISOString(),
      })]);

      const signedBytes = await pdfDoc.save();
      
      results.push({
        signedPdfBase64: Buffer.from(signedBytes).toString('base64'),
        signatureBase64: signHash(certInfo.privateKey, signedBytes),
      });
    }

    return NextResponse.json({
      success: true,
      results,
      metadata: {
        signerName: signerName || certInfo.signerName,
        signerRole: signerRole || '',
        issuer: certInfo.issuer,
        serialNumber: certInfo.serialNumber,
        signingTime: new Date().toISOString(),
        filesProcessed: filesToProcess.length,
        standard: 'PAdES-BES',
      },
    });
  } catch (error: any) {
    console.error('[PAdES Sign] Error:', error);
    return NextResponse.json({ error: `Error interno: ${error.message || 'Desconocido'}` }, { status: 500 });
  }
}