"use client";

import * as React from "react";
import {
  Users,
  Building2,
  ListTodo,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalUsers: number;
  totalWorkspaces: number;
  totalTasks: number;
  totalProjects: number;
  userGrowth: { month: string; count: number }[];
  taskCompletion: { date: string; completed: number; created: number }[];
  projectsByStatus: { name: string; value: number; color: string }[];
  tasksByPriority: { name: string; value: number; color: string }[];
  activityByDay: { day: string; count: number }[];
  previousPeriod: {
    totalUsers: number;
    totalWorkspaces: number;
    totalTasks: number;
    totalProjects: number;
  };
}

const defaultAnalytics: AnalyticsData = {
  totalUsers: 0,
  totalWorkspaces: 0,
  totalTasks: 0,
  totalProjects: 0,
  userGrowth: [],
  taskCompletion: [],
  projectsByStatus: [],
  tasksByPriority: [],
  activityByDay: [],
  previousPeriod: {
    totalUsers: 0,
    totalWorkspaces: 0,
    totalTasks: 0,
    totalProjects: 0,
  },
};

function calcTrend(current: number, previous: number): { percent: number; isUp: boolean } {
  if (previous === 0) return { percent: current > 0 ? 100 : 0, isUp: current > 0 };
  const percent = Math.round(((current - previous) / previous) * 100);
  return { percent: Math.abs(percent), isUp: percent >= 0 };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: { percent: number; isUp: boolean };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend.isUp ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              trend.isUp ? "text-emerald-500" : "text-red-500"
            )}
          >
            {trend.percent}%
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  isLoading?: boolean;
}

export function AnalyticsDashboard({
  data = defaultAnalytics,
  isLoading,
}: AnalyticsDashboardProps) {
  const stats = React.useMemo(
    () => [
      {
        title: "Total Users",
        value: data.totalUsers,
        icon: <Users className="h-4 w-4" />,
        trend: calcTrend(data.totalUsers, data.previousPeriod.totalUsers),
      },
      {
        title: "Workspaces",
        value: data.totalWorkspaces,
        icon: <Building2 className="h-4 w-4" />,
        trend: calcTrend(data.totalWorkspaces, data.previousPeriod.totalWorkspaces),
      },
      {
        title: "Total Tasks",
        value: data.totalTasks,
        icon: <ListTodo className="h-4 w-4" />,
        trend: calcTrend(data.totalTasks, data.previousPeriod.totalTasks),
      },
      {
        title: "Projects",
        value: data.totalProjects,
        icon: <FolderKanban className="h-4 w-4" />,
        trend: calcTrend(data.totalProjects, data.previousPeriod.totalProjects),
      },
    ],
    [data]
  );

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[260px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty =
    data.totalTasks === 0 &&
    data.totalProjects === 0 &&
    data.totalUsers === 0 &&
    data.projectsByStatus.length === 0 &&
    data.tasksByPriority.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold">No analytics data yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create tasks and projects to see analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Member Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis className="text-xs text-muted-foreground" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.taskCompletion}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis className="text-xs text-muted-foreground" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar
                    dataKey="created"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    opacity={0.3}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.projectsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.projectsByStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {data.projectsByStatus.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color || COLORS[0] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.activityByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis className="text-xs text-muted-foreground" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.activityByDay.map((entry, index) => (
                      <Cell
                        key={entry.day}
                        fill={`hsl(var(--primary) / ${0.2 + (entry.count / Math.max(...data.activityByDay.map((d) => d.count), 1)) * 0.8})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
