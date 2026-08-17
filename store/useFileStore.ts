import { create, type StoreApi, type UseBoundStore } from 'zustand';

interface FileState {
  globalFile: File | null;
  globalFiles: File[];
  setGlobalFile: (file: File | null) => void;
  setGlobalFiles: (files: File[]) => void;
  addGlobalFiles: (files: File[]) => void;
  removeGlobalFile: (index: number) => void;
  clearGlobalFile: () => void;
}

const createFileStore = () =>
  create<FileState>((set) => ({
    globalFile: null,
    globalFiles: [],
    setGlobalFile: (file) => set({ globalFile: file, globalFiles: file ? [file] : [] }),
    setGlobalFiles: (files) => set({ globalFiles: files, globalFile: files.length > 0 ? files[0] : null }),
    addGlobalFiles: (newFiles) =>
      set((state) => {
        const updated = [...state.globalFiles, ...newFiles];
        return { globalFiles: updated, globalFile: updated.length > 0 ? updated[0] : null };
      }),
    removeGlobalFile: (index) =>
      set((state) => {
        const updated = state.globalFiles.filter((_, i) => i !== index);
        return { globalFiles: updated, globalFile: updated.length > 0 ? updated[0] : null };
      }),
    clearGlobalFile: () => set({ globalFile: null, globalFiles: [] }),
  }));

type FileStore = UseBoundStore<StoreApi<FileState>>;

// Guardar el store en globalThis para que sobreviva a HMR de Turbopack
// (sin esto, cada recarga en caliente reinicia el store y se pierde el archivo)
const g = globalThis as unknown as { __pdfblack_filestore?: FileStore };

export const useFileStore: FileStore =
  g.__pdfblack_filestore ?? (g.__pdfblack_filestore = createFileStore());