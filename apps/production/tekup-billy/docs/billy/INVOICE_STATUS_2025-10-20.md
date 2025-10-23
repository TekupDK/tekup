# Faktura Status - 20. Oktober 2025

**Genereret:** 20-10-2025 kl. 20:00 CET  
**Kilde:** ChatGPT via Tekup-Billy MCP Server  
**Periode:** 1. januar 2025 → 20. oktober 2025

---

## 🎯 Executive Summary

| Metric | Værdi | Status |
|--------|-------|--------|
| **Total fakturaer** | 81 | ✅ |
| **Betalt** | 79 (97.5%) | ✅ Fremragende |
| **Afventer** | 2 (2.5%) | ⏳ Under kontrol |
| **Forsinket** | 0 (0%) | ✅ Perfekt |
| **Afventende beløb** | 3.315 DKK | ⏳ Lavt |

---

## 📋 Afventende Fakturaer (Detaljer)

### Faktura #1089

- **Beløb:** 1.570 DKK
- **Forfaldsdato:** 31. oktober 2025 (om 11 dage)
- **Status:** Afventer betaling (ikke forsinket)
- **Handling:** Vent til 25. oktober, send venlig påmindelse hvis ikke betalt

### Faktura #1088

- **Beløb:** 1.745 DKK  
- **Forfaldsdato:** 31. oktober 2025 (om 11 dage)
- **Status:** Afventer betaling (ikke forsinket)
- **Handling:** Vent til 25. oktober, send venlig påmindelse hvis ikke betalt

---

## 💼 Handlingsplan

### ✅ Umiddelbar handling (I DAG)

- **Ingen handling nødvendig** - Begge fakturaer har 11 dage til forfald

### ⏰ 25. Oktober 2025 (om 5 dage)

**HVIS ikke betalt:**
1. Tjek betalingsstatus via ChatGPT:

   ```
   @billy get_invoice invoiceId="<id for 1089>"
   @billy get_invoice invoiceId="<id for 1088>"
   ```

2. Send venlig påmindelse (6 dage før forfald):

   ```
   @billy send_invoice invoiceId="<id>" message="Venlig påmindelse: Betalingsfrist 31. oktober 2025"
   ```

### 📅 1. November 2025 (om 12 dage)

**HVIS stadig ikke betalt:**
1. Markér som forsinket i system
2. Send opfølgnings email med betalingslink
3. Overvej opkald til kunde

---

## 📊 Historisk Performance

**Betalingsrate:** 97.5% (79/81)  
**Gennemsnitlig betalingstid:** Data afventer (kræver dybere analyse)  
**Forsinkelsesrate:** 0% (fremragende!)

**Konklusion:** Dine kunder betaler ekstremt pålideligt! 🌟

---

## 🔍 Næste Skridt

### For ChatGPT

1. **Hent kunde info:**

   ```
   @billy get_customer contactId="<contactId fra faktura 1089>"
   @billy get_customer contactId="<contactId fra faktura 1088>"
   ```

2. **Generer CSV:**

   ```
   @billy Eksportér alle 81 fakturaer til CSV med felter: 
   id, invoiceNo, entryDate, dueDate, contactId, isPaid, balance
   Sortér med afventende først, derefter betalte efter dato (nyeste først)
   ```

3. **Automatisk opfølgning:**
   Opsæt reminder d. 25. oktober kl. 09:00 til at tjekke disse 2 fakturaer igen.

---

## 📈 Anbfalinger

### Kort Sigt (Denne måned)

- ✅ Vent på naturlig betaling af #1089 og #1088
- 📧 Send venlig påmindelse 6 dage før forfald (25. okt)
- 📊 Dokumentér betalingsmønster for disse kunder

### Mellem Sigt (Næste 3 måneder)

- 🤖 Automatiser betalingspåmindelser via ChatGPT
- 📈 Opret dashboard til real-time tracking
- 🎯 Analyser kunde segmenter (hurtige vs. langsomme betalere)

### Lang Sigt (2026)

- 💳 Overvej automatisk betalingsløsning (MobilePay, kort på fil)
- 📊 Predictive analytics til cash flow forecasting
- 🏆 Loyalty program til kunder der betaler til tiden

---

## 🎯 Success Metrics

**Nuværende status:**
- ✅ Betalingsrate: 97.5% (Target: 95%+) → **OVERPERFORMER**
- ✅ Forsinkelsesrate: 0% (Target: <5%) → **PERFEKT**
- ⏳ Gennemsnitlig betalingstid: TBD (Target: <30 dage)

**Fortsæt det gode arbejde!** 🚀

---

**Sidst opdateret:** 20-10-2025 kl. 20:00 CET  
**Næste review:** 25-10-2025 (betalingspåmindelse check)  
**Kilde:** Tekup-Billy MCP Server via ChatGPT integration
