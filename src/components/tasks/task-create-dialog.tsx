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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateTask } from "@/hooks/use-tasks";
import { useWorkspaceMembers } from "@/hooks/use-workspace";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useQuery } from "@tanstack/react-query";
import { cn, getInitials } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@/types";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { getLabelsAction } from "@/actions/task";

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
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.medium);
  const [dueDate, setDueDate] = useState(defaultDueDate || "");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const { data: labels } = useQuery({
    queryKey: ["labels"],
    queryFn: getLabelsAction,
  });

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority(TaskPriority.medium);
    setDueDate(defaultDueDate || "");
    setSelectedAssigneeIds([]);
    setSelectedLabelIds([]);
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
        assigneeIds: selectedAssigneeIds,
        labelIds: selectedLabelIds,
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

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
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
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Add a description (optional)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
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
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-2">
              {(members || []).map((member) => {
                const isSelected = selectedAssigneeIds.includes(member.userId);
                return (
                  <button
                    key={member.userId}
                    onClick={() => toggleAssignee(member.userId)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {member.user.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {(labels || []).map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      isSelected ? "border-foreground" : "border-input hover:bg-accent"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: label.color || undefined }}
                    />
                    {label.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
