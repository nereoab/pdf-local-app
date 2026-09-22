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
 * Sube un archivo a través de la API segura de PDFBlack (/api/share)
 * y retorna el enlace oficial con el dominio de la web.
 */
export async function createShareLink(
  fileOrBlob: Blob | File,
  filename: string,
  toolTitle: string = 'PDFBlack',
): Promise<{ shareId: string; shareUrl: string; downloadUrl: string }> {
  const formData = new FormData();
  formData.append('file', fileOrBlob, filename);
  formData.append('filename', filename);
  formData.append('tool', toolTitle);

  const res = await fetch('/api/share', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al generar enlace de compartición');
  }

  const data = await res.json();
  return {
    shareId: data.shareId,
    shareUrl: data.shareUrl,
    downloadUrl: data.downloadUrl,
  };
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
