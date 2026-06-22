import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  commandPaletteOpen: boolean;
  activeModal: string | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toggleCommandPalette: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  commandPaletteOpen: false,
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),
}));
