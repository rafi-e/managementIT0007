import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { gte: now, lte: in24h },
      status: { not: "completed" },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assignments: {
        select: { userId: true },
      },
    },
  });

  for (const task of tasks) {
    const userIds = task.assignments.map((a) => a.userId);
    if (userIds.length === 0) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        userId: { in: userIds },
        type: "due_date_reminder",
        title: { contains: task.title },
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) continue;

    const dueLabel = task.dueDate! < now ? "OVERDUE" : `due ${task.dueDate!.toLocaleDateString()}`;

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "due_date_reminder",
        title: `Task ${dueLabel}: ${task.title}`,
        message: task.dueDate! < now
          ? `This task is overdue! It was due on ${task.dueDate!.toLocaleDateString()}`
          : `This task is due within 24 hours (${task.dueDate!.toLocaleDateString()})`,
        link: `/tasks`,
      })),
    });

    console.log(`  Created reminders for task: ${task.title}`);
  }

  console.log(`Processed ${tasks.length} tasks with upcoming/overdue due dates`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
