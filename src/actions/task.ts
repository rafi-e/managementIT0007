"use server";

import { requireAuth } from "@/lib/auth-actions";
import {
  getTasksByProjectId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getAllTasks,
  getLabels,
  createActivityLog,
} from "@/lib/db";
import {
  createNotifications,
  getAllUserIds,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { TaskInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getTasksAction(projectId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const tasks = await getTasksByProjectId(projectId);
  return serialize(tasks);
}

export async function getAllTasksAction() {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const tasks = await getAllTasks();
  return serialize(tasks);
}

export async function getTaskAction(taskId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return null;
  const task = await getTaskById(taskId);
  return serialize(task);
}

export async function createTaskAction(data: TaskInput) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;
    const task = await createTask(data, session.user.id);

    await createActivityLog({
      taskId: task.id,
      userId: session.user.id,
      action: `created task: "${task.title}"`,
    });

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";

    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} created task: ${task.title}`,
        message: `Task created in project`,
        link: `/tasks`,
      }))
    );

    revalidatePath(`/project/${data.projectId}`);
    return serialize(task);
  } catch (error) {
    console.error("createTaskAction failed:", error);
    throw new Error("Failed to create task");
  }
}

export async function updateTaskAction(
  taskId: string,
  data: Partial<TaskInput & { order?: number }>
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;

    const oldTask = await getTaskById(taskId);
    if (!oldTask) throw new Error("Task not found");

  const task = await updateTask(taskId, data, session.user.id);

  const actorName = session.user.name || "Someone";

  const changedFields: string[] = [];
  let changeDetail = "";

  if (data.status !== undefined && oldTask.status !== data.status) {
    changedFields.push("status");
    changeDetail = ` moved from ${oldTask.status} to ${data.status}`;
  }
  if (data.title !== undefined && oldTask.title !== data.title) {
    changedFields.push("title");
  }
  if (data.description !== undefined && oldTask.description !== data.description) {
    changedFields.push("description");
  }
  if (data.priority !== undefined && oldTask.priority !== data.priority) {
    changedFields.push("priority");
  }
  if (data.dueDate !== undefined && oldTask.dueDate !== data.dueDate) {
    changedFields.push("due date");
  }

  const promises: Promise<unknown>[] = [];

  const allUserIds = await getAllUserIds();

  if (changedFields.length > 0) {
    const changes = changedFields.join(", ") + changeDetail;
    promises.push(
      createNotifications(
        allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
          userId: uid,
          type: "task_updated",
          title: `${actorName} updated task: ${task.title}`,
          message: `${changes}`,
          link: `/tasks`,
        }))
      )
    );
  }

  if (data.assigneeIds?.length) {
    const newAssigneeIds = data.assigneeIds.filter(
      (uid) => !oldTask.assignments?.some((a) => a.id === uid)
    );
    if (newAssigneeIds.length > 0) {
      promises.push(
        createNotifications(
          newAssigneeIds.map((userId: string) => ({
            userId,
            type: "task_assigned",
            title: `Assigned to: ${task.title}`,
            message: `${actorName} assigned you to this task`,
            link: `/tasks`,
          }))
        )
      );
    }
  }

  await Promise.all(promises);

  const actionParts: string[] = [];
  if (data.title !== undefined && oldTask.title !== data.title) actionParts.push(`title to "${data.title}"`);
  if (data.status !== undefined && oldTask.status !== data.status) actionParts.push(`status to ${data.status}`);
  if (data.description !== undefined && oldTask.description !== data.description) actionParts.push("description");
  if (data.priority !== undefined && oldTask.priority !== data.priority) actionParts.push(`priority to ${data.priority}`);
  if (data.dueDate !== undefined && oldTask.dueDate !== data.dueDate) actionParts.push("due date");
  if (data.assigneeIds) actionParts.push("assignees");
  if (actionParts.length > 0) {
    await createActivityLog({
      taskId,
      userId: session.user.id,
      action: `updated task: "${task.title}" — ${actionParts.join(", ")}`,
    });
  }

  revalidatePath(`/project/*`);
  return serialize(task);
  } catch (error) {
    console.error("updateTaskAction failed:", error);
    throw new Error("Failed to update task");
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;

    const task = await getTaskById(taskId);

    if (task) {
      await createActivityLog({
        taskId,
        userId: session.user.id,
        action: `deleted task: "${task.title}"`,
      });

      const allUserIds = await getAllUserIds();
      const actorName = session.user.name || "Someone";
      await createNotifications(
        allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
          userId: uid,
          type: "task_updated",
          title: `${actorName} deleted task: ${task.title}`,
          message: `Task has been deleted`,
          link: `/tasks`,
        }))
      );
    }

    await deleteTask(taskId);

  revalidatePath(`/project/*`);
  } catch (error) {
    console.error("deleteTaskAction failed:", error);
    throw new Error("Failed to delete task");
  }
}

export async function getLabelsAction() {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const labels = await getLabels();
  return serialize(labels);
}

export async function reorderTasksAction(
  updates: { id: string; order: number; status?: string }[]
) {
  const session = await requireAuth();
  if (!session?.user?.id) return null;
  const result = await reorderTasks(updates);

  revalidatePath(`/project/*`);
  return serialize(result);
}
