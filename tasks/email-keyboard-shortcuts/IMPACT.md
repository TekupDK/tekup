# Email Keyboard Shortcuts - Impact Analysis

## 📁 File-by-File Impact

### 🆕 New Files

#### 1. `client/src/hooks/useKeyboardShortcuts.ts`

**Purpose**: Reusable React hook for registering and managing keyboard shortcuts

**Lines**: ~150 lines

**Key Functions**:

```typescript
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig[],
  enabled = true
): void;

export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean;

export const KEYBOARD_SHORTCUTS = {
  navigation: [
    { key: "j", description: "Næste email" },
    { key: "k", description: "Forrige email" },
  ],
  action: [
    { key: "r", description: "Besvar email" },
    { key: "f", description: "Videresend email" },
    { key: "c", description: "Ny email" },
  ],
  // ...
};
```

**Dependencies**:

- React (useEffect, useCallback)
- No external libraries needed

**Impact**: None (new file)

---

#### 2. `client/src/components/inbox/KeyboardShortcutsHelp.tsx`

**Purpose**: Modal component showing all available keyboard shortcuts (triggered by `?`)

**Lines**: ~200 lines

**UI Components**:

- Modal overlay with keyboard shortcut table
- Categorized shortcuts (Navigation, Actions, Search, Modal)
- Styled like Gmail's keyboard help
- Close button + Escape key handling

**Dependencies**:

- React
- Tailwind CSS for styling
- lucide-react for icons (optional)

**Impact**: None (new file)

---

#### 3. `tests/email-keyboard-shortcuts.spec.ts`

**Purpose**: Playwright E2E tests for all keyboard shortcuts

**Lines**: ~250 lines

**Test Cases**:

- Navigation with j/k keys
- Reply/Forward/Compose with r/f/c
- Search focus with /
- Thread close with Escape
- Help modal with ?
- Ignore shortcuts when typing in inputs

**Dependencies**:

- Playwright
- Existing test utilities (login, route interception)

**Impact**: None (new file)

---

### ✏️ Modified Files

#### 4. `client/src/components/inbox/EmailTab.tsx`

**Current Lines**: 998

**Expected Changes**: +80 lines

**Impact Level**: 🟡 Medium

**Changes**:

1. **Add State** (lines 50-55):

```typescript
const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(0);
const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
```

2. **Add useKeyboardShortcuts Hook** (lines 100-150):

```typescript
useKeyboardShortcuts(
  [
    {
      key: "j",
      handler: () =>
        setSelectedEmailIndex(prev => Math.min(prev + 1, emails.length - 1)),
      description: "Næste email",
      category: "navigation",
    },
    {
      key: "k",
      handler: () => setSelectedEmailIndex(prev => Math.max(prev - 1, 0)),
      description: "Forrige email",
      category: "navigation",
    },
    // ... r/f/c/? shortcuts
  ],
  !isComposing
); // Disable shortcuts when composing
```

3. **Add Visual Selection** (line ~600, in email list map):

```typescript
<div
  key={thread.id}
  className={cn(
    "email-item",
    selectedEmailIndex === index && "ring-2 ring-blue-500"
  )}
  ref={selectedEmailIndex === index ? selectedEmailRef : undefined}
>
```

4. **Add Scroll Into View** (lines 160-170):

```typescript
useEffect(() => {
  selectedEmailRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}, [selectedEmailIndex]);
```

5. **Add Help Modal** (line ~980, before closing div):

```typescript
{showShortcutsHelp && (
  <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />
)}
```

**Risks**:

- Low - Additive changes only
- No breaking changes to existing functionality
- Keyboard shortcuts are opt-in (user must press keys)

---

#### 5. `client/src/components/inbox/EmailThreadView.tsx`

**Current Lines**: 255

**Expected Changes**: +15 lines

**Impact Level**: 🟢 Low

**Changes**:

1. **Add Escape Handler** (lines 40-50):

```typescript
useKeyboardShortcuts([
  {
    key: "Escape",
    handler: onClose,
    description: "Luk tråd",
    category: "modal",
  },
]);
```

**Risks**:

- None - Simple escape key handler

---

#### 6. `README.md`

**Current Lines**: 488

**Expected Changes**: +30 lines

**Impact Level**: 🟢 Low

**Changes**:

Add keyboard shortcuts section after Email Tab features:

```markdown
#### ⌨️ Keyboard Shortcuts

| Key    | Action           |
| ------ | ---------------- |
| j      | Næste email      |
| k      | Forrige email    |
| r      | Besvar email     |
| f      | Videresend email |
| c      | Ny email         |
| /      | Fokus søgning    |
| Escape | Luk tråd         |
| ?      | Vis genveje      |
```

**Risks**: None (documentation only)

---

## 🔗 Dependencies

### Internal Dependencies

- `EmailTab.tsx` - Main integration point
- `EmailThreadView.tsx` - Escape key handling
- tRPC email actions - Existing reply/forward/archive actions
- Search input ref - Existing search functionality

### External Dependencies

None - uses only React built-ins and existing utilities

---

## 🧪 Testing Impact

### Unit Tests

- New: `useKeyboardShortcuts.test.ts` (~100 lines)
- Tests hook logic, event filtering, cleanup

### E2E Tests

- New: `email-keyboard-shortcuts.spec.ts` (~250 lines)
- Tests all keyboard interactions in browser

### Existing Tests

- No impact - keyboard shortcuts are additive
- Existing EmailTab tests should still pass

---

## 📊 Bundle Size Impact

**Estimated**: +5-7 KB (minified + gzipped)

- `useKeyboardShortcuts.ts`: ~3 KB
- `KeyboardShortcutsHelp.tsx`: ~4 KB
- Total impact: Negligible (<0.5% of bundle)

---

## ♿ Accessibility Impact

**Positive Impact**:

- Keyboard-only navigation improves accessibility
- Follows WCAG 2.1 guidelines for keyboard interaction
- Help modal (?) aids discoverability

**Considerations**:

- Screen reader announcements for selected email (aria-live)
- Focus management when navigating with j/k
- Visual selection indicator must have sufficient contrast

---

## 🚀 Performance Impact

**Minimal**:

- Single global keyboard listener (not per-email)
- Event listener cleanup on unmount
- No re-renders unless state changes (selectedEmailIndex)

---

## 🔄 Migration Strategy

**No migration needed** - This is a purely additive feature.

Users will discover keyboard shortcuts organically or via the `?` help modal.

---

## 📝 Rollback Plan

If issues arise:

1. Remove `useKeyboardShortcuts` import from EmailTab
2. Remove visual selection state
3. Delete new files (no breaking changes)

---

## ✅ Pre-Implementation Checklist

- [x] Task structure created (PLAN, STATUS, CHANGELOG, IMPACT)
- [x] Files to create/modify identified
- [x] Dependencies mapped
- [x] Testing strategy defined
- [ ] Hook implementation ready
- [ ] EmailTab integration ready
- [ ] Help modal ready
- [ ] E2E tests ready
- [ ] Documentation updated

---

## 🎯 Success Criteria

- [ ] All 8 keyboard shortcuts working (j, k, r, f, c, /, Escape, ?)
- [ ] Visual selection indicator visible
- [ ] Selected email scrolls into view
- [ ] Shortcuts ignored when typing in inputs
- [ ] Help modal accessible with ?
- [ ] E2E test coverage 100%
- [ ] No performance regression
- [ ] Documentation updated
