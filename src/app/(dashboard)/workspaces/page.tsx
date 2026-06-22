"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { useWorkspaces, useCreateWorkspace, useDeleteWorkspace, useUserCount } from "@/hooks/use-workspace";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Building2,
  Plus,
  Settings,
  Trash2,
  ExternalLink,
  Loader2,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";

export default function WorkspacesPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { data: totalUsers } = useUserCount();
  const createWorkspace = useCreateWorkspace();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    try {
      const ws = await createWorkspace.mutateAsync({ name: newName.trim() });
      toast.success("Workspace created");
      setShowCreate(false);
      setNewName("");
      router.push(`/workspace/${ws.id}`);
    } catch {
      toast.error("Failed to create workspace");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workspaces
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Workspace
        </Button>
      </div>

      {!workspaces?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No workspaces</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create your first workspace to start collaborating
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/workspace/${ws.id}`)}
            >
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-base sm:text-lg">
                    {ws.icon || <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{ws.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {totalUsers ?? ws._count?.members ?? ws.members?.length ?? 0} total users · {ws._count?.projects || ws.projects?.length || 0} projects
                    </p>
                    {ws.owner && (
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Created by <span className="font-medium text-foreground/70">{ws.owner.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/workspace/${ws.id}`);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/workspace/${ws.id}/settings`);
                    }}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Give your workspace a name to get started
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace name</label>
              <Input
                placeholder="e.g. My Team"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createWorkspace.isPending}>
              {createWorkspace.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
