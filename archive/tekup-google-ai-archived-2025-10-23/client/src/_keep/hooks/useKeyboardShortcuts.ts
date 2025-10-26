import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey
        )
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}

// Common keyboard shortcuts
export const globalShortcuts: KeyboardShortcut[] = [
  {
    key: 's',
    ctrlKey: true,
    action: () => {
      // Save action - will be overridden by specific components
      console.log('Save shortcut triggered')
    },
    description: 'Gem (Ctrl+S)'
  },
  {
    key: 'z',
    ctrlKey: true,
    action: () => {
      // Undo action - will be overridden by specific components
      console.log('Undo shortcut triggered')
    },
    description: 'Fortryd (Ctrl+Z)'
  },
  {
    key: 'y',
    ctrlKey: true,
    action: () => {
      // Redo action - will be overridden by specific components
      console.log('Redo shortcut triggered')
    },
    description: 'Gentag (Ctrl+Y)'
  },
  {
    key: 'n',
    ctrlKey: true,
    action: () => {
      // New action - will be overridden by specific components
      console.log('New shortcut triggered')
    },
    description: 'Ny (Ctrl+N)'
  },
  {
    key: 'o',
    ctrlKey: true,
    action: () => {
      // Open action - will be overridden by specific components
      console.log('Open shortcut triggered')
    },
    description: 'Åbn (Ctrl+O)'
  },
  {
    key: 'p',
    ctrlKey: true,
    action: () => {
      // Print action - will be overridden by specific components
      console.log('Print shortcut triggered')
    },
    description: 'Udskriv (Ctrl+P)'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: () => {
      // Find action - will be overridden by specific components
      console.log('Find shortcut triggered')
    },
    description: 'Find (Ctrl+F)'
  },
  {
    key: 'h',
    ctrlKey: true,
    action: () => {
      // Replace action - will be overridden by specific components
      console.log('Replace shortcut triggered')
    },
    description: 'Erstat (Ctrl+H)'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: () => {
      // Select all action - will be overridden by specific components
      console.log('Select all shortcut triggered')
    },
    description: 'Vælg alt (Ctrl+A)'
  },
  {
    key: 'c',
    ctrlKey: true,
    action: () => {
      // Copy action - will be overridden by specific components
      console.log('Copy shortcut triggered')
    },
    description: 'Kopier (Ctrl+C)'
  },
  {
    key: 'v',
    ctrlKey: true,
    action: () => {
      // Paste action - will be overridden by specific components
      console.log('Paste shortcut triggered')
    },
    description: 'Indsæt (Ctrl+V)'
  },
  {
    key: 'x',
    ctrlKey: true,
    action: () => {
      // Cut action - will be overridden by specific components
      console.log('Cut shortcut triggered')
    },
    description: 'Klip (Ctrl+X)'
  }
]