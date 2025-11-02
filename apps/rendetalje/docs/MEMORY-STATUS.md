# 🧠 Memory Status - Friday AI

**Dato:** Opdateret november 2025  
**Status:** 7/24 memories implementeret i intelligence layer  
**Note:** Alle 24 memories dokumenteret i SYSTEM_PROMPT for prompt training

---

## ✅ **IMPLEMENTEREDE MEMORIES** (3/24)

### **✅ MEMORY_4: Lead Source Rules**

**Status:** ✅ **FULLY IMPLEMENTED**

- **Fil:** `services/tekup-ai/packages/inbox-orchestrator/src/leadParser.ts` (linje 97-114)
- **Funktion:** `applyLeadSourceRules()`
- **Regel:**
  - Rengøring.nu → CREATE_NEW_EMAIL (ikke reply på leadmail)
  - AdHelp → DIRECT_TO_CUSTOMER (send til kunde)
  - Leadpoint → REPLY_DIRECT (kan svares direkte)
- **Output:** Hints i chatbot output

---

### **✅ MEMORY_23: Price Calculation**

**Status:** ✅ **FULLY IMPLEMENTED**

- **Fil:** `services/tekup-ai/packages/inbox-orchestrator/src/leadParser.ts` (linje 116-147)
- **Funktion:** `calculatePrice()`
- **Regel:**
  - 349 kr/t inkl. moms
  - Baseret på m²: <100m²=2t, 100-150m²=3t, 150-200m²=4t, >200m²=ceil(m²/50)
  - 2 personer for >150 m²
- **Output:** "698-1047 kr (1 pers, 2-3t)"

---

### **✅ MEMORY_5: Calendar Check Before Suggesting**

**Status:** ✅ **FULLY IMPLEMENTED**

- **Fil:** `services/tekup-ai/packages/inbox-orchestrator/src/index.ts` (linje 216-243, 310-336)
- **Regel:**
  - Checker kalender næste 7 dage før booking-forslag
  - Viser optagne tidsperioder
  - Foreslår kun ledige tider
- **Output:** "TILGÆNGELIGE TIDER (NÆSTE 7 DAGE)" med optagne slots

---

## ❌ **MANGENDE MEMORIES** (21/24)

### **❌ MEMORY_1: Time Check Regel** ⏰

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:** Før NOGET med datoer/tider → ALTID tjek current time FØRST
- **Action Needed:** Implementer time validation før alle dato-operationer

---

### **❌ MEMORY_2: Lead-System** 📋

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:**
  - Labels: Leads → Rengøring.nu/Århus → Needs Reply → Venter på svar → I kalender → Finance → Afsluttet
  - Opgavetyper: Fast, Flytterengøring, Engangsopgaver
  - Billy.dk til fakturering
- **Action Needed:** Implementer label-management og workflow

---

### **❌ MEMORY_3: Kundeservice Tilgang** 💬

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:**
  1. Forklar konkret hvad der indgår
  2. Erkend fejl direkte
  3. Hold fast på realistiske estimater
  4. Tilbyd alternativer og løsninger
  5. Ærlig, direkte kommunikation
- **Action Needed:** Integrer i reply generation logic

---

### **❌ MEMORY_6: Kalender-Systematisering** 🗂️

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:**
  1. MAIL + FAKTURAER → KALENDER (aldrig omvendt!)
  2. Søg mails for hver kunde først
  3. Analyser fakturaer for historik/#nummerering
  4. Krydsrefer mail-aftaler med kalenderdata
  5. Format: 🏠 TYPE #X - [Navn], komplet historik
  6. Prioriter: Manglende events → Format → Synk
- **Action Needed:** Implementer kalender-synkroniserings-logik

---

### **❌ MEMORY_7: Email Process - Søgning Først** 🔍

**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

- **Regel:**
  - Før emails til kunder (særligt leads)
  - ALTID søg eksisterende kommunikation FØRST (search_email)
  - Undgå dobbelt-tilbud og pinlige gentagelser
  - Kun hvis INGEN tidligere emails → skriv nyt tilbud
- **Current:** Email search virker, men ikke automatisk check før reply
- **Action Needed:** Integrer i `/generate-reply` endpoint

---

### **❌ MEMORY_8: Overtid Kommunikation** ⚠️

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:**
  - Ring til BESTILLER (ikke partner) ved +1t overskridelse, IKKE +3-5t!
  - Cecilie case: "aldrig informeret om 2 personer" = inkasso
  - KRITISK: Oplys antal medarbejdere i ALLE tilbud
  - Format: "2 personer, 3 timer = 6 arbejdstimer = 2.094kr"
- **Action Needed:** Implementer i quote generation og validation

---

### **❌ MEMORY_9: Conflict Resolution** 🤝

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:**
  - SUCCESFULDE: Ken (fejl→rabat→tilfreds), Jørgen (erkend→ret pris)
  - MISLYKKEDE: Cecilie (fastholdt pris→inkasso), Amalie (ingen fleksibilitet)
  - REGEL: Erkend fejl HURTIGT
  - Tilbyd konkret kompensation
  - Find ALTID mindelighed før inkasso
- **Action Needed:** Implementer conflict detection og resolution logic

---

### **❌ MEMORY_10: Lead Management & Opfølgning** 📊

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:**
  - KONVERSION: Rengøring.nu (lav), Rengøring Aarhus (bedre), AdHelp (tidlig)
  - OPFØLGNING: 7-10 dage efter tilbud
  - Format: Nye tider + status spørgsmål
  - Afslut efter 2-3 opfølgninger
  - LOST REASONS: Eva (høj pris), Christina (valgte andet)
- **Action Needed:** Implementer opfølgnings-system

---

### **❌ MEMORY_11: Optimeret Tilbudsformat** 📝

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:** Tilbud SKAL indeholde:
  - 📏 Bolig: [X]m² med [Y] rum
  - 👥 Medarbejdere: [Z] personer
  - ⏱️ Estimeret tid: [A] timer på stedet = [B] arbejdstimer total
  - 💰 Pris: 349kr/time/person = ca.[C-D]kr inkl. moms
  - 📅 Ledige tider: [konkrete datoer fra kalender]
  - 💡 Du betaler kun faktisk tidsforbrug
  - 📞 Vi ringer ved +1t overskridelse
- **Action Needed:** Implementer i quote generation (kritisk!)

---

### **❌ MEMORY_12: Business Intelligence** 💼

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:**
  - SUCCESFULDE: Mette Nielsen (150m² villa, gentagne bookings)
  - TABTE: Eva (2.792-3.490kr vs 2t selv forventning)
  - Patterns og learnings
- **Action Needed:** Implementer analytics og pattern detection

---

### **❌ MEMORY_13: Lead Leverandør Relations**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Dokumenter relationer til leverandører

---

### **❌ MEMORY_14: 349kr/time Pricing**

**Status:** ⚠️ **PARTIALLY IMPLEMENTED** (som MEMORY_23)

- **Note:** MEMORY_23 bruger allerede 349 kr/t
- **Action Needed:** Verificér at alle steder bruger 349kr (ikke 300kr)

---

### **❌ MEMORY_15: Tilbud Timing & Booking**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Implementer timing logic for tilbud

---

### **❌ MEMORY_16: Flytterengøring Workflow**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Specifik workflow for flytterengøring

---

### **❌ MEMORY_17: Billy MCP Critical**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Implementer Billy.dk integration

---

### **❌ MEMORY_18: Booking Process Workflow**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Implementer komplet booking workflow

---

### **❌ MEMORY_19: NO Calendar Attendees**

**Status:** ❌ **NOT IMPLEMENTED**

- **Regel:** Ingen attendees i kalender events
- **Action Needed:** Auto-fix ved event creation

---

### **❌ MEMORY_20: Om Jonas & Kvalitet**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Dokumenter Jonas' rolle og kvalitetsstandards

---

### **❌ MEMORY_21: Output Verificering**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Implementer validation af output før sending

---

### **❌ MEMORY_22: Tech Stack**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Dokumenter tech stack requirements

---

### **❌ MEMORY_24: Afslutnings-workflow**

**Status:** ❌ **NOT IMPLEMENTED**

- **Action Needed:** Implementer afslutnings-logic

---

## 📊 **STATISTIK**

| Kategori          | Antal | Status                           |
| ----------------- | ----- | -------------------------------- |
| **Implementeret** | 3     | ✅ MEMORY_4, MEMORY_23, MEMORY_5 |
| **Mangler**       | 21    | ❌ MEMORY_1, 2, 3, 6-22, 24      |
| **Total**         | 24    | **12.5% implementeret**          |

---

## 🎯 **PRIORITERING**

### **KRITISKE** (implementer først)

1. ✅ **MEMORY_5** - Calendar Check (DONE)
2. ❌ **MEMORY_7** - Email Search First (PARTIALLY)
3. ❌ **MEMORY_11** - Tilbudsformat (KRITISK for quotes!)
4. ❌ **MEMORY_8** - Overtid Kommunikation (KRITISK!)
5. ❌ **MEMORY_1** - Time Check (KRITISK for datoer)

### **VIKTIGE** (implementer derefter)

6. ❌ **MEMORY_2** - Lead-System (workflow)
7. ❌ **MEMORY_3** - Kundeservice Tilgang
8. ❌ **MEMORY_9** - Conflict Resolution
9. ❌ **MEMORY_10** - Lead Management

### **NICE TO HAVE**

10. ❌ **MEMORY_6** - Kalender-Systematisering
11. ❌ **MEMORY_12** - Business Intelligence
12. ❌ Resten af memories

---

## 📝 **NÆSTE SKRIDT**

1. **Implementer MEMORY_7** (Email Search First)
   - Check eksisterende kommunikation før reply
   - Integrer i `/generate-reply` endpoint

2. **Implementer MEMORY_11** (Tilbudsformat)
   - Quote validation
   - Format template med alle påkrævede felter

3. **Implementer MEMORY_8** (Overtid)
   - +1t regel (IKKE +3-5t!)
   - Medarbejder-angivelse i alle tilbud

4. **Implementer MEMORY_1** (Time Check)
   - Time validation før alle dato-operationer

---

**Dokument opdateret:** 31. oktober 2025  
**Næste review:** Efter implementering af kritiske memories
