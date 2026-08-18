import { create, type StoreApi, type UseBoundStore } from 'zustand';

interface UIState {
  isHeaderHidden: boolean;
  setHeaderHidden: (hidden: boolean) => void;
}

const createUIStore = () =>
  create<UIState>((set) => ({
    isHeaderHidden: false,
    setHeaderHidden: (hidden) => set({ isHeaderHidden: hidden }),
  }));

type UIStore = UseBoundStore<StoreApi<UIState>>;

const g = globalThis as unknown as { __pdfblack_uistore?: UIStore };

export const useUIStore: UIStore =
  g.__pdfblack_uistore ?? (g.__pdfblack_uistore = createUIStore());
