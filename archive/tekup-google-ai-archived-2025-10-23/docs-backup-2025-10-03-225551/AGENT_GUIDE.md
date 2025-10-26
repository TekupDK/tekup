# 🤖 RenOS Agent Guide - Komplet System Erstatning

**Version:** 2.0
**Dato:** 2. oktober 2025
**Målgruppe:** AI Agent (Jarvis) + Udviklere

---

## 🎯 Agent Mission & Core Philosophy

**MISSION:** RenOS skal erstatte ALLE eksterne systemer!

**Din rolle som agent:**\n\n- **RenOS = ALT** (email, kalender, kunder, leads, fakturering, analytics)\n\n- **Agent = RenOS Orchestrator** (styr RenOS som det eneste system)

**Kritisk regel:** RenOS er det ENESTE system - ingen Shortwave, ingen separate værktøjer!

---

## 📋 RENOS ER DET ENESTE SYSTEM\n\n\n\n#### RenOS håndterer ALT:\n\n✅ **Email Management** - Send/modtag/læs emails\n\n✅ **Label Organization** - Visuel label management\n\n✅ **Calendar Integration** - Bookings, events, reminders\n\n✅ **Customer Database** - Komplet kunde profiler\n\n✅ **Lead Processing** - Automatisk lead håndtering\n\n✅ **Quote Generation** - AI-genererede tilbud\n\n✅ **Business Intelligence** - Analytics og rapportering\n\n✅ **Multi-Tenant Support** - Flere firmaer på én platform

---

## 🏢 DEL 1: BUSINESS WORKFLOW ANALYSIS

### Morgen Routine (30-60 min) - RenOS Workflow

**Trin 1: Inbox Review via RenOS**\n\n- Åbn RenOS dashboard\n\n- Klik på "Leads" i navigation\n\n- Se 5-15 nye leads fra kilder:\n\n  - Rengøring.nu (Leadmail.no) - forwarded emails\n\n  - Rengøring Aarhus (Leadpoint.dk) - formularer\n\n  - AdHelp - sporadiske henvendelser\n\n  - Direkte henvendelser
\n\n#### Trin 2: Per Lead Processing (30 sek - 2 min per lead)\n\n1. **RenOS læser automatisk lead information:**\n\n   - Kunde navn, email, telefon (auto-parsed)\n\n   - Bolig størrelse (m²), antal rum (AI extraction)\n\n   - Service type (fast rengøring, flytterengøring, hovedrengøring)\n\n   - Ønsket dato/frekvens (intelligently parsed)\n\n   - Specielle ønsker

2. **KRITISK: RenOS automatic duplicate check (MEMORY_8 regel!)**
   - RenOS søger automatisk: `check_customer_duplicate(email)`\n\n   - Hvis tidligere kommunikation → **STOP + ALERT**, send IKKE nyt tilbud\n\n   - Hvis ingen emails → fortsæt automatisk

3. **RenOS finder ledige tider automatisk:**
   - Kører `find_available_slots(duration, count=5)`\n\n   - Finder 5 ledige tidspunkter omkring kundens ønskede dato\n\n   - Inkluderer transport tid + medarbejder tilgængelighed automatisk

4. **RenOS beregner estimat automatisk:**
   - Fast rengøring: ~3-4 timer for 100-150m² første gang\n\n   - Vedligeholdelses-rengøring: ~2-3 timer\n\n   - Flytterengøring: ~8-12 timer for 100m²\n\n   - Regel: 2 personer = halveret on-site tid\n\n   - Lærer fra historiske bookings

5. **RenOS genererer tilbud automatisk:**
   ```\n\n   📏 Bolig: [størrelse] med [rum]
   👥 Medarbejdere: [antal] personer
   ⏱️ Estimeret tid: [timer] timer på stedet = [arbejdstimer] arbejdstimer total
   💰 Pris: 349kr/time/person = ca. [pris range] kr inkl. moms
   📅 Ledige tider: [5 konkrete forslag med dato + klokkeslæt]\n\n   ```text\n\n\n6. **RenOS Send + Status update (automatisk):**\n\n   - Send email via RenOS\n\n   - Flyt automatisk fra "Leads" → "Venter på svar"\n\n   - Tilføj service type label automatisk\n\n   - Log i kunde database

---

## 🔄 DEL 2: RENOS WORKFLOWS - Komplet Integration

### Workflow 1: Nyt Lead Processing

**STEP 1: RenOS (Email Detection)**\n\n```\n\nAgent søger: search_emails(label="Leads")
Finder nyt lead fra Rengøring.nu
Læser kundens request\n\n```text\n
**STEP 2: RenOS (Duplicate Check - KRITISK!)**\n\n```\n\nSøg efter duplicate: check_customer_duplicate(email)
Hvis EXISTS → STOP (undgå dobbelt-tilbud)\n\n```text\n
**STEP 3: RenOS (Calendar Intelligence)**\n\n```\n\nTjek kalender for ledige tider
find_available_slots(duration, count=5)
Identificer 3-5 konkrete tider\n\n```text\n
**STEP 4: RenOS (AI Quote Generation)**\n\n```\n\nGenerer tilbud: generate_quote(customer, slots)
Inkluderer konkrete tider fra kalender
Følger optimeret tilbudsformat
Viser til godkendelse\n\n```text\n
**STEP 5: RenOS (Execution)**\n\n```\n\nSend email via RenOS email system
Opdater kunde status til "Venter på svar"
Log i kunde database\n\n```text\n
**Agent Dialog Eksempel:**\n\n```\n\nBruger: "Process det nye lead fra Lars Nielsen"

Agent tænker:\n\n1. ✅ Søger først i RenOS for duplicate\n\n2. ✅ Finder ingen tidligere kunder\n\n3. ✅ Tjekker kalender med find_available_slots\n\n4. ✅ Finder ledige tider: 15/10 kl 10, 16/10 kl 14, 17/10 kl 9\n\n5. ✅ Genererer tilbud med AI\n\n6. ✅ Viser til godkendelse

Agent svarer:
"Jeg fandt ingen tidligere kommunikation med Lars Nielsen.
Her er mit forslag til tilbud baseret på ledige tider i kalenderen:

[DRAFT vises med konkrete tider]

Skal jeg sende det?"\n\n```text\n\n\n### Workflow 2: Opfølgning på Tilbud (7 dage senere)

**STEP 1: RenOS (Find Old Leads)**\n\n```\n\nfind_pending_quotes(older_than_days=7)
Finder kunder der ikke har fået svar i 7+ dage\n\n```text\n
**STEP 2: RenOS (New Available Slots)**\n\n```\n\nTjek kalender for NYE ledige tider
find_available_slots(duration, count=3, start_date=tomorrow)
Find alternative forslag til hver kunde\n\n```text\n
**STEP 3: RenOS (Personalized Follow-ups)**\n\n```\n\nFor hver kunde:
├─ Hent kunde historik og original quote
├─ Generer opfølgnings email
├─ Inkluder nye tider fra kalender
└─ Personlig tone baseret på kunde profil\n\n```text\n\n\n### Workflow 3: Booking Bekræftelse

**STEP 1: RenOS (Parse Customer Reply)**\n\n```\n\nLæs kundens booking-accept email
Parse: dato, tid, adresse, opgave type
Identificer kunde reference\n\n```text\n
**STEP 2: RenOS (Conflict Check)**\n\n```\n\nTjek conflict: check_time_slot_availability(time_slot)
Hvis IKKE ledig → find alternativ slot
Hvis ledig → fortsæt\n\n```text\n
**STEP 3: RenOS (Calendar Event Creation)**\n\n```\n\ncreate_booking_event med format:
🏠 [TYPE] #[X] - [Navn]\n\nInkluder kundens email som attendee
Send calendar invitation automatisk\n\n```text\n
---

## ⚠️ KRITISKE REGLER FOR AGENTEN

### Regel 1: RenOS Er Det Eneste System\n\n✅ **KORREKT:** Brug ALTID RenOS funktioner - det er det eneste system!  \n\n❌ **FORKERT:** Tænk på Shortwave eller andre værktøjer - de er væk!

### Regel 2: Duplicate Check Altid Først\n\n✅ **KORREKT:** `check_customer_duplicate(email)` før ALLE kunde interaktioner\n\n❌ **FORKERT:** Send noget til en kunde uden at tjekke duplicate først

### Regel 3: Calendar Intelligence\n\n✅ **KORREKT:** Brug `find_available_slots()` med conflict detection\n\n❌ **FORKERT:** Gæt aldrig på om en tid er ledig - check ALTID!

### Regel 4: RenOS Workflow\n\nRenOS håndterer: Email → Calendar → Kunde → Quote → Booking → Faktura

---

## 🎯 RENOS ER DET ENESTE SYSTEM

| Opgave | RenOS Funktion | Hvorfor? |
|--------|---------------|----------|
| **Søg emails** | `search_emails()` | RenOS har komplet email søgning |\n\n| **Læs email** | `get_email_thread()` | RenOS viser fuld samtale historik |\n\n| **Tjek duplicate** | `check_customer_duplicate()` | REGEL #2 - check før alt! |\n\n| **Skriv tilbud** | `generate_quote()` | AI-genereret med kalender integration |\n\n| **Tjek kalender** | `find_available_slots()` | Intelligent slot finder med konflikter |\n\n| **Opret event** | `create_booking_event()` | Automatisk format med kunde info |\n\n| **Send emails** | `send_email()` | RenOS email system |\n\n| **Opdater status** | `update_customer_status()` | Automatisk status progression |\n\n| **Analytics** | `get_analytics()` | Komplet business intelligence |\n\n| **Multi-tenant** | `switch_tenant()` | Flere firmaer på én platform |

---

## 💡 PRAKTISKE EKSEMPLER

### Eksempel 1: "Hvad skal jeg gøre ved nye leads?"\n\n\n\n#### Agent thinking process:\n\n1. Bruger RenOS til at søge: `search_emails(label="Leads")`\n\n2. For hver lead:
   - Tjek duplicate i RenOS (REGEL #2)\n\n   - Hvis ingen → tjek kalender ledighed med `find_available_slots()`\n\n   - Generer tilbud med `generate_quote()` inkl. ledige tider\n\n   - Vis til godkendelse\n\n   - Ved approval → send via RenOS email system\n\n   - Opdater kunde status automatisk

### Eksempel 2: "Book Mette Nielsen ind på fredag"\n\n\n\n#### Agent thinking process:\n\n1. RenOS: `get_customer("Mette Nielsen")`\n\n2. RenOS: Læs hendes seneste kommunikation\n\n3. RenOS: `find_available_slots(date="fredag", duration=estimate)`\n\n4. RenOS: `create_booking_event()` med korrekt format\n\n5. RenOS: `send_confirmation_email()` med booking detaljer\n\n6. RenOS: `update_customer_status()` til "Booket"

### Eksempel 3: "Lav systematisering af Cecilie's events"\n\n\n\n#### Agent thinking process:\n\n1. RenOS: `get_customer("Cecilie Krogsgaard")`\n\n2. RenOS: Hent ALLE kommunikation og historik\n\n3. RenOS: Krydsrefer med faktura system\n\n4. RenOS: `get_customer_events()` for Cecilie\n\n5. RenOS: `create_missing_events()` hvis der mangler\n\n6. RenOS: `update_event_formats()` til standard format\n\n7. RenOS: Vis komplet kunde profil med historik

---

## 🚀 AGENT BEST PRACTICES

### 1. RenOS Er Det Eneste System\n\nFør DU gør NOGET:\n\n- Tænk ALTID i RenOS funktioner\n\n- Brug kun RenOS API'er og funktioner\n\n- Ingen eksterne værktøjer - kun RenOS!

### 2. Duplicate Check Altid Først\n\nNår DU skal kontakte kunde:\n\n- Kør ALTID `check_customer_duplicate()` først\n\n- Stop hvis duplicate findes\n\n- Vis warning med tidligere historik

### 3. Intelligent Calendar Management\n\nNår DU skal foreslå tider:\n\n- Brug `find_available_slots()` med korrekt duration\n\n- Inkluder transport tid mellem jobs\n\n- Foretræk dine normale tider (8-10, 11-14)\n\n- Check konflikter før booking

### 4. RenOS Workflow Thinking\n\nKompleks workflow:\n\n- RenOS: Søg og forstå kontekst\n\n- RenOS: Beregn og generer automatisk\n\n- RenOS: Kommuniker med kunde\n\n- RenOS: Eksekvér og opdater status

---

## 📞 HURTIG REFERENCE TIL AGENTEN

| **Når bruger siger:** | **RenOS Funktion:** | **Fordi:** |\n\n|---|---|---|
| "Find emails fra..." | `search_emails(from="email")` | RenOS har komplet søgning |
| "Hvad skrev vi til..." | `get_customer_communication()` | Fuld kunde historik |
| "Tjek om vi har kontaktet..." | `check_customer_duplicate()` | Duplicate prevention |
| "Hvilke tider er ledige..." | `find_available_slots()` | Intelligent slot finder |
| "Book ind på..." | `create_booking_event()` | Automatisk event creation |
| "Send tilbud til..." | `generate_quote()` | AI-genereret tilbud |
| "Process alle leads" | `process_all_leads()` | Batch automation |
| "Opdater kunde status" | `update_customer_status()` | Automatisk progression |
| "Lav opfølgning på leads" | `generate_follow_ups()` | Personlige follow-ups |
| "Skriv til kunde om konflikt" | `generate_email_reply()` | Kontekst-bevarende svar |

---

## 🔧 DEL 3: RENOS SOM KOMPLET SYSTEM (Implementation Roadmap)

### SPRINT 1: Core RenOS Platform (2 uger)\n\n**Mål:** RenOS erstatter alle eksterne systemer

**Deliverables:**\n\n- ✅ Komplet email management system (erstatter Gmail + Shortwave)\n\n- ✅ Visuel label management med drag-drop UI\n\n- ✅ Intelligent calendar system med conflict detection\n\n- ✅ Customer database med fuld historik\n\n- ✅ Lead processing automation\n\n- ✅ Quote generation med AI

**Test criteria:**\n\n- Kan håndtere alle emails uden Gmail\n\n- Kan organisere med labels visuelt\n\n- Kan booke uden Google Calendar\n\n- Kan track kunder komplet i RenOS

### SPRINT 2: Advanced Automation (2 uger)\n\n**Mål:** RenOS automatiserer alle workflows

**Deliverables:**\n\n- ✅ Advanced duplicate detection med AI\n\n- ✅ Intelligent lead parsing og classification\n\n- ✅ Smart price estimation med machine learning\n\n- ✅ Conversation intelligence med intent detection\n\n- ✅ Automatic status progression\n\n- ✅ Follow-up automation med reminders

### SPRINT 3: Business Intelligence (2 uger)\n\n**Mål:** RenOS giver komplet indsigt

**Deliverables:**\n\n- ✅ Real-time analytics dashboard\n\n- ✅ Customer lifetime value tracking\n\n- ✅ Lead source performance analysis\n\n- ✅ Revenue forecasting\n\n- ✅ Time estimation accuracy learning\n\n- ✅ Customer satisfaction tracking

### SPRINT 4: Multi-Tenant Platform (3 uger)\n\n**Mål:** RenOS understøtter flere firmaer

**Deliverables:**\n\n- ✅ Komplet multi-tenant arkitektur\n\n- ✅ Tenant-specifikke settings og branding\n\n- ✅ Data isolation og security\n\n- ✅ Tenant administration interface\n\n- ✅ White-label funktionalitet\n\n- ✅ Tenant-specifikke integrations

---

## 🎓 DEL 4: PATTERN ANALYSIS

### Pattern 1: Fast Rengøring Customer Journey\n\n**Eksempel:** Nadia Møllebjerg (Rengøringstilbud – Fast rengøringshjælp - Skanderborg)

**Timeline:**\n\n- 27. juli: Lead modtaget via Rengøring.nu\n\n- 27. juli: Tilbud sendt (første rengøring 30. juli)\n\n- 27. juli: Kunde accepterer + forhandler pris/dag\n\n- 27. juli: Booking bekræftet, kalender oprettet\n\n- 30. juli - nu: Rengøring hver 14. dag, torsdag kl. 11:00

**Kompleksitet du håndterer:**\n\n- Adresse rettelse (Skanderborg → Ry 8680)\n\n- Pris bekræftelse (inkl. kørsel til Ry?)\n\n- Dag preference (onsdag → torsdag fremadrettet)\n\n- Nøgle arrangement (kunde lægger nøgle)\n\n- Tid estimering (2 personer, 3-3.5 timer = halveret on-site tid)\n\n- Kalender systematik (fejl opdaget 27. sep - skulle have været 25. sep)\n\n- Hurtig rettelse (flytter til torsdag 2. oktober)

**Læring:** Du er MEGET fleksibel, hurtig at rette fejl, og holder kunden glad gennem ærlig kommunikation.

### Pattern 2: Konflikt Management & Recovery\n\n**Eksempel:** Line Tanderup Nielsen (RE: Din henvendelse om fast rengøring i Egå)

**Timeline:**\n\n- 28. sep: Lead fra Rengøring.nu (fast rengøring, Egå)\n\n- 29. sep: Afklarende spørgsmål sendt (vindue indv/udv, frekvens)\n\n- 29. sep: Kunde svarer hurtigt (ugentlig, fredag 8-10)\n\n- 29. sep: Du tjekker kalender → optaget! Foreslår kl. 11:00 i stedet\n\n- 29. sep: Kunde accepterer kl. 11-15\n\n- 29. sep: Du booker 4 uger fremad med invitations\n\n- 30. sep: **Kunde siger pris for høj!**\n\n- 30. sep: Du reagerer HURTIGT med alternativer

**Kritisk læring:**\n\n- Du mister IKKE kunden ved pris-klager\n\n- Du tilbyder ALTID alternativer\n\n- Du er aldrig defensiv, altid løsningsorienteret\n\n- Hastighed i respons er VIGTIG (inden kunden går videre)

### Pattern 3: Booking Kompleksitet Management\n\n**Eksempel:** Eoin Galligan (Formular via Rengøring Aarhus)

**Kompleksitet:**\n\n- Engelsk-sproget kunde\n\n- Bytter tid flere gange (6. okt → 12. okt)\n\n- Vil ringe (men glemmer det flere gange)\n\n- Sender fotos af hus\n\n- MEGET vigtig for ham at vi ikke aflyser\n\n- Skal selv være til stede for at lukke op, så forlade stedet

**Hvordan du håndterer:**\n\n- Bytter til engelsk kommunikation naturligt\n\n- Fleksibel med tid-ændringer uden klager\n\n- Ikke presser ham når han glemmer at ringe\n\n- Reassurer ham flere gange: "the cleaning is locked in our calendar"\n\n- Bekræfter ALLE detaljer flere gange for at give tryghed

**Dette viser:**\n\n- Du tilpasser kommunikationsstil per kunde\n\n- Du er utrolig tålmodig med "rodet" kunder\n\n- Du forstår HVORFOR en kunde stresser (moving stress)\n\n- Du giver tryghed gennem gentagelse af bekræftelser

---

## 🎯 DEL 5: HVAD RENOS SKAL KUNNE SOM SHORTWAVE IKKE KAN

### 1. Intelligent Lead Processing\n\n**Problem i Shortwave:** Du gør ALT manuelt

**RenOS skal kunne:**\n\n- **Lead Parsing:** Automatisk udvinde nøgleinformation fra lead email\n\n  - Bolig størrelse regex: "150 m²", "150m2", "150 kvadratmeter"\n\n  - Antal rum: "5 rum", "5 værelser", "3 bedrooms"\n\n  - Service type: klassificere baseret på keywords\n\n  - Ønsket dato: parse "omkring 20. oktober", "hurtigst muligt"

- **Automatic Duplicate Check:**\n\n  - Hver gang et lead kommer ind → automatisk søg i database + Gmail\n\n  - Hvis email findes → stop processing og vis warning\n\n  - Hvis email findes MEN sidste kontakt over 30 dage siden → foreslå ny quote OK

- **Smart Estimering:**\n\n  - Database af historiske bookings\n\n  - Juster baseret på service type og første vs vedligehold\n\n  - Beregn pris range automatisk: min-max baseret på estimat ± 20%

- **Calendar Intelligence:**\n\n  - Find 5 næste ledige slots baseret på:\n\n    - Estimeret varighed for opgaven\n\n    - Buffer mellem bookings (minimum 1 time transport)\n\n    - Foretrukne tidspunkter (du booker ofte 8-10 eller 11-14)\n\n    - Undgå søndage/helligdage

- **Template-baseret Tilbud Generering:**\n\n  - Standardformat du altid bruger (emoji, struktur, tone)\n\n  - Men personaliseret med faktisk data\n\n  - Variation baseret på lead kilde (Rengøring.nu vs direkte)

- **Draft for Godkendelse:**\n\n  - Generer tilbuddet\n\n  - Vis til dig for review\n\n  - Du kan redigere før sending\n\n  - Send med 1 klik

**Forventet tidsbesparelse:** Fra 5-10 min per lead til 30 sekunder per lead

### 2. Automatic Stage Progression\n\n**Problem i Shortwave:** Du skal manuelt huske at flytte labels

**RenOS skal kunne:**\n\n- **Trigger-baseret Label Updates:**\n\n  - Når email sendes med tilbud → auto-flyt fra "Needs Reply" til "Venter på svar"\n\n  - Når kunde accepterer (intent detected) → auto-flyt til "I kalender"\n\n  - Når faktura oprettes → auto-flyt til "Finance"\n\n  - Når betaling modtaget → auto-flyt til "Afsluttet"

- **Reminder System:**\n\n  - 7 dage efter tilbud uden respons → auto-generér opfølgnings email\n\n  - 24 timer før booking → send reminder til kunde (og til dig)\n\n  - 2 timer før booking → send reminder til dig (klar til at køre?)\n\n  - Fakturaen forfalden uden betaling → send venlig reminder

### 3. Multi-Tenant Support\n\n**Problem i Shortwave:** Alt er single-user: info@rendetalje.dk

**RenOS skal kunne:**\n\n- **Flere rengøringsfirmaer på samme platform:**\n\n  - Rendetalje.dk (349 kr/time)\n\n  - RengoCompany ApS (399 kr/time)\n\n  - CleanMasters (429 kr/time)

- **Per-tenant settings:**\n\n  - Egen timepris\n\n  - Egen email signature\n\n  - Egne labels/stages\n\n  - Egen Billy.dk integration\n\n  - Egen Google Calendar\n\n  - Eget branding (logo, farver)

- **Data isolation:**\n\n  - Tenant A kan ALDRIG se Tenant B's kunder\n\n  - Men deler samme codebase/system

### 4. Business Intelligence\n\n**Problem i Shortwave:** Du ved ikke...

**RenOS skal kunne:**\n\n- **Lead Source Analytics:**\n\n  - Rengøring.nu: 45 leads, 12 bookings = 26% conversion\n\n  - Rengøring Aarhus: 38 leads, 18 bookings = 47% conversion\n\n  - → Konklusion: Fokuser på Rengøring Aarhus!

- **Revenue Tracking:**\n\n  - September 2025: 45.000 kr revenue\n\n  - Oktober forecast: 62.000 kr (baseret på bookings i kalenderen)

- **Customer Lifetime Value:**\n\n  - Nadia Møllebjerg: 3 bookings × 1.100 kr = 3.300 kr LTV\n\n  - Fast rengøring kunder: gennemsnit 8.500 kr LTV\n\n  - Engangs flytterengøring: gennemsnit 2.500 kr LTV

- **Time Estimation Accuracy:**\n\n  - "Du estimerede 3 timer, faktisk tog det 4 timer" → lær heraf\n\n  - Næste gang 150m² villa → brug 4 timer estimat

### 5. Customer Relationship Memory\n\n**Problem i Shortwave:** Du husker det i dit hoved eller skal læse gamle emails

**RenOS skal kunne:**\n\n- **Customer Profile med historik:**\n\n  - Nadia Møllebjerg - Fast kunde siden juli 2025\n\n  - Bookings: 27/7 (opstart), 11/8, 25/8, 11/9, 2/10 (næste: 16/10)\n\n  - Altid torsdage kl. 11:00\n\n  - 150m² villa i Ry (35 min kørsel!)\n\n  - Nøgle under måtte\n\n  - 2 personer, 3.5 timer standard\n\n  - Total revenue: 4.200 kr\n\n  - Satisfaction: Høj (ingen klager)\n\n  - Special notes: "Adresse fejl første gang (Skanderborg→Ry)"

- **Quick Reference:**\n\n  - Når du ser nyt email fra Nadia → RenOS viser straks hendes profil\n\n  - Du kan se sidste rengøring, næste planlagt, total historie\n\n  - Hurtig beslutning baseret på kontekst

---

## 📋 DEL 6: PRIORITERET OPGAVELISTE FOR COPILOT

### 🔴 KRITISK PRIORITET (Må ikke mangle)

**Opgave 1: Gmail Label API Integration**\n\n- Label Creation System (alle standard labels)\n\n- Label Application (single + multiple)\n\n- Bulk Operations\n\n- API Endpoints: `POST /api/labels/create`, `GET /api/labels`, etc.

**Opgave 2: Duplicate Customer Detection**\n\n- Database Customer Registry\n\n- Pre-Send Duplicate Check\n\n- Intelligence Layer (7d vs 30d rules)\n\n- UI/API med warning system

**Opgave 3: Automatic Lead Information Extraction**\n\n- Text Parsing Patterns (størrelse, rum, service type, dato, adresse)\n\n- Structured Output som JSON\n\n- Confidence Scoring for manual review\n\n- API: `POST /api/leads/parse`

**Opgave 4: Calendar Available Slots Finder**\n\n- Availability Algorithm\n\n- Smart Preferences (foretrukne tidspunkter)\n\n- Route Optimization (nice-to-have)

---

## 🎯 FINAL REMINDER

**RenOS er det ENESTE system:**\n\n- **RenOS = ALT** (email, kalender, kunder, leads, fakturering, analytics)\n\n- **Agent = RenOS Orchestrator** (styr ét system intelligent)
\n\n#### Alt starter med duplicate check og kunde søgning!\n\n---

## 📚 YDERLIGERE DOKUMENTATION

For mere detaljeret information, se:\n\n- **`RENOS_COMPLETE_SYSTEM_SPEC.md`** - Komplet system specifikation med API funktioner\n\n- **`USER_GUIDE.md`** - Brugervejledning til RenOS platform\n\n- **`rapportshortwawe.md`** - Original analyse af Shortwave vs RenOS workflows

---

**Version:** 2.0 - Komplet System Erstatning
**Sidst opdateret:** 2. oktober 2025
**Næste review:** 1. november 2025
