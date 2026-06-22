"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parse,
} from "date-fns";
import { useTaskStore } from "@/store/use-task-store";
import { Button } from "@/components/ui/button";
import { TaskCreateDialog } from "./task-create-dialog";
import { cn, stripHtml } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Task } from "@/types";
import { TaskStatus, TaskPriority } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateTask } from "@/hooks/use-tasks";

const STATUS_DOT_CLASSES: Record<TaskStatus, string> = {
  [TaskStatus.todo]: "bg-gray-400",
  [TaskStatus.in_progress]: "bg-blue-400",
  [TaskStatus.review]: "bg-yellow-400",
  [TaskStatus.completed]: "bg-green-400",
};

const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  [TaskStatus.todo]: { label: "To Do", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  [TaskStatus.in_progress]: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  [TaskStatus.review]: { label: "Review", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" },
  [TaskStatus.completed]: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
};

const PRIORITY_TOOLTIP: Record<TaskPriority, string> = {
  [TaskPriority.low]: "bg-gray-700 text-white",
  [TaskPriority.medium]: "bg-blue-600 text-white",
  [TaskPriority.high]: "bg-orange-600 text-white",
  [TaskPriority.urgent]: "bg-red-600 text-white",
};

interface TaskCalendarViewProps {
  tasks?: Task[];
  projectId?: string;
}

export function TaskCalendarView({ tasks: propTasks, projectId }: TaskCalendarViewProps) {
  const storeTasks = useTaskStore((s) => s.tasks);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const updateTaskInStore = useTaskStore((s) => s.updateTask);
  const tasks = propTasks ?? storeTasks;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const { mutate: updateTask } = useUpdateTask();

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks
      .filter((t) => t.dueDate)
      .forEach((t) => {
        const key = format(new Date(t.dueDate!), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
    return map;
  }, [tasks]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData("text/plain", taskId);
      e.dataTransfer.effectAllowed = "move";
      setDraggedTaskId(taskId);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dateKey: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      setDropTarget(null);
      setDraggedTaskId(null);
      if (!taskId) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newDate = parse(dateKey, "yyyy-MM-dd", new Date());
      if (format(new Date(task.dueDate!), "yyyy-MM-dd") === dateKey) return;
      updateTask(
        { id: taskId, data: { dueDate: newDate.toISOString() } },
        {
          onSuccess: () => {
            updateTaskInStore(taskId, {
              dueDate: newDate.toISOString(),
            });
          },
        }
      );
    },
    [tasks, updateTask, updateTaskInStore]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const prevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const isHovered = hoveredDate === dateKey;

            return (
              <div
                key={dateKey}
                className={cn(
                  "group relative min-h-[70px] sm:min-h-[90px] border-b border-r px-1 sm:px-2 py-1 sm:py-1.5 transition-colors last:border-r-0",
                  !isCurrentMonth && "bg-muted/30",
                  isCurrentMonth && "hover:bg-accent/30",
                  dropTarget === dateKey && "bg-accent/50 ring-2 ring-primary/50"
                )}
                onMouseEnter={() => setHoveredDate(dateKey)}
                onMouseLeave={() => setHoveredDate(null)}
                onDragOver={handleDragOver}
                onDragEnter={() => setDropTarget(dateKey)}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => handleDrop(e, dateKey)}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isCurrentDay && "bg-primary text-primary-foreground font-semibold",
                      !isCurrentDay && !isCurrentMonth && "text-muted-foreground",
                      !isCurrentDay && isCurrentMonth && "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {isHovered && isCurrentMonth && projectId && (
                    <TaskCreateDialog
                      projectId={projectId}
                      defaultDueDate={dateKey}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs leading-none">+</span>
                        </Button>
                      }
                    />
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <Tooltip key={task.id}>
                      <TooltipTrigger asChild>
                        <button
                          draggable
                          onClick={() => setSelectedTask(task)}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight hover:bg-accent transition-colors",
                            !isCurrentMonth && "opacity-50",
                            draggedTaskId === task.id && "opacity-30"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              STATUS_DOT_CLASSES[task.status]
                            )}
                          />
                          <span className="truncate">{task.title}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className={cn("max-w-[260px] border-0", PRIORITY_TOOLTIP[task.priority])}>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            {task.project && (
                              <p className="truncate text-xs font-semibold text-white/80">
                                {task.project.name}
                              </p>
                            )}
                            <span className={cn("shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider", STATUS_BADGE[task.status].className)}>
                              {STATUS_BADGE[task.status].label}
                            </span>
                          </div>
                          <div className="border-t border-white/10" />
                          <p className="text-sm font-semibold leading-snug">{task.title}</p>
                          {task.description && (
                            <p className="text-[11px] text-white/70 leading-relaxed line-clamp-3">
                              {stripHtml(task.description)}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="block px-1 text-[10px] text-muted-foreground">
                      +{dayTasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
