"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTaskStore } from "@/store/use-task-store";
import {
  getTasksAction,
  getAllTasksAction,
  getTaskAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  reorderTasksAction,
} from "@/actions/task";
import {
  addAttachmentAction,
  deleteAttachmentAction,
} from "@/actions/attachment";
import { addCommentAction } from "@/actions/comment";
import type { Attachment, Comment } from "@/types";
import type { TaskInput } from "@/lib/validations";

export function useTasks(projectId: string | undefined) {
  const setTasks = useTaskStore((s) => s.setTasks);

  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const result = await getTasksAction(projectId);
      setTasks(result);
      return result;
    },
    enabled: !!projectId,
    initialData: projectId ? undefined : [],
    refetchInterval: 30000,
  });
}

export function useAllTasks() {
  const setTasks = useTaskStore((s) => s.setTasks);

  return useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const result = await getAllTasksAction();
      setTasks(result);
      return result;
    },
    refetchInterval: 30000,
  });
}

export function useTask(taskId: string | undefined) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);

  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const result = await getTaskAction(taskId);
      if (result) setSelectedTask(result);
      return result;
    },
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const addTask = useTaskStore((s) => s.addTask);

  return useMutation({
    mutationFn: async (data: TaskInput) => {
      const result = await createTaskAction(data);
      if (!result) throw new Error("Failed to create task");
      return result;
    },
    onSuccess: (task) => {
      addTask(task);
      queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const updateTaskInStore = useTaskStore((s) => s.updateTask);

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TaskInput & { order?: number }>;
    }) => {
      const result = await updateTaskAction(id, data);
      if (!result) throw new Error("Failed to update task");
      return result;
    },
    onSuccess: (task) => {
      updateTaskInStore(task.id, task);
      queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const removeTask = useTaskStore((s) => s.removeTask);

  return useMutation({
    mutationFn: async (taskId: string) => {
      await deleteTaskAction(taskId);
    },
    onSuccess: (_data, taskId) => {
      removeTask(taskId);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useAddAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      file,
    }: {
      taskId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await addAttachmentAction(taskId, formData);
      return result as Attachment;
    },
    onSuccess: (attachment, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attachmentId,
    }: {
      attachmentId: string;
      taskId: string;
    }) => {
      await deleteAttachmentAction(attachmentId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      content,
    }: {
      taskId: string;
      content: string;
    }) => {
      const result = await addCommentAction(taskId, content);
      return result as Comment;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: { id: string; order: number; status?: string }[]
    ) => {
      const result = await reorderTasksAction(updates);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
