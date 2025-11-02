# Leads Tab - Komplet Dokumentation og Analyse

## 📋 Oversigt

Leads Tab er en produktionsklar, optimeret komponent til håndtering af leads i tekup-ai-v2. Den implementerer deduplication, smart filtrering, pipeline-visning og type-safe kode.

---

## 🏗️ Arkitektur og Struktur

### **Komponent-hierarki:**

```
InboxPanel
  └── TabsContent (leads)
       └── LeadsTab
            ├── Filter Section (shrink-0)
            ├── Pipeline View / List View
            ├── LeadCard (multiple)
            ├── CustomerProfile Modal
            └── Create Lead Dialog
```

### **Data Flow:**

```
TRPC Query (inbox.leads.list)
    ↓
Raw Leads Data
    ↓
processedLeads (useMemo) - Deduplication & Count Calculation
    ↓
filteredLeads (useMemo) - Status/Source/Search Filtering + Sorting
    ↓
leadsByStatus (useMemo) - Grouping for Pipeline View
    ↓
UI Rendering (Pipeline/List)
```

---

## 🔑 Nøglefunktioner

### **1. Deduplication System**

#### **Type Definition:**

```typescript
type LeadWithDuplicateCount = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  score: number;
  status: string;
  source: string;
  createdAt: Date | null;
  duplicateCount: number; // ✅ Added field
};
```

#### **Helper Functions:**

**a) `normalizePhone(phone: string | null | undefined): string | null`**

- Fjerner alle whitespace
- Beholder kun cifre og `+`
- Eksempel: `"+45 12 34 56 78"` → `"+4512345678"`
- Konsistent normalisering for deduplication

**b) `getDeduplicationKey(lead): string | null`**

- Returnerer unik nøgle baseret på:
  1. **Email** (prioriteret): `email:test@example.com`
  2. **Telefon**: `phone:+4512345678`
  3. **Navn+Virksomhed**: `name:lars_andersen_abc_as`
- Returnerer `null` hvis ingen match

#### **Deduplication Logic (`processedLeads` memo):**

**Step 1: Build Key Map**

```typescript
const keyMap = new Map<string, number[]>();
// Maps each deduplication key to array of lead IDs
```

**Step 2: Calculate Duplicate Counts**

```typescript
const duplicateMap = new Map<number, number>();
// For each key with count > 1, mark all leads as duplicates
```

**Step 3: Add Count to All Leads**

```typescript
duplicateCount: duplicateMap.get(lead.id) || 1;
```

**Step 4: Deduplicate (if `showOnlyUnique === true`)**

- Beholder den bedste lead per key:
  - Højere score, ELLER
  - Senere `createdAt` dato
- Fjerner dublerede entries fra array

**Performance:** O(n) complexity - single pass gennem alle leads

---

### **2. Filtrering og Sortering**

#### **Filter Chain:**

1. **Status Filter**: `"all" | LeadStatus`
2. **Source Filter**: `"all" | specific source`
3. **Billy Import Toggle**: Skjul `billy_import` leads
4. **Search Query**: Søg i navn, email, telefon, virksomhed

#### **Sorting Options:**

- **Date** (newest first): `createdAt` timestamp
- **Score** (highest first): AI-calculated lead score (0-100)
- **Name** (alphabetical): Case-insensitive localeCompare

#### **Memoization:**

Alle filter/transform operations bruger `useMemo` for optimal performance:

- `processedLeads` - afhænger af: `[leads, showOnlyUnique]`
- `filteredLeads` - afhænger af: `[processedLeads, statusFilter, sourceFilter, hideBillyImport, searchQuery, sortBy]`
- `leadsByStatus` - afhænger af: `[filteredLeads]`

---

### **3. Pipeline View (Kanban-style)**

#### **Status Kolonner:**

```typescript
const STATUS_CONFIG = {
  new: { label: "Ny", color: "bg-blue-500", icon: <Clock /> },
  contacted: { label: "Kontaktet", color: "bg-yellow-500", icon: <Phone /> },
  qualified: { label: "Kvalificeret", color: "bg-purple-500", icon: <Users /> },
  proposal: { label: "Tilbud", color: "bg-orange-500", icon: <Mail /> },
  won: { label: "Vundet", color: "bg-green-500", icon: <CheckCircle2 /> },
  lost: { label: "Tabt", color: "bg-red-500", icon: <XCircle /> },
};
```

#### **Priority Highlighting:**

- **"Ny"** og **"Kontaktet"** kolonner får ring highlight:
  ```tsx
  ring-2 ring-primary/40 ring-offset-2 ring-offset-background
  ```

#### **Collapsible Sections:**

- **Default State:**
  - `new: true` ✅ (expanded)
  - `contacted: true` ✅ (expanded)
  - `qualified: false`
  - `proposal: false`
  - `won: false`
  - `lost: false`

#### **Layout Structure:**

```tsx
<div className="flex-1 overflow-hidden flex flex-col min-h-0">
  <div className="flex-1 overflow-x-auto pb-2 min-h-0">
    <div className="grid grid-cols-6 gap-3 min-w-fit h-full items-start">
      {/* Status columns */}
    </div>
  </div>
</div>
```

**Scrolling:**

- Horizontal scroll for at se alle 6 kolonner
- Vertical scroll indenfor hver kolonne (CollapsibleContent)
- `min-h-0` på flex children for korrekt scrolling i flexbox

---

### **4. List View**

Når `statusFilter !== "all"` vises List View i stedet for Pipeline:

- Vertikal liste med alle filtered leads
- Samme `LeadCard` komponent
- Full-width layout med spacing

---

### **5. LeadCard Komponent**

#### **Props Interface:**

```typescript
interface LeadCardProps {
  lead: LeadWithDuplicateCount;
  onViewProfile: () => void;
  onStatusChange: (status: LeadStatus) => void;
  onMoveNext: () => void;
  onMovePrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  isPriority?: boolean;
  duplicateCount: number;
}
```

#### **Visual Elements:**

**a) Badges:**

- **Status Badge**: Colored outline badge med status label
- **Duplicate Badge**: Red `destructive` badge vises hvis `duplicateCount > 1`
  - Format: `"3×"` (indikerer 3 leads med samme key)
- **Import Badge**: Secondary badge for `billy_import` leads
- **Score Badge**: ⭐ icon med score (highlight hvis `score >= 70`)

**b) Actions:**

- **Dropdown Menu** (hover):
  - "Se profil" → åbner `CustomerProfile` modal
  - "Send email" → `mailto:` link
  - "Ring op" → `tel:` link

**c) Quick Navigation:**

- **"Tilbage"** button (hvis `hasPrev`)
- **"Næste"** button (hvis `hasNext`)
- Automatisk status progression

---

### **6. Customer Profile Modal**

Åbnes når `selectedLeadId !== null`:

- Bruger `CustomerProfile` komponent
- Viser lead details, invoices, emails, calendar events
- TRPC query: `inbox.leads.getCalendarEvents`

---

### **7. Create Lead Dialog**

**Form Fields:**

- Navn (required)
- Email (optional)
- Telefon (optional)
- Kilde (dropdown)
- Firma (optional)

**Validation:**

- Navn skal være ikke-tom string
- Toast error hvis navn mangler
- Success toast + refetch ved oprettelse

**TRPC Mutation:** `inbox.leads.create`

---

## 🎨 UI/UX Features

### **Filter Section:**

1. **Search Input:**
   - Clear button (X) når der er tekst
   - Real-time søgning
   - Resultat counter: `"{count} resultat(er)"`

2. **Quick Filter Toggles:**
   - **"Kun unikke" / "Vis alle"**:
     - Badge viser: `{uniqueCount}/{totalLeads}`
     - Eksempel: `45/114` (45 unikke ud af 114 total)
   - **"Skjul Billy Import"**:
     - Checkmark når aktiv
     - Skjuler alle leads med `source === "billy_import"`

### **Empty State:**

- Vises når `hasNoLeads === true`
- Call-to-action buttons:
  - "Opret Lead"
  - "Opret via Chat"
- Tips section med info om automatisk oprettelse

### **Loading State:**

- Simpel "Indlæser leads..." tekst
- Vises under `isLoading === true`

---

## 🔧 Type Safety

### **Ingen `as any` Casts:**

- Alle leads har korrekt `LeadWithDuplicateCount` type
- Status casts: `lead.status as LeadStatus` (nødvendigt pga. database type)

### **Type Guards:**

- Null checks for `email`, `phone`, `name`, `company`
- Optional chaining hvor relevant
- Default values for missing data

---

## 📊 Performance Optimeringer

### **1. Memoization Strategy:**

- **`processedLeads`**: Recalculates kun når `leads` eller `showOnlyUnique` ændrer sig
- **`filteredLeads`**: Recalculates kun når filtre/sort ændrer sig
- **`leadsByStatus`**: Recalculates kun når `filteredLeads` ændrer sig
- **`uniqueCount`**: Recalculates kun når `leads` ændrer sig

### **2. Efficient Algorithms:**

- Single-pass duplicate detection
- Map-based key lookup (O(1) complexity)
- Minimal re-renders pga. proper memoization

### **3. Layout Optimizations:**

- `shrink-0` på fixed headers
- `min-h-0` på scrollable containers
- Proper flexbox nesting for korrekt scrolling

---

## 🐛 Fixes Implementeret

### **1. Type Safety:**

- ✅ Tilføjet `LeadWithDuplicateCount` type
- ✅ Fjernet alle `as any` casts
- ✅ Korrekt type propagation gennem hele komponenten

### **2. Deduplication:**

- ✅ Konsolideret til én `processedLeads` memo
- ✅ Helper functions for genbrugelig logik
- ✅ Korrekt duplicate count beregning
- ✅ Smart deduplication (beholder bedste lead)

### **3. Layout & Scrolling:**

- ✅ Root container: `overflow-hidden`
- ✅ Fixed sections: `shrink-0`
- ✅ Scrollable sections: `min-h-0`
- ✅ Pipeline view: Horizontal + vertical scrolling
- ✅ InboxPanel: Fjernet ScrollArea wrapper conflict

### **4. Phone Normalization:**

- ✅ `normalizePhone` helper function
- ✅ Konsistent format gennem hele app
- ✅ Korrekt deduplication baseret på normaliseret telefon

### **5. Visual Indicators:**

- ✅ Duplicate count badges (`3×`)
- ✅ Priority column highlights
- ✅ Score badges med threshold (70)
- ✅ Import badges for billy_import

### **6. Linter Warnings:**

- ✅ `flex-shrink-0` → `shrink-0` (Tailwind best practices)

---

## 📝 TRPC Endpoints Brugt

### **Queries:**

1. `trpc.inbox.leads.list.useQuery()` - Henter alle leads
2. `trpc.inbox.leads.getCalendarEvents.useQuery({ leadId })` - Henter relaterede events

### **Mutations:**

1. `trpc.inbox.leads.create.useMutation()` - Opretter nyt lead
2. `trpc.inbox.leads.updateStatus.useMutation()` - Opdaterer lead status

---

## 🧪 Test Scenarier

### **1. Deduplication Test:**

```
Input:
- Lead 1: email="test@example.com", phone="12345678"
- Lead 2: email="test@example.com", phone="87654321"
- Lead 3: phone="12345678", name="Test"

Expected:
- showOnlyUnique=true: Vis kun Lead 1 (bedste email match)
- duplicateCount: Lead 1=2, Lead 2=2, Lead 3=1
```

### **2. Filter Test:**

```
Input:
- 10 leads med status "new"
- 5 leads med status "contacted"
- 3 leads fra "billy_import"

Actions:
- Filter: status="contacted" → Viser 5 leads
- Toggle "Skjul Billy Import" → Skjuler 3 leads
- Search: "test" → Viser kun matchende leads
```

### **3. Layout Test:**

```
Test:
- Scroll pipeline horizontal → Alle 6 kolonner synlige
- Scroll pipeline vertical → Leads i hver kolonne scrollable
- Collapse/Expand section → Animering smooth
- Resize window → Layout responsivt
```

---

## 🚀 Fremtidige Forbedringer

### **Potentielle Features:**

1. **Drag & Drop**: Flyt leads mellem status kolonner
2. **Bulk Actions**: Multi-select leads og masse-opdatering
3. **Advanced Filters**: Date range, score range, custom filters
4. **Export**: CSV/Excel export af filtered leads
5. **Keyboard Shortcuts**: Naviger med keyboard
6. **Real-time Updates**: WebSocket for live lead updates
7. **Lead Scoring AI**: Automatisk score calculation baseret på behavior

### **Performance Improvements:**

1. **Virtual Scrolling**: For meget store lead lists (1000+)
2. **Pagination**: Lazy load leads i batches
3. **Debounced Search**: Reduce API calls ved søgning

---

## 📚 Code References

### **Hovedfiler:**

- `client/src/components/inbox/LeadsTab.tsx` (1046 lines)
- `client/src/components/InboxPanel.tsx` (LeadsTab integration)
- `server/routers.ts` (TRPC endpoints)
- `server/db.ts` (Database functions)

### **Key Functions:**

- `normalizePhone()` - Line 121-125
- `getDeduplicationKey()` - Line 128-147
- `processedLeads` memo - Line 205-274
- `filteredLeads` memo - Line 277-321
- `LeadCard` component - Line 889-1045

---

## ✅ Production Ready Checklist

- [x] Type safety (ingen `any` types)
- [x] Error handling (toast notifications)
- [x] Loading states
- [x] Empty states
- [x] Responsive layout
- [x] Performance optimized (memoization)
- [x] Linter warnings fixed
- [x] Scrolling working correctly
- [x] Deduplication tested
- [x] Filtering tested
- [x] Sorting tested
- [x] TRPC integration working
- [x] Container layout fixed

---

**Status:** ✅ **PRODUCTION READY**

**Last Updated:** 2025-11-02
**Version:** 1.0.0
**Author:** AI Assistant (Cursor)
