import { useCallback, useEffect, useRef } from "react";

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
  category: "navigation" | "action" | "search" | "modal" | "help";
}

/**
 * Check if keyboard event should be ignored (e.g., when typing in input fields)
 */
export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;

  // Guard against null or undefined target
  if (!target || !target.tagName) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  // Ignore if typing in input, textarea, or contenteditable
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable
  ) {
    return true;
  }

  // Ignore if any modifier keys are pressed (except for shortcuts that explicitly require them)
  // This allows Ctrl+C, Ctrl+V, etc. to work normally
  const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
  if (hasModifier) {
    return true;
  }

  return false;
}

/**
 * React hook for registering keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'j',
 *     handler: () => selectNextEmail(),
 *     description: 'Næste email',
 *     category: 'navigation',
 *   },
 *   {
 *     key: 'k',
 *     handler: () => selectPreviousEmail(),
 *     description: 'Forrige email',
 *     category: 'navigation',
 *   },
 * ], enabled);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled = true
): void {
  // Use ref to avoid re-registering event listener on every render
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts if disabled
      if (!enabled) return;

      // Don't handle shortcuts when typing in inputs
      if (shouldIgnoreKeyboardEvent(event)) return;

      // Find matching shortcut
      const shortcut = shortcutsRef.current.find(s => {
        const keyMatches = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = !!s.ctrlKey === event.ctrlKey;
        const metaMatches = !!s.metaKey === event.metaKey;
        const shiftMatches = !!s.shiftKey === event.shiftKey;

        return keyMatches && ctrlMatches && metaMatches && shiftMatches;
      });

      if (shortcut) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.handler(event);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Predefined keyboard shortcuts for the Email tab
 */
export const EMAIL_KEYBOARD_SHORTCUTS = {
  navigation: [
    { key: "j", description: "Næste email", category: "navigation" as const },
    { key: "k", description: "Forrige email", category: "navigation" as const },
  ],
  action: [
    { key: "r", description: "Besvar email", category: "action" as const },
    { key: "f", description: "Videresend email", category: "action" as const },
    {
      key: "c",
      description: "Ny email (compose)",
      category: "action" as const,
    },
    {
      key: "e",
      description: "Arkivér valgt email",
      category: "action" as const,
    },
    {
      key: "Backspace",
      description: "Slet valgt email",
      category: "action" as const,
    },
    {
      key: "m",
      description: "Marker valgt som læst",
      category: "action" as const,
    },
    {
      key: "u",
      description: "Marker valgt som ulæst",
      category: "action" as const,
    },
  ],
  search: [
    { key: "/", description: "Fokus søgning", category: "search" as const },
  ],
  modal: [
    {
      key: "Escape",
      description: "Luk tråd eller modal",
      category: "modal" as const,
    },
  ],
  help: [
    {
      key: "?",
      description: "Vis keyboard genveje",
      category: "help" as const,
    },
  ],
} as const;

/**
 * Get all keyboard shortcuts as a flat array
 */
export function getAllKeyboardShortcuts(): Array<{
  key: string;
  description: string;
  category: "navigation" | "action" | "search" | "modal" | "help";
}> {
  return [
    ...EMAIL_KEYBOARD_SHORTCUTS.navigation,
    ...EMAIL_KEYBOARD_SHORTCUTS.action,
    ...EMAIL_KEYBOARD_SHORTCUTS.search,
    ...EMAIL_KEYBOARD_SHORTCUTS.modal,
    ...EMAIL_KEYBOARD_SHORTCUTS.help,
  ];
}
