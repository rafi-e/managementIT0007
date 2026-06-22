"use client";

import { useCurrentUser } from "@/hooks/use-auth";
import { useAllTasks } from "@/hooks/use-tasks";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";

export default function CalendarPage() {
  const user = useCurrentUser();
  const { data: allTasks, isLoading } = useAllTasks();

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">View tasks by due date</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const tasks = allTasks ?? [];

  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View tasks by due date
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No tasks with due dates</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tasks with due dates will appear on the calendar
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View tasks by due date
        </p>
      </div>
      <TaskCalendarView tasks={tasks} />
    </div>
  );
}
