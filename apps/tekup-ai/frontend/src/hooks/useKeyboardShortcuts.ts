import { isBrowser } from '@/lib/utils';
import { useEffect } from 'react';

export interface KeyboardShortcut {
  keys: string;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

const normalize = (keys: string) =>
  keys
    .toLowerCase()
    .split('+')
    .map((key) => key.trim())
    .filter(Boolean);

const matchShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut) => {
  const keys = normalize(shortcut.keys);
  let matchCount = 0;

  for (const key of keys) {
    switch (key) {
      case 'ctrl':
      case 'control':
        if (
          event.ctrlKey ||
          (event.metaKey && navigator.platform.includes('Mac'))
        ) {
          matchCount += 1;
        }
        break;
      case 'meta':
        if (event.metaKey) {
          matchCount += 1;
        }
        break;
      case 'shift':
        if (event.shiftKey) {
          matchCount += 1;
        }
        break;
      case 'alt':
      case 'option':
        if (event.altKey) {
          matchCount += 1;
        }
        break;
      default:
        if (event.key.toLowerCase() === key) {
          matchCount += 1;
        }
        break;
    }
  }

  return matchCount === keys.length;
};

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  deps: unknown[] = []
) {
  useEffect(() => {
    if (!isBrowser() || shortcuts.length === 0) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        if (matchShortcut(event, shortcut)) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.handler(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, ...deps]);
}
