"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MessageSquare, ListChecks, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, getInitials, stripHtml } from "@/lib/utils";
import { useTaskStore } from "@/store/use-task-store";
import type { Task } from "@/types";
import { TaskPriority, TaskStatus } from "@/types";
import { motion } from "framer-motion";

interface KanbanCardProps {
  task: Task;
  isDragOverlay?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  [TaskPriority.low]: { label: "Low", className: "bg-gray-100 text-gray-600" },
  [TaskPriority.medium]: { label: "Medium", className: "bg-blue-100 text-blue-700" },
  [TaskPriority.high]: { label: "High", className: "bg-orange-100 text-orange-700" },
  [TaskPriority.urgent]: { label: "Urgent", className: "bg-red-100 text-red-700" },
};

export function KanbanCard({ task, isDragOverlay }: KanbanCardProps) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority];
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.status === TaskStatus.completed).length || 0;
  const commentCount = task.comments?.length || 0;
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.completed;

  const content = (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={!isDragOverlay ? style : undefined}
      className={cn(
        "cursor-pointer rounded-lg border bg-card p-2.5 sm:p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50",
        isDragOverlay && "shadow-lg"
      )}
      onClick={() => setSelectedTask(task)}
      {...(!isDragOverlay ? attributes : {})}
      {...(!isDragOverlay ? listeners : {})}
    >
      {task.attachments && task.attachments.length > 0 && (
        <div className="mb-2 -mx-2.5 -mt-2.5 sm:-mx-3 sm:-mt-3 overflow-hidden rounded-t-lg">
          <img
            src={task.attachments[0].url}
            alt={task.attachments[0].name}
            className="h-20 w-full object-cover"
            loading="lazy"
          />
          {task.attachments.length > 1 && (
            <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[9px] text-white">
              +{task.attachments.length - 1}
            </div>
          )}
        </div>
      )}
      <div className="mb-2 flex items-start gap-2">
        {!isDragOverlay && (
          <div
            className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => e.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium leading-tight text-foreground line-clamp-2">
            {task.title}
          </p>
          {task.description && (
            <p className="hidden sm:block text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-2 leading-relaxed">
              {stripHtml(task.description)}
            </p>
          )}
        </div>
        {isDragOverlay && (
          <div className="cursor-grab text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="mb-1.5 sm:mb-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: label.color || undefined }}
              title={label.name}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {priority.label && (
          <Badge
            variant="outline"
            className={cn("px-1.5 py-0 text-[10px] font-medium", priority.className)}
          >
            {priority.label}
          </Badge>
        )}

        {task.dueDate && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              isOverdue ? "text-red-600" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate, "MMM d")}
          </span>
        )}
      </div>

      <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {subtaskCount > 0 && (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
              <ListChecks className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {completedSubtasks}/{subtaskCount}
            </span>
          )}
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
              <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {commentCount}
            </span>
          )}
        </div>

        {task.assignments && task.assignments.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignments.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-background">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="text-[8px] sm:text-[9px]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignments.length > 3 && (
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px] sm:text-[9px] font-medium text-muted-foreground">
                +{task.assignments.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      {task.updatedBy ? (
        <p className="hidden sm:block mt-1.5 text-[10px] text-muted-foreground/60">
          Edited by {task.updatedBy.name}
        </p>
      ) : task.createdBy ? (
        <p className="hidden sm:block mt-1.5 text-[10px] text-muted-foreground/60">
          Created by {task.createdBy.name}
        </p>
      ) : null}
    </div>
  );

  if (isDragOverlay) {
    return content;
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {content}
    </motion.div>
  );
}
