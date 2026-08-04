import { getFirestore, doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import app from './config';

// ─── Firestore (lazy init) ───
const db = getFirestore(app);

// ─── Tipos ───

export interface UserPreferences {
  language?: 'es' | 'en';
  theme?: 'dark' | 'light' | 'system';
  favoritesToolIds?: string[];
  lastActiveAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserActivity {
  totalFilesProcessed?: number;
  totalBytesSaved?: number;
  totalTimeSavedMinutes?: number;
  lastProcessedAt?: Timestamp;
}

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  action: string;
  toolId: string;
  timestamp: Timestamp;
}

// ═══════════════════════════════════════════
//  PREFERENCIAS DE USUARIO
// ═══════════════════════════════════════════

export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
  try {
    const ref = doc(db, 'users', uid, 'settings', 'preferences');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] No se pudieron cargar preferencias (offline?):', error);
    return null;
  }
}

export async function saveUserPreferences(uid: string, prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'settings', 'preferences');
    await setDoc(
      ref,
      {
        ...prefs,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] No se pudieron guardar preferencias (offline?):', error);
  }
}

// ═══════════════════════════════════════════
//  ACTIVIDAD DE USUARIO (stats)
// ═══════════════════════════════════════════

export async function getUserActivity(uid: string): Promise<UserActivity | null> {
  try {
    const ref = doc(db, 'users', uid, 'activity', 'stats');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserActivity;
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] No se pudo cargar actividad:', error);
    return null;
  }
}

export async function saveUserActivity(uid: string, activity: Partial<UserActivity>): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'activity', 'stats');
    await setDoc(
      ref,
      {
        ...activity,
        lastProcessedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] No se pudo guardar actividad:', error);
  }
}

// ═══════════════════════════════════════════
//  ARCHIVOS RECIENTES (historial)
// ═══════════════════════════════════════════

export async function getRecentFiles(uid: string, limit = 10): Promise<FileEntry[]> {
  try {
    const ref = doc(db, 'users', uid, 'activity', 'recentFiles');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { files: FileEntry[] };
      return (data.files || []).slice(0, limit);
    }
    return [];
  } catch (error) {
    console.warn('[Firestore] No se pudieron cargar archivos recientes:', error);
    return [];
  }
}

export async function addRecentFile(uid: string, file: FileEntry): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'activity', 'recentFiles');
    const snap = await getDoc(ref);
    const existing: { files: FileEntry[] } = snap.exists()
      ? (snap.data() as { files: FileEntry[] })
      : { files: [] };

    const updatedFiles = [file, ...existing.files].slice(0, 10);
    await setDoc(ref, {
      files: updatedFiles,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[Firestore] No se pudo guardar archivo reciente:', error);
  }
}

export async function clearRecentFiles(uid: string): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'activity', 'recentFiles');
    await setDoc(ref, { files: [], updatedAt: serverTimestamp() });
  } catch (error) {
    console.warn('[Firestore] No se pudo limpiar archivos recientes:', error);
  }
}

export { db };