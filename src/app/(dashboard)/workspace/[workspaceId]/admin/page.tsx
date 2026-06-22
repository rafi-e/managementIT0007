"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Download,
  History,
  Loader2,
  BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWorkspaceAction, getWorkspaceAnalyticsAction } from "@/actions/workspace";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ActivityLog } from "@/types";

function useActivityLogs(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["activity-logs", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspace/${workspaceId}/activity`);
      if (!res.ok) return [];
      return res.json() as Promise<ActivityLog[]>;
    },
    enabled: !!workspaceId,
  });
}

export default function AdminPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      return getWorkspaceAction(workspaceId) as any;
    },
    enabled: !!workspaceId,
  });

  const { data: activityLogs = [], isLoading: logsLoading } = useActivityLogs(workspaceId);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: async () => {
      const data = await getWorkspaceAnalyticsAction(workspaceId);
      return data;
    },
    enabled: !!workspaceId,
  });

  const stats = React.useMemo(() => {
    if (!workspace) return { totalTasks: 0, totalProjects: 0 };
    return {
      totalTasks: workspace.projects?.reduce((acc: number, p: any) => acc + (p._count?.tasks ?? p.tasks?.length ?? 0), 0) ?? 0,
      totalProjects: workspace.projects?.length ?? 0,
    };
  }, [workspace]);

  const handleExport = () => {
    if (!workspace) return;
    const data = {
      workspace: { name: workspace.name, slug: workspace.slug },
      stats,
      projects: workspace.projects?.map((p: any) => ({
        name: p.name,
        status: p.status,
        tasks: p._count?.tasks ?? p.tasks?.length ?? 0,
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspace.slug}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const STATUS_COLORS: Record<string, string> = {
    todo: "#94a3b8",
    in_progress: "#3b82f6",
    review: "#f59e0b",
    completed: "#22c55e",
  };

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  const dashboardData = React.useMemo(() => {
    const a = analytics;
    return {
      totalUsers: a?.totalMembers ?? 0,
      totalWorkspaces: 1,
      totalTasks: a?.totalTasks ?? 0,
      totalProjects: a?.totalProjects ?? 0,
      userGrowth: [],
      taskCompletion: a?.taskCompletion ?? [],
      projectsByStatus:
        (a?.tasksByStatus as any)?.map((s: { status: string; count: number }) => ({
          name: s.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          value: s.count,
          color: STATUS_COLORS[s.status] ?? "#6366f1",
        })) ?? [],
      tasksByPriority:
        (a?.tasksByPriority as any)?.map((p: { priority: string; count: number }) => ({
          name: p.priority.replace(/\b\w/g, (c) => c.toUpperCase()),
          value: p.count,
          color: PRIORITY_COLORS[p.priority] ?? "#6366f1",
        })) ?? [],
      activityByDay: a?.activityByDay ?? [],
      previousPeriod: { totalUsers: 0, totalWorkspaces: 0, totalTasks: 0, totalProjects: 0 },
    };
  }, [analytics]);

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View analytics and activity for this workspace.
          </p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard data={dashboardData} isLoading={analyticsLoading} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-6 py-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {log.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{log.user.name}</span>{" "}
                          {log.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
