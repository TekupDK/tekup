# Email UI – Plan

Context: EmailTab has visual and UX issues affecting usability.

## Identified Issues

### 1. Scroll Behavior 🐛 Critical

**Problem:** Virtual scrolling implementation has layout issues

- Absolute positioning conflicts with container height
- Section headers and email cards may overlap
- Scroll jumps or doesn't smooth scroll properly
- Parent ref height calculation incorrect

**Root Cause:**

```tsx
// Line ~700: Absolute positioning in virtualizer
style={{
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  transform: `translateY(${virtualRow.start}px)`,
}}
```

**Impact:** Users can't reliably browse email list; poor UX.

### 2. Navigation Bar Layout 🐛 High Priority

**Problem:** Top navigation bar with search, view toggle, and refresh button has spacing/alignment issues

- Elements may not align vertically
- Responsive behavior breaks on smaller screens
- Rate limit warning overlaps other elements
- Too much horizontal space taken

**Location:** Lines ~530-600 in EmailTab.tsx

**Impact:** Cluttered header; hard to use on laptop screens.

### 3. Dialog/Modal Compactness ⚠️ Medium Priority

**Problem:** Modals take up too much space or don't adapt to content

- EmailPreviewModal may be too wide
- CustomerProfile drawer too large
- EmailComposer modal not optimized
- Bulk action confirmation dialogs too verbose

**Impact:** User has to scroll unnecessarily; modals cover too much of the screen.

## Goals

- Fix virtual scroll to be smooth and reliable.
- Compact navigation bar to single row with proper spacing.
- Optimize modal sizes and responsive behavior.
- Maintain accessibility and mobile-first design.

## Out of scope (for this phase)

- Redesigning entire email list layout.
- Changing virtualizer library (keep @tanstack/react-virtual).
- Adding new features (focus on bug fixes only).

## Milestones

1. **Scroll Fix** (Critical) - Make email list reliably scrollable.
2. **Nav Bar Cleanup** (High) - One clean, compact row.
3. **Modal Polish** (Medium) - Optimize sizes and padding.

## Acceptance criteria

- [ ] Email list scrolls smoothly without jumps or overlaps.
- [ ] All emails are clickable and selectable.
- [ ] Section headers stay fixed at correct positions.
- [ ] Navigation bar fits in one row on 1920px screen.
- [ ] Rate limit warning doesn't overlap other elements.
- [ ] EmailPreviewModal is max 80vw width, adaptive height.
- [ ] CustomerProfile drawer is max 500px wide.
- [ ] EmailComposer uses compact padding (p-4 → p-3).

## Risks & mitigations

- Virtualizer changes may break performance → Test with 1000+ emails.
- Layout changes may affect mobile → Test responsive breakpoints.
- Modal size changes may hide content → Ensure scroll within modals.

## Steps (suggested)

### Phase 1: Scroll Fix (🔴 Critical)

- [ ] Debug virtualizer parent ref and height calculation.
- [ ] Fix absolute positioning to use relative container.
- [ ] Add proper gap/margin between section headers and emails.
- [ ] Test with empty list, 1 email, 100 emails, 1000+ emails.
- [ ] Verify no overlap between elements.

### Phase 2: Navigation Bar (🟡 High)

- [ ] Reduce padding in search bar (p-4 → p-2).
- [ ] Make view toggle buttons smaller (h-8 → h-7).
- [ ] Move rate limit warning to toast instead of inline.
- [ ] Stack elements on mobile (flex-col for <768px).
- [ ] Add max-width constraint to search input.

### Phase 3: Modal Optimization (🟢 Medium)

- [ ] Set EmailPreviewModal max-width: 80vw.
- [ ] Set CustomerProfile max-width: 500px.
- [ ] Reduce EmailComposer padding (p-6 → p-4).
- [ ] Add responsive max-height with internal scroll.
- [ ] Test modal stacking (preview → composer → profile).

### Phase 4: Testing & Validation

- [ ] Visual regression test with Playwright screenshots.
- [ ] Test on mobile (375px), tablet (768px), desktop (1920px).
- [ ] Verify accessibility (keyboard nav, screen reader).
- [ ] Load test with 1000+ emails.

## Technical Notes

### Virtualizer Best Practices

```tsx
// Correct pattern:
const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // Estimate row height
  overscan: 5, // Render extra items
});

// Parent must have:
// - overflow-auto (not overflow-hidden!)
// - Fixed height (h-full or flex-1)
// - Position relative (for absolute children)
```

### Modal Size Constraints

```tsx
// Good practice:
<Dialog>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Related Files

- `client/src/components/inbox/EmailTab.tsx` (main file)
- `client/src/components/inbox/EmailSidebar.tsx`
- `client/src/components/inbox/EmailPreviewModal.tsx`
- `client/src/components/inbox/EmailComposer.tsx`
- `client/src/components/CustomerProfile.tsx`

## Dependencies

- @tanstack/react-virtual (keep current version)
- shadcn/ui Dialog, Sheet components
- TailwindCSS responsive utilities
