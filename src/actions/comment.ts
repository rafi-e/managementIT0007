"use server";

import { requireAuth } from "@/lib/auth-actions";
import { createComment, getCommentsByTaskId, createActivityLog } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import {
  createNotification,
  createNotifications,
  getAllUserIds,
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function addCommentAction(taskId: string, content: string) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const comment = await createComment(taskId, session.user.id, content);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, projectId: true },
    });

    await createActivityLog({
      taskId,
      userId: session.user.id,
      action: `commented on task: "${task?.title ?? 'unknown'}"`,
    });

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";

    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "comment_added",
        title: `${actorName} commented on task: ${task?.title ?? 'unknown'}`,
        message: `${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
        link: `/tasks`,
      }))
    );

    // Check for @mentions in the comment content
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedUser = await prisma.user.findUnique({
        where: { pn: match[1] },
        select: { id: true },
      });

      if (mentionedUser && mentionedUser.id !== session.user.id) {
        await createNotification({
          userId: mentionedUser.id,
          type: "mention",
          title: `${actorName} mentioned you in a comment`,
          message: `${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
          link: `/tasks`,
        });
      }
    }

    revalidatePath(`/project/*`);
    return JSON.parse(JSON.stringify(comment));
    } catch (error) {
      console.error("addCommentAction failed:", error);
      throw new Error("Failed to add comment");
    }
  }

export async function getCommentsAction(taskId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return [];

  const comments = await getCommentsByTaskId(taskId);
  return JSON.parse(JSON.stringify(comments));
}
