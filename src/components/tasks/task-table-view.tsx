"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useTaskStore } from "@/store/use-task-store";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/state-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatDate, formatRelativeTime, stripHtml } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@/types";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  MoreHorizontal,
  Trash2,
  ListTodo,
  MessageSquare,
  ListChecks,
  Paperclip,
  Calendar,
  Clock,
  Flag,
  Circle,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

type SortField = "title" | "status" | "priority" | "dueDate" | "createdAt" | "project";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = [
  { value: TaskStatus.todo, label: "To Do" },
  { value: TaskStatus.in_progress, label: "In Progress" },
  { value: TaskStatus.review, label: "Review" },
  { value: TaskStatus.completed, label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: TaskPriority.low, label: "Low" },
  { value: TaskPriority.medium, label: "Medium" },
  { value: TaskPriority.high, label: "High" },
  { value: TaskPriority.urgent, label: "Urgent" },
];

const STATUS_STYLE: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  review:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
};

const PRIORITY_STYLE: Record<string, { badge: string; icon: typeof Flag; dot: string }> = {
  urgent: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    icon: AlertCircle,
    dot: "bg-red-500",
  },
  high: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: ArrowUp,
    dot: "bg-orange-500",
  },
  medium: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: ArrowDown,
    dot: "bg-blue-500",
  },
  low: {
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    icon: ArrowDown,
    dot: "bg-gray-400",
  },
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-30" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  );
}

interface TaskTableViewProps {
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function TaskTableView({ projectId, projectName, projectColor, isLoading, error, onRetry }: TaskTableViewProps = {}) {
  const hasProjectContext = !!projectId;
  const tasks = useTaskStore((s) => s.tasks);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.project?.name?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "priority": {
          const order = [TaskPriority.low, TaskPriority.medium, TaskPriority.high, TaskPriority.urgent];
          cmp = order.indexOf(a.priority) - order.indexOf(b.priority);
          break;
        }
        case "dueDate":
          if (!a.dueDate && !b.dueDate) cmp = 0;
          else if (!a.dueDate) cmp = 1;
          else if (!b.dueDate) cmp = -1;
          else cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "project":
          cmp = (a.project?.name || "").localeCompare(b.project?.name || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [tasks, search, sortField, sortDir]);

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((t) => t.id)));
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      deleteTask.mutate(id);
    });
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} tasks deleted`);
  };

  const handleBulkStatusChange = (status: TaskStatus) => {
    selectedIds.forEach((id) => {
      updateTask.mutate({ id, data: { status } });
    });
    setSelectedIds(new Set());
    toast.success(`Status updated for ${selectedIds.size} tasks`);
  };

  const isTotallyEmpty = !isLoading && tasks.length === 0;
  const priorityOrder = [TaskPriority.low, TaskPriority.medium, TaskPriority.high, TaskPriority.urgent];

  if (isLoading) {
    return <LoadingState variant="table" />;
  }

  if (error) {
    return <ErrorState title="Failed to load tasks" message={error.message} onRetry={onRetry} />;
  }

  if (isTotallyEmpty && !hasProjectContext) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No tasks yet"
        description="Create a task to get started"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={hasProjectContext ? "Search tasks..." : "Search tasks, descriptions, projects..."}
            className="h-9 w-full pl-9 text-sm bg-background"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
              {selectedIds.size} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  <ListChecks className="h-3.5 w-3.5" />
                  Set Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleBulkStatusChange(opt.value)}
                    className="text-xs gap-2"
                  >
                    <span className={cn("h-2 w-2 rounded-full", STATUS_STYLE[opt.value]?.split(" ")[0])} />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-destructive gap-1"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Project Context Header */}
      {hasProjectContext && (
        <div className="flex items-center gap-3 px-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: projectColor || "#3b82f6" }}
          >
            {projectName?.[0] || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{projectName || "Project"}</h3>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              {tasks.filter((t) => t.status === TaskStatus.completed).length > 0 && (
                <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">
                  · {tasks.filter((t) => t.status === TaskStatus.completed).length} completed
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Table - hidden on mobile, visible on md+ */}
      <div className="hidden md:block overflow-x-auto rounded-xl border shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-10 px-3 py-3">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                onClick={() => toggleSort("title")}
              >
                <span className="inline-flex items-center gap-1">
                  Task
                  <SortIcon field="title" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                onClick={() => toggleSort("status")}
              >
                <span className="inline-flex items-center gap-1">
                  Status
                  <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                onClick={() => toggleSort("priority")}
              >
                <span className="inline-flex items-center gap-1">
                  Priority
                  <SortIcon field="priority" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">Unit Kerja</span>
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                onClick={() => toggleSort("dueDate")}
              >
                <span className="inline-flex items-center gap-1">
                  Due Date
                  <SortIcon field="dueDate" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">Activity</span>
              </th>
              <th className="w-12 px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => {
              const statusCfg = STATUS_STYLE[task.status];
              const priorityCfg = PRIORITY_STYLE[task.priority];
              const PriorityIcon = priorityCfg.icon;
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== TaskStatus.completed;
              const c = task._count;
              const subtaskCount = task.subtasks?.length ?? c?.subtasks ?? 0;
              const commentCount = task.comments?.length ?? c?.comments ?? 0;
              const attachmentCount = task.attachments?.length ?? c?.attachments ?? 0;

              return (
                <tr
                  key={task.id}
                  className={cn(
                    "group border-b last:border-0 transition-all duration-150",
                    selectedIds.has(task.id)
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-accent/40"
                  )}
                >
                  <td className="px-3 py-2.5">
                    <Checkbox
                      checked={selectedIds.has(task.id)}
                      onCheckedChange={() => toggleSelect(task.id)}
                    />
                  </td>

                  {/* Task Title + Meta */}
                  <td className="px-3 py-2.5">
                    <div className="max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        {!hasProjectContext && task.project?.name && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal shrink-0"
                          >
                            {task.project.name}
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="text-sm font-medium text-foreground truncate block mt-0.5 hover:text-primary transition-colors text-left w-full"
                      >
                        {task.title}
                      </button>
                      {task.description && (
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5 leading-relaxed">
                          {stripHtml(task.description)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {task.estimatedHours != null && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                            <Clock className="h-3 w-3" />
                            {task.estimatedHours}h
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/40">
                          {formatRelativeTime(task.createdAt)}
                        </span>
                        {task.updatedBy && (
                          <span className="text-[10px] text-muted-foreground/40">
                            · edited
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-2.5">
                    <Select
                      value={task.status}
                      onValueChange={(v) => {
                        updateTask.mutate({ id: task.id, data: { status: v as TaskStatus } });
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-[115px] text-[11px] font-medium border-0",
                          statusCfg
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  STATUS_STYLE[opt.value]?.split(" ")[0]
                                )}
                              />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Priority Badge */}
                  <td className="px-3 py-2.5">
                    <Select
                      value={task.priority}
                      onValueChange={(v) => {
                        updateTask.mutate({ id: task.id, data: { priority: v as TaskPriority } });
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-[90px] text-[11px] font-medium border-0 gap-1",
                          priorityCfg.badge
                        )}
                      >
                        <PriorityIcon className="h-3 w-3" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => {
                          const Icon = PRIORITY_STYLE[opt.value].icon;
                          return (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              <div className="flex items-center gap-2">
                                <Icon className="h-3 w-3" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Unit Kerja */}
                  <td className="px-3 py-2.5">
                    {task.unitKerja ? (
                      <Badge
                        variant="secondary"
                        className="text-[11px] px-1.5 py-0 font-normal gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        {task.unitKerja.kode || task.unitKerja.nama}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 italic">—</span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="px-3 py-2.5">
                    {task.dueDate ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs",
                          isOverdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.dueDate, "MMM d")}</span>
                        {isOverdue && (
                          <span className="text-[10px] text-red-500">(overdue)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 italic">—</span>
                    )}
                  </td>

                  {/* Activity Counts */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {subtaskCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <ListChecks className="h-3.5 w-3.5" />
                              {subtaskCount}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {subtaskCount} subtasks
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {commentCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {commentCount}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {commentCount} comments
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {attachmentCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Paperclip className="h-3.5 w-3.5" />
                              {attachmentCount}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {attachmentCount} attachments
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {subtaskCount === 0 && commentCount === 0 && attachmentCount === 0 && (
                        <span className="text-[11px] text-muted-foreground/40 italic">—</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedTask(task)}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          Open details
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              deleteTask.mutate(task.id);
                              toast.success("Task deleted");
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          Delete task
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
                    <p className="text-xs text-muted-foreground/60">
                      {tasks.length === 0
                        ? "Create a task to get started"
                        : "Try adjusting your search"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view - visible below md */}
      <div className="md:hidden space-y-2">
        {filtered.map((task) => {
          const statusCfg = STATUS_STYLE[task.status];
          const priorityCfg = PRIORITY_STYLE[task.priority];
          const PriorityIcon = priorityCfg.icon;
          const isOverdue =
            task.dueDate &&
            new Date(task.dueDate) < new Date() &&
            task.status !== TaskStatus.completed;

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                selectedIds.has(task.id) ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-accent/40"
              )}
            >
              <Checkbox
                checked={selectedIds.has(task.id)}
                onCheckedChange={() => toggleSelect(task.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-sm font-medium text-foreground truncate block hover:text-primary transition-colors text-left w-full"
                    >
                      {task.title}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", statusCfg?.split(" ")[0])} />
                    <PriorityIcon className={cn("h-3.5 w-3.5", priorityCfg.badge?.split(" ")[0])} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  {task.unitKerja && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {task.unitKerja.kode || task.unitKerja.nama}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={cn("inline-flex items-center gap-1", isOverdue && "text-red-500")}>
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueDate, "MMM d")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedTask(task)}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => {
                    deleteTask.mutate(task.id);
                    toast.success("Task deleted");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16">
            <Search className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
            <p className="text-xs text-muted-foreground/60">
              {tasks.length === 0 ? "Create a task to get started" : "Try adjusting your search"}
            </p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing {filtered.length} of {tasks.length} tasks
          </span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Circle className="h-3 w-3 text-gray-400" />
              {tasks.filter((t) => t.status === TaskStatus.todo).length} todo
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              {tasks.filter((t) => t.status === TaskStatus.in_progress).length} in progress
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {tasks.filter((t) => t.status === TaskStatus.completed).length} completed
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
