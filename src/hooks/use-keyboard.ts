"use client";

import { useEffect, useCallback } from "react";
import { useUiStore } from "@/store/use-ui-store";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

function parseShortcut(shortcut: string): KeyCombo {
  const parts = shortcut.toLowerCase().split("+");
  const combo: KeyCombo = { key: "" };

  for (const part of parts) {
    switch (part) {
      case "ctrl":
      case "control":
        combo.ctrl = true;
        break;
      case "meta":
      case "cmd":
      case "command":
        combo.meta = true;
        break;
      case "shift":
        combo.shift = true;
        break;
      case "alt":
      case "option":
        combo.alt = true;
        break;
      default:
        combo.key = part;
    }
  }

  return combo;
}

function matchEvent(e: KeyboardEvent, combo: KeyCombo): boolean {
  const isCtrlOrMeta = combo.ctrl || combo.meta;
  const ctrlOrMetaPressed = e.ctrlKey || e.metaKey;

  if (isCtrlOrMeta && !ctrlOrMetaPressed) return false;
  if (!isCtrlOrMeta && ctrlOrMetaPressed) return false;
  if (combo.shift && !e.shiftKey) return false;
  if (!combo.shift && e.shiftKey && combo.key !== "shift") return false;
  if (combo.alt && !e.altKey) return false;
  if (!combo.alt && e.altKey && combo.key !== "alt") return false;

  const expectedKey = combo.key.toLowerCase();
  const pressedKey = e.key.toLowerCase();

  if (expectedKey === "escape" || expectedKey === "esc") {
    return pressedKey === "escape";
  }

  if (expectedKey === "enter") {
    return pressedKey === "enter";
  }

  return (
    pressedKey === expectedKey ||
    e.code?.toLowerCase() === expectedKey ||
    e.code?.toLowerCase() === `key${expectedKey}`
  );
}

export function useKeyboardShortcut(
  shortcut: string,
  handler: () => void,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      if (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const combo = parseShortcut(shortcut);
      if (matchEvent(e, combo)) {
        e.preventDefault();
        e.stopPropagation();
        handler();
      }
    },
    [shortcut, handler, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export function useGlobalKeyboardShortcuts() {
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  useKeyboardShortcut("ctrl+k", toggleCommandPalette);
  useKeyboardShortcut("ctrl+\\", toggleSidebar);
  useKeyboardShortcut("ctrl+shift+t", toggleTheme);
}
