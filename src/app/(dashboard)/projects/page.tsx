"use client";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { useWorkspaces } from "@/hooks/use-workspace";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, FolderOpen, Plus } from "lucide-react";
import { ProjectStatus } from "@/types";
import { generateSlug } from "@/lib/utils";

export default function ProjectsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const { data: workspaces, isLoading: wLoading } = useWorkspaces();

  if (!user) return null;

  if (wLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!workspaces?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 p-6">
        <FolderOpen className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">No workspaces yet</h2>
        <p className="text-sm text-muted-foreground">
          Create a workspace to get started with projects
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All projects across your workspaces
          </p>
        </div>
      </div>

      {workspaces.map((workspace) => (
        <WorkspaceProjectsSection
          key={workspace.id}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          onProjectClick={(projectSlug) =>
            router.push(`/workspace/${workspace.id}/projects/${projectSlug}`)
          }
        />
      ))}
    </div>
  );
}

function WorkspaceProjectsSection({
  workspaceId,
  workspaceName,
  onProjectClick,
}: {
  workspaceId: string;
  workspaceName: string;
  onProjectClick: (id: string) => void;
}) {
  const { data: projects, isLoading } = useProjects(workspaceId);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <FolderKanban className="h-5 w-5 text-muted-foreground" />
        {workspaceName}
      </h2>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : !projects?.length ? (
        <p className="text-sm text-muted-foreground py-4">No projects in this workspace</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onProjectClick(generateSlug(project.name))}
            >
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div
                    className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-white text-xs sm:text-sm font-bold"
                    style={{ backgroundColor: project.color || "#3b82f6" }}
                  >
                    {project.icon || project.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {project._count?.tasks ?? project.tasks?.length ?? 0} tasks · {project.status || "active"}
                </p>
                {project.createdBy && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    Created by <span className="font-medium text-foreground/70">{project.createdBy.name}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
