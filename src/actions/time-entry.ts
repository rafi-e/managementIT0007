"use server";

import { requireAuth } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { createTimeEntry, createActivityLog } from "@/lib/db";
import { createNotifications, getAllUserIds } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function logTimeAction(data: {
  taskId: string;
  duration: number;
  note?: string;
}) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;

    const timeEntry = await createTimeEntry({
      taskId: data.taskId,
      userId: session.user.id,
      duration: data.duration,
      note: data.note,
    });

    await createActivityLog({
      taskId: data.taskId,
      userId: session.user.id,
      action: `logged ${data.duration} minutes`,
      details: data.note,
    });

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} logged time on a task`,
        message: `${data.duration} minutes logged`,
        link: `/tasks`,
      }))
    );

    revalidatePath(`/project/*`);
    return serialize(timeEntry);
  } catch (error) {
    console.error("logTimeAction failed:", error);
    throw new Error("Failed to log time");
  }
}
