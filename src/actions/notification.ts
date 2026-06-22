"use server";

import { requireAuth } from "@/lib/auth-actions";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getNotificationsAction(
  opts?: { limit?: number; offset?: number; unreadOnly?: boolean }
) {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const notifications = await getNotifications(session.user.id, opts);
  return serialize(notifications);
}

export async function getUnreadCountAction() {
  const session = await requireAuth();
  if (!session?.user?.id) return 0;
  return getUnreadCount(session.user.id);
}

export async function markAsReadAction(notificationId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return;
  await markAsRead(notificationId, session.user.id);
  revalidatePath("/notifications");
}

export async function markAllAsReadAction() {
  const session = await requireAuth();
  if (!session?.user?.id) return;
  await markAllAsRead(session.user.id);
  revalidatePath("/notifications");
}

export async function deleteNotificationAction(notificationId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return;
  await deleteNotification(notificationId, session.user.id);
  revalidatePath("/notifications");
}
