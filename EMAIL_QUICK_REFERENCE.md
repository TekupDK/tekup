# 🚀 Email Tab - Quick Reference Guide

## ⚡ Hurtig Test Kommando

```bash
node test-all-email-functions.mjs
```

**Forventet Output:** ✅ 34/34 tests passed

---

## 📋 Funktions Tjekliste

### Basis Funktioner

- [x] ✅ **Archive** - Email forsvinder fra Inbox
- [x] ✅ **Delete** - Email fjernes permanent
- [x] ✅ **Add Label** - Label vises på email
- [x] ✅ **Remove Label** - Email forsvinder fra label view
- [x] ✅ **Star** - Stjerne vises, email i Starred folder
- [x] ✅ **Unstar** - Stjerne væk, email forsvinder fra Starred
- [x] ✅ **Mark Read** - Bold skrift væk, unread count ned
- [x] ✅ **Mark Unread** - Bold skrift, unread count op

### Avancerede Funktioner

- [x] ✅ **Bulk Archive** - Flere emails arkiveres samtidig
- [x] ✅ **Bulk Delete** - Flere emails slettes samtidig
- [x] ✅ **Bulk Label** - Flere emails får samme label
- [x] ✅ **Combined Filters** - Inbox + Label + Starred osv.
- [x] ✅ **Search** - Søg i emails med Gmail syntax

### Folders

- [x] ✅ **Inbox** - Query: `in:inbox`
- [x] ✅ **Sent** - Query: `in:sent`
- [x] ✅ **Archive** - Query: `-in:inbox`
- [x] ✅ **Starred** - Query: `is:starred`

---

## 🔍 Gmail Query Syntax

| Query         | Beskrivelse          | Eksempel                         |
| ------------- | -------------------- | -------------------------------- |
| `in:inbox`    | Emails i Inbox       | `in:inbox`                       |
| `in:sent`     | Sendte emails        | `in:sent`                        |
| `-in:inbox`   | Arkiverede emails    | `-in:inbox`                      |
| `is:starred`  | Starred emails       | `is:starred`                     |
| `is:unread`   | Ulæste emails        | `in:inbox is:unread`             |
| `label:Leads` | Emails med label     | `label:Leads`                    |
| `from:email`  | Fra bestemt afsender | `from:customer@example.com`      |
| **Combined**  | Flere filters        | `in:inbox label:Leads is:unread` |

---

## 🎯 Cache Skip Logic

### Backend Check (server/routers.ts)

```typescript
const hasGmailQuery =
  input.query &&
  (input.query.includes("in:") || // ✅ Folders
    input.query.includes("label:") || // ✅ Labels
    input.query.includes("is:") || // ✅ Status
    input.query.includes("-in:")); // ✅ Negation

if (hasGmailQuery) {
  // Skip database → Gmail API direkte ✅
}
```

### Hvornår Skippes Database?

- ✅ **ALTID** for EmailTab (bruger altid Gmail queries)
- ✅ Inbox: `in:inbox`
- ✅ Sent: `in:sent`
- ✅ Archive: `-in:inbox`
- ✅ Starred: `is:starred`
- ✅ Labels: `label:*`
- ✅ Combined: `in:inbox label:Leads is:unread`

### Hvornår Bruges Database?

- ⚠️ Kun for queries **UDEN** Gmail filters
- ⚠️ EmailTab bruger ALDRIG database cache

---

## 🧪 Manuel Test Guide

### Test 1: Archive

1. Åbn Inbox
2. Klik på en email
3. Klik "Arkivér"
4. ✅ Email forsvinder fra Inbox
5. Gå til Archive folder
6. ✅ Email vises i Archive

### Test 2: Delete

1. Åbn Inbox
2. Klik på en email
3. Klik "Slet"
4. ✅ Email forsvinder fra Inbox
5. Tjek alle folders
6. ✅ Email væk overalt

### Test 3: Labels

1. Åbn Inbox
2. Klik på en email
3. Klik "Tilføj Label" → "Leads"
4. ✅ Label vises på email
5. Filter på "label:Leads"
6. ✅ Email vises i listen
7. Klik "Fjern Label" → "Leads"
8. ✅ Email forsvinder fra label view

### Test 4: Star

1. Åbn Inbox
2. Klik stjerne icon på email
3. ✅ Stjerne vises (fyldt)
4. Gå til Starred folder
5. ✅ Email vises i Starred
6. Klik stjerne igen (unstar)
7. ✅ Email forsvinder fra Starred

### Test 5: Read Status

1. Åbn Inbox med ulæst email
2. Email vises **bold** (ulæst)
3. Klik "Markér som læst"
4. ✅ Bold skrift væk
5. Klik "Markér som ulæst"
6. ✅ Bold skrift tilbage

### Test 6: Bulk Operations

1. Åbn Inbox
2. Select 3 emails (checkboxes)
3. Klik bulk action "Arkivér"
4. ✅ Alle 3 emails forsvinder
5. Gå til Archive
6. ✅ Alle 3 emails vises

---

## 📊 Troubleshooting

### Problem: Email forsvinder ikke efter Archive

**Check:**

```bash
# 1. Tjek Docker logs
docker logs friday-ai-container | grep "Skipping database cache"

# Forventet output:
# [Email List] Skipping database cache, using Gmail API directly
```

**Hvis ingen output:**

- ❌ Fix ikke deployed
- 🔧 Rebuild: `docker-compose build friday-ai && docker-compose up -d friday-ai`

### Problem: Slow refetch (~5+ sekunder)

**Check:**

- ⚠️ Gmail API rate limit?
- ⚠️ Netværksforbindelse langsom?
- ✅ Normal: ~800ms for Gmail API call

### Problem: Error toast efter mutation

**Check:**

```typescript
// Gmail API error?
onError: error => {
  console.error("Gmail API error:", error);
  // Tjek error.message for rate limit, auth, etc.
};
```

---

## 🔧 Nyttige Kommandoer

### Run Tests

```bash
node test-all-email-functions.mjs
```

### Rebuild Docker

```bash
docker-compose build friday-ai && docker-compose up -d friday-ai
```

### Check Docker Logs

```bash
docker logs friday-ai-container
```

### Check Gmail API Calls

```bash
docker logs friday-ai-container | grep "Gmail API"
```

### Check Database Skip

```bash
docker logs friday-ai-container | grep "Skipping database cache"
```

---

## 📁 Vigtige Filer

### Frontend

- `client/src/components/inbox/EmailTab.tsx` - Main email list + folders
- `client/src/components/inbox/EmailActions.tsx` - Archive, delete, labels, star, read
- `client/src/components/inbox/EmailThreadView.tsx` - Thread view

### Backend

- `server/routers.ts` - Email list endpoint (line 777-920)
- `server/routers.ts` - Archive endpoint (line 981-985)
- `server/routers.ts` - Delete endpoint (line 986-990)
- `server/routers.ts` - Label endpoints (line 1001-1015)
- `server/routers.ts` - Star/Read endpoints (line 1017-1040)
- `server/gmail-labels.ts` - Gmail API operations

### Tests & Docs

- `test-all-email-functions.mjs` - Komplet test suite (34 tests)
- `EMAIL_FUNCTIONS_DOCUMENTATION.md` - Detaljeret dokumentation
- `EMAIL_TAB_CACHE_ANALYSIS.md` - Cache bug analyse
- `EMAIL_ARCHIVE_FIX_ANALYSIS.md` - Root cause analysis

---

## ⌨️ Keyboard Shortcuts

**Gmail/Shortwave-style navigation - Works in list view only**

| Shortcut | Action         | Description                                          |
| -------- | -------------- | ---------------------------------------------------- |
| `j`      | Next email     | Navigate down with blue ring selection + auto-scroll |
| `k`      | Previous email | Navigate up with blue ring selection + auto-scroll   |
| `r`      | Reply          | Reply to keyboard-selected email                     |
| `f`      | Forward        | Forward keyboard-selected email                      |
| `c`      | Compose        | Open new email composer                              |
| `/`      | Focus search   | Jump to search field                                 |
| `Escape` | Close thread   | Return to email list from thread view                |
| `?`      | Show help      | Display keyboard shortcuts modal                     |

**Features:**

- ✅ Visual feedback - Blue ring on selected email
- ✅ Auto-scroll - Selected email scrolls into view
- ✅ Smart disable - Shortcuts ignored when typing in input fields
- ✅ Context-aware - Disabled when composer or help modal open
- ✅ Help modal - Press `?` or click keyboard button in toolbar
- ✅ Unit tested - 9/9 tests passing
- ✅ E2E tested - Comprehensive Playwright test suite

**Related Files:**

- `client/src/hooks/useKeyboardShortcuts.ts` - Reusable hook
- `client/src/components/inbox/EmailTab.tsx` - Integration
- `client/src/components/inbox/KeyboardShortcutsHelp.tsx` - Help modal
- `tests/email-keyboard-shortcuts.spec.ts` - E2E tests

---

## 🎯 Success Criteria

✅ **All Green:**

- Archive mutation → Email væk fra Inbox
- Delete mutation → Email væk fra alle folders
- Label mutation → Label vises/fjernes korrekt
- Star mutation → Stjerne vises/fjernes korrekt
- Read mutation → Status opdateres korrekt
- Bulk operations → Alle valgte emails opdateres
- All folders → Viser korrekte emails
- Combined filters → Avanceret søgning virker
- Test suite → 34/34 tests passed
- Keyboard shortcuts → All 8 shortcuts working with visual feedback

---

## 📞 Support Checklist

Hvis bug rapporteres:

1. ☑️ Kør test suite: `node test-all-email-functions.mjs`
2. ☑️ Tjek Docker logs: `docker logs friday-ai-container`
3. ☑️ Verificer query: Indeholder `in:`, `label:`, `is:`, eller `-in:`?
4. ☑️ Tjek database skip: Se logs for "Skipping database cache"
5. ☑️ Test manuel: Følg Manuel Test Guide ovenfor
6. ☑️ Tjek Gmail API: Rate limit? Auth error?

---

**Last Updated:** November 4, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
