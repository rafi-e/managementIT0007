import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const protectedPaths = [
    "/dashboard", "/settings", "/workspace", "/profile",
    "/projects", "/tasks", "/calendar",
    "/notifications", "/workspaces", "/admin",
  ];

  const isProtected = protectedPaths.some((p) =>
    nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/")
  );

  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthPage = authPaths.some((p) =>
    nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/")
  );

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
