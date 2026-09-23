/**
 * Google Drive OAuth + Upload — 100% Client-side
 *
 * Usa Google Identity Services (GIS) para obtener un access_token
 * y sube el archivo directamente a Google Drive vía la REST API v3.
 *
 * Scope mínimo: drive.file (solo puede crear/editar archivos que la app subió).
 *
 * Flujo:
 *   1. initTokenClient() — configura el cliente OAuth
 *   2. requestDriveAccessToken() — abre popup de Google "Elige tu cuenta"
 *   3. uploadFileToDrive() — sube el blob como multipart/related
 */

// ──────────────────────────────────────────────────────────────────────
// Tipos del Google Identity Services SDK (google.accounts.oauth2)
// ──────────────────────────────────────────────────────────────────────

/** TokenResponse devuelto por GIS tras la autenticación */
interface GisTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

/** Cliente de token (google.accounts.oauth2.TokenClient) */
interface GisTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

/** Opciones de inicialización del token client */
interface GisTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GisTokenResponse) => void;
  error_callback?: (error: { type: string; message: string }) => void;
}

/** Google Identity Services global */
interface GoogleAccounts {
  oauth2: {
    initTokenClient: (config: GisTokenClientConfig) => GisTokenClient;
    revoke: (token: string, done?: () => void) => void;
  };
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

// ──────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// ──────────────────────────────────────────────────────────────────────
// Resultado de la subida
// ──────────────────────────────────────────────────────────────────────

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
}

// ──────────────────────────────────────────────────────────────────────
// 1. Verificar que el SDK de GIS está cargado
// ──────────────────────────────────────────────────────────────────────

function isGisReady(): boolean {
  return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2?.initTokenClient;
}

/**
 * Inyecta dinámicamente el script de Google Identity Services si aún no existe,
 * y espera hasta que esté completamente cargado y listo.
 *
 * Este enfoque es más robusto que usar `next/script` porque:
 * - No depende del timing de Next.js Script strategy
 * - Se carga solo cuando el usuario realmente lo necesita
 * - Maneja errores de carga explícitamente
 */
async function loadGisScript(timeoutMs = 15000): Promise<void> {
  // Ya cargado
  if (isGisReady()) return;

  return new Promise<void>((resolve, reject) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      // El script se cargó, pero el SDK necesita un momento para inicializarse
      const start = Date.now();
      const poll = setInterval(() => {
        if (isGisReady()) {
          clearInterval(poll);
          resolve();
        } else if (Date.now() - start > 5000) {
          clearInterval(poll);
          reject(new Error('Google Identity Services SDK loaded but failed to initialize.'));
        }
      }, 100);
    };

    const fail = (errorMsg: string) => {
      if (resolved) return;
      resolved = true;
      console.error('[Google Drive] Script load error:', errorMsg);
      reject(new Error(errorMsg));
    };

    // Verificar si el script ya está en el DOM
    let script = document.getElementById('google-gis-sdk') as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gis-sdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;

      script.onload = () => {
        console.log('[Google Drive] GIS SDK script loaded successfully');
        done();
      };

      script.onerror = (e) => {
        console.error('[Google Drive] GIS SDK script failed to load:', e);
        // Remover el script fallido para permitir reintentos
        script?.remove();
        fail(
          'Could not load Google sign-in. This may be caused by an ad blocker, firewall, or Content Security Policy. Please disable ad blockers and try again.',
        );
      };

      document.head.appendChild(script);
    } else {
      // El script ya existe, solo esperar a que se inicialice
      done();
    }

    // Timeout global de seguridad
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(
          new Error(
            'Google Identity Services SDK timed out. Please check your internet connection or disable ad blockers and try again.',
          ),
        );
      }
    }, timeoutMs);
  });
}

// ──────────────────────────────────────────────────────────────────────
// 2. Solicitar access_token vía popup OAuth
// ──────────────────────────────────────────────────────────────────────

/**
 * Abre el popup de Google OAuth para que el usuario elija su cuenta.
 * Retorna un access_token con scope drive.file.
 *
 * @param clientId — NEXT_PUBLIC_GOOGLE_CLIENT_ID
 */
export async function requestDriveAccessToken(clientId: string): Promise<string> {
  await loadGisScript();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response: GisTokenResponse) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message || 'OAuth popup was closed or blocked.'));
      },
    });

    // Dispara el popup de selección de cuenta
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

// ──────────────────────────────────────────────────────────────────────
// 3. Subir archivo a Google Drive (multipart/related)
// ──────────────────────────────────────────────────────────────────────

/**
 * Sube un Blob a Google Drive del usuario autenticado.
 *
 * Usa un upload multipart/related:
 *   Part 1: JSON metadata (nombre del archivo, mimeType)
 *   Part 2: El archivo binario
 *
 * @param blob        — El archivo PDF a subir
 * @param filename    — Nombre del archivo en Drive
 * @param accessToken — Token obtenido de requestDriveAccessToken
 */
export async function uploadFileToDrive(
  blob: Blob,
  filename: string,
  accessToken: string,
): Promise<DriveUploadResult> {
  const boundary = '-----pdfblack-boundary-' + Date.now();
  const delimiter = '\r\n--' + boundary + '\r\n';
  const closeDelimiter = '\r\n--' + boundary + '--';

  // Metadatos del archivo
  const metadata = JSON.stringify({
    name: filename,
    mimeType: 'application/pdf',
  });

  // Convertir blob a ArrayBuffer para concatenación binaria
  const fileBuffer = await blob.arrayBuffer();
  const fileBytes = new Uint8Array(fileBuffer);

  // Construir el body multipart/related manualmente para soportar binarios
  const encoder = new TextEncoder();

  const part1 = encoder.encode(
    delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadata +
      '\r\n--' +
      boundary +
      '\r\nContent-Type: application/pdf\r\nContent-Transfer-Encoding: binary\r\n\r\n',
  );
  const part3 = encoder.encode(closeDelimiter);

  // Combinar todas las partes en un solo ArrayBuffer
  const bodyLength = part1.byteLength + fileBytes.byteLength + part3.byteLength;
  const body = new Uint8Array(bodyLength);
  body.set(part1, 0);
  body.set(fileBytes, part1.byteLength);
  body.set(part3, part1.byteLength + fileBytes.byteLength);

  const response = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body.buffer,
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Google Drive Upload] Error response:', errBody);
    throw new Error(`Google Drive upload failed (${response.status}): ${response.statusText}`);
  }

  const result = await response.json();

  return {
    fileId: result.id,
    fileName: result.name || filename,
    webViewLink: result.webViewLink,
  };
}

// ──────────────────────────────────────────────────────────────────────
// 4. Revocar token (limpieza opcional)
// ──────────────────────────────────────────────────────────────────────

/**
 * Revoca el access_token para que el usuario deba re-autorizar la próxima vez.
 * Útil para testing o si el usuario quiere desconectar.
 */
export function revokeAccessToken(accessToken: string): void {
  if (!isGisReady()) return;
  window.google!.accounts.oauth2.revoke(accessToken);
}
