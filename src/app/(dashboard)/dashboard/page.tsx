"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { useWorkspaces } from "@/hooks/use-workspace";
import { useAllTasks } from "@/hooks/use-tasks";
import { useTaskStore } from "@/store/use-task-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { EmptyState, ErrorState } from "@/components/ui/state-display";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Activity,
  CalendarDays,
  Building2,
  Hash,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { format, subDays, startOfWeek, isSameDay } from "date-fns";
import { TaskStatus } from "@/types";
import type { ActivityLog, Task } from "@/types";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  [TaskStatus.todo]: "#6b7280",
  [TaskStatus.in_progress]: "#f59e0b",
  [TaskStatus.review]: "#1f03c4",
  [TaskStatus.completed]: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  [TaskStatus.todo]: "Todo",
  [TaskStatus.in_progress]: "In Progress",
  [TaskStatus.review]: "Review",
  [TaskStatus.completed]: "Completed",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  [TaskStatus.todo]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  [TaskStatus.in_progress]:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  [TaskStatus.review]: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  [TaskStatus.completed]: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export default function DashboardPage() {
  const user = useCurrentUser();
  const tasks = useTaskStore((s) => s.tasks);
  const { data: workspaces, isLoading: wLoading } = useWorkspaces();
  const { isLoading, error: tasksError, refetch } = useAllTasks();

  if (user === undefined) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (tasksError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={(tasksError as Error).message || "An unexpected error occurred"}
        onRetry={() => refetch()}
      />
    );
  }

  if (tasks.length === 0 && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="space-y-6">
        <Header user={user} />
        <EmptyState
          icon={BarChart3}
          title="Welcome to your dashboard"
          description="Create a workspace and tasks to see your dashboard populated with insights"
        />
      </div>
    );
  }

  return <DashboardContent user={user} tasks={tasks} workspaces={workspaces || []} />;
}

function DashboardContent({
  user,
  tasks,
  workspaces,
}: {
  user: NonNullable<ReturnType<typeof useCurrentUser>>;
  tasks: Task[];
  workspaces: { id: string; name: string; icon: string | null; owner?: { name: string } | null }[];
}) {
  const stats = useMemo(() => {
    const now = new Date();
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === TaskStatus.completed).length,
      overdueTasks: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.completed
      ).length,
      inProgressTasks: tasks.filter((t) => t.status === TaskStatus.in_progress).length,
    };
  }, [tasks]);

  const completionData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayTasks = tasks.filter(
        (t) => t.status === TaskStatus.completed && isSameDay(new Date(t.updatedAt), date)
      );
      return {
        name: format(date, "EEE"),
        completed: dayTasks.length,
      };
    });
    return last7;
  }, [tasks]);

  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      key,
      value,
    }));
  }, [tasks]);

  const productivityData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const done = tasks.filter(
        (t) => t.status === TaskStatus.completed && isSameDay(new Date(t.updatedAt), date)
      ).length;
      const created = tasks.filter((t) => isSameDay(new Date(t.createdAt), date)).length;
      return {
        name: format(date, "EEE"),
        completed: done,
        created,
      };
    });
  }, [tasks]);

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [tasks]
  );

  const upcomingDueDates = useMemo(
    () =>
      [...tasks]
        .filter(
          (t) => t.dueDate && new Date(t.dueDate) >= new Date() && t.status !== TaskStatus.completed
        )
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5),
    [tasks]
  );

  const recentActivity: ActivityLog[] = useMemo(() => {
    const logs: ActivityLog[] = [];
    for (const task of tasks) {
      if (task.comments?.length) {
        for (const comment of task.comments) {
          logs.push({
            id: comment.id,
            taskId: task.id,
            userId: comment.userId,
            action: `commented on "${task.title}"`,
            details: null,
            user: comment.user,
            createdAt: comment.createdAt,
          });
        }
      }
    }
    logs.push(
      ...tasks.map((t) => ({
        id: `update-${t.id}`,
        taskId: t.id,
        userId: t.assignments[0]?.id || "",
        action: `updated "${t.title}" to ${STATUS_LABELS[t.status]}`,
        details: null,
        user: t.assignments[0] || {
          id: "",
          name: "Unknown",
          email: "",
          image: null,
          role: "MEMBER" as const,
          createdAt: "",
        },
        createdAt: t.updatedAt,
      }))
    );
    return logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [tasks]);

  return (
    <div className="space-y-6">
      <Header user={user} />

      <StatsRow stats={stats} />

      <WorkspacesRow workspaces={workspaces} />

      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm font-medium">Tasks Completed (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm font-medium">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[entry.key] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm font-medium">Productivity Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px]">
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                <div className="min-w-0">
                  <p className="truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px]">
            {recentTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent tasks</p>
            )}
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1 mr-2">{task.title}</span>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-xs border-0", STATUS_BADGE_CLASSES[task.status])}
                >
                  {STATUS_LABELS[task.status]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Upcoming Due Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px]">
            {upcomingDueDates.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming due dates</p>
            )}
            {upcomingDueDates.map((task) => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1 mr-2">{task.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(task.dueDate!, "MMM d")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Header({ user }: { user: { name: string } }) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
        Welcome back, {user.name?.split(" ")[0] || "there"}
      </h1>
      <p className="text-sm text-muted-foreground">{today}</p>
    </div>
  );
}

function StatsRow({
  stats,
}: {
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
  };
}) {
  const router = useRouter();
  const items = [
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      icon: ListTodo,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      href: "/tasks",
    },
    {
      label: "In Progress",
      value: stats.inProgressTasks,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      href: "/tasks?tab=active&status=in_progress",
    },
    {
      label: "Completed",
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      href: "/tasks?tab=completed",
    },
    {
      label: "Overdue",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
      href: "/tasks?tab=active&preset=overdue",
    },
  ];

  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          onClick={() => router.push(item.href)}
          className="cursor-pointer transition-all hover:ring-2 hover:ring-offset-2 hover:ring-primary/20"
        >
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`rounded-lg p-1.5 sm:p-2.5 ${item.bg}`}>
                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl sm:text-2xl font-bold">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WorkspacesRow({
  workspaces,
}: {
  workspaces: { id: string; name: string; icon: string | null; owner?: { name: string } | null }[];
}) {
  if (workspaces.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        Workspaces
      </h2>
      <div className="grid grid-cols-1 sm:flex sm:gap-3 sm:overflow-x-auto gap-2">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/workspace/${ws.id}`}
            className="flex items-center gap-3 rounded-lg border p-3 sm:min-w-[200px] sm:shrink-0 hover:bg-accent transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm">
              {ws.icon || <Hash className="h-4 w-4 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{ws.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {ws.owner?.name ? `by ${ws.owner.name}` : ""}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                <div className="space-y-1 sm:space-y-2">
                  <Skeleton className="h-3 w-16 sm:w-20" />
                  <Skeleton className="h-5 w-10 sm:h-6 sm:w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
