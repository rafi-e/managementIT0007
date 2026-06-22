"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "react-hot-toast";
import { NotificationToastWatcher } from "@/components/notifications/notification-toast-watcher";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            {children}
            <NotificationToastWatcher />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
