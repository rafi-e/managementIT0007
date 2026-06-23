import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, getBaseUrl } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/email";
import { createNotifications } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, email, role } = await req.json();

  if (!workspaceId || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: { where: { userId: session.user.id } } },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const isAdmin = workspace.members.some(
    (m) => m.role === "owner" || m.role === "admin"
  );
  if (!isAdmin) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  const actorName = inviter?.name || "Someone";

  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
    });
    if (!alreadyMember) {
      await prisma.workspaceMember.create({
        data: { workspaceId, userId: existingUser.id, role: role || "member" },
      });

      await createNotifications([{
        userId: existingUser.id,
        type: "invitation",
        title: `Invited to workspace: ${workspace.name}`,
        message: `You have been added as a ${role ?? "member"}`,
        link: `/workspace/${workspaceId}`,
      }]);
    }
  } else {
    const token = generateToken(48);
    await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role: role || "member",
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  await sendInvitationEmail({
    email,
    inviterName: actorName,
    workspaceName: workspace.name,
    inviteLink: `${getBaseUrl()}/login`,
  });

  return NextResponse.json({ success: true });
}
