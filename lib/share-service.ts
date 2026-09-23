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

function generateShortId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Sube un archivo a través de la API segura de PDFBlack (/api/share)
 * con fallback directo a Firebase Storage si la API experimenta latencia o error.
 * Garantiza que SIEMPRE se retorne un enlace real /share/[id].
 */
export async function createShareLink(
  fileOrBlob: Blob | File,
  filename: string,
  toolTitle: string = 'PDFBlack',
): Promise<{ shareId: string; shareUrl: string; downloadUrl: string }> {
  // 1. Intento primario: Endpoint /api/share
  try {
    const formData = new FormData();
    formData.append('file', fileOrBlob, filename);
    formData.append('filename', filename);
    formData.append('tool', toolTitle);

    const res = await fetch('/api/share', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.shareId && data.shareUrl) {
        // Asegurar que el dominio siempre sea el oficial de la web (pdf-black.com)
        const origin =
          typeof window !== 'undefined' ? window.location.origin : 'https://pdf-black.com';
        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
        const siteUrl = isLocal ? origin : 'https://pdf-black.com';
        const cleanShareUrl = data.shareUrl.includes('a.run.app')
          ? `${siteUrl}/share/${data.shareId}`
          : data.shareUrl;
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
  } catch (apiErr) {
    console.warn('[ShareService] POST /api/share falló o timeout, activando fallback:', apiErr);
  }

  // 2. Fallback de alta resiliencia: Subida directa cliente-a-Firebase Storage
  // storage.rules permite escribir en /temp-shares/{shareId} hasta 50MB
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
    const shareId = generateShortId();
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
    console.error('[ShareService] Fallback de subida directa a Storage también falló:', storageErr);
    throw storageErr;
  }
}

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
