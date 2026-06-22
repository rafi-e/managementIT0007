import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const SETTINGS_KEYS = [
  "assignments", "comments", "mentions", "dueDates",
  "statusChanges", "invitations", "workspaceAnnouncements", "emailDigest",
] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.notificationSetting.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    settings = await prisma.notificationSetting.create({
      data: { userId: session.user.id },
    });
  }

  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, boolean> = {};

  for (const key of SETTINGS_KEYS) {
    if (typeof body[key] === "boolean") {
      data[key] = body[key];
    }
  }

  const settings = await prisma.notificationSetting.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json({ success: true, settings });
}
