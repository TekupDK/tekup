# Invoices UI — Plan

Context: InvoicesTab (`client/src/components/inbox/InvoicesTab.tsx`) displays Billy.dk invoices with AI analysis. Current focus: improve dialogs, modals, and overall UX.

## Current State

- **Component:** `InvoicesTab.tsx` (~520 lines)
- **Key Features:**
  - Invoice list with search & filter (status: draft/approved/sent/paid/overdue)
  - AI analysis modal (Gemini-powered, with feedback thumbs up/down + CSV export)
  - Dialog for AI analysis results
  - Rate limiting & adaptive polling (via hooks)
- **Integrations:**
  - Billy API (via `trpc.inbox.invoices.list`)
  - AI analysis (`trpc.chat.analyzeInvoice`)
  - Feedback submission (`trpc.chat.submitAnalysisFeedback`)

## Identified Opportunities

### 1. Dialog/Modal UX Polish ⭐ High Priority

**Current State:**

- AI analysis dialog (`Dialog` from shadcn/ui) opens on "Analyze" click
- Shows loading state, then Markdown-rendered AI analysis
- Feedback section with thumbs up/down and optional comment input
- CSV export button

**Improvement Areas:**

- **Dialog Size:** Max-width is 2xl; could be responsive (smaller on mobile, larger on desktop)
- **Scroll Behavior:** `max-h-[85vh] overflow-y-auto` works, but could be smoother with virtualization or better layout
- **Close/Escape UX:** Ensure ESC key and overlay click reliably close dialog
- **Loading State:** Skeleton loader is basic; could be more polished with animated placeholders
- **Empty State:** "Click Analyze to get AI insights" is minimal—could add illustration/icon for better engagement

### 2. Invoice Card Compactness & Hover States 🎨 Medium Priority

**Current State:**

- Each invoice is a `Card` with hover effect (`hover:bg-accent/50`)
- Shows: icon, invoice number, customer, date, payment terms, status badge, "Analyze" button
- Line items count displayed at bottom

**Improvement Areas:**

- **Density:** Cards could be more compact (reduce padding/spacing) for laptops/tablets
- **Hover:** Add subtle scale/shadow animation on hover (not just bg color)
- **Quick Actions:** Add inline actions (e.g., copy invoice number, mark as paid) without opening dialog
- **Status Badges:** Enhance with icons (e.g., check for paid, clock for overdue)

### 3. Search & Filter Bar Layout 📐 Medium Priority

**Current State:**

- Search input with icon, status filter dropdown, clear button (if filters active)
- Horizontal layout with `flex gap-2`

**Improvement Areas:**

- **Mobile:** Stack vertically on small screens for better usability
- **Accessibility:** Ensure labels/aria-labels for screen readers
- **Keyboard Shortcuts:** Add shortcuts (e.g., Cmd+K to focus search)
- **Filter Chips:** Show active filters as dismissible chips below the bar

### 4. AI Analysis Dialog — Advanced Features 🚀 Low Priority (Future)

**Ideas for Phase 2:**

- **Streaming Response:** Show AI analysis as it streams (not just final result)
- **Action Buttons:** Add "Send Reminder" or "Mark as Paid" based on AI insights
- **Comparison:** Compare multiple invoices side-by-side
- **History:** Show past analyses for the same invoice

### 5. Error & Empty States 🛡️ Medium Priority

**Current State:**

- Empty state: "No invoices found" with icon and text
- Error handling: Rate limit via `useRateLimit` hook

**Improvement Areas:**

- **Error Messages:** More descriptive errors (e.g., "Billy API unavailable, retrying...")
- **Retry UX:** Show retry button or countdown when rate-limited
- **Empty Illustrations:** Add friendly illustrations for empty/error states

## Goals

- **Primary:** Polish AI analysis dialog (size, scroll, loading, close UX)
- **Secondary:** Improve invoice card density and hover effects
- **Tertiary:** Enhance search/filter bar (mobile layout, keyboard shortcuts, filter chips)

## Out of Scope (For This Task)

- Backend changes (Billy API integration, AI model tuning)
- New features (e.g., bulk invoice actions, PDF preview)
- Email/Calendar/Leads tabs improvements (separate tasks)

## Success Criteria

- [ ] AI analysis dialog is responsive (mobile/tablet/desktop)
- [ ] Dialog scroll is smooth; ESC/overlay close works reliably
- [ ] Loading state has polished skeleton/animation
- [ ] Invoice cards are more compact (reduced padding)
- [ ] Hover states include subtle scale/shadow animation
- [ ] Search/filter bar stacks vertically on mobile
- [ ] Active filters shown as dismissible chips
- [ ] Empty/error states have friendly illustrations

## Technical Notes

### Component & UI

- **Location:** `client/src/components/inbox/InvoicesTab.tsx` (~520 lines)
- **UI Library:** shadcn/ui (`Dialog`, `Card`, `Badge`, `Input`, `Select`, `Button`)
- **Styling:** Tailwind CSS
- **State:** React hooks (`useState`, `useMemo`, `useEffect`)
- **Markdown:** `SafeStreamdown` component for AI analysis rendering

### Data Flow & Integration

#### Billy.dk API Integration

- **Backend:** `server/billy.ts` — direct Billy API client
- **MCP Server:** Billy-mcp By Tekup (TekupDK/tekup-billy)
  - Base URL: `https://tekup-billy-production.up.railway.app`
  - API Version: 2.0.0
  - Auth: X-API-Key header
- **Endpoints:**
  - `getInvoices()` — fetch all invoices with pagination
  - `getInvoice(id)` — fetch single invoice by ID
  - `createInvoice(...)` — create draft invoice
  - `updateInvoiceState(...)` — approve/send invoice

#### tRPC Layer (Frontend ↔ Backend)

- **List Invoices:** `trpc.inbox.invoices.list.useQuery()`
  - Strategy: Database-first (query PostgreSQL cache, fallback to Billy API)
  - Background caching: `cacheInvoicesToDatabase()` syncs Billy → DB
  - Returns: Array of `BillyInvoice` objects
- **AI Analysis:** `trpc.chat.analyzeInvoice.useMutation()`
  - Input: Invoice summary (number, customer, status, date, terms, lines)
  - Uses: Gemini 2.5 Flash for analysis
  - Output: Markdown-formatted analysis (payment status, completeness, anomalies, recommendations)
- **Feedback:** `trpc.chat.submitAnalysisFeedback.useMutation()`
  - Stores: User feedback (thumbs up/down, optional comment) in analytics events
  - Tracks: `invoiceId`, `rating`, `analysis`, `comment`

#### Database Schema (PostgreSQL/Supabase)

- **Table:** `customer_invoices` (in `friday_ai` schema)
- **Columns:**
  - `id` (serial, PK)
  - `userId` (int, FK → users)
  - `customerId` (int, nullable, FK → customer_profiles)
  - `billyInvoiceId` (varchar(100), unique per user)
  - `invoiceNumber` (varchar(50))
  - `amount` (numeric(10,2))
  - `currency` (varchar(3), default 'DKK')
  - `status` (enum: draft/approved/sent/paid/overdue/voided)
  - `dueDate`, `paidAt`, `createdAt`, `updatedAt` (timestamps)
- **Caching Logic:**
  - `server/invoice-cache.ts` — background job caches Billy invoices to DB
  - Automatic customer profile creation/update from invoice data
  - Reduces Billy API calls (rate limit protection)

#### Rate Limiting & Polling

- Every invoice change updates `synced_at` timestamp

#### Rate Limiting & Polling

- **Hook:** `useRateLimit()` — detects 429 errors, shows user-friendly message
- **Hook:** `useAdaptivePolling()` — adjusts refetch interval based on activity
- **Strategy:** Query database first → if empty or stale, fetch from Billy API

#### Analytics & Tracking

- **Polling:** `useAdaptivePolling()` — adjusts interval based on user activity

#### Analytics & Tracking

- **Events:** Stored via `trackEvent()` in `analytics_events` table
- **Metrics:** Feedback ratings, AI analysis requests, CSV exports
- **Usage:** Monitor AI quality, user satisfaction, feature adoption

### Supabase Schema Alignment ?? Blocker

**Current State**

- Supabase table `friday_ai.customer_invoices` is missing fields the app reads/writes: `invoiceNo`, `paidAmount`, `entryDate`, `paidDate`.
- Drizzle schema currently describes those columns, so inserts silently drop data and downstream calculations (`updateCustomerBalance`) return `NaN`.

**Next Steps**

- Add migration to introduce the missing columns (amount fields in øre as `integer`, timestamps for dates) and rename `invoiceNumber` → `invoiceNo` if necessary.
- Update `drizzle/schema.ts`, `schema.backup.ts`, and snapshots; run `drizzle-kit push`.
- Trigger Billy resync or write backfill to repopulate the new columns. Verify UI renders invoice numbers and balances again.

### Security & Performance

- **Auth:** Protected routes via `protectedProcedure` (tRPC middleware)
- **Caching:** Database-first reduces API load and latency
- **Optimistic UI:** Mutations show loading states, error boundaries handle failures
- **No PII in logs:** Sensitive data (email, phone) masked in console/analytics

## Rollout Plan

1. **Phase 1:** Dialog UX polish (size, scroll, loading, close)
2. **Phase 2:** Invoice card improvements (density, hover, quick actions)
3. **Phase 3:** Search/filter bar enhancements (mobile, chips, keyboard shortcuts)
4. **Phase 4:** Error/empty state polish (illustrations, retry UX)

Each phase can be done incrementally without breaking existing functionality.
