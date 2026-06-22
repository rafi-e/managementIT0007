"use server";

import { requireAuth } from "@/lib/auth-actions";
import {
  createAttachment,
  deleteAttachment,
  getAttachmentById,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { createNotifications, getAllUserIds } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function addAttachmentAction(taskId: string, formData: FormData) {
  const session = await requireAuth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${taskId}/${timestamp}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from("task-attachments")
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("task-attachments").getPublicUrl(data.path);

  const attachment = await createAttachment({
    taskId,
    name: file.name,
    url: publicUrl,
    publicId: data.path,
    size: file.size,
    type: file.type,
  });

  const allUserIds = await getAllUserIds();
  const actorName = session.user.name || "Someone";
  await createNotifications(
    allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
      userId: uid,
      type: "task_updated",
      title: `${actorName} added attachment: ${file.name}`,
      message: `New attachment added to task`,
      link: `/tasks`,
    }))
  );

  revalidatePath(`/project/*`);
  return JSON.parse(JSON.stringify(attachment));
}

export async function saveAttachmentData(
  taskId: string,
  name: string,
  url: string,
  publicId: string,
  size: number,
  type: string,
) {
  const session = await requireAuth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const attachment = await createAttachment({
    taskId,
    name,
    url,
    publicId,
    size,
    type,
    width: 0,
    height: 0,
  });

  const allUserIds = await getAllUserIds();
  const actorName = session.user.name || "Someone";
  await createNotifications(
    allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
      userId: uid,
      type: "task_updated",
      title: `${actorName} added attachment: ${name}`,
      message: `New attachment added to task`,
      link: `/tasks`,
    }))
  );

  revalidatePath(`/project/*`);
  return JSON.parse(JSON.stringify(attachment));
}

export async function deleteAttachmentAction(attachmentId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const attachment = await getAttachmentById(attachmentId);
  if (!attachment) throw new Error("Attachment not found");

  if (attachment.publicId) {
    await supabase.storage.from("task-attachments").remove([attachment.publicId]);
  }

  await deleteAttachment(attachmentId);
  revalidatePath(`/project/*`);
}
