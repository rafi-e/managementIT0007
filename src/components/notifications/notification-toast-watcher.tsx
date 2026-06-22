"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { getNotificationsAction } from "@/actions/notification";
import { useNotificationStore } from "@/store/use-notification-store";
import type { Notification } from "@/types";
import { Bell, UserPlus, MessageSquare, AtSign, Mail, ArrowRightLeft, Calendar } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  task_assigned: <UserPlus className="h-4 w-4" />,
  task_updated: <Bell className="h-4 w-4" />,
  comment_added: <MessageSquare className="h-4 w-4" />,
  mention: <AtSign className="h-4 w-4" />,
  invitation: <Mail className="h-4 w-4" />,
  status_change: <ArrowRightLeft className="h-4 w-4" />,
  due_date_reminder: <Calendar className="h-4 w-4" />,
};

const TYPE_STYLES: Record<string, string> = {
  task_assigned: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  task_updated: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  comment_added: "text-green-500 bg-green-100 dark:bg-green-900/30",
  mention: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  invitation: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
  status_change: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  due_date_reminder: "text-red-500 bg-red-100 dark:bg-red-900/30",
};

function showToastNotification(notification: Notification) {
  const icon = TYPE_ICONS[notification.type] ?? <Bell className="h-4 w-4" />;
  const iconStyle = TYPE_STYLES[notification.type] ?? "bg-muted text-muted-foreground";

  toast(
    (t) => (
      <div className="flex items-start gap-3 min-w-0 max-w-sm">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{notification.title}</p>
          {notification.message && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    ),
    { duration: 6000 }
  );
}

export function NotificationToastWatcher() {
  const latestId = React.useRef<string | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleNotification = React.useCallback(
    (notification: Notification) => {
      if (notification.id === latestId.current) return;
      latestId.current = notification.id;
      addNotification(notification);
      showToastNotification(notification);
    },
    [addNotification]
  );

  React.useEffect(() => {
    let mounted = true;
    let eventSource: EventSource | null = null;

    // Initialize: snapshot the latest notification ID without showing a toast
    getNotificationsAction({ limit: 1, unreadOnly: true }).then((data) => {
      if (!mounted) return;
      const notifications = data as unknown as Notification[];
      if (notifications.length > 0) {
        latestId.current = notifications[0].id;
      }
    }).catch(() => {});

    // SSE connection for real-time delivery
    try {
      eventSource = new EventSource("/api/notifications/stream");
      eventSource.addEventListener("notification", (event) => {
        if (!mounted) return;
        try {
          const notification = JSON.parse(event.data) as Notification;
          handleNotification(notification);
        } catch {
          /* silent */
        }
      });
    } catch {
      /* silent */
    }

    // Poll fallback every 3s
    const interval = setInterval(async () => {
      if (!mounted) return;
      try {
        const data = await getNotificationsAction({ limit: 1, unreadOnly: true });
        if (!mounted) return;
        const notifications = data as unknown as Notification[];
        if (notifications.length === 0) return;
        handleNotification(notifications[0]);
      } catch {
        /* silent */
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
      eventSource?.close();
    };
  }, [handleNotification]);

  return null;
}
