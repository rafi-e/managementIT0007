"use client";

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/hooks/use-auth";
import { useAllTasks } from "@/hooks/use-tasks";
import { useTaskStore } from "@/store/use-task-store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatRelativeTime, getInitials, stripHtml } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@/types";
import {
  ListTodo,
  Circle,
  CheckCircle2,
  Search,
  AlertCircle,
  Calendar,
  MessageSquare,
  Paperclip,
  Users,
  ChevronRight,
  Clock,
  Flag,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: TaskStatus.todo, label: "To Do" },
  { value: TaskStatus.in_progress, label: "In Progress" },
  { value: TaskStatus.review, label: "Review" },
  { value: TaskStatus.completed, label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: TaskPriority.low, label: "Low" },
  { value: TaskPriority.medium, label: "Medium" },
  { value: TaskPriority.high, label: "High" },
  { value: TaskPriority.urgent, label: "Urgent" },
];

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800",
};

const PRIORITY_STYLES: Record<string, { dot: string; label: string }> = {
  urgent: { dot: "bg-red-500", label: "text-red-600 dark:text-red-400" },
  high: { dot: "bg-orange-500", label: "text-orange-600 dark:text-orange-400" },
  medium: { dot: "bg-blue-500", label: "text-blue-600 dark:text-blue-400" },
  low: { dot: "bg-gray-400", label: "text-gray-500 dark:text-gray-400" },
};

const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

export default function TasksPage() {
  const user = useCurrentUser();
  const { data: allTasks, isLoading } = useAllTasks();
  const tasks = useMemo(() => allTasks ?? [], [allTasks]);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, search, statusFilter, priorityFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const task of filtered) {
      const key = task.project?.name || "No Project";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a === "No Project" ? 1 : b === "No Project" ? -1 : a.localeCompare(b)
    );
  }, [filtered]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(
      (t) => t.status === TaskStatus.todo || t.status === TaskStatus.in_progress
    ).length;
    const completed = tasks.filter((t) => t.status === TaskStatus.completed).length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.completed
    ).length;
    return { total, pending, completed, overdue };
  }, [tasks]);

  const activeFilters = statusFilter !== "all" || priorityFilter !== "all" || search !== "";

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all tasks across your projects
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 shrink-0">
                <ListTodo className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
            )}
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2 shrink-0">
                <Circle className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold">{stats.pending}</p>
            )}
            {!isLoading && stats.total > 0 && (
              <Progress value={(stats.pending / stats.total) * 100} className="mt-3 h-1.5" />
            )}
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold">{stats.completed}</p>
            )}
            {!isLoading && stats.total > 0 && (
              <Progress value={(stats.completed / stats.total) * 100} className="mt-3 h-1.5" />
            )}
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2 shrink-0">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 w-full sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-9 w-full pl-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-[140px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 w-full sm:w-[140px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ListTodo className="h-4 w-4" />
        <span>
          {filtered.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Task Groups */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, g) => (
            <Card key={g} className="overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="px-4 py-16 text-center">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">
              {tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {tasks.length === 0
                ? "Create tasks in your projects to see them here"
                : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(([projectName, projectTasks], pi) => {
            const colorIdx = pi % PROJECT_COLORS.length;
            return (
              <Card key={projectName} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Project Header */}
                <div className="flex items-center gap-3 px-3 sm:px-5 py-2.5 border-b bg-muted/20">
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", PROJECT_COLORS[colorIdx])} />
                  <span className="text-sm font-semibold">{projectName}</span>
                  <Badge variant="secondary" className="ml-auto text-xs font-normal">
                    {projectTasks.length} {projectTasks.length === 1 ? "task" : "tasks"}
                  </Badge>
                </div>

                {/* Task Rows */}
                <div className="divide-y">
                  {projectTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== TaskStatus.completed;
                    const priority = PRIORITY_STYLES[task.priority];
                    const assignees = task.assignments ?? [];

                    const subtaskCount = task.subtasks?.length ?? 0;
                    const commentCount = task.comments?.length ?? 0;
                    const attachmentCount = task.attachments?.length ?? 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="group grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1.5 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 transition-colors hover:bg-accent/40 cursor-pointer"
                      >
                        <div className="min-w-0 space-y-1.5">
                          {/* Title row */}
                          <div className="flex items-start gap-2">
                            <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", priority.dot)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {stripHtml(task.description)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 pl-4">
                            <Badge
                              variant="outline"
                              className={cn("text-[11px] font-normal h-5 px-1.5", STATUS_BADGE[task.status])}
                            >
                              {STATUS_LABELS[task.status] || task.status}
                            </Badge>

                            <span className={cn("text-[11px] font-medium flex items-center gap-1", priority.label)}>
                              <Flag className="h-3 w-3" />
                              {PRIORITY_LABELS[task.priority]}
                            </span>

                            {task.dueDate && (
                              <span
                                className={cn(
                                  "text-[11px] flex items-center gap-1",
                                  isOverdue
                                    ? "text-red-600 dark:text-red-400 font-medium"
                                    : "text-muted-foreground"
                                )}
                              >
                                <Calendar className="h-3 w-3" />
                                {formatRelativeTime(task.dueDate)}
                              </span>
                            )}

                            {subtaskCount > 0 && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <ListTodo className="h-3 w-3" />
                                {subtaskCount}
                              </span>
                            )}

                            {commentCount > 0 && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {commentCount}
                              </span>
                            )}

                            {attachmentCount > 0 && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                {attachmentCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: assignees + chevron */}
                        <div className="flex items-center gap-2 sm:self-center justify-end">
                          {assignees.length > 0 && (
                            <div className="flex -space-x-1.5">
                              {assignees.slice(0, 3).map((u) => (
                                <Tooltip key={u.id}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium ring-2 ring-background"
                                      title={u.name ?? undefined}
                                    >
                                      {getInitials(u.name)}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{u.name}</TooltipContent>
                                </Tooltip>
                              ))}
                              {assignees.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium ring-2 ring-background">
                                  +{assignees.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
