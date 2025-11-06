# EmailSidebar & EmailTab Logic Verifikation

## ✅ Mapper (Folders)

### 1. **Indbakke (inbox)**

- **UI**: Folder button med `Inbox` ikon
- **Query**: `in:inbox`
- **Status**: ✅ Korrekt implementeret
- **Test**: Klik på "Indbakke" → EmailTab buildQuery returnerer `"in:inbox"`

### 2. **Sendte (sent)**

- **UI**: Folder button med `Send` ikon
- **Query**: `in:sent`
- **Status**: ✅ Korrekt implementeret
- **Test**: Klik på "Sendte" → EmailTab buildQuery returnerer `"in:sent"`

### 3. **Arkiv (archive)**

- **UI**: Folder button med `Archive` ikon
- **Query**: `-in:inbox` (alle emails UDEN inbox label)
- **Status**: ✅ Korrekt implementeret
- **Test**: Klik på "Arkiv" → EmailTab buildQuery returnerer `"-in:inbox"`

### 4. **Stjernede (starred)**

- **UI**: Folder button med `Star` ikon
- **Query**: `is:starred`
- **Status**: ✅ Korrekt implementeret
- **Test**: Klik på "Stjernede" → EmailTab buildQuery returnerer `"is:starred"`

---

## ✅ Standard Labels

### Backend (`gmail-labels.ts`)

- **Endpoint**: `trpc.inbox.email.getLabels.useQuery()`
- **Filter**: `type === "user"` (kun bruger-oprettede labels)
- **Cache**: 5 minutter stale time, 10 minutter GC time
- **Status**: ✅ Korrekt implementeret

### Frontend Filter (EmailSidebar)

```typescript
const standardLabels =
  labels?.filter(label =>
    [
      "Leads",
      "Needs Reply",
      "Venter på svar",
      "I kalender",
      "Finance",
      "Afsluttet",
    ].includes(label.name)
  ) || [];
```

### Label Farver

1. **Leads** → Blå dot (bg-blue-500)
2. **Needs Reply / Venter på svar** → Rød dot (bg-red-500)
3. **I kalender** → Grøn dot (bg-green-500)
4. **Finance** → Gul dot (bg-yellow-500)
5. **Afsluttet** → Grå dot (bg-gray-500)

**Status**: ✅ Alle farver korrekt mappet

---

## ✅ Andre Labels

### Filter Logic

```typescript
const otherLabels =
  labels?.filter(
    label =>
      ![
        "Leads",
        "Needs Reply",
        "Venter på svar",
        "I kalender",
        "Finance",
        "Afsluttet",
        "INBOX", // ← System label (filtreret væk)
        "SENT", // ← System label (filtreret væk)
        "STARRED", // ← System label (filtreret væk)
        "ARCHIVE", // ← System label (filtreret væk)
      ].includes(label.name)
  ) || [];
```

- **Display limit**: Første 10 labels via `.slice(0, 10)`
- **Status**: ✅ System labels filtreret korrekt

---

## ✅ Query Building Logic (EmailTab)

### Kombinerede Queries

#### Eksempel 1: Inbox + Leads

```
Folder: inbox
Labels: ["Leads"]
→ Query: "in:inbox label:Leads"
```

#### Eksempel 2: Sent + Finance

```
Folder: sent
Labels: ["Finance"]
→ Query: "in:sent label:Finance"
```

#### Eksempel 3: Archive + Multiple Labels

```
Folder: archive
Labels: ["Afsluttet", "Finance"]
→ Query: "-in:inbox label:Afsluttet label:Finance"
```

#### Eksempel 4: Stjernede + Search Query

```
Folder: starred
Search: "faktura"
→ Query: "is:starred faktura"
```

#### Eksempel 5: Labels Only (ingen folder valgt)

```
Folder: inbox (default)
Labels: ["Needs Reply"]
→ Query: "in:inbox label:Needs Reply"
```

**Status**: ✅ Alle kombinationer håndteret korrekt

---

## ✅ UI State Management

### Selected State

1. **Folder highlight**: `bg-primary text-primary-foreground` når selected
2. **Label checkbox**: Checked når `selectedLabels.includes(label.name)`
3. **Label background**: `bg-accent` når checked, `hover:bg-accent/50` ellers

**Status**: ✅ Visual feedback korrekt

### State Sync

- EmailTab tracker både `selectedFolder` og `selectedLabels`
- EmailContext synces for AI tracking
- **Status**: ✅ Sync korrekt implementeret

---

## 🔍 Potentielle Issues (INGEN FUNDET)

### ❌ Issues

_Ingen kritiske issues fundet_

### ⚠️ Edge Cases (Håndteret)

1. ✅ Ingen labels returneret fra Gmail → Viser "Ingen labels fundet" message
2. ✅ Loading state → Viser 6 skeleton loaders
3. ✅ Labels cache → 5 min stale time, retry: false
4. ✅ System labels → Filtreret væk (INBOX, SENT, etc.)
5. ✅ Over 10 "andre labels" → .slice(0, 10) begrænser display

---

## 📝 Konklusion

**Status**: ✅ **ALT VIRKER KORREKT**

### Mapper (Folders)

✅ Alle 4 mapper (inbox, sent, archive, starred) med korrekte queries

### Labels

✅ Standard labels med farve-coding
✅ Andre labels med limit på 10
✅ System labels filtreret væk
✅ Checkbox state sync korrekt

### Query Building

✅ Kombinerede queries (folder + labels + search)
✅ Fallback til "in:inbox"
✅ Korrekt join med mellemrum

### UI/UX

✅ Visual feedback (highlight, checkboxes)
✅ Loading states (skeleton)
✅ Empty states (ingen labels)
✅ Scroll håndtering (én scrollbar)

---

## 🚀 Anbefalinger

### Ingen kritiske fixes nødvendige

Alt fungerer som forventet. Logikken er solid og håndterer alle edge cases.

### Eventuelle forbedringer (optional):

1. **Label counts**: Vis antal emails per label (kræver backend ændring)
2. **Label colors**: Lade brugeren vælge farve per label (advanced feature)
3. **Drag & drop**: Reorganiser labels (nice-to-have)
4. **Label search**: Filtrer labels hvis mange (kun hvis > 20 labels)

Men disse er **ikke nødvendige** for basic funktionalitet.
