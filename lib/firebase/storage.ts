import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, StorageReference } from 'firebase/storage';
import app from './config';

// ─── Storage (lazy init) ───
const storage = getStorage(app);

// ─── Tipos ───

export interface CloudBackupFile {
  /** Nombre del archivo en storage */
  name: string;
  /** Ruta completa en storage */
  fullPath: string;
  /** URL pública temporal (válida por 1 hora por defecto) */
  downloadUrl?: string;
  /** Tamaño en bytes */
  size: number;
  /** Fecha de subida */
  uploadedAt: string;
  /** Tipo MIME */
  contentType: string;
}

export interface BackupResult {
  success: boolean;
  message: string;
  file?: CloudBackupFile;
  error?: string;
}

// ═══════════════════════════════════════════
//  SUBIR PDF A STORAGE (BACKUP)
// ═══════════════════════════════════════════

/**
 * Sube un PDF al storage de Firebase como backup.
 * SOLO DEBE LLAMARSE si el usuario dio consentimiento explícito (opt-in).
 *
 * @param uid - UID del usuario autenticado
 * @param file - Archivo PDF a subir (File o Blob)
 * @param fileName - Nombre descriptivo (ej: "Contrato_Firmado_2025.pdf")
 */
export async function uploadBackupPdf(
  uid: string,
  file: File | Blob,
  fileName: string
): Promise<BackupResult> {
  try {
    // Sanitizar nombre de archivo
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `users/${uid}/backups/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);

    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        encrypted: 'false', // Se puede implementar cifrado client-side luego
      },
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    const backupFile: CloudBackupFile = {
      name: safeName,
      fullPath: snapshot.ref.fullPath,
      downloadUrl,
      size: snapshot.metadata.size || file.size,
      uploadedAt: new Date().toISOString(),
      contentType: 'application/pdf',
    };

    console.log(`[Storage] Backup subido: ${path}`);
    return { success: true, message: 'Backup guardado en la nube.', file: backupFile };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Storage] Error al subir backup:', error);
    return { success: false, message: 'No se pudo guardar el backup.', error: msg };
  }
}

// ═══════════════════════════════════════════
//  LISTAR BACKUPS DEL USUARIO
// ═══════════════════════════════════════════

/**
 * Obtiene la lista de backups del usuario.
 */
export async function listBackups(uid: string): Promise<CloudBackupFile[]> {
  try {
    const folderRef = ref(storage, `users/${uid}/backups`);
    const result = await listAll(folderRef);

    const files: CloudBackupFile[] = await Promise.all(
      result.items.map(async (item) => {
        try {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            fullPath: item.fullPath,
            downloadUrl: url,
            size: 0, // listAll no devuelve metadata; se puede obtener con getMetadata si es necesario
            uploadedAt: '',
            contentType: 'application/pdf',
          };
        } catch {
          return {
            name: item.name,
            fullPath: item.fullPath,
            size: 0,
            uploadedAt: '',
            contentType: 'application/pdf',
          };
        }
      })
    );

    // Ordenar por nombre (que incluye timestamp) más reciente primero
    return files.sort((a, b) => b.name.localeCompare(a.name));
  } catch (error) {
    console.warn('[Storage] No se pudieron listar backups:', error);
    return [];
  }
}

// ═══════════════════════════════════════════
//  DESCARGAR BACKUP (obtener URL firmada)
// ═══════════════════════════════════════════

/**
 * Obtiene una URL de descarga temporal para un backup específico.
 */
export async function getBackupDownloadUrl(fullPath: string): Promise<string | null> {
  try {
    const fileRef = ref(storage, fullPath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.warn('[Storage] No se pudo obtener URL de descarga:', error);
    return null;
  }
}

// ═══════════════════════════════════════════
//  ELIMINAR BACKUP
// ═══════════════════════════════════════════

/**
 * Elimina un backup del storage.
 */
export async function deleteBackup(fullPath: string): Promise<boolean> {
  try {
    const fileRef = ref(storage, fullPath);
    await deleteObject(fileRef);
    console.log(`[Storage] Backup eliminado: ${fullPath}`);
    return true;
  } catch (error) {
    console.warn('[Storage] No se pudo eliminar backup:', error);
    return false;
  }
}

// ═══════════════════════════════════════════
//  VERIFICAR ESPACIO USADO (opcional)
// ═══════════════════════════════════════════

/**
 * Calcula el espacio total usado por los backups del usuario (en bytes).
 * Aproximado, ya que listAll no devuelve metadata detallada.
 */
export async function getBackupStorageUsed(uid: string): Promise<number> {
  try {
    const files = await listBackups(uid);
    return files.reduce((total, f) => total + (f.size || 0), 0);
  } catch {
    return 0;
  }
}

export { storage };