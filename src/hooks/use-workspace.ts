"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/use-workspace-store";
import {
  getWorkspacesAction,
  getWorkspaceAction,
  getWorkspaceMembersAction,
  createWorkspaceAction,
  updateWorkspaceAction,
  deleteWorkspaceAction,
  addWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateWorkspaceMemberRoleAction,
  getUserCountAction,
} from "@/actions/workspace";
import type { Workspace, WorkspaceMember } from "@/types";
import type { WorkspaceInput } from "@/lib/validations";

export function useWorkspaces() {
  const { setWorkspaces } = useWorkspaceStore();

  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const data = await getWorkspacesAction();
      const workspaces = data as unknown as Workspace[];
      setWorkspaces(workspaces);
      return workspaces;
    },
  });
}

export function useWorkspace(workspaceId: string | undefined) {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const data = await getWorkspaceAction(workspaceId);
      const workspace = data as unknown as Workspace;
      setCurrentWorkspace(workspace);
      return workspace;
    },
    enabled: !!workspaceId,
    initialData: currentWorkspace?.id === workspaceId ? currentWorkspace : undefined,
  });
}

export function useCurrentWorkspace() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  return {
    currentWorkspace,
    setCurrentWorkspace,
  };
}

export function useUserCount() {
  return useQuery({
    queryKey: ["user-count"],
    queryFn: async () => {
      return getUserCountAction();
    },
  });
}

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const data = await getWorkspaceMembersAction(workspaceId);
      return data as unknown as WorkspaceMember[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);

  return useMutation({
    mutationFn: async (data: WorkspaceInput) => {
      const result = await createWorkspaceAction(data);
      return result as unknown as Workspace;
    },
    onSuccess: (workspace) => {
      addWorkspace(workspace);
      useWorkspaceStore.getState().setCurrentWorkspace(workspace);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<WorkspaceInput>;
    }) => {
      const result = await updateWorkspaceAction(id, data);
      return result as unknown as Workspace;
    },
    onSuccess: (workspace) => {
      updateWorkspace(workspace.id, workspace);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const removeWorkspace = useWorkspaceStore((s) => s.removeWorkspace);

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      await deleteWorkspaceAction(workspaceId);
    },
    onSuccess: (_data, workspaceId) => {
      removeWorkspace(workspaceId);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role?: "admin" | "member" | "guest";
    }) => {
      const result = await addWorkspaceMemberAction(workspaceId, userId, role);
      return result as unknown as WorkspaceMember;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspace", workspaceId],
      });
    },
  });
}

export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      userId,
    }: {
      workspaceId: string;
      userId: string;
    }) => {
      await removeWorkspaceMemberAction(workspaceId, userId);
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspace", workspaceId],
      });
    },
  });
}

export function useUpdateWorkspaceMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role: "admin" | "member" | "guest";
    }) => {
      const result = await updateWorkspaceMemberRoleAction(
        workspaceId,
        userId,
        role
      );
      return result as unknown as WorkspaceMember;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
    },
  });
}
