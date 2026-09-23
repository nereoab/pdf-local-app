import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD1iKq-cZz1zJT9HoCWCKjO-mEUczzMa6k',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pdfblack-proy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pdfblack-proy',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pdfblack-proy.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '878586961850',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:878586961850:web:3469a31c2fb80fbd000783',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const storage = getStorage(app);

function generateShortId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── POST /api/share ───
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const filename = (formData.get('filename') as string) || file?.name || 'documento.pdf';
    const toolTitle = (formData.get('tool') as string) || 'PDFBlack';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const shareId = generateShortId();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileRef = ref(storage, `temp-shares/${shareId}`);

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        originalName: filename,
        fileSize: String(fileBuffer.length),
        uploadedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        toolTitle,
      },
    };

    // Subir en Node.js (servidor sin restricciones de CORS)
    await uploadBytes(fileRef, fileBuffer, metadata);

    // Resolver el dominio del sitio de forma inteligente:
    // Si la petición se hace en entorno local (localhost / 127.0.0.1), usamos http://${host}
    // para que el desarrollador pueda probar el enlace inmediatamente sin recibir 404 de producción.
    // En producción (pdf-black.com), se usa el dominio oficial configurado.
    const host = req.headers.get('host') || 'localhost:3000';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const siteUrl = isLocal
      ? `http://${host}`
      : process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`;
    const shareUrl = `${siteUrl}/share/${shareId}`;
    const downloadUrl = `${siteUrl}/api/share?id=${shareId}&download=1`;

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      downloadUrl,
      filename,
      formattedSize: formatBytes(fileBuffer.length),
    });
  } catch (error: any) {
    console.error('[API /api/share] Error al subir archivo:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar subida compartida' },
      { status: 500 },
    );
  }
}

// ─── GET /api/share?id=... ───
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 });
    }

    const fileRef = ref(storage, `temp-shares/${shareId}`);
    const downloadUrl = await getDownloadURL(fileRef);
    const meta = await getMetadata(fileRef);

    const custom = meta.customMetadata || {};
    const size = meta.size || parseInt(custom.fileSize || '0', 10);
    const filename = custom.originalName || 'documento.pdf';

    // Soporte para visualización directa en navegador (inline) sin bloqueos Cross-Origin
    if (searchParams.get('stream') === '1' || searchParams.get('preview') === '1') {
      const fileRes = await fetch(downloadUrl);
      const arrayBuffer = await fileRes.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': String(arrayBuffer.byteLength),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Soporte para descarga directa sin problemas de CORS ni bloqueo de navegador
    if (searchParams.get('download') === '1') {
      const fileRes = await fetch(downloadUrl);
      const arrayBuffer = await fileRes.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Content-Length': String(arrayBuffer.byteLength),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return NextResponse.json({
      success: true,
      shareId,
      originalName: filename,
      fileSize: size,
      formattedSize: formatBytes(size),
      uploadedAt: custom.uploadedAt || meta.timeCreated || new Date().toISOString(),
      expiresAt: custom.expiresAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      downloadUrl,
      tool: custom.toolTitle || 'PDFBlack',
    });
  } catch (error: any) {
    console.warn('[API /api/share] Documento no encontrado o error:', error?.message);
    return NextResponse.json({ error: 'Documento no encontrado o expirado' }, { status: 404 });
  }
}
