"use client";

import * as React from "react";
import {
  Search,
  UserPlus,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn, getInitials } from "@/lib/utils";
import type { WorkspaceMember } from "@/types";
import { WorkspaceRole } from "@/types";

const roleIcons: Partial<Record<WorkspaceRole, React.ReactNode>> = {
  [WorkspaceRole.owner]: <ShieldAlert className="h-3.5 w-3.5" />,
  [WorkspaceRole.admin]: <ShieldAlert className="h-3.5 w-3.5" />,
  [WorkspaceRole.member]: <ShieldCheck className="h-3.5 w-3.5" />,
  [WorkspaceRole.guest]: <Shield className="h-3.5 w-3.5" />,
};

const roleColors: Partial<Record<WorkspaceRole, string>> = {
  [WorkspaceRole.owner]: "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  [WorkspaceRole.admin]: "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  [WorkspaceRole.member]: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  [WorkspaceRole.guest]: "text-gray-600 border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950",
};

interface UserManagementProps {
  members: WorkspaceMember[];
  currentUserId: string;
  workspaceId: string;
  onRoleChange: (userId: string, role: WorkspaceRole) => void;
  onRemove: (userId: string) => void;
  onInvite: (email: string, role: WorkspaceRole) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function UserManagement({
  members,
  currentUserId,
  workspaceId,
  onRoleChange,
  onRemove,
  onInvite,
  isLoading,
}: UserManagementProps) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>(WorkspaceRole.member);
  const [removeConfirm, setRemoveConfirm] = React.useState<string | null>(null);

  const filtered = React.useMemo(
    () =>
      members.filter(
        (m) =>
          m.user.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.user.email ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [members, search]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = React.useMemo(
    () => filtered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE),
    [filtered, currentPage]
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    onInvite(inviteEmail, inviteRole);
    setInviteEmail("");
    setInviteOpen(false);
  };

  const handleRemove = (userId: string) => {
    onRemove(userId);
    setRemoveConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite Member</span>
              <span className="sm:hidden">Invite</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as WorkspaceRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="GUEST">Guest</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!inviteEmail}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="divide-y">
              {paged.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={member.user.image ?? ""} />
                        <AvatarFallback>
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {member.user.name}
                          </span>
                          {member.userId === currentUserId && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-12 sm:ml-0">
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          onRoleChange(member.userId, v as WorkspaceRole)
                        }
                        disabled={member.userId === currentUserId}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 w-28 sm:w-32 gap-2 border-0 bg-transparent shadow-none",
                            roleColors[member.role]
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            {roleIcons[member.role]}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="MEMBER">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Member
                            </div>
                          </SelectItem>
                          <SelectItem value="GUEST">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3.5 w-3.5" />
                              Guest
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {member.userId !== currentUserId && (
                      <Dialog
                        open={removeConfirm === member.userId}
                        onOpenChange={(open) =>
                          setRemoveConfirm(open ? member.userId : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove Member</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to remove{" "}
                              <strong>{member.user.name}</strong> from this
                              workspace? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setRemoveConfirm(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleRemove(member.userId)}
                            >
                              Remove
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
