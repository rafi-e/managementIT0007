"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/hooks/use-workspace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Save, Loader2, Settings2, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default function WorkspaceSettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const workspaceId = params.workspaceId;

  const { data: workspace, isLoading: wLoading, error: wError } =
    useWorkspace(workspaceId);

  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (!initialized && workspace) {
    setName(workspace.name);
    setSlug(workspace.slug);
    setIcon(workspace.icon || "");
    setInitialized(true);
  }

  const error = wError;

  if (wLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-destructive text-lg">Failed to load settings</p>
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
        <p className="text-lg font-semibold">Workspace not found</p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: { name: name.trim(), icon: icon.trim() || undefined },
      });
      toast.success("Workspace updated");
    } catch {
      toast.error("Failed to update workspace");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorkspace.mutateAsync(workspaceId);
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete workspace");
    }
  };

  return (
    <div className="max-w-2xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace preferences.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-0">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>
                Update your workspace name and icon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input value={slug} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Slug cannot be changed.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon (emoji)</label>
                <Input
                  placeholder="e.g. 🚀"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                />
              </div>
              <Button onClick={handleSave} disabled={updateWorkspace.isPending}>
                {updateWorkspace.isPending && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting this workspace will remove all projects, tasks, and data.
                This cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Workspace
              </Button>
            </CardContent>
          </Card>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Workspace</DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be undone. Type{" "}
                  <strong>{workspace.name}</strong> to confirm.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder={workspace.name}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirm("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== workspace.name || deleteWorkspace.isPending}
                  onClick={handleDelete}
                >
                  {deleteWorkspace.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
