"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUiStore } from "@/store/use-ui-store";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/store/use-workspace-store";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href: string;
}

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const closeCommandPalette = () => {
    if (open) toggleCommandPalette();
  };
  const { currentWorkspace } = useCurrentWorkspace();
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const [query, setQuery] = React.useState("");

  const handleSelect = (href: string) => {
    setQuery("");
    closeCommandPalette();
    router.push(href);
  };

  const navigationItems: CommandItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Go to dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    ...workspaces.map((ws) => ({
      id: `ws-${ws.id}`,
      label: ws.name,
      description: "Switch workspace",
      icon: Building2,
      href: `/workspace/${ws.id}`,
    })),
    {
      id: "projects",
      label: "Projects",
      description: "View all projects",
      icon: FolderKanban,
      href: "/projects",
    },
    {
      id: "tasks",
      label: "Tasks",
      description: "View all tasks",
      icon: ListTodo,
      href: "/tasks",
    },
  ];

  const filteredItems = query
    ? navigationItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : navigationItems;

  return (
    <CommandDialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setQuery("");
        toggleCommandPalette();
      }
    }}>
      <CommandInput
        placeholder="Search pages, projects, tasks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          <div cmdk-group-heading="">Quick Navigation</div>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.description && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
