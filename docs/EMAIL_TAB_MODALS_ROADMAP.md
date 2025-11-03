# Email Tab - Modals & Dialogs Roadmap

**Dato:** 2. november 2025
**Status:** Analysering og Planlægning

---

## 📋 Eksisterende Modals/Dialogs

### ✅ Implementeret:

1. **EmailComposer** ✅
   - **Type:** Dialog (Radix UI)
   - **Funktionalitet:** Compose, Reply, Forward
   - **File:** `client/src/components/inbox/EmailComposer.tsx`
   - **Status:** Fungerer korrekt

2. **CustomerProfile** ✅
   - **Type:** Modal/Dialog
   - **Funktionalitet:** Vis kundeprofil fra email
   - **File:** `client/src/components/CustomerProfile.tsx`
   - **Status:** Fungerer korrekt

---

## 🎯 Manglende Modals/Dialogs (Foreslået)

### Priority 1: Kritisk (Høj Værdi)

#### 1. **Email Quick Preview Modal** 🔴

**Hvad:** Hurtig preview af email uden at åbne fuld thread view
**Hvorfor:** Bedre UX - hurtigere scanning af emails
**Features:**

- Preview af email i modal
- Quick actions (Reply, Forward, Archive)
- "Åbn fuld view" knap
- Close med ESC eller klik udenfor

#### 2. **Confirmation Dialogs** 🔴

**Hvorfor:** Bekræftelse før destruktive actions
**Use Cases:**

- Delete email confirmation
- Archive confirmation (hvis bulk)
- Send email confirmation (hvis attachments mangler)

#### 3. **Snooze Email Modal** 🟡

**Hvorfor:** Google Inbox-style snooze funktionalitet
**Features:**

- Vælg dato/tidspunkt for snooze
- Vælg snooze duration (1 time, 3 timer, i morgen, næste uge)
- Custom dato/tid vælger

### Priority 2: Vigtigt (Nice-to-Have)

#### 4. **Bulk Actions Modal** 🟡

**Hvorfor:** Håndter flere emails på én gang
**Features:**

- Vælg emails (checkboxes)
- Bulk actions: Archive, Delete, Label, Mark as Read/Unread
- Progress indicator for bulk operations

#### 5. **Label Management Modal** 🟡

**Hvorfor:** Tilføj/fjern labels fra emails
**Features:**

- Vise alle labels
- Checkboxes for at vælge labels
- Apply/Remove labels
- Opret nyt label

#### 6. **Email Templates Modal** 🟢

**Hvorfor:** Opret og administrer email templates
**Features:**

- Liste af templates
- Opret/Redigér/Slet template
- Preview template
- Variabler system ({{customerName}}, etc.)

### Priority 3: Advanced (Fremtidigt)

#### 7. **Email Settings Modal** 🟢

**Hvorfor:** Konfigurer email indstillinger
**Features:**

- Auto-refresh interval
- Notification preferences
- Signature settings
- Default folder/label

#### 8. **Search Filters Modal** 🟢

**Hvorfor:** Avanceret søgning med filtre
**Features:**

- Dato range picker
- Afsender filter
- Label filter dropdown
- Attachment filter
- Save search query

---

## 🎨 Design Principper

### Modal Sizes:

- **Small:** `sm:max-w-md` (Confirmation dialogs)
- **Medium:** `sm:max-w-lg` (Snooze, Label Management)
- **Large:** `sm:max-w-2xl` (Email Preview, Bulk Actions)
- **XLarge:** `sm:max-w-4xl` (Email Composer, Templates)

### Modal Patterns:

1. **Confirmation Dialogs:** Kort og præcis, primær action fremhævet
2. **Form Modals:** Scrollable content, action buttons fixed i footer
3. **Preview Modals:** Header + scrollable content + fixed actions
4. **List Modals:** Header + scrollable list + fixed actions

### Teknologi:

- **Radix UI Dialog** (allerede i brug)
- **Consistent styling** med eksisterende EmailComposer
- **Accessibility:** Keyboard navigation, focus trap, ARIA labels

---

## 📝 Implementation Plan

### Phase 1: Quick Wins (1-2 timer)

1. ✅ Confirmation Dialogs (Delete, Archive)
2. ✅ Email Quick Preview Modal

### Phase 2: Core Features (2-4 timer)

3. ✅ Snooze Email Modal
4. ✅ Label Management Modal

### Phase 3: Advanced (4-6 timer)

5. ✅ Bulk Actions Modal
6. ✅ Email Templates Modal

### Phase 4: Polish (2-4 timer)

7. ✅ Email Settings Modal
8. ✅ Search Filters Modal

---

## ✅ Implementerede Modals (2. november 2025)

### 1. EmailConfirmationDialog ✅

**File:** `client/src/components/inbox/EmailConfirmationDialog.tsx`
**Features:**

- Generisk confirmation dialog
- Destructive variant for delete actions
- Loading states
- Customizable title, description, labels

**Brug:**

- Delete email confirmation
- Archive email confirmation
- Eventuelt andre destructive actions

### 2. EmailPreviewModal ✅

**File:** `client/src/components/inbox/EmailPreviewModal.tsx`
**Features:**

- Quick preview af email content
- Viser latest message i thread
- Quick actions: Reply, Forward, Archive, Delete
- "Åbn fuld view" knap til thread view
- Viser antal beskeder hvis multiple messages

**Brug:**

- Double-click på email card i liste
- Quick scanning uden at åbne fuld thread view

### 3. Integration ✅

**Files:**

- `EmailTab.tsx` - Integreret EmailPreviewModal
- `EmailActions.tsx` - Integreret EmailConfirmationDialog

**Features:**

- Double-click på email åbner preview modal
- Delete og Archive actions kræver nu confirmation
- Preview modal kan åbne fuld thread view

---

## 📝 Implementation Status

### Completed ✅

- [x] EmailConfirmationDialog
- [x] EmailPreviewModal
- [x] Integration i EmailTab
- [x] Integration i EmailActions

### Pending ⏳

- [ ] Snooze Email Modal
- [ ] Bulk Actions Modal
- [ ] Label Management Modal
- [ ] Email Templates Modal
- [ ] Email Settings Modal
- [ ] Search Filters Modal

---

## 🎯 Næste Steps

**Priority 2 Modals:**

1. Snooze Email Modal (Google Inbox-style)
2. Bulk Actions Modal (for bulk operations)
3. Label Management Modal (for label administration)
