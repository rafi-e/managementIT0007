"use server";

import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { signIn, signOut, auth } from "./auth";
import { AuthError } from "next-auth";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./validations";
import { generateToken, getBaseUrl } from "./utils";
import { sendResetPasswordEmail } from "./email";

export async function login(formData: FormData) {
  const raw = {
    pn: formData.get("pn") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid personal number or password format" };
  }

  try {
    await signIn("credentials", {
      pn: parsed.data.pn,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid personal number or password" };
    }
    return { error: "Something went wrong" };
  }
}

export async function register(formData: FormData) {
  const raw = {
    pn: formData.get("pn") as string,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { pn, name, email, password } = parsed.data;

  const existingPn = await prisma.user.findUnique({ where: { pn } });
  if (existingPn) {
    return { error: "Personal number already in use" };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { error: "Email already in use" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      pn,
      name,
      email,
      password: hashedPassword,
    },
  });

  try {
    await signIn("credentials", {
      pn,
      password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function logout() {
  await signOut({ redirect: false });
  return { success: true };
}

export async function forgotPassword(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid email format" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return { success: true };
  }

  const token = generateToken(48);
  const expires = new Date(Date.now() + 3600000);

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires,
    },
  });

  const resetLink = `${getBaseUrl()}/reset-password?token=${token}`;

  await sendResetPasswordEmail({
    email: user.email,
    resetLink,
  });

  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { token, password } = parsed.data;

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return { error: "Invalid or expired token" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { password: hashedPassword },
  });

  await prisma.verificationToken.delete({
    where: { token },
  });

  return { success: true };
}

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}
