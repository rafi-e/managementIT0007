import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@clickupclone.com" },
    update: {},
    create: {
      pn: "admin",
      name: "Admin User",
      email: "admin@clickupclone.com",
      password: hashedPassword,
      role: "admin",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin",
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@clickupclone.com" },
    update: {},
    create: {
      pn: "user",
      name: "Regular User",
      email: "user@clickupclone.com",
      password: hashedPassword,
      role: "member",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=user",
    },
  });

  console.log(`Created users: ${adminUser.email}, ${regularUser.email}`);

  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      icon: "corporate-farm",
      ownerId: adminUser.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: adminUser.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: adminUser.id, role: "owner" },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: regularUser.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: regularUser.id, role: "member" },
  });

  console.log("Added members to workspace");

  const project1 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Website Redesign",
      description: "Complete overhaul of the company website with modern design and improved UX",
      color: "#6366f1",
      icon: "palette",
      status: "active",
      isFavorite: true,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Mobile App v2",
      description: "Version 2 of the mobile application with new features and performance improvements",
      color: "#f59e0b",
      icon: "smartphone",
      status: "active",
      isFavorite: false,
    },
  });

  console.log(`Created projects: ${project1.name}, ${project2.name}`);

  const labels = await Promise.all([
    prisma.label.upsert({ where: { name: "bug" }, update: {}, create: { name: "bug", color: "#ef4444" } }),
    prisma.label.upsert({ where: { name: "feature" }, update: {}, create: { name: "feature", color: "#22c55e" } }),
    prisma.label.upsert({ where: { name: "enhancement" }, update: {}, create: { name: "enhancement", color: "#3b82f6" } }),
    prisma.label.upsert({ where: { name: "design" }, update: {}, create: { name: "design", color: "#a855f7" } }),
    prisma.label.upsert({ where: { name: "documentation" }, update: {}, create: { name: "documentation", color: "#64748b" } }),
    prisma.label.upsert({ where: { name: "urgent" }, update: {}, create: { name: "urgent", color: "#f97316" } }),
  ]);

  const tasksData = [
    { projectId: project1.id, title: "Design new homepage layout", description: "Create wireframes and high-fidelity mockups for the new homepage", status: "in_progress" as const, priority: "high" as const, assigneeId: adminUser.id },
    { projectId: project1.id, title: "Implement responsive navigation", description: "Build a responsive navbar with mobile hamburger menu", status: "todo" as const, priority: "medium" as const, assigneeId: regularUser.id },
    { projectId: project1.id, title: "Create contact form component", description: "Build a contact form with validation and email integration", status: "todo" as const, priority: "low" as const, assigneeId: null },
    { projectId: project1.id, title: "Optimize images and assets", description: "Compress and convert images to WebP format for performance", status: "review" as const, priority: "medium" as const, assigneeId: regularUser.id },
    { projectId: project1.id, title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment", status: "completed" as const, priority: "high" as const, assigneeId: adminUser.id },
    { projectId: project1.id, title: "Write unit tests for utility functions", description: "Achieve 80% code coverage on shared utilities", status: "todo" as const, priority: "medium" as const, assigneeId: null },
    { projectId: project2.id, title: "Implement push notifications", description: "Add push notification support using Firebase Cloud Messaging", status: "in_progress" as const, priority: "high" as const, assigneeId: adminUser.id },
    { projectId: project2.id, title: "Redesign onboarding flow", description: "Simplify the user onboarding process to reduce drop-off", status: "todo" as const, priority: "medium" as const, assigneeId: regularUser.id },
    { projectId: project2.id, title: "Add dark mode support", description: "Implement system-aware dark mode throughout the app", status: "todo" as const, priority: "low" as const, assigneeId: null },
    { projectId: project2.id, title: "Performance audit and optimization", description: "Profile and optimize rendering performance, reduce bundle size", status: "review" as const, priority: "urgent" as const, assigneeId: adminUser.id },
    { projectId: project2.id, title: "Migrate to new API endpoints", description: "Update all API calls to use the new v2 endpoints", status: "completed" as const, priority: "high" as const, assigneeId: regularUser.id },
    { projectId: project2.id, title: "Write end-to-end tests", description: "Add Cypress E2E tests for critical user flows", status: "todo" as const, priority: "medium" as const, assigneeId: null },
  ];

  const tasks: Array<{ id: string; title: string }> = [];
  for (const t of tasksData) {
    const task = await prisma.task.create({
      data: {
        projectId: t.projectId,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        estimatedHours: Math.floor(Math.random() * 40) + 2,
        order: tasks.length,
      },
    });

    if (t.assigneeId) {
      await prisma.taskAssignment.create({
        data: { taskId: task.id, userId: t.assigneeId },
      });
    }

    const randomLabels = labels.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
    for (const label of randomLabels) {
      await prisma.taskLabel.create({
        data: { taskId: task.id, labelId: label.id },
      });
    }

    tasks.push({ id: task.id, title: task.title });
  }

  console.log(`Created ${tasks.length} tasks`);

  const commentsData = [
    { taskId: tasks[0].id, userId: regularUser.id, content: "I love the new layout! The hero section looks much cleaner." },
    { taskId: tasks[0].id, userId: adminUser.id, content: "Thanks! Let me know if you have any feedback on the color scheme." },
    { taskId: tasks[6].id, userId: adminUser.id, content: "FCM setup is complete on Android. Working on iOS now." },
    { taskId: tasks[6].id, userId: regularUser.id, content: "Let me know if you need help testing the iOS integration." },
    { taskId: tasks[3].id, userId: adminUser.id, content: "The images look great. Can you also add lazy loading?" },
    { taskId: tasks[9].id, userId: regularUser.id, content: "Found a few bottlenecks in the list rendering. Pushing fixes soon." },
  ];

  for (const c of commentsData) {
    await prisma.comment.create({
      data: {
        taskId: c.taskId,
        userId: c.userId,
        content: c.content,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`Created ${commentsData.length} comments`);

  const activityLogsData = [
    { userId: adminUser.id, taskId: null, workspaceId: workspace.id, action: "created_workspace", details: "Created Acme Corp workspace" },
    { userId: adminUser.id, taskId: null, workspaceId: workspace.id, action: "created_project", details: "Created Website Redesign project" },
    { userId: adminUser.id, taskId: null, workspaceId: workspace.id, action: "created_project", details: "Created Mobile App v2 project" },
    { userId: adminUser.id, taskId: null, workspaceId: workspace.id, action: "invited_member", details: "Invited Regular User to workspace" },
    { userId: regularUser.id, taskId: tasks[0].id, workspaceId: workspace.id, action: "commented", details: `Commented on "${tasks[0].title}"` },
    { userId: adminUser.id, taskId: tasks[6].id, workspaceId: workspace.id, action: "status_change", details: `Changed "${tasks[6].title}" status to in_progress` },
  ];

  for (const log of activityLogsData) {
    await prisma.activityLog.create({
      data: {
        userId: log.userId,
        taskId: log.taskId,
        workspaceId: log.workspaceId,
        action: log.action,
        details: log.details,
      },
    });
  }

  console.log(`Created ${activityLogsData.length} activity logs`);

  const notificationsData = [
    { userId: regularUser.id, type: "task_assigned" as const, title: "New task assigned", message: "You've been assigned 'Implement responsive navigation'", link: `/task/${tasks[1].id}` },
    { userId: regularUser.id, type: "comment_added" as const, title: "New comment", message: "Admin User commented on 'Design new homepage layout'", link: `/task/${tasks[0].id}` },
    { userId: adminUser.id, type: "task_assigned" as const, title: "New task assigned", message: "You've been assigned 'Implement push notifications'", link: `/task/${tasks[6].id}` },
    { userId: regularUser.id, type: "status_change" as const, title: "Status updated", message: "Task 'Optimize images and assets' moved to review", link: `/task/${tasks[3].id}` },
    { userId: adminUser.id, type: "due_date_reminder" as const, title: "Task due soon", message: "'Design new homepage layout' is due in 2 days", link: `/task/${tasks[0].id}` },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({
      data: {
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: Math.random() > 0.5,
      },
    });
  }

  console.log(`Created ${notificationsData.length} notifications`);
  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
