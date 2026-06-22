import { create } from 'zustand';
import type { Workspace } from '@/types';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];

  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  workspaces: [],

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    })),

  updateWorkspace: (id, data) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...data } : w
      ),
      currentWorkspace:
        state.currentWorkspace?.id === id
          ? { ...state.currentWorkspace, ...data }
          : state.currentWorkspace,
    })),

  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace:
        state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    })),
}));
