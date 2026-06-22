"use server";

import { requireAuth } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { createSubtask, toggleSubtask, deleteSubtask, createActivityLog } from "@/lib/db";
import {
  createNotifications,
  getAllUserIds,
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function createSubtaskAction(taskId: string, title: string) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;

    const subtask = await createSubtask(taskId, title);

    await createActivityLog({
      taskId,
      userId: session.user.id,
      action: `created subtask: "${title}"`,
    });

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} added subtask: ${title}`,
        message: `New subtask added`,
        link: `/tasks`,
      }))
    );

    revalidatePath(`/project/*`);
    return serialize(subtask);
  } catch (error) {
    console.error("createSubtaskAction failed:", error);
    throw new Error("Failed to create subtask");
  }
}

export async function toggleSubtaskAction(subtaskId: string, completed: boolean) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;

    await toggleSubtask(subtaskId, completed);

    const action = completed ? "completed" : "reopened";
    await createActivityLog({
      taskId: subtaskId,
      userId: session.user.id,
      action: `${action} subtask`,
    });

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} ${action} a subtask`,
        message: `Subtask ${action}`,
        link: `/tasks`,
      }))
    );

    revalidatePath(`/project/*`);
  } catch (error) {
    console.error("toggleSubtaskAction failed:", error);
    throw new Error("Failed to update subtask");
  }
}

export async function deleteSubtaskAction(subtaskId: string) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;

    await createActivityLog({
      taskId: subtaskId,
      userId: session.user.id,
      action: `deleted subtask`,
    });

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} deleted a subtask`,
        message: `Subtask deleted`,
        link: `/tasks`,
      }))
    );

    await deleteSubtask(subtaskId);
    revalidatePath(`/project/*`);
  } catch (error) {
    console.error("deleteSubtaskAction failed:", error);
    throw new Error("Failed to delete subtask");
  }
}
