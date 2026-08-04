import { create } from 'zustand';
import {
  saveUserActivity,
  addRecentFile as firestoreAddRecentFile,
  getRecentFiles as firestoreGetRecentFiles,
  getUserActivity,
} from '../lib/firebase/firestore';
import { useAuthStore } from './useAuthStore';

interface FileEntry {
  id: string;
  name: string;
  size: number;
  action: string;
  timestamp: Date;
  toolId: string;
}

interface ActivityState {
  filesProcessed: number;
  bytesSaved: number;
  timeSavedMinutes: number;
  recentFiles: FileEntry[];

  // Acciones locales
  incrementProcessed: (fileSize: number) => void;
  addRecentFile: (entry: Omit<FileEntry, 'id' | 'timestamp'>) => void;
  clearRecent: () => void;

  // Sincronización Firestore
  syncFromFirestore: (uid: string) => Promise<void>;
  syncToFirestore: (uid: string) => Promise<void>;
  hasSyncedFromFirestore: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Callbacks para integración con los componentes de herramientas
// Cada componente PdfXxx.tsx llamará a estas funciones al completar procesamiento
export const activityTracker = {
  onFileProcessed: (toolId: string, fileName: string, fileSize: number, actionDescription: string) => {
    const store = useActivityStore.getState();
    store.incrementProcessed(fileSize);
    store.addRecentFile({
      name: fileName,
      size: fileSize,
      action: actionDescription,
      toolId,
    });

    // Sincronizar a Firestore si el usuario está autenticado
    try {
      const authState = useAuthStore.getState();
      if (authState.currentUser?.uid) {
        syncActivityToFirestore(authState.currentUser.uid);
      }
    } catch {
      // No hay usuario autenticado, solo almacenamiento local
    }
  },
};

// Extensión del tracker para pasar el uid
export async function syncActivityToFirestore(uid: string) {
  const state = useActivityStore.getState();
  if (!uid) return;
  await state.syncToFirestore(uid);
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  filesProcessed: 0,
  bytesSaved: 0,
  timeSavedMinutes: 0,
  recentFiles: [],
  hasSyncedFromFirestore: false,

  incrementProcessed: (fileSize: number) =>
    set((state) => ({
      filesProcessed: state.filesProcessed + 1,
      bytesSaved: state.bytesSaved + Math.floor(fileSize * 0.45),
      timeSavedMinutes: state.timeSavedMinutes + Math.floor(Math.random() * 3) + 1,
    })),

  addRecentFile: (entry) =>
    set((state) => ({
      recentFiles: [
        {
          ...entry,
          id: generateId(),
          timestamp: new Date(),
        },
        ...state.recentFiles,
      ].slice(0, 10),
    })),

  clearRecent: () => set({ recentFiles: [] }),

  // ─── SINCRONIZACIÓN CON FIRESTORE ───

  syncFromFirestore: async (uid: string) => {
    if (!uid || get().hasSyncedFromFirestore) return;

    try {
      // Cargar actividad (stats)
      const activity = await getUserActivity(uid);
      if (activity) {
        set({
          filesProcessed: activity.totalFilesProcessed || 0,
          bytesSaved: activity.totalBytesSaved || 0,
          timeSavedMinutes: activity.totalTimeSavedMinutes || 0,
        });
      }

      // Cargar archivos recientes
      const files = await firestoreGetRecentFiles(uid);
      if (files.length > 0) {
        const mappedFiles: FileEntry[] = files.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          action: f.action,
          toolId: f.toolId,
          timestamp: f.timestamp?.toDate?.() || new Date(),
        }));
        set({ recentFiles: mappedFiles });
      }

      set({ hasSyncedFromFirestore: true });
      console.log('[ActivityStore] Sincronizado desde Firestore');
    } catch (error) {
      console.warn('[ActivityStore] Error al sincronizar desde Firestore:', error);
    }
  },

  syncToFirestore: async (uid: string) => {
    if (!uid) return;

    const state = get();

    try {
      // Guardar actividad (stats)
      await saveUserActivity(uid, {
        totalFilesProcessed: state.filesProcessed,
        totalBytesSaved: state.bytesSaved,
        totalTimeSavedMinutes: state.timeSavedMinutes,
      });

      // Guardar archivos recientes (el último)
      if (state.recentFiles.length > 0) {
        const latest = state.recentFiles[0];
        await firestoreAddRecentFile(uid, {
          id: latest.id,
          name: latest.name,
          size: latest.size,
          action: latest.action,
          toolId: latest.toolId,
          timestamp: latest.timestamp as unknown as import('../lib/firebase/firestore').FileEntry['timestamp'],
        });
      }

      console.log('[ActivityStore] Sincronizado a Firestore');
    } catch (error) {
      console.warn('[ActivityStore] Error al sincronizar a Firestore:', error);
    }
  },
}));