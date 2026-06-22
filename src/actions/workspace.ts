"use server";

import { requireAuth } from "@/lib/auth-actions";
import {
  getWorkspacesByUserId,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  getUserCount,
  getWorkspaceAnalytics,
} from "@/lib/db";
import { prisma } from "@/lib/prisma";
import {
  createNotifications,
  getAllUserIds,
} from "@/lib/notifications";
import type { WorkspaceInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getWorkspacesAction() {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const workspaces = await getWorkspacesByUserId();
  return serialize(workspaces);
}

export async function getWorkspaceAction(workspaceId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return null;
  const workspace = await getWorkspaceById(workspaceId);
  return serialize(workspace);
}

export async function createWorkspaceAction(data: WorkspaceInput) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;
    const workspace = await createWorkspace(data, session.user.id);
    revalidatePath("/workspaces");
    return serialize(workspace);
  } catch (error) {
    console.error("createWorkspaceAction failed:", error);
    throw new Error("Failed to create workspace");
  }
}

export async function updateWorkspaceAction(
  workspaceId: string,
  data: Partial<WorkspaceInput>
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;
    const workspace = await updateWorkspace(workspaceId, data);

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    // Notify all users about workspace update
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "invitation",
        title: `${actorName} updated workspace: ${workspace.name}`,
        message: `Workspace has been updated`,
        link: `/workspace/${workspaceId}`,
      }))
    );

    revalidatePath(`/workspace/${workspaceId}`);
    return serialize(workspace);
  } catch (error) {
    console.error("updateWorkspaceAction failed:", error);
    throw new Error("Failed to update workspace");
  }
}

export async function deleteWorkspaceAction(workspaceId: string) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "invitation",
        title: `${actorName} deleted workspace`,
        message: `Workspace has been deleted`,
        link: `/workspaces`,
      }))
    );

    await deleteWorkspace(workspaceId);
    revalidatePath("/workspaces");
  } catch (error) {
    console.error("deleteWorkspaceAction failed:", error);
    throw new Error("Failed to delete workspace");
  }
}

export async function getWorkspaceMembersAction(workspaceId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const workspace = await getWorkspaceById(workspaceId);
  return workspace?.members ?? [];
}

export async function addWorkspaceMemberAction(
  workspaceId: string,
  email: string,
  role: "admin" | "member" | "guest" = "member"
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const member = await addWorkspaceMember(workspaceId, user.id, role);

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "invitation",
        title: `${actorName} added ${user.name || user.email} to workspace`,
        message: `${user.name || user.email} has been added as ${role}`,
        link: `/workspace/${workspaceId}`,
      }))
    );

    revalidatePath(`/workspace/${workspaceId}`);
    return serialize(member);
  } catch (error) {
    console.error("addWorkspaceMemberAction failed:", error);
    throw new Error("Failed to add member");
  }
}

export async function removeWorkspaceMemberAction(
  workspaceId: string,
  userId: string
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "invitation",
        title: `${actorName} removed a member from workspace`,
        message: `A member has been removed`,
        link: `/workspace/${workspaceId}`,
      }))
    );

    await removeWorkspaceMember(workspaceId, userId);
    revalidatePath(`/workspace/${workspaceId}`);
  } catch (error) {
    console.error("removeWorkspaceMemberAction failed:", error);
    throw new Error("Failed to remove member");
  }
}

export async function updateWorkspaceMemberRoleAction(
  workspaceId: string,
  userId: string,
  role: "admin" | "member" | "guest"
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "invitation",
        title: `${actorName} updated a member's role`,
        message: `A member's role has been changed`,
        link: `/workspace/${workspaceId}`,
      }))
    );

    await updateWorkspaceMemberRole(workspaceId, userId, role);
    revalidatePath(`/workspace/${workspaceId}`);
  } catch (error) {
    console.error("updateWorkspaceMemberRoleAction failed:", error);
    throw new Error("Failed to update member role");
  }
}

export async function getUserCountAction() {
  const session = await requireAuth();
  if (!session?.user?.id) return 0;
  return getUserCount();
}

export async function getWorkspaceAnalyticsAction(workspaceId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return null;
  const data = await getWorkspaceAnalytics(workspaceId);
  return serialize(data);
}
