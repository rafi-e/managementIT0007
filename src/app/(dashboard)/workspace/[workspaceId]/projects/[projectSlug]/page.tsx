"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTasks, useCreateTask } from "@/hooks/use-tasks";
import { useTaskStore } from "@/store/use-task-store";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { TaskTableView } from "@/components/tasks/task-table-view";
import { EmptyState, ErrorState } from "@/components/ui/state-display";
import { Plus, Columns3, List, Calendar, Table2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
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

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-gray-400 dark:border-l-gray-500",
  medium: "border-l-blue-500",
  high: "border-l-orange-500",
  urgent: "border-l-red-500",
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
  const createTask = useCreateTask();

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>(TaskPriority.medium);

  if (error) {
    return (
      <ErrorState
        title="Failed to load project"
        message={(error as Error).message || "An unexpected error occurred"}
        onRetry={() => refetch()}
      />
    );
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    try {
      await createTask.mutateAsync({
        projectId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        status: TaskStatus.todo,
        priority: newTaskPriority.toLowerCase() as TaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
      });
      toast.success("Task created");
      setShowCreateTask(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate("");
      setNewTaskPriority(TaskPriority.medium);
    } catch {
      toast.error("Failed to create task");
    }
  };

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
        <Button
          size="icon"
          className="shrink-0 sm:w-auto sm:px-4"
          onClick={() => setShowCreateTask(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-1">Add Task</span>
        </Button>
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

      {!tasks || tasks.length === 0 ? (
        <EmptyState
          icon={Columns3}
          title="No tasks yet"
          description="Create your first task to start tracking work in this project."
          action={{ label: "Create Task", onClick: () => setShowCreateTask(true), icon: Plus }}
        />
      ) 
      : viewMode === "kanban" ? (
        <KanbanBoard />
      ) 
      : viewMode === "list" ? (
        <ListView tasks={tasks} />
      )       : viewMode === "table" ? (
        <TaskTableView
          projectId={projectId}
          projectName={project?.name}
          projectColor={project?.color || undefined}
        />
      ) : viewMode === "calendar" ? (
        <TaskCalendarView tasks={tasks} projectId={projectId} />
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
      )}

      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Add a description (optional)"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.low}>Low</SelectItem>
                    <SelectItem value={TaskPriority.medium}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.high}>High</SelectItem>
                    <SelectItem value={TaskPriority.urgent}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListView({ tasks }: { tasks: Task[] }) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const sorted = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-wrap gap-4">
      {sorted.map((task) => {
        const isOverdue =
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== TaskStatus.completed;

        return (
          <Card
            key={task.id}
            className={cn(
              "w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] xl:w-[calc(25%-12px)] sm:min-w-[260px] cursor-pointer hover:shadow-md transition-shadow border-l-[3px]",
              PRIORITY_BORDER[task.priority] || "border-l-transparent"
            )}
            onClick={() => setSelectedTask(task)}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium leading-snug line-clamp-2">
                  {task.title}
                </CardTitle>
                <div className="flex gap-1 shrink-0">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full mt-1",
                      PRIORITY_BADGE[task.priority].split(" ")[0]
                    )}
                  />
                </div>
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {task.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-normal px-1.5 py-0", STATUS_BADGE[task.status])}
                >
                  {STATUS_LABELS[task.status] || task.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-normal capitalize px-1.5 py-0",
                    PRIORITY_BADGE[task.priority]
                  )}
                >
                  {task.priority}
                </Badge>
              </div>
              {task.dueDate && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      isOverdue
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {isOverdue ? "Overdue: " : "Due: "}
                    {formatRelativeTime(task.dueDate)}
                  </span>
                </div>
              )}
              {task.assignments?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {task.assignments.slice(0, 3).map((a) => (
                      <Avatar key={a.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={a.image || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {getInitials(a.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {task.assignments.length > 3 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                        +{task.assignments.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.assignments.length} assignee{task.assignments.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
