"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isUnauthenticated, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isUnauthenticated) {
      router.replace("/login");
    }
  }, [isUnauthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isUnauthenticated) {
    return null;
  }

  if (requiredRole && user && user.role && !requiredRole.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have the required permissions to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
