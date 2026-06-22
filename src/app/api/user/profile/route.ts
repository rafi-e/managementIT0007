import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { settingsSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, image } = parsed.data;

  if (email && email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(image !== undefined ? { image } : {}),
    },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return NextResponse.json({ user });
}
