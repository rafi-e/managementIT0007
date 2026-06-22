"use client";

import * as React from "react";
import { useCurrentUser, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, User } from "lucide-react";
import { settingsSchema } from "@/lib/validations";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";
import { AvatarUpload } from "@/components/ui/avatar-upload";

export default function ProfilePage() {
  const user = useCurrentUser();
  const { update } = useAuth();

  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [saving, setSaving] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(user?.image ?? null);

  if (!user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your name and email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl ?? ""} />
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </div>
            <AvatarUpload userId={user.id} onUploadComplete={async (url) => { setAvatarUrl(url); await update({ image: url }); }} />
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
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
