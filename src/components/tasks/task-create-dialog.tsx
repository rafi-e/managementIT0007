"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTask } from "@/hooks/use-tasks";
import { useUnitKerjaList } from "@/hooks/use-unit-kerja";
import { TaskStatus, TaskPriority } from "@/types";
import { Plus, ListTodo, CalendarDays, Flag, Building2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface TaskCreateDialogProps {
  projectId: string;
  defaultDueDate?: string;
  trigger?: React.ReactNode;
}

const PRIORITY_OPTIONS = [
  { value: TaskPriority.low, label: "Low" },
  { value: TaskPriority.medium, label: "Medium" },
  { value: TaskPriority.high, label: "High" },
  { value: TaskPriority.urgent, label: "Urgent" },
];

export function TaskCreateDialog({
  projectId,
  defaultDueDate,
  trigger,
}: TaskCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.medium);
  const [dueDate, setDueDate] = useState(defaultDueDate || "");
  const [selectedUnitKerjaId, setSelectedUnitKerjaId] = useState<string>("");
  const { data: unitKerjaList, isLoading: unitKerjaLoading } = useUnitKerjaList();

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority(TaskPriority.medium);
    setDueDate(defaultDueDate || "");
    setSelectedUnitKerjaId("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    createTask.mutate(
      {
        projectId,
        title: title.trim(),
        description: description || undefined,
        status: TaskStatus.todo,
        priority: priority.toLowerCase() as TaskPriority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        unitKerjaId: selectedUnitKerjaId || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Task created");
          setOpen(false);
          reset();
        },
        onError: () => toast.error("Failed to create task"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ListTodo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Create Task</DialogTitle>
              <p className="text-sm text-muted-foreground">Add a new task to this project</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[90px] w-full resize-none rounded-xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              placeholder="Add a description (optional)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                  <Flag className="h-3 w-3 text-muted-foreground" />
                </span>
                Priority
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-10">
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
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                </span>
                Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                <Building2 className="h-3 w-3 text-muted-foreground" />
              </span>
              Unit Kerja
            </Label>
            <Select
              value={selectedUnitKerjaId}
              onValueChange={(v) => setSelectedUnitKerjaId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Pilih unit kerja (opsional)" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__none__">Tidak ada</SelectItem>
                {unitKerjaLoading ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Memuat...</div>
                ) : (unitKerjaList || []).length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Tidak ada data unit kerja</div>
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
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-4">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createTask.isPending} className="h-9 px-5 gap-1.5">
            {createTask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {createTask.isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
