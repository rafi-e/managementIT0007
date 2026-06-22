"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectsAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/actions/project";
import type { Project } from "@/types";
import type { ProjectInput } from "@/lib/validations";

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const data = await getProjectsAction(workspaceId);
      return data as unknown as Project[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectInput) => {
      const result = await createProjectAction(data);
      return result as unknown as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", project.workspaceId],
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ProjectInput>;
    }) => {
      const result = await updateProjectAction(id, data);
      return result as unknown as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", project.workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      workspaceId,
    }: {
      id: string;
      workspaceId: string;
    }) => {
      await deleteProjectAction(id);
      return workspaceId;
    },
    onSuccess: (workspaceId) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", workspaceId],
      });
    },
  });
}
