# Invoices UI — Status & Checklist

Dato: 4. november 2025
Owner: Product/Engineering
Status: [~] Ready to start (plan complete)

## Milestones

### Phase 0: Critical Fixes (🔴 NEW - High Priority)

- [ ] P0.1. Fix memory leak in CSV export (URL.revokeObjectURL missing)
- [ ] P0.2. Add TypeScript interfaces (remove all `any` types)
- [ ] P0.3. Fix race condition in AI analysis (multiple fast clicks)
- [ ] P0.4. Add error handling to CSV export buttons
- [ ] P0.5. Implement search debouncing (300ms delay)

### Phase 1: Dialog UX Polish (✅ Complete)

- [x] P1.1. Make AI analysis dialog responsive (mobile/tablet/desktop sizes)
- [x] P1.2. Improve scroll behavior (smooth, no layout jumps)
- [x] P1.3. Verify ESC key and overlay click reliably close dialog
- [x] P1.4. Polish loading state (animated skeleton placeholders)
- [x] P1.5. Enhance empty state ("Click Analyze") with illustration/icon

### Phase 2: Invoice Card Improvements (✅ Complete)

- [x] P2.1. Reduce card padding/spacing for laptop/tablet density
- [x] P2.2. Add subtle scale + shadow animation on hover
- [x] P2.3. Add inline quick actions (open in Billy, download CSV)
- [x] P2.4. Enhance status badges with icons (check for paid, clock for overdue)

### Phase 2.5: Code Quality Improvements (⏳ Pending)

- [ ] P2.5.1. Refactor analysis state to useReducer (6 states → 1 reducer)
- [ ] P2.5.2. Add keyboard navigation to invoice cards (Tab, Enter, Space)
- [ ] P2.5.3. Add ARIA labels to all icon buttons
- [ ] P2.5.4. Extract magic numbers to INVOICE_CONFIG constants
- [ ] P2.5.5. Add focus indicators for accessibility

### Phase 3: Search & Filter Bar Enhancements (⏳ Pending)

- [ ] P3.1. Stack search/filter controls vertically on mobile (responsive layout)
- [ ] P3.2. Add aria-labels and keyboard accessibility
- [ ] P3.3. Implement keyboard shortcut (Cmd+K / Ctrl+K) to focus search
- [ ] P3.4. Show active filters as dismissible chips below the bar

### Phase 4: Error & Empty State Polish (⏳ Pending)

- [ ] P4.1. Add friendly illustrations for empty state ("No invoices found")
- [ ] P4.2. Improve error messages (e.g., "Billy API unavailable, retrying...")
- [ ] P4.3. Add retry button or countdown when rate-limited
- [ ] P4.4. Test error states (network failure, API timeout, rate limit)

## Acceptance Criteria

- [ ] AI analysis dialog adapts size for mobile/tablet/desktop
- [ ] Dialog scroll is smooth; ESC/overlay close works reliably
- [ ] Loading state uses polished animated skeletons
- [ ] Invoice cards have reduced padding and smooth hover animations
- [ ] Search/filter bar is fully responsive (mobile-first)
- [ ] Active filters shown as dismissible chips
- [ ] Empty/error states have friendly illustrations and clear CTAs
- [ ] Keyboard shortcuts functional (Cmd+K to focus search)

## Open Issues / Blockers

### 🔴 CRITICAL
- [ ] **Memory Leak:** CSV export doesn't revoke blob URLs (causes memory buildup)
- [ ] **Type Safety:** All invoice objects use `any` type (no compile-time checks)
- [ ] **Race Condition:** Fast clicking "Analyze" on different invoices shows wrong results

### 🟠 HIGH
- [ ] **Database Schema:** Supabase `customer_invoices` table lacks `invoiceNo`, `paidAmount`, `entryDate`, `paidDate` columns — causes `NaN` balances and missing invoice numbers

### 🟡 MEDIUM
- [ ] **Performance:** Search input has no debouncing (100+ invoices = slow typing)
- [ ] **Accessibility:** No keyboard navigation or ARIA labels (WCAG non-compliant)
- [ ] **State Management:** 6 separate states for analysis modal (should use useReducer)

## Dependencies

- None (all changes are UI/UX only, no backend work)

## Risks & Mitigations

- **Dialog size changes break existing layout:** Test on multiple screen sizes before committing
- **Hover animations impact performance:** Use CSS transforms (GPU-accelerated), avoid layout thrashing
- **Keyboard shortcuts conflict with browser:** Use standard patterns (Cmd+K is common for search)

## Notes

- Component: `client/src/components/inbox/InvoicesTab.tsx`
- UI library: shadcn/ui (Dialog, Card, Badge, Input, Select, Button)
- Styling: Tailwind CSS
- No backend/API changes required for this task
- Can be done incrementally (phase-by-phase) without breaking prod

## Next Actions

1. Start with Phase 1 (Dialog UX Polish) — smallest scope, highest impact
2. Test on mobile/tablet/desktop before moving to Phase 2
3. Get feedback from users after each phase
