"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface KanbanColumnProps {
  columnId: string;
  title: string;
  tasks: Task[];
  color: string;
  borderColor: string;
}

export function KanbanColumn({ columnId, title, tasks, color, borderColor }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: "column", columnId },
  });

  return (
    <div
      className={cn(
        "flex w-full lg:flex-1  flex-col rounded-lg border bg-card",
        "border-t-4",
        isOver && "ring-2 ring-primary/50"
      )}
      style={{ borderTopColor: borderColor }}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 pb-2">
        <div ref={setNodeRef} className="flex min-h-15 flex-col gap-2">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center rounded-lg border border-dashed py-8 text-xs text-muted-foreground">
              Drop tasks here
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
