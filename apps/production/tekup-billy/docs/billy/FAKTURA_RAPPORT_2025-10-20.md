# Faktura Status Rapport - 20. Oktober 2025

**Genereret:** 20-10-2025  
**Periode:** 1. januar 2025 → 20. oktober 2025  
**Kilde:** ChatGPT via Tekup-Billy MCP Server  

---

## 📊 Oversigt

**Total antal åbne fakturaer:** 81  
**Status:** `approved` (godkendt, ikke nødvendigvis sendt eller betalt)  
**Seneste fakturanumre:** 1095, 1094, 1093, 1092, 1089, 1088

---

## 🎯 Næste Skridt - Handlingsplan

### Option 1: CSV Eksport 📄

Få komplet liste af alle 81 fakturaer med:
- Faktura ID
- Fakturanummer  
- Dato
- Kunde ID (contactId)
- Beløb
- Betalingsstatus (`isPaid`)
- Resterende balance

**Brug:** Import i Excel/Google Sheets for manuel gennemgang

---

### Option 2: PDF Klargøring 📑

Gruppér fakturaer pr. kunde og forbered:
- PDF samling pr. kunde
- Email udsendelse via Billy's send-funktion
- Automatisk tracking af sendte fakturaer

**Brug:** Masseudsendelse til kunder

---

### Option 3: Betalingspåmindelser 💌

Identificér forsinket betalte fakturaer og:
- Generer venlig påmindelse skabelon
- Filtrer kun fakturaer hvor `dueDate < today`
- Send via Billy's email funktion

**Brug:** Opfølgning på udestående betalinger

---

### Option 4: Draft Review 📝

Gennemgå kladde-fakturaer (`state=draft`):
- Find fakturaer der ikke er godkendt endnu
- Marker til gennemgang
- Godkend relevante via `approve_invoice` tool

**Brug:** Rydde op i ufærdige fakturaer

---

## 🔍 Detaljeret Analyse

### Betalingsstatus Distribution

*Bliver tilgængelig efter deployment med `isPaid` felt*

Forventet opdeling:
- ✅ Betalt (`isPaid=true`)
- ⏳ Afventer betaling (`isPaid=false`, inden `dueDate`)
- ⚠️ Forsinket (`isPaid=false`, efter `dueDate`)

### Kunde Distribution

*Antal fakturaer pr. kunde*

Kan bruges til:
- Identificere største kunder
- Prioritere opfølgning
- Segmentere masseudsendelse

### Månedlig Fordeling

```
Maj 2025:    ? fakturaer
Juni 2025:   ? fakturaer  
Juli 2025:   ? fakturaer
August 2025: ? fakturaer
September:   ? fakturaer
Oktober:     ? fakturaer
```

---

## 💡 Anbefalinger

### Umiddelbar Handling (i dag)

1. ✅ **CSV eksport** - Få overblik
2. 🔍 **Identificer forsinkede** - Hvor `dueDate < 2025-10-20`
3. 📧 **Send påmindelser** - Til kunder med +30 dage forsinkelse

### Denne uge

1. 📑 **PDF klargøring** - Til kunder der mangler faktura
2. ✔️ **Draft cleanup** - Godkend eller slet kladder
3. 📊 **Rapport til regnskab** - Status på udestående

### Næste måned

1. 🤖 **Automatiser påmindelser** - Ugentlig kørsel
2. 📈 **Dashboard setup** - Real-time tracking
3. 🎯 **Optimér betalingsvilkår** - Baseret på data

---

## 🚀 Sådan Fortsætter Du

**Til ChatGPT:**

### For CSV Eksport

```
@billy Eksportér alle 81 fakturaer til CSV med felter: id, invoiceNo, entryDate, contactId, totalAmount, isPaid, balance, dueDate
```

### For Betalingspåmindelser

```
@billy Find alle fakturaer hvor dueDate < 2025-10-20 og isPaid = false. Gruppér efter kunde.
```

### For PDF Klargøring

```
@billy Gruppér de 81 fakturaer efter contactId og vis top 10 kunder med flest fakturaer
```

### For Draft Gennemgang

```
@billy list_invoices state="draft"
```

---

## 📋 CSV Format (når deployment er klar)

```csv
id,invoiceNo,entryDate,contactId,totalAmount,currency,isPaid,balance,dueDate
bgCOlr8xRCq2UePHpl9b6Q,1002,2025-05-28,KRVyT9maQLWqMrb6mWAsgg,1250.00,DKK,false,1250.00,2025-06-04
...
```

**Kolonner:**
- `id` - Billy invoice ID (til API kald)
- `invoiceNo` - Fakturanummer (til mennesker)
- `entryDate` - Fakturadato
- `contactId` - Kunde ID (brug med `get_customer` for detaljer)
- `totalAmount` - Total beløb inkl. moms
- `currency` - Valuta (typisk DKK)
- `isPaid` - Betalt? (true/false)
- `balance` - Resterende beløb
- `dueDate` - Betalingsfrist

---

**Status:** ⏳ Venter på deployment (2-3 min) for komplet data med `isPaid` og `balance`

**Næste handling:** Fortæl mig hvilken option (1-4) du vil have, eller bed ChatGPT køre en af kommandoerne ovenfor! 🎯
