"use client";

import { useState, useMemo } from "react";
import { useTaskStore } from "@/store/use-task-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/state-display";
import { cn, formatDate, getInitials, stripHtml } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@/types";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ListTodo,
  Plus,
} from "lucide-react";

type SortField = "title" | "status" | "priority" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  );
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  [TaskStatus.todo]: { label: "Todo", className: "bg-gray-100 text-gray-700" },
  [TaskStatus.in_progress]: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  [TaskStatus.review]: { label: "Review", className: "bg-yellow-100 text-yellow-700" },
  [TaskStatus.completed]: { label: "Completed", className: "bg-green-100 text-green-700" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  [TaskPriority.low]: { label: "Low", className: "bg-gray-100 text-gray-600" },
  [TaskPriority.medium]: { label: "Medium", className: "bg-blue-100 text-blue-700" },
  [TaskPriority.high]: { label: "High", className: "bg-orange-100 text-orange-700" },
  [TaskPriority.urgent]: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

interface TaskListViewProps {
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onCreateTask?: () => void;
}

export function TaskListView({ isLoading, error, onRetry, onCreateTask }: TaskListViewProps = {}) {
  const tasks = useTaskStore((s) => s.tasks);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image: string | null }>();
    tasks.forEach((t) =>
      t.assignments.forEach((u) => {
        if (!map.has(u.id)) map.set(u.id, { id: u.id, name: u.name, image: u.image });
      })
    );
    return Array.from(map.values());
  }, [tasks]);

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
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((t) => t.priority === priorityFilter);
    if (assigneeFilter !== "all")
      result = result.filter((t) => t.assignments.some((u) => u.id === assigneeFilter));

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
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, sortField, sortDir]);

  const isTotallyEmpty = !isLoading && tasks.length === 0;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  if (isLoading) {
    return <LoadingState variant="table" />;
  }

  if (error) {
    return <ErrorState title="Failed to load tasks" message={error.message} onRetry={onRetry} />;
  }

  if (isTotallyEmpty) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No tasks yet"
        description="Create a task to get started"
        action={onCreateTask ? { label: "Create Task", onClick: onCreateTask, icon: Plus } : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32 sm:w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 w-32 sm:w-36 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="h-9 w-36 sm:w-40 text-sm">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {uniqueAssignees.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th
                className="cursor-pointer px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                onClick={() => toggleSort("title")}
              >
                <span className="inline-flex items-center">
                  Task <SortIcon field="title" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                onClick={() => toggleSort("status")}
              >
                <span className="inline-flex items-center">
                  Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                onClick={() => toggleSort("priority")}
              >
                <span className="inline-flex items-center">
                  Priority <SortIcon field="priority" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Assignee
              </th>
              <th
                className="hidden sm:table-cell cursor-pointer px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                onClick={() => toggleSort("dueDate")}
              >
                <span className="inline-flex items-center">
                  Due Date <SortIcon field="dueDate" sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Labels
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => {
              const statusCfg = STATUS_CONFIG[task.status];
              const priorityCfg = PRIORITY_CONFIG[task.priority];
              return (
                <tr
                  key={task.id}
                  className="cursor-pointer border-b last:border-0 hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedTask(task)}
                >
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                    <div className="truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-[11px] text-muted-foreground/60 font-normal truncate mt-0.5">
                        {stripHtml(task.description)}
                      </div>
                    )}
                    {task.updatedBy ? (
                      <div className="text-[10px] text-muted-foreground/40 font-normal mt-0.5">
                        Edited by {task.updatedBy.name}
                      </div>
                    ) : task.createdBy ? (
                      <div className="text-[10px] text-muted-foreground/40 font-normal mt-0.5">
                        by {task.createdBy.name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn("px-1.5 py-0 text-[10px] font-medium", statusCfg.className)}
                    >
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {priorityCfg.label && (
                      <Badge
                        variant="outline"
                        className={cn("px-1.5 py-0 text-[10px] font-medium", priorityCfg.className)}
                      >
                        {priorityCfg.label}
                      </Badge>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <div className="flex -space-x-1.5">
                      {task.assignments.slice(0, 3).map((u) => (
                        <Avatar key={u.id} className="h-7 w-7 border-2 border-background">
                          <AvatarImage src={u.image || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignments.length > 3 && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">
                          +{task.assignments.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs text-muted-foreground">
                    {task.dueDate ? formatDate(task.dueDate, "MMM d, yyyy") : "-"}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <div className="flex gap-1">
                      {task.labels?.slice(0, 3).map((l) => (
                        <span
                          key={l.id}
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: l.color || undefined }}
                          title={l.name}
                        />
                      ))}
                      {(task.labels?.length || 0) > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{task.labels!.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">No tasks match your filters</p>
                    <p className="text-xs text-muted-foreground/60">Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {filtered.map((task) => {
          const statusCfg = STATUS_CONFIG[task.status];
          const priorityCfg = PRIORITY_CONFIG[task.priority];
          return (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-lg border bg-card p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <Badge variant="outline" className={cn("shrink-0 px-1.5 py-0 text-[10px] font-medium", statusCfg.className)}>
                    {statusCfg.label}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{stripHtml(task.description)}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  {task.dueDate && <span>{formatDate(task.dueDate, "MMM d")}</span>}
                  {task.assignments.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={task.assignments[0].image || undefined} />
                        <AvatarFallback className="text-[6px]">{getInitials(task.assignments[0].name)}</AvatarFallback>
                      </Avatar>
                      {task.assignments[0].name}
                      {task.assignments.length > 1 && <span>+{task.assignments.length - 1}</span>}
                    </span>
                  )}
                  {task.labels?.map((l) => (
                    <span key={l.id} className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: l.color || undefined }} title={l.name} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12">
            <Search className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No tasks match your filters</p>
            <p className="text-xs text-muted-foreground/60">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
