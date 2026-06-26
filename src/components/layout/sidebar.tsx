"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Calendar,
  Settings,
  Settings2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/store/use-ui-store";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useCurrentUser } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { getInitials } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/unit-kerja", label: "Unit Kerja", icon: Building2 },
];

const bottomLinks = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const { currentWorkspace, setCurrentWorkspace } = useCurrentWorkspace();
  const user = useCurrentUser();
  const isMobile = useIsMobile();

  const closeOnMobile = React.useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setSidebarOpen]);

  React.useEffect(() => {
    const handleRouteChange = () => closeOnMobile();
    handleRouteChange();
  }, [pathname, closeOnMobile]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-full flex-col border-r bg-background transition-all duration-300",
        sidebarOpen ? "w-60 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16",
        "md:transition-all"
      )}
    >
      <div className={cn("flex h-full flex-col overflow-hidden", !sidebarOpen && "md:items-center")}>
        <div className="flex h-14 items-center border-b px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex w-full items-center gap-2 px-2",
                  !sidebarOpen && "md:justify-center md:p-0 md:w-10 md:h-10"
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                  {currentWorkspace ? getInitials(currentWorkspace.name) : <Globe className="h-4 w-4" />}
                </div>
                {sidebarOpen && (
                  <>
                    <span className="flex-1 truncate text-left text-sm font-medium">
                      {currentWorkspace?.name ?? "All Tasks"}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentWorkspace(null)} className="cursor-pointer">
                <Globe className="mr-2 h-4 w-4" />
                <span>All Tasks</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/workspaces" className="cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Workspaces
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/workspaces" className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className={cn("flex flex-col gap-1 px-2", !sidebarOpen && "md:items-center")}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  asChild
                  className={cn(
                    "justify-start",
                    isActive(link.href) && "bg-secondary font-medium",
                    !sidebarOpen && "md:justify-center md:w-10 md:h-10 md:p-0"
                  )}
                >
                  <Link href={link.href} onClick={closeOnMobile}>
                    <Icon className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
                    {sidebarOpen && <span>{link.label}</span>}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t p-2">
          <nav className={cn("flex flex-col gap-1", !sidebarOpen && "md:items-center")}>
            {bottomLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  asChild
                  className={cn(
                    "justify-start",
                    isActive(link.href) && "bg-secondary font-medium",
                    !sidebarOpen && "md:justify-center md:w-10 md:h-10 md:p-0"
                  )}
                >
                  <Link href={link.href} onClick={closeOnMobile}>
                    <Icon className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
                    {sidebarOpen && <span>{link.label}</span>}
                  </Link>
                </Button>
              );
            })}
            {currentWorkspace && (
              <Button
                variant={pathname.includes("/workspace/") && pathname.includes("/settings") ? "secondary" : "ghost"}
                asChild
                className={cn(
                  "justify-start",
                  pathname.includes("/workspace/") && pathname.includes("/settings") && "bg-secondary font-medium",
                  !sidebarOpen && "md:justify-center md:w-10 md:h-10 md:p-0"
                )}
              >
                <Link href={`/workspace/${currentWorkspace.id}/settings`} onClick={closeOnMobile}>
                  <Settings2 className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
                  {sidebarOpen && <span>Workspace Settings</span>}
                </Link>
              </Button>
            )}
          </nav>
        </div>

        <div className={cn("border-t p-2", !sidebarOpen && "md:flex md:justify-center")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="inline-flex"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
