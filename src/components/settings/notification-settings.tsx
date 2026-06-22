"use client";

import * as React from "react";
import { Loader2, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

type NotificationSettingsData = {
  assignments: boolean;
  comments: boolean;
  mentions: boolean;
  dueDates: boolean;
  statusChanges: boolean;
  invitations: boolean;
  workspaceAnnouncements: boolean;
  emailDigest: boolean;
};

const defaultSettings: NotificationSettingsData = {
  assignments: true,
  comments: true,
  mentions: true,
  dueDates: true,
  statusChanges: true,
  invitations: true,
  workspaceAnnouncements: false,
  emailDigest: true,
};

const toggles: { key: keyof NotificationSettingsData; label: string; desc: string }[] = [
  { key: "assignments", label: "Task assignments", desc: "When someone assigns you a task" },
  { key: "comments", label: "Comments", desc: "When someone comments on your task" },
  { key: "mentions", label: "Mentions", desc: "When someone mentions you" },
  { key: "dueDates", label: "Due dates", desc: "When a task due date is approaching" },
  { key: "statusChanges", label: "Status changes", desc: "When a task status changes" },
  { key: "invitations", label: "Invitations", desc: "When you're invited to a workspace" },
  {
    key: "workspaceAnnouncements",
    label: "Workspace announcements",
    desc: "General workspace announcements",
  },
];

export function NotificationSettings() {
  const [settings, setSettings] = React.useState<NotificationSettingsData>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/user/notification-settings");
        if (!res.ok) throw new Error("Failed to load notification settings");
        const json = await res.json();
        if (!cancelled) {
          setSettings((prev) => ({
            ...prev,
            ...json.settings,
          }));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
          <CardDescription className="text-xs">Choose what notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
        <CardDescription className="text-xs">
          Choose what notifications you receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toggles.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={settings[key]}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, [key]: v }))}
            />
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email digest</p>
            <p className="text-xs text-muted-foreground">
              Receive a daily summary of activity
            </p>
          </div>
          <Switch
            checked={settings.emailDigest}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, emailDigest: v }))}
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
