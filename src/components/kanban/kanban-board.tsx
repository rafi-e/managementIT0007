"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTaskStore } from "@/store/use-task-store";
import { useUpdateTask, useReorderTasks } from "@/hooks/use-tasks";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/state-display";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";
import { Columns3 } from "lucide-react";

const COLUMNS = [
  { id: TaskStatus.todo, title: "To Do", color: "border-t-gray-500", borderColor: "#af1bd4" },
  { id: TaskStatus.in_progress, title: "In Progress", color: "border-t-amber-500", borderColor: "#f59e0b" },
  { id: TaskStatus.review, title: "Review", color: "border-t-blue-700", borderColor: "#1f03c4" },
  { id: TaskStatus.completed, title: "Completed", color: "border-t-green-500", borderColor: "#22c55e" },
];

interface KanbanBoardProps {
  tasks?: Task[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function KanbanBoard({ tasks: propTasks, isLoading, error, onRetry }: KanbanBoardProps = {}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const storeTasks = useTaskStore((s) => s.tasks);
  const tasks = propTasks ?? storeTasks;
  const updateTask = useUpdateTask();
  const reorderTasks = useReorderTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const columnTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of COLUMNS) {
      map[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.order - b.order);
    }
    return map;
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId),
    [activeId, tasks]
  );

  const hasAnyTasks = Object.values(columnTasks).some((arr) => arr.length > 0);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || !active) return;

      const activeTaskData = tasks.find((t) => t.id === active.id);
      if (!activeTaskData) return;

      let overColumnId: string = "";
      let overIndex = -1;

      if (over.data?.current?.type === "column") {
        overColumnId = String(over.id);
        const colTasks = columnTasks[overColumnId] || [];
        overIndex = colTasks.length;
      } else {
        const overTask = tasks.find((t) => t.id === over.id);
        if (!overTask) return;
        overColumnId = overTask.status;
        const colTasks = columnTasks[overColumnId] || [];
        overIndex = colTasks.findIndex((t) => t.id === over.id);
        if (overIndex === -1) overIndex = colTasks.length;
      }

      if (!overColumnId) return;

      const sourceColumnId = activeTaskData.status;
      const sourceTasks = [...(columnTasks[sourceColumnId] || [])];
      const destTasks = [...(columnTasks[overColumnId] || [])];

      const sourceIndex = sourceTasks.findIndex((t) => t.id === active.id);
      if (sourceIndex === -1) return;

      const [movedTask] = sourceTasks.splice(sourceIndex, 1);
      const newStatus = overColumnId as TaskStatus;
      const statusChanged = movedTask.status !== newStatus;

      movedTask.status = newStatus;

      if (sourceColumnId === overColumnId) {
        destTasks.splice(sourceIndex, 1);
        const adjustedIndex = overIndex > sourceIndex ? overIndex - 1 : overIndex;
        destTasks.splice(adjustedIndex, 0, movedTask);
      } else {
        destTasks.splice(overIndex, 0, movedTask);
      }

      const updatedTasks = destTasks.map((t, i) => ({
        ...t,
        order: i,
      }));

      const updates = updatedTasks.map((t) => ({
        id: t.id,
        order: t.order,
        status: t.status,
      }));

      useTaskStore.getState().setTasks(
        tasks.map((t) => {
          const found = updatedTasks.find((u) => u.id === t.id);
          if (found) return found;

          if (t.status === sourceColumnId && sourceColumnId !== overColumnId) {
            const remaining = sourceTasks.map((st, i) => ({
              ...st,
              order: i,
            }));
            const foundRemaining = remaining.find((r) => r.id === t.id);
            if (foundRemaining) return foundRemaining;
          }

          return t;
        })
      );

      if (statusChanged) {
        const movedInUpdated = updatedTasks.find((t) => t.id === movedTask.id);
        updateTask.mutate({
          id: movedTask.id,
          data: { status: newStatus, order: movedInUpdated?.order ?? movedTask.order },
        });
      }
      reorderTasks.mutate(updates);
    },
    [tasks, columnTasks, updateTask, reorderTasks]
  );

  if (isLoading) {
    return <LoadingState variant="card" count={4} />;
  }

  if (error) {
    return <ErrorState title="Failed to load board" message={error.message} onRetry={onRetry} />;
  }

  if (!hasAnyTasks) {
    return (
      <EmptyState
        icon={Columns3}
        title="No tasks on the board"
        description="Create a task and assign it a status to see it here"
      />
    );
  }

  const isFiltered = !!propTasks;

  return (
    <div className="flex min-h-0 gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
      {isFiltered ? (
        COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            columnId={column.id}
            title={column.title}
            color={column.color}
            borderColor={column.borderColor}
            tasks={columnTasks[column.id] || []}
          />
        ))
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              title={column.title}
              color={column.color}
              borderColor={column.borderColor}
              tasks={columnTasks[column.id] || []}
            />
          ))}
          <DragOverlay>
            {activeTask ? (
              <div className="w-72 max-w-[85vw] opacity-90">
                <KanbanCard task={activeTask} isDragOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
