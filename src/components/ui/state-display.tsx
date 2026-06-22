"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox, RefreshCw, type LucideIcon } from "lucide-react";

interface LoadingStateProps {
  variant?: "card" | "table" | "list";
  count?: number;
  className?: string;
}

export function LoadingState({ variant = "card", count, className }: LoadingStateProps) {
  const n = count ?? (variant === "list" ? 8 : 5);

  if (variant === "table") {
    return (
      <div className={cn("rounded-lg border", className)}>
        <div className="border-b bg-muted/40 p-3">
          <Skeleton className="h-4 w-full max-w-[200px]" />
        </div>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b p-3 last:border-0">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="mb-3 h-4 w-3/4" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="mb-4 h-3 w-1/2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <Icon className="mb-4 h-12 w-12 text-muted-foreground/30" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4 gap-1.5">
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <AlertCircle className="mb-4 h-12 w-12 text-destructive/60" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4 gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
