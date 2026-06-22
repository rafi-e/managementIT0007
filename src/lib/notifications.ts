import { prisma } from "./prisma";
import type { NotificationType } from "@/generated/prisma/client";
import { broadcast } from "./sse";

export async function getAllUserIds() {
  const users = await prisma.user.findMany({ select: { id: true } });
  return users.map((u) => u.id);
}

export async function getWorkspaceMembersByWorkspaceId(
  workspaceId: string
): Promise<string[]> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { members: { select: { userId: true } } },
  });
  return workspace?.members.map((m) => m.userId) ?? [];
}

export async function getWorkspaceMembersByProjectId(
  projectId: string
): Promise<string[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      workspace: {
        select: { members: { select: { userId: true } } },
      },
    },
  });
  return project?.workspace.members.map((m) => m.userId) ?? [];
}

export async function getWorkspaceMembersByTaskId(
  taskId: string
): Promise<string[]> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      project: {
        select: {
          workspace: {
            select: { members: { select: { userId: true } } },
          },
        },
      },
    },
  });
  return task?.project.workspace.members.map((m) => m.userId) ?? [];
}

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
};

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, link } = params;

  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link },
  });

  broadcast("notification", notification);
  return notification;
}

export async function createNotifications(params: CreateNotificationParams[]) {
  if (params.length === 0) return [];

  const results = await Promise.all(
    params.map((p) => createNotification(p))
  );

  return results;
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

export async function getNotifications(
  userId: string,
  opts?: { limit?: number; offset?: number; unreadOnly?: boolean }
) {
  const { limit = 20, offset = 0, unreadOnly = false } = opts ?? {};

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  return prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}
