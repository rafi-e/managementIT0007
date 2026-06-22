"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/use-notification-store";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from "@/actions/notification";
import type { Notification } from "@/types";

export function useNotifications(opts?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  return useQuery({
    queryKey: ["notifications", opts],
    queryFn: async () => {
      const data = await getNotificationsAction(opts);
      const notifications = data as unknown as Notification[];
      setNotifications(notifications);
      return notifications;
    },
    refetchInterval: 15_000,
  });
}

export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => {
      const count = await getUnreadCountAction();
      setUnreadCount(count);
      return count;
    },
    refetchInterval: 30000,
    initialData: unreadCount,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const markAsReadInStore = useNotificationStore((s) => s.markAsRead);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await markAsReadAction(notificationId);
      return notificationId;
    },
    onSuccess: (notificationId) => {
      markAsReadInStore(notificationId);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const markAllAsReadInStore = useNotificationStore((s) => s.markAllAsRead);

  return useMutation({
    mutationFn: async () => {
      await markAllAsReadAction();
    },
    onSuccess: () => {
      markAllAsReadInStore();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await deleteNotificationAction(notificationId);
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}
