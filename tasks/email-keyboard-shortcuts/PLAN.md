# Email Keyboard Shortcuts - Implementation Plan

## 🎯 Goal

Add Gmail/Shortwave-style keyboard shortcuts to the Email tab for power user productivity.

## 📋 Scope

### In Scope

- Navigation shortcuts (j/k for next/prev)
- Action shortcuts (r/f/c for reply/forward/compose)
- Search shortcut (/ to focus search)
- Modal shortcuts (Escape to close thread/modals)
- Help modal (? to show all shortcuts)
- Visual feedback (highlight selected email)
- Focus management (prevent shortcuts when typing)

### Out of Scope

- Global keyboard shortcuts across all tabs (future work)
- Customizable keybindings (use defaults for now)
- Vim-style advanced navigation (keep it simple)

## 🏗️ Architecture

### 1. useKeyboardShortcuts Hook (`client/src/hooks/useKeyboardShortcuts.ts`)

```typescript
interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
  description: string;
  category: "navigation" | "action" | "search" | "modal";
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig[],
  enabled = true
) {
  // Register global keyboard listeners
  // Ignore when typing in input/textarea
  // Handle shortcuts with preventDefault
}
```

### 2. EmailTab Integration

- Add `selectedEmailIndex` state for j/k navigation
- Highlight selected email with visual border/background
- Wire keyboard shortcuts to existing actions:
  - `j/k` → Navigate selection up/down
  - `r` → Open reply composer for selected email
  - `f` → Open forward composer for selected email
  - `c` → Open new compose modal
  - `/` → Focus search input
  - `Escape` → Close thread view or deselect

### 3. KeyboardShortcutsHelp Component

- Modal triggered by `?` key
- Shows all available shortcuts in categories
- Styled like Gmail's keyboard shortcut help

## 📦 Files to Create/Modify

### New Files

1. `client/src/hooks/useKeyboardShortcuts.ts` - Reusable keyboard hook
2. `client/src/components/inbox/KeyboardShortcutsHelp.tsx` - Help modal
3. `tests/email-keyboard-shortcuts.spec.ts` - E2E tests

### Modified Files

1. `client/src/components/inbox/EmailTab.tsx` - Add shortcuts integration
2. `client/src/components/inbox/EmailThreadView.tsx` - Handle Escape key
3. `README.md` - Document keyboard shortcuts

## ✅ Acceptance Criteria

- [ ] j/k navigation works with visual selection feedback
- [ ] r/f/c shortcuts trigger correct actions on selected email
- [ ] / focuses search input without typing "/"
- [ ] Escape closes thread view when open
- [ ] ? shows help modal with all shortcuts
- [ ] Shortcuts are ignored when typing in inputs
- [ ] Selected email scrolls into view when navigating
- [ ] E2E tests validate all keyboard interactions
- [ ] Documentation updated in README

## 🎨 UX Considerations

1. **Visual Selection**: Selected email gets subtle border/background
2. **Scroll Behavior**: Selected email auto-scrolls into viewport
3. **Focus Management**: Don't trigger shortcuts in input fields
4. **Feedback**: Toast notification when action succeeds (optional)
5. **Discoverability**: Help button (?) visible in toolbar

## 🧪 Testing Strategy

1. **Unit Tests** (Vitest):
   - Test useKeyboardShortcuts hook logic
   - Test key event filtering (ignore inputs)

2. **E2E Tests** (Playwright):
   - Navigate emails with j/k
   - Trigger reply/forward with r/f
   - Open compose with c
   - Focus search with /
   - Open help with ?

## 📅 Estimated Timeline

- Setup & Hook: 30 min
- EmailTab Integration: 45 min
- Help Modal: 30 min
- Testing: 45 min
- **Total: ~2.5 hours**

## 🔗 Related Tasks

- Email Tab Core (`tasks/email-tab/`)
- Testing Infrastructure (`tasks/testing/`)

## 🚀 Rollout Plan

1. Implement hook and basic navigation (j/k)
2. Add action shortcuts (r/f/c)
3. Add help modal (?)
4. Write E2E tests
5. Update documentation
6. Announce to users in changelog
