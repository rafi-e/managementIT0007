"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  User,
  Palette,
  Bell,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useCurrentUser, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUiStore } from "@/store/use-ui-store";
import { cn, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";
import { settingsSchema } from "@/lib/validations";
import { signOut } from "next-auth/react";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { AvatarUpload } from "@/components/ui/avatar-upload";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ProfileSection() {
  const user = useCurrentUser();
  const { update } = useAuth();
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [saving, setSaving] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(user?.image ?? null);

  const handleSave = async () => {
    const result = settingsSchema.safeParse({ name, email });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      const msg = errs.name?.[0] ?? errs.email?.[0] ?? "Invalid input";
      toast.error(msg);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) throw new Error("Failed to update");
      await update();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Profile" description="Update your personal information">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl ?? ""} />
              <AvatarFallback className="text-lg">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </div>
            <AvatarUpload userId={user?.id ?? ""} onUploadComplete={async (url) => { setAvatarUrl(url); await update({ image: url }); }} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </SectionCard>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <SectionCard title="Theme" description="Customize your interface appearance">
        <div className="flex gap-3">
          {[
            { value: "light", icon: Sun, label: "Light" },
            { value: "dark", icon: Moon, label: "Dark" },
            { value: "system", icon: Monitor, label: "System" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                theme === value
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/20"
              )}
              onClick={() => setTheme(value)}
            >
              <Icon className={cn("h-6 w-6", theme === value ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm font-medium", theme === value ? "text-primary" : "")}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Sidebar" description="Configure sidebar behavior">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Default sidebar state</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sidebar is currently {sidebarOpen ? "open" : "collapsed"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleSidebar} className="gap-2">
            {sidebarOpen ? (
              <>
                <ChevronLeft className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                Expand
              </>
            )}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationSettingsSection() {
  return <NotificationSettings />;
}

function AccountSection() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to change password");
      }
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure? This will permanently delete your account and all associated data.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Change Password" description="Update your account password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="relative space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="relative space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setShowPasswords(!showPasswords)}
            >
              {showPasswords ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide passwords
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Show passwords
                </>
              )}
            </Button>
            <Button type="submit" disabled={savingPassword || !currentPassword || !newPassword} className="gap-2">
              {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Delete Account"
        description="Permanently delete your account and all associated data"
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Danger zone</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Once you delete your account, there is no going back. All your workspaces,
                  projects, and tasks will be permanently removed.
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="gap-2"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleting ? "Deleting..." : "Delete My Account"}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-0">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Shield className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceSection />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettingsSection />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
