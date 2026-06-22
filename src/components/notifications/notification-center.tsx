"use client";

import * as React from "react";
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
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NotificationType, type Notification } from "@/types";
import { useNotificationStore } from "@/store/use-notification-store";

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  [NotificationType.task_assigned]: <UserPlus className="h-4 w-4" />,
  [NotificationType.task_updated]: <Bell className="h-4 w-4" />,
  [NotificationType.comment_added]: <MessageSquare className="h-4 w-4" />,
  [NotificationType.mention]: <AtSign className="h-4 w-4" />,
  [NotificationType.invitation]: <Mail className="h-4 w-4" />,
  [NotificationType.status_change]: <ArrowRightLeft className="h-4 w-4" />,
  [NotificationType.due_date_reminder]: <Calendar className="h-4 w-4" />,
};

interface NotificationCenterProps {
  onClose?: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { data: queryNotifications = [], isLoading } = useNotifications();
  const storeNotifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = queryNotifications.length > 0 ? queryNotifications : storeNotifications;

  const handleMarkAsRead = React.useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead.mutate(notification.id);
      }
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = React.useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card className="w-full sm:w-96 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !notification.read && "bg-muted/30"
                  )}
                  onClick={() => {
                    handleMarkAsRead(notification);
                    if (notification.link && onClose) {
                      onClose();
                    }
                  }}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      !notification.read
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {notificationIcons[notification.type] ?? <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-sm",
                          !notification.read && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
