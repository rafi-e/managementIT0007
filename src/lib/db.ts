import { prisma } from "./prisma";
import type {
  WorkspaceInput,
  ProjectInput,
  TaskInput,
  UnitKerjaInput,
} from "./validations";
import type { Task, Label } from "@/types";
import { generateSlug } from "./utils";

export async function getWorkspacesByUserId() {
  return prisma.workspace.findMany({
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, projects: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkspaceById(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
      _count: { select: { projects: true } },
    },
  });
}

export async function createWorkspace(data: WorkspaceInput, ownerId: string) {
  const slug = generateSlug(data.name);
  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

  return prisma.workspace.create({
    data: {
      name: data.name,
      icon: data.icon,
      slug: uniqueSlug,
      ownerId,
      members: {
        create: { userId: ownerId, role: "owner" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function updateWorkspace(
  workspaceId: string,
  data: Partial<WorkspaceInput>
) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = `${generateSlug(data.name)}-${Date.now().toString(36)}`;
  }
  if (data.icon !== undefined) updateData.icon = data.icon;

  return prisma.workspace.update({
    where: { id: workspaceId },
    data: updateData,
    include: {
      owner: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function deleteWorkspace(workspaceId: string) {
  return prisma.workspace.delete({ where: { id: workspaceId } });
}

export async function getProjectsByWorkspaceId(workspaceId: string) {
  return prisma.project.findMany({
    where: { workspaceId },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
  });
}

export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, image: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function createProject(data: ProjectInput, createdById?: string) {
  return prisma.project.create({
    data: {
      workspaceId: data.workspaceId,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      status: data.status,
      isFavorite: data.isFavorite,
      createdById: createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function updateProject(
  projectId: string,
  data: Partial<ProjectInput>
) {
  return prisma.project.update({
    where: { id: projectId },
    data,
    include: {
      _count: { select: { tasks: true } },
    },
  });
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({ where: { id: projectId } });
}

function toTask(t: Record<string, unknown>): Task {
  return {
    ...t,
    assignments: ((t.assignments as Record<string, unknown>[]) || []).map(
      (a: Record<string, unknown>) => a.user as Task["assignments"][number]
    ),
    labels: ((t.labels as Record<string, unknown>[]) || []).map(
      (l: Record<string, unknown>) => l.label as Label
    ),
    subtasks: ((t.subtasks as Record<string, unknown>[]) || []).map((st: Record<string, unknown>) => ({
      ...st,
      assignments: ((st.assignments as Record<string, unknown>[]) || []).map(
        (a: Record<string, unknown>) => a.user as Task["assignments"][number]
      ),
      labels: ((st.labels as Record<string, unknown>[]) || []).map(
        (l: Record<string, unknown>) => l.label as Label
      ),
    })) as Task["subtasks"],
    unitKerja: t.unitKerja
      ? { id: (t.unitKerja as Record<string, unknown>).id as string, kode: (t.unitKerja as Record<string, unknown>).kode as string, nama: (t.unitKerja as Record<string, unknown>).nama as string }
      : null,
  } as Task;
}

export async function getAllTasks() {
  const tasks = await prisma.task.findMany({
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, image: true } },
      updatedBy: { select: { id: true, name: true, image: true } },
      unitKerja: { select: { id: true, kode: true, nama: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      labels: {
        include: { label: true },
      },
      attachments: { orderBy: { createdAt: "desc" } },
      _count: { select: { comments: true, subtasks: true, attachments: true } },
    },
    orderBy: { order: "asc" },
  });
  return tasks.map(toTask);
}

export async function getTasksByProjectId(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      updatedBy: { select: { id: true, name: true, image: true } },
      unitKerja: { select: { id: true, kode: true, nama: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      labels: {
        include: { label: true },
      },
      attachments: { orderBy: { createdAt: "desc" } },
      _count: { select: { comments: true, subtasks: true, attachments: true } },
    },
    orderBy: { order: "asc" },
  });
  return tasks.map(toTask);
}

export async function getTaskById(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { id: true, name: true, workspaceId: true },
      },
      createdBy: { select: { id: true, name: true, image: true } },
      updatedBy: { select: { id: true, name: true, image: true } },
      unitKerja: { select: { id: true, kode: true, nama: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      labels: {
        include: { label: true },
      },
      comments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      subtasks: {
        include: {
          assignments: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
      attachments: { orderBy: { createdAt: "desc" } },
      _count: { select: { comments: true, attachments: true } },
    },
  });
  if (!task) return null;
  return toTask(task as unknown as Record<string, unknown>);
}

export async function createTask(data: TaskInput, createdById?: string) {
  const { assigneeIds, labelIds, ...taskData } = data;
  if (taskData.unitKerjaId === "") taskData.unitKerjaId = null;

  const task = await prisma.task.create({
    data: {
      ...taskData,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      createdById: createdById,
      assignments: assigneeIds?.length
        ? {
            create: assigneeIds.map((userId) => ({ userId })),
          }
        : undefined,
      labels: labelIds?.length
        ? {
            create: labelIds.map((labelId) => ({ labelId })),
          }
        : undefined,
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      updatedBy: { select: { id: true, name: true, image: true } },
      unitKerja: { select: { id: true, kode: true, nama: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      labels: { include: { label: true } },
    },
  });
  return toTask(task as unknown as Record<string, unknown>);
}

export async function updateTask(
  taskId: string,
  data: Partial<TaskInput & { order?: number }>,
  updatedById?: string
) {
  const { assigneeIds, labelIds, ...taskData } = data;
  if (taskData.unitKerjaId === "") taskData.unitKerjaId = null;

  const updateData: Record<string, unknown> = { ...taskData, updatedById };
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  if (assigneeIds !== undefined) {
    await prisma.taskAssignment.deleteMany({ where: { taskId } });
    if (assigneeIds.length > 0) {
      await prisma.taskAssignment.createMany({
        data: assigneeIds.map((userId) => ({ taskId, userId })),
      });
    }
  }

  if (labelIds !== undefined) {
    await prisma.taskLabel.deleteMany({ where: { taskId } });
    if (labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: labelIds.map((labelId) => ({ taskId, labelId })),
      });
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      updatedBy: { select: { id: true, name: true, image: true } },
      unitKerja: { select: { id: true, kode: true, nama: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      labels: { include: { label: true } },
    },
  });
  return toTask(task as unknown as Record<string, unknown>);
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } });
}

export async function reorderTasks(
  updates: { id: string; order: number; status?: string }[]
) {
  const transactions = updates.map((update) =>
    prisma.task.update({
      where: { id: update.id },
      data: {
        order: update.order,
        ...(update.status ? { status: update.status as TaskInput["status"] } : {}),
      },
    })
  );

  return prisma.$transaction(transactions);
}

export async function createComment(taskId: string, userId: string, content: string) {
  return prisma.comment.create({
    data: { taskId, userId, content },
    include: {
      user: { select: { id: true, name: true, image: true, email: true, role: true, createdAt: true } },
    },
  });
}

export async function createSubtask(taskId: string, title: string) {
  const parent = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, order: true },
  });
  if (!parent) throw new Error("Parent task not found");

  const st = await prisma.task.create({
    data: {
      projectId: parent.projectId,
      parentId: taskId,
      title,
      order: parent.order + 1,
    },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      labels: { include: { label: true } },
    },
  });
  return toTask(st as unknown as Record<string, unknown>);
}

export async function toggleSubtask(subtaskId: string, completed: boolean) {
  return prisma.task.update({
    where: { id: subtaskId },
    data: { status: completed ? "completed" : "todo" },
  });
}

export async function deleteSubtask(subtaskId: string) {
  return prisma.task.delete({ where: { id: subtaskId } });
}

export async function createActivityLog(data: {
  taskId?: string;
  userId: string;
  workspaceId?: string;
  action: string;
  details?: string;
}) {
  return prisma.activityLog.create({
    data: {
      taskId: data.taskId,
      userId: data.userId,
      workspaceId: data.workspaceId,
      action: data.action,
      details: data.details,
    },
  });
}

export async function createTimeEntry(data: {
  taskId: string;
  userId: string;
  duration: number;
  note?: string;
}) {
  return prisma.timeEntry.create({
    data: {
      taskId: data.taskId,
      userId: data.userId,
      duration: data.duration,
      note: data.note,
    },
  });
}

export async function getCommentsByTaskId(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: "admin" | "member" | "guest" = "member"
) {
  return prisma.workspaceMember.create({
    data: { workspaceId, userId, role },
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
    },
  });
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: "admin" | "member" | "guest"
) {
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role },
  });
}

export async function getUserCount() {
  return prisma.user.count();
}

export async function getWorkspaceAnalytics(workspaceId: string) {
  const [projects, members, tasksByStatus, tasksByPriority, taskCreation, taskCompletion] =
    await Promise.all([
      prisma.project.count({ where: { workspaceId } }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { project: { workspaceId } },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: { project: { workspaceId } },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["createdAt"],
        where: {
          project: { workspaceId },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["updatedAt"],
        where: {
          project: { workspaceId },
          status: "completed",
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
      }),
    ]);

  const totalTasks = tasksByStatus.reduce((sum, s) => sum + s._count, 0);

  const activityByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    activityByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const t of taskCreation) {
    const key = t.createdAt.toISOString().slice(0, 10);
    if (activityByDay[key] !== undefined) activityByDay[key] += t._count;
  }

  const completeCount: Record<string, number> = {};
  for (const t of taskCompletion) {
    const key = t.updatedAt.toISOString().slice(0, 10);
    completeCount[key] = (completeCount[key] || 0) + t._count;
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    totalTasks,
    totalProjects: projects,
    totalMembers: members,
    tasksByStatus: tasksByStatus.map((s) => ({ status: s.status, count: s._count })),
    tasksByPriority: tasksByPriority.map((p) => ({ priority: p.priority, count: p._count })),
    activityByDay: Object.entries(activityByDay).map(([date, count]) => ({
      day: dayNames[new Date(date).getDay()],
      count,
      date,
    })),
    taskCompletion: Object.entries(completeCount).map(([date, count]) => ({
      date,
      completed: count,
      created: activityByDay[date] || 0,
    })),
  };
}

export async function createLabel(name: string, color?: string) {
  return prisma.label.upsert({
    where: { name },
    update: { color },
    create: { name, color },
  });
}

export async function getLabels() {
  return prisma.label.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
}

export async function createAttachment(data: {
  taskId: string;
  name: string;
  url: string;
  publicId: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}) {
  return prisma.attachment.create({
    data: {
      taskId: data.taskId,
      name: data.name,
      url: data.url,
      publicId: data.publicId,
      size: data.size,
      type: data.type,
      width: data.width ?? null,
      height: data.height ?? null,
    },
  });
}

export async function deleteAttachment(attachmentId: string) {
  return prisma.attachment.delete({ where: { id: attachmentId } });
}

export async function getAttachmentById(attachmentId: string) {
  return prisma.attachment.findUnique({ where: { id: attachmentId } });
}

export async function deleteAttachmentsByTaskId(taskId: string) {
  return prisma.attachment.deleteMany({ where: { taskId } });
}

// ─── Unit Kerja ─────────────────────────────────────────────────

export async function getAllUnitKerja() {
  return prisma.unitKerja.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        select: { id: true, title: true, status: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getUnitKerjaById(id: string) {
  return prisma.unitKerja.findUnique({ where: { id } });
}

export async function getUnitKerjaByKode(kode: string) {
  return prisma.unitKerja.findUnique({ where: { kode } });
}

export async function createUnitKerja(data: UnitKerjaInput) {
  return prisma.unitKerja.create({
    data: {
      kode: data.kode,
      nama: data.nama,
      jenis: data.jenis,
      alamat: data.alamat ?? null,
      longitude: data.longitude ?? null,
      latitude: data.latitude ?? null,
    },
  });
}

export async function updateUnitKerja(id: string, data: Partial<UnitKerjaInput>) {
  const updateData: Record<string, unknown> = {};
  if (data.kode !== undefined) updateData.kode = data.kode;
  if (data.nama !== undefined) updateData.nama = data.nama;
  if (data.alamat !== undefined) updateData.alamat = data.alamat;
  if (data.jenis !== undefined) updateData.jenis = data.jenis;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;

  return prisma.unitKerja.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteUnitKerja(id: string) {
  return prisma.unitKerja.delete({ where: { id } });
}
