"use server";

import { requireAuth } from "@/lib/auth-actions";
import {
  getProjectsByWorkspaceId,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/db";
import type { ProjectInput } from "@/lib/validations";
import { createNotifications, getAllUserIds } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getProjectsAction(workspaceId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return [];
  const projects = await getProjectsByWorkspaceId(workspaceId);
  return serialize(projects);
}

export async function getProjectAction(projectId: string) {
  const session = await requireAuth();
  if (!session?.user?.id) return null;
  const project = await getProjectById(projectId);
  return serialize(project);
}

export async function createProjectAction(data: ProjectInput) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;
    const project = await createProject(data, session.user.id);

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} created project: ${project.name}`,
        message: `New project created`,
        link: `/projects`,
      }))
    );

    revalidatePath(`/workspace/${data.workspaceId}`);
    return serialize(project);
  } catch (error) {
    console.error("createProjectAction failed:", error);
    throw new Error("Failed to create project");
  }
}

export async function updateProjectAction(
  projectId: string,
  data: Partial<ProjectInput>
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return null;
    const project = await updateProject(projectId, data);

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} updated project: ${project.name}`,
        message: `Project has been updated`,
        link: `/projects`,
      }))
    );

    revalidatePath(`/project/*`);
    return serialize(project);
  } catch (error) {
    console.error("updateProjectAction failed:", error);
    throw new Error("Failed to update project");
  }
}

export async function deleteProjectAction(projectId: string) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) return;

    const allUserIds = await getAllUserIds();
    const actorName = session.user.name || "Someone";
    await createNotifications(
      allUserIds.filter((uid) => uid !== session.user.id).map((uid) => ({
        userId: uid,
        type: "task_updated",
        title: `${actorName} deleted project`,
        message: `Project has been deleted`,
        link: `/projects`,
      }))
    );

    await deleteProject(projectId);
    revalidatePath(`/workspace/*`);
  } catch (error) {
    console.error("deleteProjectAction failed:", error);
    throw new Error("Failed to delete project");
  }
}
