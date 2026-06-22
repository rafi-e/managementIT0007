"use client";

import * as React from "react";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/store/use-notification-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NotificationType, type Notification } from "@/types";
import {
  Bell,
  BellOff,
  CheckCheck,
  UserPlus,
  MessageSquare,
  AtSign,
  Calendar,
  ArrowRightLeft,
  Mail,
  Loader2,
} from "lucide-react";

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  [NotificationType.task_assigned]: <UserPlus className="h-4 w-4" />,
  [NotificationType.task_updated]: <Bell className="h-4 w-4" />,
  [NotificationType.comment_added]: <MessageSquare className="h-4 w-4" />,
  [NotificationType.mention]: <AtSign className="h-4 w-4" />,
  [NotificationType.invitation]: <Mail className="h-4 w-4" />,
  [NotificationType.status_change]: <ArrowRightLeft className="h-4 w-4" />,
  [NotificationType.due_date_reminder]: <Calendar className="h-4 w-4" />,
};

const NOTIFICATION_BG: Record<NotificationType, string> = {
  [NotificationType.task_assigned]: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  [NotificationType.task_updated]: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  [NotificationType.comment_added]: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
  [NotificationType.mention]: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  [NotificationType.invitation]: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  [NotificationType.status_change]: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
  [NotificationType.due_date_reminder]: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = !notification.read;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 px-4 sm:px-6 py-4 transition-colors hover:bg-accent/30",
        isUnread && "bg-muted/20"
      )}
    >
      {/* Unread indicator line */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          NOTIFICATION_BG[notification.type] ?? "bg-muted text-muted-foreground"
        )}
      >
        {NOTIFICATION_ICONS[notification.type] ?? <Bell className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm truncate",
                isUnread ? "font-semibold" : "text-muted-foreground"
              )}
            >
              {notification.title}
            </p>
            {notification.message && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
              {formatRelativeTime(notification.createdAt)}
            </span>
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          {isUnread && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications({ limit: 50 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const storeNotifications = useNotificationStore((s) => s.notifications);

  const display = notifications.length > 0 ? notifications : storeNotifications;

  const unreadCount = display.filter((n) => !n.read).length;

  const groupByDate = React.useMemo(() => {
    const groups = new Map<string, Notification[]>();
    for (const n of display) {
      const date = new Date(n.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(n);
    }
    return Array.from(groups.entries());
  }, [display]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Summary bar */}
      {!isLoading && display.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>
            {display.length} {display.length === 1 ? "notification" : "notifications"}
            {unreadCount > 0 && (
              <>
                <span className="mx-1">&middot;</span>
                <span className="font-medium text-foreground">{unreadCount} unread</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : display.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BellOff className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-muted-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              You&apos;re all caught up
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden divide-y">
          {groupByDate.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date header */}
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 sm:px-6 py-2 border-b">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {dateLabel}
                </span>
                <span className="ml-2 text-xs text-muted-foreground/60">
                  ({items.length})
                </span>
              </div>

              {/* Items */}
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markAsRead.mutate(id)}
                />
              ))}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
