"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskStore } from "@/store/use-task-store";
import { useProjects } from "@/hooks/use-projects";
import { useUnitKerjaList } from "@/hooks/use-unit-kerja";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { TaskTableView } from "@/components/tasks/task-table-view";
import { ErrorState } from "@/components/ui/state-display";
import { Plus, Columns3, List, Calendar, Table2, ArrowLeft, Building2, FilterX, Clock, MessageSquare, CheckSquare, Flag } from "lucide-react";
import { cn, formatRelativeTime, getInitials, generateSlug } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@/types";
import type { Task } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
};

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};



const VIEWS = [
  { id: "kanban" as const, label: "Kanban", icon: Columns3 },
  { id: "list" as const, label: "List", icon: List },
  { id: "calendar" as const, label: "Calendar", icon: Calendar },
  { id: "table" as const, label: "Table", icon: Table2 },
];

export default function ProjectPage() {
  const params = useParams<{
    workspaceId: string;
    projectSlug: string;
  }>();
  const router = useRouter();
  const { workspaceId, projectSlug } = params;

  const viewMode = useTaskStore((s) => s.viewMode);
  const setViewMode = useTaskStore((s) => s.setViewMode);

  const { data: projects } = useProjects(workspaceId);

  const project = useMemo(() => {
    if (!projects) return undefined;
    return projects.find((p) => generateSlug(p.name) === projectSlug);
  }, [projects, projectSlug]);

  const projectId = project?.id || "";

  const { data: tasks, isLoading, error, refetch } = useTasks(projectId);
  const { data: unitKerjaList, isLoading: unitKerjaLoading } = useUnitKerjaList();

  const [filterUnitKerjaId, setFilterUnitKerjaId] = useState("");

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!filterUnitKerjaId) return tasks;
    return tasks.filter((t) => t.unitKerjaId === filterUnitKerjaId);
  }, [tasks, filterUnitKerjaId]);

  if (error) {
    return (
      <ErrorState
        title="Failed to load project"
        message={(error as Error).message || "An unexpected error occurred"}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1 flex-1 min-w-0">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24 sm:w-32" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-3 sm:p-6">
                <Skeleton className="h-5 w-16 sm:w-20" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-20 sm:h-24 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push(`/workspace/${workspaceId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {project && (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            >
              {project.icon || project.name[0]}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{project?.name || "Project"}</h1>
            {project?.description && (
              <p className="text-sm text-muted-foreground truncate">{project.description}</p>
            )}
          </div>
        </div>
        <TaskCreateDialog
          projectId={projectId}
          trigger={
            <Button size="icon" className="shrink-0 sm:w-auto sm:px-4">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-1">Add Task</span>
            </Button>
          }
        />
      </div>

      <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/50 overflow-x-auto">
        {VIEWS.map((v) => (
          <Button
            key={v.id}
            variant={viewMode === v.id ? "default" : "ghost"}
            size="sm"
            className="flex-1 sm:flex-none h-9 sm:h-8 gap-1.5"
            onClick={() => setViewMode(v.id)}
          >
            <v.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{v.label}</span>
          </Button>
        ))}
      </div>

      {tasks && tasks.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-[280px]">
            <Select
              value={filterUnitKerjaId}
              onValueChange={(v) => setFilterUnitKerjaId(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="h-9 text-sm pl-8">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <SelectValue placeholder="Semua unit kerja" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__all__">Semua unit kerja</SelectItem>
                {unitKerjaLoading ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Memuat...</div>
                ) : (unitKerjaList || []).length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Tidak ada data</div>
                ) : (
                  (unitKerjaList || []).map((uk) => (
                    <SelectItem key={uk.id} value={uk.id}>
                      {uk.kode} - {uk.nama}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {filterUnitKerjaId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-muted-foreground"
              onClick={() => setFilterUnitKerjaId("")}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
          {filterUnitKerjaId && (
            <span className="text-xs text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {!tasks || tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Columns3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">No tasks yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first task to start tracking work in this project.
          </p>
          <TaskCreateDialog
            projectId={projectId}
            trigger={
              <Button className="mt-4 gap-1.5">
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            }
          />
        </div>
      ) 
      : tasks.length > 0 && filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FilterX className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">No tasks match filter</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try selecting a different unit kerja or clear the filter.
          </p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={() => setFilterUnitKerjaId("")}>
            <FilterX className="h-4 w-4" />
            Clear Filter
          </Button>
        </div>
      ) 
      : viewMode === "kanban" ? (
        <KanbanBoard tasks={filteredTasks} />
      ) 
      : viewMode === "list" ? (
        <ListView tasks={filteredTasks} />
      )       : viewMode === "table" ? (
        <TaskTableView
          projectId={projectId}
          projectName={project?.name}
          projectColor={project?.color || undefined}
        />
      ) : viewMode === "calendar" ? (
        <TaskCalendarView tasks={filteredTasks} projectId={projectId} />
      ) 
      : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Columns3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium mb-1">
              {VIEWS.find((v) => v.id === viewMode)?.label || "Unknown"} View
            </p>
            <p className="text-sm text-muted-foreground">
              Coming soon. Switch to Kanban, List, or Calendar view.
            </p>
          </CardContent>
        </Card>
      )
      }
    </div>
  );
}

function ListView({ tasks }: { tasks: Task[] }) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const sorted = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sorted.map((task) => {
        const isOverdue =
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== TaskStatus.completed;

        const completedSubtasks = (task.subtasks ?? []).filter(
          (st) => st.status === TaskStatus.completed
        ).length;
        const totalSubtasks = (task.subtasks ?? []).length;
        const commentCount = task.comments?.length ?? 0;
        const assignees = task.assignments ?? [];

        return (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className={cn(
              "group relative flex flex-col rounded-xl border bg-card cursor-pointer transition-all duration-200 overflow-hidden",
              "hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
              isOverdue && "border-red-200 dark:border-red-900/50"
            )}
          >
            {/* Top accent bar */}
            <div
              className={cn(
                "h-1 shrink-0",
                task.priority === "urgent" && "bg-red-500",
                task.priority === "high" && "bg-orange-500",
                task.priority === "medium" && "bg-blue-500",
                task.priority === "low" && "bg-gray-300 dark:bg-gray-600"
              )}
            />

            <div className="flex flex-col flex-1 p-4 gap-3">
              {/* Header: title + priority */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>
                  <Flag
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 mt-0.5",
                      task.priority === "urgent" && "text-red-500",
                      task.priority === "high" && "text-orange-500",
                      task.priority === "medium" && "text-blue-500",
                      task.priority === "low" && "text-gray-300 dark:text-gray-600"
                    )}
                  />
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
                    task.status === "todo" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                    task.status === "in_progress" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                    task.status === "review" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
                    task.status === "completed" && "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  )}
                >
                  {STATUS_LABELS[task.status] || task.status}
                </span>
                {task.unitKerja && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Building2 className="h-3 w-3" />
                    {task.unitKerja.kode}
                  </span>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Footer metadata */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground border-t pt-3">
                {task.dueDate && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      isOverdue && "text-red-600 dark:text-red-400 font-medium"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {isOverdue ? "Overdue" : formatRelativeTime(task.dueDate)}
                  </span>
                )}

                {totalSubtasks > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}

                {commentCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {commentCount}
                  </span>
                )}

                <div className="flex-1" />

                {assignees.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {assignees.slice(0, 3).map((a) => (
                      <Avatar
                        key={a.id}
                        className="h-5 w-5 border-2 border-background transition-transform duration-200 group-hover:scale-110"
                      >
                        <AvatarImage src={a.image || undefined} />
                        <AvatarFallback className="text-[7px] font-medium">
                          {getInitials(a.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {assignees.length > 3 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px] font-medium text-muted-foreground">
                        +{assignees.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
