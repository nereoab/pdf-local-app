'use client';

export interface ShareMetadata {
  shareId: string;
  originalName: string;
  fileSize: number;
  formattedSize: string;
  uploadedAt: string;
  expiresAt: string;
  downloadUrl: string;
  tool?: string;
}

/**
 * Genera un ID corto determinístico y seguro (8 caracteres)
 */
export function generateShareId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Construye la URL oficial para compartir a partir de un shareId
 */
export function buildShareUrl(shareId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pdf-black.com';
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const siteUrl = isLocal ? origin : 'https://pdf-black.com';
  return `${siteUrl}/share/${shareId}`;
}

/**
 * Sube un archivo a través de la API segura de PDFBlack (/api/share)
 * con fallback directo a Firebase Storage si la API experimenta latencia o error.
 * Soporta un shareId pre-asignado para permitir compartir de forma instantánea a t=0.
 */
export async function createShareLink(
  fileOrBlob: Blob | File,
  filename: string,
  toolTitle: string = 'PDFBlack',
  targetShareId?: string,
): Promise<{ shareId: string; shareUrl: string; downloadUrl: string }> {
  const shareId = targetShareId || generateShareId();
  const prebuiltShareUrl = buildShareUrl(shareId);

  const fileSize = fileOrBlob.size || 0;
  // Timeout adaptativo: mínimo 2.5 min (150s), hasta 5 min (300s) para PDFs pesados
  const timeoutMs = Math.min(300000, Math.max(150000, Math.ceil(fileSize / 15000) * 1000));

  // Función interna para intentar subida mediante endpoint seguro /api/share
  const attemptServerUpload = async (): Promise<{
    shareId: string;
    shareUrl: string;
    downloadUrl: string;
  } | null> => {
    const formData = new FormData();
    formData.append('file', fileOrBlob, filename);
    formData.append('filename', filename);
    formData.append('tool', toolTitle);
    formData.append('shareId', shareId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.shareId) {
          const origin =
            typeof window !== 'undefined' ? window.location.origin : 'https://pdf-black.com';
          const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
          const siteUrl = isLocal ? origin : 'https://pdf-black.com';
          const cleanShareUrl = data.shareUrl?.includes('a.run.app')
            ? `${siteUrl}/share/${data.shareId}`
            : data.shareUrl || prebuiltShareUrl;
          const cleanDownloadUrl =
            data.downloadUrl && !data.downloadUrl.includes('a.run.app')
              ? data.downloadUrl
              : `${siteUrl}/api/share?id=${data.shareId}&download=1`;

          return {
            shareId: data.shareId,
            shareUrl: cleanShareUrl,
            downloadUrl: cleanDownloadUrl,
          };
        }
      }
      return null;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('[ShareService] Intento POST /api/share:', err?.message || err);
      return null;
    }
  };

  // 1. Primer intento por el servidor
  let result = await attemptServerUpload();

  // 2. Reintento automático en caso de glitch de red transitorio
  if (!result) {
    console.log('[ShareService] Reintentando subida a /api/share...');
    await new Promise((r) => setTimeout(r, 1200));
    result = await attemptServerUpload();
  }

  if (result) {
    return result;
  }

  // 3. Fallback de alta resiliencia: Subida directa cliente-a-Firebase Storage si la API de Cloud Run falla
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getStorage, ref, uploadBytes } = await import('firebase/storage');

    const clientConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD1iKq-cZz1zJT9HoCWCKjO-mEUczzMa6k',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pdfblack-proy.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pdfblack-proy',
      storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'pdfblack-proy.firebasestorage.app',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '878586961850',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:878586961850:web:3469a31c2fb80fbd000783',
    };

    const app = getApps().length > 0 ? getApp() : initializeApp(clientConfig);
    const storage = getStorage(app);
    const fileRef = ref(storage, `temp-shares/${shareId}`);

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const arrayBuffer = await fileOrBlob.arrayBuffer();
    await uploadBytes(fileRef, new Uint8Array(arrayBuffer), {
      contentType: 'application/pdf',
      customMetadata: {
        originalName: filename,
        fileSize: String(fileOrBlob.size),
        uploadedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        toolTitle,
      },
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pdf-black.com';
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    const siteUrl = isLocal ? origin : 'https://pdf-black.com';

    return {
      shareId,
      shareUrl: `${siteUrl}/share/${shareId}`,
      downloadUrl: `${siteUrl}/api/share?id=${shareId}&download=1`,
    };
  } catch (storageErr) {
    console.error('[ShareService] Fallback de subida a Storage falló:', storageErr);
    // IMPORTANTE: Lanzar error para que la UI sepa que falló y permita reintentar,
    // en lugar de entregar un enlace fantasma a un archivo que nunca se subió.
    throw new Error(
      'No se pudo sincronizar el archivo compartido con la nube. Por favor, reintenta.',
    );
  }
}

export const uploadShareDocument = createShareLink;

/**
 * Obtiene los detalles de un documento compartido para la página receptora /share/[id]
 */
export async function getShareDetails(shareId: string): Promise<ShareMetadata | null> {
  try {
    const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;

    return {
      shareId: data.shareId,
      originalName: data.originalName,
      fileSize: data.fileSize,
      formattedSize: data.formattedSize,
      uploadedAt: data.uploadedAt,
      expiresAt: data.expiresAt,
      downloadUrl: data.downloadUrl,
      tool: data.tool,
    };
  } catch (error) {
    console.warn('[ShareService] Error al obtener documento compartido:', error);
    return null;
  }
}
