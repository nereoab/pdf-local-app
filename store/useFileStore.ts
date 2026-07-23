import { create } from 'zustand';

interface FileState {
  globalFile: File | null;
  setGlobalFile: (file: File | null) => void;
  clearGlobalFile: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  globalFile: null,
  setGlobalFile: (file) => set({ globalFile: file }),
  clearGlobalFile: () => set({ globalFile: null }),
}));