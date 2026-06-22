"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/store/use-ui-store";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/store/use-notification-store";
import { getInitials } from "@/lib/utils";
import { signOut } from "next-auth/react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const user = useCurrentUser();
  useUnreadCount();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="shrink-0"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex h-9 w-64 justify-start text-muted-foreground gap-2"
          onClick={toggleCommandPalette}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left text-sm">Search anything...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleCommandPalette}
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image ?? ""} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name ?? "User"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
