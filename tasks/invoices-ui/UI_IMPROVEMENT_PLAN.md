# InvoicesTab - Komplet UI Forbedringsplan

**Dato:** 2025-11-05
**Status:** 🔴 Nuværende UI er ikke optimal
**Mål:** Gøre InvoicesTab lige så god som LeadsTab

---

## 🔍 NUVÆRENDE PROBLEMER

### ❌ **Layout Issues**
1. **Card-baseret layout tager for meget plads**
   - Kan kun se 3-4 fakturaer på skærmen ad gangen
   - Meget whitespace mellem cards
   - Svært at sammenligne fakturaer

2. **Ingen virtual scrolling**
   - Ved 100+ fakturaer bliver det langsomt
   - Alle cards renderes på én gang
   - Performance issues ved scrolling

3. **Ikke responsive nok**
   - Cards ser dårlige ud på mobile
   - For meget info pakket i lille plads

### ❌ **Manglende Funktionalitet**

#### **1. Ingen Statistics Overview**
```
┌─────────────────────────────────────────────────────┐
│ Total Fakturaer: 127                                │
│ Ubetalte: 23 (145.500 DKK)                         │
│ Forfaldne: 5 (67.200 DKK) ⚠️                        │
│ Betalt denne måned: 89.300 DKK ✅                    │
└─────────────────────────────────────────────────────┘
```
**Impact:** Mangler overblik over økonomi

---

#### **2. Begrænset Filtering**
**Nuværende:**
- ✅ Search (navn, ID, kunde)
- ✅ Status filter (dropdown)

**Mangler:**
- ❌ Beløb filter (min/max)
- ❌ Dato range filter (forfaldsdato, oprettelsesdato)
- ❌ Quick filters ("Forfaldne", "Denne uge", "Denne måned")
- ❌ Kunde filter
- ❌ Saved filter sets

**Sammenligning med LeadsTab:**
LeadsTab har:
- Status filter ✅
- Source filter ✅
- Sort options ✅
- "Kun unikke" toggle ✅
- "Skjul Billy Import" ✅

---

#### **3. Ingen Sorting**
**Kan ikke sortere efter:**
- ❌ Beløb (højeste først)
- ❌ Forfaldsdato (oldest first)
- ❌ Oprettelsesdato
- ❌ Kunde navn (alfabetisk)
- ❌ Status

**LeadsTab har:** Sort by dato/score/navn ✅

---

#### **4. Manglende Bulk Actions**
**Kan ikke:**
- ❌ Vælge flere fakturaer med checkbox
- ❌ Bulk export til CSV (eksporter 10 fakturaer på én gang)
- ❌ Bulk analyze med AI
- ❌ Bulk mark as paid
- ❌ Bulk send påmindelse

**LeadsTab:** Ingen bulk actions endnu (men nemmere at tilføje med table layout)

---

#### **5. Ingen Quick Actions**
**Nuværende:** Hover for at se "Open in Billy" og "Download CSV"

**Mangler:**
- ❌ "Mark as paid" button
- ❌ "Send påmindelse" button
- ❌ "Create reminder" button
- ❌ "View customer profile" link
- ❌ Copy invoice number
- ❌ Copy payment link

**LeadsTab har:** Dropdown menu med "Se profil", "Send email", "Ring op" ✅

---

#### **6. Ingen Invoice Preview**
**Problem:** Skal klikke "Analyze" for at se detaljer

**Forslag:**
- ❌ Quick preview modal (vis invoice lines, beløb breakdown)
- ❌ Thumbnail af PDF (hvis Billy API supporterer det)
- ❌ Invoice timeline (created → sent → paid)

---

#### **7. Manglende Payment Status Details**
**Nuværende:** Viser kun "Betalt", "Afsendt", etc.

**Mangler:**
- ❌ Payment date (hvis betalt)
- ❌ Payment method
- ❌ Partial payments (hvis delvist betalt)
- ❌ Days overdue (hvis forfalden)
- ❌ Payment reminder history

---

#### **8. Ingen Create Invoice**
**Problem:** Kan ikke oprette faktura fra UI

**LeadsTab har:** "Tilføj Lead" button med dialog ✅

**Forslag:**
- ❌ "Opret Faktura" button
- ❌ Quick-create dialog med basic info
- ❌ Integration med Billy API's `createInvoice`

---

#### **9. Ingen Analytics/Insights**
**Mangler:**
- ❌ Gennemsnitlig betalingstid
- ❌ Top 5 kunder (efter beløb)
- ❌ Revenue trend graph
- ❌ Overdue rate (%)
- ❌ Cash flow prediction

---

#### **10. AI Analysis Issues**
**Nuværende problemer:**
- ⚠️ Skal klikke "Analyser" manuelt for hver faktura
- ⚠️ AI analysis gemmes ikke (skal re-analyze)
- ⚠️ Ingen batch analyze

**Forslag:**
- ✅ Auto-analyze forfaldne fakturaer
- ✅ Cache AI results i database
- ✅ Bulk analyze med progressbar
- ✅ Show AI insights inline (uden at åbne dialog)

---

## 🎯 FORBEDRINGS PLAN

### **Phase A: Layout Overhaul (2-3 timer)**

#### **A1: Skift til Table Layout** (som LeadsTab)
**Før (Cards):**
```tsx
<Card className="p-2.5">
  <div>Invoice #12345</div>
  <div>Customer: ABC A/S</div>
  <div>Status: Betalt</div>
</Card>
```

**Efter (Table):**
```tsx
<div className="grid grid-cols-12 gap-3 px-5 py-4">
  <div className="col-span-2">Invoice #12345</div>
  <div className="col-span-3">ABC A/S</div>
  <div className="col-span-2">15.000 DKK</div>
  <div className="col-span-2">Betalt ✅</div>
  <div className="col-span-1">05. nov</div>
  <div className="col-span-2">Actions...</div>
</div>
```

**Fordele:**
- ✅ Se 10-15 fakturaer på skærmen (vs 3-4)
- ✅ Nemmere at sammenligne
- ✅ Mere kompakt

**Estimat:** 1-2 timer

---

#### **A2: Add Virtual Scrolling**
**Library:** `@tanstack/react-virtual` (allerede brugt i LeadsTab)

**Implementation:**
```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: filteredInvoices.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // Row height
  overscan: 5,
});

// Only render visible items
{virtualizer.getVirtualItems().map(virtualRow => {
  const invoice = filteredInvoices[virtualRow.index];
  return <InvoiceRow key={invoice.id} invoice={invoice} />;
})}
```

**Performance improvement:**
- 100 invoices: Render 15 items instead of 100 (85% reduction)
- Smooth scrolling ved 500+ fakturaer

**Estimat:** 1 time

---

#### **A3: Memoize Invoice Rows**
```tsx
const InvoiceRow = memo(function InvoiceRow({
  invoice,
  onAnalyze,
  onStatusChange
}: InvoiceRowProps) {
  // ... row content
});
```

**Fordele:**
- ✅ Undgå re-renders når andre rows opdateres
- ✅ Performance boost ved filtering/sorting

**Estimat:** 30 min

---

### **Phase B: Statistics & Overview (1-2 timer)**

#### **B1: Statistics Cards**
```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">Total Fakturaer</p>
    <p className="text-3xl font-bold">127</p>
  </Card>
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">Ubetalte</p>
    <p className="text-3xl font-bold text-yellow-600">23</p>
    <p className="text-sm">145.500 DKK</p>
  </Card>
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">Forfaldne ⚠️</p>
    <p className="text-3xl font-bold text-red-600">5</p>
    <p className="text-sm">67.200 DKK</p>
  </Card>
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">Betalt denne måned</p>
    <p className="text-3xl font-bold text-green-600">89.300 DKK</p>
  </Card>
</div>
```

**Calculation:**
```tsx
const stats = useMemo(() => {
  if (!invoices) return null;

  const total = invoices.length;
  const unpaid = invoices.filter(i => i.state !== 'paid').length;
  const overdue = invoices.filter(i => i.state === 'overdue').length;

  const unpaidAmount = invoices
    .filter(i => i.state !== 'paid')
    .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const overdueAmount = invoices
    .filter(i => i.state === 'overdue')
    .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const thisMonthPaid = invoices
    .filter(i => {
      if (!i.paidAt) return false;
      const paidDate = new Date(i.paidAt);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() &&
             paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + (i.paidAmount || 0), 0);

  return { total, unpaid, overdue, unpaidAmount, overdueAmount, thisMonthPaid };
}, [invoices]);
```

**Estimat:** 1 time

---

#### **B2: Quick Filters**
```tsx
<div className="flex gap-2 mb-4">
  <Button
    variant={quickFilter === 'overdue' ? 'default' : 'outline'}
    onClick={() => setQuickFilter('overdue')}
  >
    🔥 Forfaldne ({stats.overdue})
  </Button>
  <Button
    variant={quickFilter === 'this-week' ? 'default' : 'outline'}
    onClick={() => setQuickFilter('this-week')}
  >
    📅 Denne uge
  </Button>
  <Button
    variant={quickFilter === 'this-month' ? 'default' : 'outline'}
    onClick={() => setQuickFilter('this-month')}
  >
    📆 Denne måned
  </Button>
  <Button
    variant={quickFilter === 'unpaid' ? 'default' : 'outline'}
    onClick={() => setQuickFilter('unpaid')}
  >
    ⏳ Ubetalte ({stats.unpaid})
  </Button>
</div>
```

**Estimat:** 1 time

---

### **Phase C: Advanced Filtering & Sorting (1-2 timer)**

#### **C1: Sort Options**
```tsx
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger>
    <ArrowUpDown className="w-4 h-4 mr-2" />
    Sortér efter
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="date-desc">Nyeste først</SelectItem>
    <SelectItem value="date-asc">Ældste først</SelectItem>
    <SelectItem value="amount-desc">Højeste beløb</SelectItem>
    <SelectItem value="amount-asc">Laveste beløb</SelectItem>
    <SelectItem value="due-date-asc">Forfaldsdato (snarest)</SelectItem>
    <SelectItem value="customer-asc">Kunde (A-Z)</SelectItem>
    <SelectItem value="status">Status</SelectItem>
  </SelectContent>
</Select>
```

**Implementation:**
```tsx
const sortedInvoices = useMemo(() => {
  const sorted = [...filteredInvoices];

  switch (sortBy) {
    case 'amount-desc':
      return sorted.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    case 'due-date-asc':
      return sorted.sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      });
    // ... other cases
    default:
      return sorted;
  }
}, [filteredInvoices, sortBy]);
```

**Estimat:** 1 time

---

#### **C2: Amount Range Filter**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <DollarSign className="w-4 h-4 mr-2" />
      Beløb
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-4">
      <Label>Min beløb (DKK)</Label>
      <Input
        type="number"
        value={minAmount}
        onChange={e => setMinAmount(Number(e.target.value))}
      />
      <Label>Max beløb (DKK)</Label>
      <Input
        type="number"
        value={maxAmount}
        onChange={e => setMaxAmount(Number(e.target.value))}
      />
    </div>
  </PopoverContent>
</Popover>
```

**Estimat:** 30 min

---

#### **C3: Date Range Filter**
```tsx
import { DatePickerWithRange } from "@/components/ui/date-picker";

<DatePickerWithRange
  from={dateRange.from}
  to={dateRange.to}
  onSelect={(range) => setDateRange(range)}
/>
```

**Estimat:** 30 min

---

### **Phase D: Bulk Actions (1-2 timer)**

#### **D1: Selection Checkboxes**
```tsx
const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

// Checkbox i hver row
<Checkbox
  checked={selectedInvoices.has(invoice.id)}
  onCheckedChange={(checked) => {
    const newSet = new Set(selectedInvoices);
    if (checked) newSet.add(invoice.id);
    else newSet.delete(invoice.id);
    setSelectedInvoices(newSet);
  }}
/>

// Select all checkbox i header
<Checkbox
  checked={selectedInvoices.size === filteredInvoices.length}
  onCheckedChange={(checked) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredInvoices.map(i => i.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  }}
/>
```

**Estimat:** 1 time

---

#### **D2: Bulk Action Bar**
```tsx
{selectedInvoices.size > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-4 rounded-lg shadow-2xl z-50">
    <div className="flex items-center gap-4">
      <p className="font-semibold">{selectedInvoices.size} valgt</p>

      <Button
        variant="secondary"
        onClick={handleBulkExportCSV}
      >
        <Download className="w-4 h-4 mr-2" />
        Eksportér CSV
      </Button>

      <Button
        variant="secondary"
        onClick={handleBulkAnalyze}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Analysér alle
      </Button>

      <Button
        variant="secondary"
        onClick={handleBulkMarkPaid}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Markér betalt
      </Button>

      <Button
        variant="ghost"
        onClick={() => setSelectedInvoices(new Set())}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  </div>
)}
```

**Estimat:** 1 time

---

### **Phase E: Inline Actions Dropdown (1 time)**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreVertical className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleAnalyze(invoice)}>
      <Sparkles className="w-4 h-4 mr-2" />
      Analysér med AI
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => window.open(`https://app.billy.dk/invoices/${invoice.id}`)}>
      <ExternalLink className="w-4 h-4 mr-2" />
      Åbn i Billy.dk
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleExportCSV(invoice)}>
      <Download className="w-4 h-4 mr-2" />
      Download CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleMarkPaid(invoice)}>
      <CheckCircle2 className="w-4 h-4 mr-2" />
      Markér som betalt
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>
      <Mail className="w-4 h-4 mr-2" />
      Send påmindelse
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleViewCustomer(invoice.contactId)}>
      <User className="w-4 h-4 mr-2" />
      Se kundeprofil
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => handleCopyInvoiceNumber(invoice)}>
      <Copy className="w-4 h-4 mr-2" />
      Kopiér fakturanummer
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Estimat:** 1 time

---

### **Phase F: Invoice Preview Modal (1-2 timer)**

```tsx
<Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Faktura #{previewInvoice?.invoiceNo}</DialogTitle>
      <DialogDescription>
        {previewInvoice?.contactId} • {previewInvoice?.state}
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6">
      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Kunde</Label>
          <p className="font-medium">{previewInvoice?.contactId}</p>
        </div>
        <div>
          <Label>Status</Label>
          <Badge>{previewInvoice?.state}</Badge>
        </div>
        <div>
          <Label>Oprettelsesdato</Label>
          <p>{formatDate(previewInvoice?.entryDate)}</p>
        </div>
        <div>
          <Label>Forfaldsdato</Label>
          <p>{formatDate(previewInvoice?.dueDate)}</p>
        </div>
      </div>

      {/* Invoice Lines */}
      <div>
        <Label>Linjer</Label>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beskrivelse</TableHead>
              <TableHead>Antal</TableHead>
              <TableHead>Enhedspris</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewInvoice?.lines?.map(line => (
              <TableRow key={line.id}>
                <TableCell>{line.description}</TableCell>
                <TableCell>{line.quantity}</TableCell>
                <TableCell>{formatCurrency(line.unitPrice)}</TableCell>
                <TableCell>{formatCurrency(line.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Total */}
      <div className="flex justify-end">
        <div className="space-y-2">
          <div className="flex justify-between gap-8">
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(previewInvoice?.totalAmount)}</span>
          </div>
          <div className="flex justify-between gap-8 text-lg font-bold">
            <span>Total:</span>
            <span>{formatCurrency(previewInvoice?.totalAmount)} DKK</span>
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

**Estimat:** 2 timer

---

### **Phase G: Create Invoice Feature (2-3 timer)**

```tsx
<Button onClick={() => setIsCreateDialogOpen(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Opret Faktura
</Button>

<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Opret ny faktura</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleCreateInvoice}>
      <div className="space-y-4">
        <div>
          <Label>Kunde</Label>
          <Select value={newInvoice.contactId} onValueChange={...}>
            {/* List of customers from Billy */}
          </Select>
        </div>
        <div>
          <Label>Betalingsbetingelser (dage)</Label>
          <Input
            type="number"
            value={newInvoice.paymentTermsDays}
            onChange={...}
          />
        </div>
        {/* Add invoice lines */}
        <div>
          <Label>Linjer</Label>
          {newInvoice.lines.map((line, idx) => (
            <div key={idx} className="flex gap-2">
              <Input placeholder="Beskrivelse" />
              <Input type="number" placeholder="Antal" />
              <Input type="number" placeholder="Pris" />
              <Button type="button" onClick={() => removeLine(idx)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addLine}>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj linje
          </Button>
        </div>
      </div>
      <Button type="submit">Opret</Button>
    </form>
  </DialogContent>
</Dialog>
```

**Backend integration:**
```tsx
const createInvoiceMutation = trpc.inbox.invoices.create.useMutation({
  onSuccess: () => {
    refetch();
    toast.success("Faktura oprettet");
    setIsCreateDialogOpen(false);
  },
});
```

**Estimat:** 3 timer (inkl. backend endpoint)

---

## 📊 PRIORITERET ROADMAP

### **Sprint 1: Core Improvements (1 uge)**
**Mest kritiske forbedringer først:**

1. ✅ **Phase A1-A3: Layout overhaul** (2-3 timer)
   - Table layout
   - Virtual scrolling
   - Memoization

2. ✅ **Phase B1: Statistics cards** (1 time)
   - Total, ubetalte, forfaldne, betalt

3. ✅ **Phase C1: Sort options** (1 time)
   - Sort by beløb, dato, kunde

4. ✅ **Phase E: Inline actions** (1 time)
   - Dropdown menu med actions

**Total:** 5-6 timer

---

### **Sprint 2: Advanced Features (1 uge)**

5. ✅ **Phase B2: Quick filters** (1 time)
   - Forfaldne, denne uge, ubetalte

6. ✅ **Phase D1-D2: Bulk actions** (2 timer)
   - Selection checkboxes
   - Bulk action bar

7. ✅ **Phase C2-C3: Advanced filters** (1 time)
   - Amount range
   - Date range

**Total:** 4 timer

---

### **Sprint 3: Power User Features (1 uge)**

8. ✅ **Phase F: Invoice preview** (2 timer)
   - Preview modal med invoice lines

9. ✅ **Phase G: Create invoice** (3 timer)
   - Create invoice dialog
   - Backend integration

**Total:** 5 timer

---

## 🎯 TOTAL ESTIMAT

**Alle forbedringer:** 14-15 timer (spredt over 3 uger)

**Hvis vi prioriterer:**
- **MVP (Sprint 1):** 5-6 timer → Se 3x flere fakturaer, bedre performance
- **Full feature set:** 14-15 timer → På niveau med bedste invoice management tools

---

## 🚀 NÆSTE SKRIDT

Hvad vil du have først?

1. **Start Sprint 1** (layout + statistics + sort) → 5-6 timer
2. **Kun layout overhaul** (table + virtual scrolling) → 2-3 timer
3. **Kun statistics cards** (quick win) → 1 time
4. **Se mockup/wireframe** før vi starter?

Lad mig vide hvad du prioriterer! 🎨
