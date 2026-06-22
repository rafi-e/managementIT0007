"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { saveAttachmentData } from "@/actions/attachment";
import { Badge } from "@/components/ui/badge";
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
import { useTaskStore } from "@/store/use-task-store";
import { useUpdateTask, useDeleteTask, useDeleteAttachment, useAddComment, useTask } from "@/hooks/use-tasks";
import { RichTextEditor } from "./rich-text-editor";
import {
  Clock,
  MessageSquare,
  Image,
  Activity,
  Trash2,
  Save,
  Pencil,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { cn, formatDate, getInitials, getStatusColor, getPriorityColor } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@/types";
import toast from "react-hot-toast";
import type { Task, Comment } from "@/types";
import {
  createSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from "@/actions/subtask";

const STATUS_OPTIONS = [
  { value: TaskStatus.todo, label: "To Do" },
  { value: TaskStatus.in_progress, label: "In Progress" },
  { value: TaskStatus.review, label: "Review" },
  { value: TaskStatus.completed, label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: TaskPriority.low, label: "Low" },
  { value: TaskPriority.medium, label: "Medium" },
  { value: TaskPriority.high, label: "High" },
  { value: TaskPriority.urgent, label: "Urgent" },
];

export function TaskModal() {
  const selectedTask = useTaskStore((s) => s.selectedTask);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  useTask(selectedTask?.id);

  return (
    <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
      {selectedTask && <TaskModalInner key={selectedTask.id + (selectedTask.comments?.length || 0) + (selectedTask.attachments?.length || 0)} task={selectedTask} />}
    </Dialog>
  );
}

function TaskModalInner({ task }: { task: Task }) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split("T")[0] : "");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(task.assignments?.map((u) => u.id) || []);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(task.labels?.map((l) => l.id) || []);
  const [subtasks, setSubtasks] = useState<Task[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [comments, setComments] = useState<Comment[]>(task.comments || []);

  const [newComment, setNewComment] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [manualTime, setManualTime] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localAttachments, setLocalAttachments] = useState(task.attachments || []);
  const [titleEditing, setTitleEditing] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), []);
  const deleteAttachment = useDeleteAttachment();
  const addComment = useAddComment();

  const handleTitleSave = () => {
    if (!title.trim()) {
      setTitle(task.title);
      return;
    }
    if (title !== task.title) {
      updateTask.mutate(
        { id: task.id, data: { title } },
        { onSuccess: () => { toast.success("Title updated"); setTitleEditing(false); },
          onError: () => { toast.error("Failed to update title"); setTitle(task.title); } }
      );
    }
    setTitleEditing(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleSave = () => {
    updateTask.mutate(
      {
        id: task.id,
        data: {
          description: description || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          assigneeIds: selectedAssigneeIds,
          labelIds: selectedLabelIds,
        },
      },
      {
        onSuccess: () => {
          toast.success("Task updated");
          setIsEditing(false);
        },
        onError: () => toast.error("Failed to update task"),
      }
    );
  };

  const handleCancel = () => {
    if (isEditing) {
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setSelectedAssigneeIds(task.assignments?.map((u) => u.id) || []);
      setSelectedLabelIds(task.labels?.map((l) => l.id) || []);
      setSubtasks(task.subtasks || []);
      setIsEditing(false);
    } else {
      setSelectedTask(null);
    }
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task deleted");
        setSelectedTask(null);
      },
      onError: () => toast.error("Failed to delete task"),
    });
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    const title = newSubtaskTitle.trim();
    setNewSubtaskTitle("");
    try {
      const subtask = await createSubtaskAction(task.id, title);
      if (subtask) {
        setSubtasks((prev) => [...prev, subtask as unknown as Task]);
        toast.success("Subtask added");
      }
    } catch {
      toast.error("Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const current = subtasks.find((st) => st.id === subtaskId);
    if (!current) return;
    const completed = current.status !== TaskStatus.completed;
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId
          ? { ...st, status: completed ? TaskStatus.completed : TaskStatus.todo }
          : st
      )
    );
    try {
      await toggleSubtaskAction(subtaskId, completed);
    } catch {
      toast.error("Failed to update subtask");
      setSubtasks((prev) =>
        prev.map((st) =>
          st.id === subtaskId ? { ...st, status: current.status } : st
        )
      );
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const prev = subtasks;
    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
    try {
      await deleteSubtaskAction(subtaskId);
      toast.success("Subtask deleted");
    } catch {
      toast.error("Failed to delete subtask");
      setSubtasks(prev);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const content = newComment.trim();
    setNewComment("");
    addComment.mutate(
      { taskId: task.id, content },
      {
        onSuccess: (comment) => {
          setComments((prev) => [...prev, comment]);
        },
        onError: () => {
          toast.error("Failed to add comment");
          setNewComment(content);
        },
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

  const handleDeleteAttachment = (attachmentId: string) => {
    deleteAttachment.mutate(
      { attachmentId, taskId: task.id },
      {
        onSuccess: () => {
          setLocalAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
          toast.success("Image deleted");
        },
        onError: () => toast.error("Failed to delete image"),
      }
    );
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setAttachmentUploading(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${task.id}/${timestamp}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw new Error(error.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("task-attachments").getPublicUrl(data.path);

      const attachment = await saveAttachmentData(
        task.id,
        file.name,
        publicUrl,
        data.path,
        file.size,
        file.type,
      );

      setLocalAttachments((prev) => [attachment, ...prev]);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAttachmentUploading(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const completedSubtasks = subtasks.filter((st) => st.status === TaskStatus.completed).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const priorityLabel = PRIORITY_OPTIONS.find((p) => p.value === priority)?.label;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === status)?.label;

  return (
    <DialogContent className="w-full max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl h-full sm:h-auto sm:max-h-[85dvh] p-0 overflow-hidden [&>button.absolute]:hidden sm:rounded-lg rounded-none border-0 sm:border">
      <div className="flex h-full max-h-[85dvh] flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <DialogTitle className="sr-only">Task</DialogTitle>
              {task.project?.name && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                  {task.project.name}
                </Badge>
              )}
              <Badge className={cn(getStatusColor(status), "text-[10px] px-1.5 py-0 font-normal")}>
                {statusLabel}
              </Badge>
            </div>
            {titleEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } if (e.key === "Escape") { setTitle(task.title); setTitleEditing(false); } }}
                className="text-xl sm:text-2xl font-bold tracking-tight h-auto py-0 px-0 border-0 focus-visible:ring-0 focus-visible:border-b focus-visible:ring-1 focus-visible:ring-ring rounded-none"
                placeholder="Task title"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl sm:text-2xl font-bold tracking-tight cursor-pointer hover:text-muted-foreground transition-colors"
                onClick={() => setTitleEditing(true)}
                title="Click to edit title"
              >
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5">
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  Confirm Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 px-3">
                    <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-8 px-2"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-border">
            {/* Metadata Row (read-only) */}
            {!isEditing && (
              <div className="px-5 py-3 flex flex-wrap items-center gap-4 bg-muted/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={cn(
                      getPriorityColor(priority),
                      "border-0 font-medium text-xs px-2 py-0.5"
                    )}
                  >
                    {priorityLabel}
                  </Badge>
                </div>
                {dueDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Due {formatDate(dueDate)}</span>
                  </div>
                )}
                {task.createdBy && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="h-3.5 w-3.5" />
                    <span>
                      Created by <span className="font-medium text-foreground">{task.createdBy.name}</span>
                    </span>
                  </div>
                )}
                {task.updatedBy && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>
                      · Edited by <span className="font-medium text-foreground">{task.updatedBy.name}</span>{" "}
                      {formatDate(task.updatedAt, "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Edit Mode Fields */}
            {isEditing && (
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
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
                    <Label className="text-xs font-medium text-muted-foreground">Due Date</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                  <RichTextEditor
                    content={description}
                    onChange={setDescription}
                    placeholder="Add a description..."
                  />
                </div>
              </div>
            )}

            {/* Description (read-only) */}
            {!isEditing && (
              <div className="px-5 py-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description
                  </h3>
                  {description ? (
                    <div
                      className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description</p>
                  )}
                </div>
              </div>
            )}

            {/* Activity (read-only) - only show if no createdBy/updatedBy in metadata bar */}
            {!isEditing && !task.createdBy && !task.updatedBy && (
              <div className="px-5 py-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Activity
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(task.createdAt, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Comments
                </h3>
                {comments.length > 0 && (
                  <span className="text-xs text-muted-foreground">({comments.length})</span>
                )}
              </div>
              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 mt-0.5">
                        <AvatarImage src={comment.user.image || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {getInitials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold">{comment.user.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(comment.createdAt, "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="rounded-lg bg-accent/50 px-3 py-2">
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No comments yet</p>
              )}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="h-9 text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                />
                <Button size="sm" className="h-9 px-4" onClick={handleAddComment}>
                  Send
                </Button>
              </div>
            </div>

            {/* Attachments */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Images
                </h3>
                <span className="text-xs text-muted-foreground">({localAttachments.length})</span>
              </div>
              {localAttachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {localAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="group relative overflow-hidden rounded-lg border bg-card"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        disabled={deleteAttachment.isPending}
                        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 hover:bg-red-500 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="truncate text-[10px] text-white">{att.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No images</p>
              )}

              <input
                ref={attachmentInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAttachmentUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={attachmentUploading}
                className="gap-2"
              >
                {attachmentUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {attachmentUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t bg-muted/20 px-5 py-3">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
                <Save className="mr-1.5 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
}
