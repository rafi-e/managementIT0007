"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { useUserCount } from "@/hooks/use-workspace";
import { useTaskStore } from "@/store/use-task-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen,
  Plus,
  Settings,
  FolderKanban,
  Activity,
  Users,
  ListTodo,
  Hash,
  Pencil,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatRelativeTime, generateSlug } from "@/lib/utils";
import { TaskStatus, ProjectStatus } from "@/types";
import type { Task, Project } from "@/types";

const PROJECT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const workspaceId = params.workspaceId;

  const {
    data: workspace,
    isLoading: wLoading,
    error: wError,
  } = useWorkspace(workspaceId);
  const {
    data: projects,
    isLoading: pLoading,
    error: pError,
  } = useProjects(workspaceId);
  const { data: totalUsers } = useUserCount();
  const tasks = useTaskStore((s) => s.tasks);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const error = wError || pError;

  if (wLoading || pLoading) return <WorkspaceSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-destructive text-lg">Failed to load workspace</p>
        <p className="text-sm text-muted-foreground">
          {(error as Error).message || "An unexpected error occurred"}
        </p>
        <Button variant="outline" onClick={() => router.refresh()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <FolderOpen className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-lg font-semibold">Workspace not found</p>
        <p className="text-sm text-muted-foreground">
          The workspace you are looking for does not exist or you don&rsquo;t have
          access.
        </p>
      </div>
    );
  }

  const workspaceTasks = tasks.filter((t) =>
    projects?.some((p) => p.id === t.projectId)
  );
  const stats = {
    totalProjects: projects?.length || 0,
    totalTasks: workspaceTasks.length,
    completedTasks: workspaceTasks.filter(
      (t) => t.status === TaskStatus.completed
    ).length,
    members: totalUsers ?? workspace.members?.length ?? 0,
  };

  const recentActivity = workspaceTasks
    .flatMap(
      (t) =>
        t.comments?.map((c) => ({
          id: c.id,
          text: `${c.user.name} commented on "${t.title}"`,
          time: c.createdAt,
        })) || []
    )
    .concat(
      workspaceTasks.map((t) => ({
        id: `update-${t.id}`,
        text: `"${t.title}" updated`,
        time: t.updatedAt,
      }))
    )
    .sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    )
    .slice(0, 10);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }
    try {
      await createProject.mutateAsync({
        workspaceId,
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        color: newProjectColor,
      });
      toast.success("Project created");
      setShowCreateDialog(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectColor(PROJECT_COLORS[0]);
    } catch (e) {
      toast.error("Failed to create project");
    }
  };

  const handleStartEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditColor(project.color || PROJECT_COLORS[0]);
  };

  const handleSaveEdit = async () => {
    if (!editingProject || !editName.trim()) {
      toast.error("Project name is required");
      return;
    }
    try {
      await updateProject.mutateAsync({
        id: editingProject.id,
        data: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          color: editColor,
        },
      });
      toast.success("Project updated");
      setEditingProject(null);
    } catch {
      toast.error("Failed to update project");
    }
  };

  const handleStartDelete = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingProjectId(projectId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProjectId) return;
    try {
      await deleteProject.mutateAsync({ id: deletingProjectId, workspaceId });
      toast.success("Project deleted");
      setDeletingProjectId(null);
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="sm:space-y-6">
      <div className="flex flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
            {workspace.icon || <Hash className="h-5 w-5 sm:h-6 sm:w-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{workspace.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {stats.totalProjects} projects · {stats.members} total users
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            className="sm:w-auto sm:px-4"
            onClick={() => router.push(`/workspace/${workspaceId}/settings`)}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline sm:ml-1">Settings</span>
          </Button>
          <Button
            size="icon"
            className="sm:w-auto sm:px-4"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline sm:ml-1">New Project</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2.5">
              <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Projects</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalProjects}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-1.5 sm:p-2.5">
              <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Tasks</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalTasks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-1.5 sm:p-2.5">
              <ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Completed</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.completedTasks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-1.5 sm:p-2.5">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.members}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects
          </h2>
          {(projects?.length || 0) === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="font-medium mb-1">No projects yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first project to get started
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {projects?.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() =>
                    router.push(
                      `/workspace/${workspaceId}/projects/${generateSlug(project.name)}`
                    )
                  }
                >
                  <CardContent className="p-3 sm:p-5">
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div
                        className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg text-white text-xs sm:text-sm font-bold"
                        style={{ backgroundColor: project.color || "#3b82f6" }}
                      >
                        {project.icon || project.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant={
                            project.status === ProjectStatus.active
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                        <span>{project._count?.tasks ?? project.tasks?.length ?? 0} tasks</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleStartEdit(project, e)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => handleStartDelete(project.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {project.createdBy && (
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        Created by <span className="font-medium text-foreground/70">{project.createdBy.name}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </h2>
          <Card>
            <CardContent className="p-3 sm:p-4">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              )}
              <div className="relative">
                {recentActivity.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-3 pb-3 sm:pb-4 last:pb-0">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary ring-2 ring-background shrink-0" />
                      {idx < recentActivity.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm truncate">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(item.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Add a new project to this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="e.g. Marketing Campaign"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      newProjectColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProjectColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={createProject.isPending}
            >
              {createProject.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProject} onOpenChange={(open: boolean) => !open && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="e.g. Marketing Campaign"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      editColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateProject.isPending}>
              {updateProject.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProjectId} onOpenChange={(open: boolean) => !open && setDeletingProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? All tasks in this project will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProjectId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24 sm:w-32" />
        </div>
      </div>
      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-3 w-16 sm:w-20" />
                  <Skeleton className="h-5 w-10 sm:h-6 sm:w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                <div className="space-y-1 flex-1 min-w-0">
                  <Skeleton className="h-4 w-24 sm:w-32" />
                  <Skeleton className="h-3 w-20 sm:w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16 sm:w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
