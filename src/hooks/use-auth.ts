"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { User, UserRole } from "@/types";

type CurrentUser = Pick<User, "id" | "name" | "email" | "image" | "role">;

function mapSessionUser(sessionUser: Record<string, unknown>): CurrentUser {
  return {
    id: (sessionUser.id as string) ?? "",
    name: (sessionUser.name as string) ?? "",
    email: (sessionUser.email as string) ?? "",
    image: (sessionUser.image as string | null) ?? null,
    role: (sessionUser.role as UserRole) ?? "member",
  };
}

export function useCurrentUser(): CurrentUser | null {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return mapSessionUser(session.user as Record<string, unknown>);
}

export function useRequireAuth(): CurrentUser | null {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) return null;
  return mapSessionUser(session.user as Record<string, unknown>);
}

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  return {
    user: session?.user
      ? mapSessionUser(session.user as Record<string, unknown>)
      : null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",
    update,
    session,
  };
}
