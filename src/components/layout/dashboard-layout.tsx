"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { TaskModal } from "@/components/tasks/task-modal";
import { useUiStore } from "@/store/use-ui-store";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const isMobileRef = React.useRef(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    isMobileRef.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => {
      isMobileRef.current = e.matches;
      setSidebarOpen(!e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [setSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 w-full flex-col transition-all duration-300",
          sidebarOpen ? "md:ml-60" : "md:ml-16"
        )}
      >
        <Navbar />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
      <TaskModal />
    </div>
  );
}
