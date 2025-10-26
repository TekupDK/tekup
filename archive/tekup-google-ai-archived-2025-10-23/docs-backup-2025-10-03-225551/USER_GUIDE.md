# 📖 RenOS User Guide - Brugervejledning\n\n\n\n**Version:** 1.0  
**Dato:** 2. oktober 2025  
**Målgruppe:** Rendetalje.dk team medlemmer\n\n
---
\n\n## 🎯 Hvad Er RenOS?\n\n\n\nRenOS er Rendetalje's AI-drevne kunde- og booking management system. Det automatiserer:\n\n\n\n- 📧 **Email håndtering** - Auto-svar til nye leads\n\n- 👥 **Kunde management** - Central kunde database\n\n- 📅 **Booking system** - Automatisk kalender integration\n\n- 💰 **Tilbud generering** - Smart pris-estimering\n\n- 📊 **Analytics** - Real-time performance metrics\n\n
---
\n\n## 🚀 Kom I Gang\n\n\n\n### Login\n\n\n\n**URL:** https://tekup-renos-1.onrender.com\n\n
**Authentication:** \n\n- Pt. ingen login påkrævet (pilot phase)\n\n- Kommer snart: Clerk authentication\n\n\n\n### Dashboard Overview\n\n\n\nNår du logger ind, ser du:
\n\n```
┌─────────────────────────────────────────────┐
│  📊 Dashboard                                │
├─────────────────────────────────────────────┤
│  💰 Revenue  👥 Customers  📋 Leads  💵 Quotes│
│  ┌──────┐   ┌──────┐     ┌──────┐  ┌──────┐ │
│  │45.2K │   │  18  │     │  161 │  │  12  │ │
│  └──────┘   └──────┘     └──────┘  └──────┘ │
│                                               │
│  📈 Top Customers                             │
│  1. København Rengøring ApS - 12.5K DKK      │\n\n│  2. Aarhus Facility - 8.2K DKK               │\n\n│  ...                                          │
└─────────────────────────────────────────────┘\n\n```

---
\n\n## 📧 Email & Lead Håndtering\n\n\n\n### Sådan Fungerer Auto-Response\n\n\n\n**Automatisk flow:**
\n\n1. **Ny lead modtages** fra Rengøring.nu → Gmail\n\n2. **RenOS detecter lead** (kører hver 20. min)\n\n3. **AI analyserer** lead type (flytterengøring, fast rengøring, etc.)\n\n4. **Template vælges** baseret på behov\n\n5. **Email sendes** automatisk efter 30 sekunder\n\n6. **Kunde oprettes** i database\n\n
**Eksempel email:**
\n\n```
Fra: info@rendetalje.dk
Til: kunde@example.com
Emne: Tak for din henvendelse — flytterengøring

Hej [Navn],

Tak for din henvendelse via Rengøring.nu 🌿

Vi kan hjælpe med flytterengøring af din [boligtype] 
på ca. [størrelse] m² på [adresse].

For at give dig den bedste plan og pris har jeg lige 
et par hurtige spørgsmål:
\n\n1. Hvornår skal flytterengøringen udføres?\n\n2. Er det fraflytning eller indflytning?\n\n3. Skal alle rum gøres rent?

Vi glæder os til at høre fra dig!

Med venlig hilsen,
Jonas fra Rendetalje.dk\n\n```
\n\n### Manuel Email Håndtering (Kommer Snart)\n\n\n\n**Email Approval UI** er under udvikling:\n\n\n\n- ✅ Se AI-genererede emails før afsendelse\n\n- ✅ Rediger emails inden sending\n\n- ✅ Approve eller reject\n\n- ✅ Send med ét klik\n\n
**Status:** Kode er klar, mangler deployment (Todo #4)\n\n
---
\n\n## 👥 Kunde Management\n\n\n\n### Se Alle Kunder\n\n\n\n**Navigation:** Dashboard → Kunder\n\n
**Features:**\n\n- 📋 Komplet kunde liste\n\n- 🔍 Søg på navn, email, telefon\n\n- 🎯 Filtrer efter status (aktiv/inaktiv)\n\n- 📊 Sortér efter sidst kontaktet\n\n\n\n### Opret Ny Kunde\n\n\n\n**Step-by-step:**
\n\n1. Klik "Ny Kunde" knap (øverst til højre)\n\n2. Udfyld formular:
   ```
   Navn: [Kundenavn]
   Email: kunde@example.com
   Telefon: +45 12 34 56 78
   Adresse: Vejnavn 123, 8000 Aarhus
   Type: Privat / Erhverv
   ```\n\n3. Klik "Opret Kunde"\n\n4. ✅ Kunde vises nu i listen
\n\n### Rediger Kunde\n\n\n\n1. Find kunde i listen\n\n2. Klik ✏️ "Rediger" ikon\n\n3. Opdater felter\n\n4. Klik "Gem Ændringer"
\n\n### Slet Kunde\n\n\n\n⚠️ **Vigtigt:** Dette er en "soft delete" - data bevares i database\n\n\n\n1. Find kunde i listen\n\n2. Klik 🗑️ "Slet" ikon\n\n3. Bekræft sletning\n\n4. Kunde markeres som inaktiv

**Gendannelse:** Kontakt admin for at gendanne slettede kunder\n\n
---
\n\n## 🔍 Customer 360 - Kundeprofil\n\n\n\n**Navigation:** Dashboard → Customer 360\n\n\n\n### Hvad Er Customer 360?\n\n\n\nEn **komplet oversigt** over kundens interaktioner:\n\n\n\n```
┌─────────────────────────────────────────────────┐
│  👤 København Rengøring ApS                     │
├─────────────────────────────────────────────────┤
│  📧 Email: kontakt@koebenhavnreng.dk           │
│  📱 Telefon: +45 12 34 56 78                    │
│  📍 Adresse: Nørrebrogade 1, 2200 København N   │
│                                                  │
│  📊 KPI'er                                       │
│  💰 Total Revenue: 12.5K DKK                    │
│  📋 Active Leads: 2                              │
│  📅 Bookings: 5                                  │
│  💵 Quotes: 3                                    │
│                                                  │
│  📧 Email Kommunikation (seneste først)         │
│  ┌──────────────────────────────────────────┐  │
│  │ 📩 Thread: "Flytterengøring - Nørrebro" │  │\n\n│  │ Sendt: 2025-10-02 14:30                  │  │
│  │ Status: ✓ Matchet                        │  │
│  │ Beskeder: 3                               │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [Klik for at se fuld email tråd]              │
└─────────────────────────────────────────────────┘\n\n```
\n\n### Sådan Bruges Det\n\n\n\n**1. Vælg Kunde:**\n\n- Venstre panel: Kundeliste\n\n- Søg på navn eller email\n\n- Klik på kunde\n\n
**2. Se Profil:**\n\n- Midte panel: Kontaktinfo + KPI'er\n\n- Scroll ned for at se historik\n\n
**3. Email Tråde:**\n\n- Højre panel: Alle email samtaler\n\n- Klik på tråd for at udvide\n\n- Se fuld samtale historik\n\n
**4. Svar på Email:**\n\n- Klik "Svar" knap på tråd\n\n- Skriv besked\n\n- Klik "Send"\n\n- ✅ Sendes via Gmail som info@rendetalje.dk\n\n
---
\n\n## 📋 Lead Management\n\n\n\n### Se Alle Leads\n\n\n\n**Navigation:** Dashboard → Leads\n\n
**Kolonner:**\n\n- 📛 Navn\n\n- 📧 Email\n\n- 📱 Telefon\n\n- 🏠 Behov (flytterengøring, fast rengøring, etc.)\n\n- 📅 Modtaget dato\n\n- 🎯 Status\n\n\n\n### Lead Status Flow\n\n\n\nLeads gennemgår denne lifecycle:
\n\n```
🆕 New → 📞 Contacted → ✅ Qualified → 💰 Converted → ❌ Lost\n\n```

**Status Beskrivelser:**

| Status | Beskrivelse | Hvad Nu? |
|--------|-------------|----------|
| 🆕 **New** | Lige modtaget, AI har sendt auto-svar | Vent på kunde svar (1-2 dage) |\n\n| 📞 **Contacted** | Kunde har svaret tilbage | Ring eller email for detaljer |\n\n| ✅ **Qualified** | Kunde er interesseret + konkret behov | Send tilbud |\n\n| 💰 **Converted** | Kunde har accepteret tilbud | Opret booking |\n\n| ❌ **Lost** | Kunde ikke interesseret / ikke svar | Arkiver |\n\n\n\n### Opdater Lead Status\n\n\n\n**Manuel opdatering:**
\n\n1. Find lead i listen\n\n2. Klik på status dropdown\n\n3. Vælg ny status\n\n4. ✅ Opdateres automatisk

**Automatisk opdatering:**\n\n- 🆕 New → Sættes automatisk ved modtagelse\n\n- 💰 Converted → Sættes automatisk når booking oprettes\n\n
---
\n\n## 📅 Booking Management\n\n\n\n### Se Alle Bookings\n\n\n\n**Navigation:** Dashboard → Bookings\n\n
**Vises:**\n\n- 📅 Dato & tid\n\n- 👤 Kunde navn\n\n- 🏠 Service type\n\n- 📍 Adresse\n\n- 🎯 Status\n\n\n\n### Booking Status\n\n\n\n```\n\n📋 Scheduled → ✅ Confirmed → ✓ Completed → ❌ Cancelled\n\n```
\n\n### Opret Manuel Booking (Kommer Snart)\n\n\n\n**Nuværende:** Kun via API  
**Fremtid:** Booking modal UI (Todo #5)\n\n
**Workaround nu:**\n\n1. Gå til Google Calendar\n\n2. Opret event i "RenOS Automatisk Booking" calendar\n\n3. RenOS syncer automatisk

**Eller:**\n\n1. Kontakt admin\n\n2. Admin opretter via CLI:
   ```bash
   npm run booking:create
   ```

---
\n\n## 💰 Tilbud (Quotes)\n\n\n\n### Se Alle Tilbud\n\n\n\n**Navigation:** Dashboard → Tilbud\n\n
**Info vist:**\n\n- 👤 Kunde\n\n- 🏠 Service type\n\n- 💵 Total pris (inkl. moms)\n\n- 📅 Gyldig til dato\n\n- 🎯 Status\n\n\n\n### Quote Status\n\n\n\n```\n\n📋 Draft → 📧 Sent → ✅ Accepted → ❌ Rejected → ⏰ Expired\n\n```
\n\n### Automatisk Quote Generering\n\n\n\n**Triggers:**\n\n- Lead modtaget med konkrete krav\n\n- AI estimerer timepris baseret på:\n\n  - Boligstørrelse (m²)\n\n  - Service type (flytterengøring, hovedrengøring, etc.)\n\n  - Kompleksitet\n\n
**Eksempel beregning:**
\n\n```
Service: Flytterengøring
Bolig: 100 m² lejlighed
Estimeret tid: 8 timer
Timepris: 350 DKK
─────────────────────────
Subtotal: 2.800 DKK
Moms (25%): 700 DKK
─────────────────────────
Total: 3.500 DKK\n\n```
\n\n### Manuel Quote Oprettelse (Kommer Snart)\n\n\n\n**Status:** Kode under udvikling (Todo #6)\n\n
**Workaround nu:**\n\n1. Kontakt admin\n\n2. Admin opretter manuelt

---
\n\n## 📊 Analytics & Rapportering\n\n\n\n### Dashboard Metrics\n\n\n\n**Real-time KPI'er:**
\n\n```
💰 Total Revenue
Beregnes fra: Alle accepterede quotes + completed bookings\n\n
👥 Total Customers  
Antal: Aktive kunder i database

📋 Total Leads
Antal: Alle leads (alle status)

💵 Active Quotes
Antal: Quotes med status "sent" (ikke expired)\n\n```
\n\n### Top Customers Liste\n\n\n\n**Sorteret efter:** Total revenue (descending)\n\n
**Viser:**\n\n- Kunde navn\n\n- Total indtjening\n\n- Antal bookings\n\n- Sidste kontakt dato\n\n
---
\n\n## 🔧 Avancerede Features\n\n\n\n### CLI Tools (Kun Admin)\n\n\n\nRenOS har kraftfulde command-line tools:

**Lead Monitoring:**\n\n```bash
npm run leads:check          # Tjek for nye leads\n\nnpm run leads:monitor        # Real-time monitoring\n\nnpm run leads:import         # Import historiske leads\n\n```\n\n
**Email Management:**\n\n```bash
npm run email:pending        # Se pending responses\n\nnpm run email:stats          # Email statistik\n\nnpm run email:test           # Test auto-response\n\n```\n\n
**Booking Tools:**\n\n```bash
npm run booking:list         # List alle bookings\n\nnpm run booking:availability # Tjek ledige tider\n\nnpm run booking:next-slot    # Find næste ledige tid\n\n```\n\n
**Database Tools:**\n\n```bash
npm run customer:list        # List alle kunder\n\nnpm run customer:stats       # Kunde statistik\n\nnpm run db:studio            # Åbn Prisma Studio (GUI)\n\n```\n\n
---
\n\n## 🚨 Troubleshooting\n\n\n\n### Email Auto-Response Virker Ikke\n\n\n\n**Mulige årsager:**
\n\n1. **RUN_MODE er sat til dry-run**
   - Fix: Kontakt admin for at sætte `RUN_MODE=live`\n\n\n\n2. **Gmail credentials mangler**
   - Fix: Kontakt admin for at verificere Google setup\n\n\n\n3. **Daily limit nået** (50 responses/dag)\n\n   - Fix: Vent til næste dag, eller kontakt admin for at øge limit\n\n
**Verificer status:**\n\n```bash\n\n# Admin kun\n\nnpm run email:stats\n\n```\n\n\n\n### Customer 360 Viser Ingen Email Tråde\n\n\n\n**Løsning:**
\n\n1. Email ingest skal køres mindst én gang\n\n2. Kontakt admin for at køre:
   ```
   https://tekup-renos.onrender.com/api/dashboard/email-ingest/stats
   ```
\n\n### Calendar Booking Oprettes Ikke\n\n\n\n**Mulige årsager:**
\n\n1. **GOOGLE_CALENDAR_ID mangler**
   - Fix: Kontakt admin\n\n\n\n2. **Service account har ikke adgang til calendar**
   - Fix: Admin skal share calendar med service account\n\n\n\n3. **Time conflict**
   - Systemet afviser overlappende bookings automatisk\n\n   - Fix: Vælg anden tid\n\n
---
\n\n## 📞 Support\n\n\n\n### Tekniske Problemer\n\n\n\n**Kontakt:**\n\n- 👤 Jonas Abde (System Admin)\n\n- 📧 Email: [din email]\n\n- 📱 Telefon: [dit nummer]\n\n\n\n### Feature Requests\n\n\n\n**Process:**\n\n1. Beskriv feature i detaljer\n\n2. Forklar use case\n\n3. Send til admin\n\n4. Feature vurderes og prioriteres
\n\n### Bug Reports\n\n\n\n**Inkluder:**\n\n- 📝 Beskrivelse af problem\n\n- 🔄 Steps to reproduce\n\n- 📸 Screenshots (hvis relevant)\n\n- ⏰ Tidspunkt for fejl\n\n- 💻 Browser/device info\n\n
---
\n\n## 🎓 Best Practices\n\n\n\n### Email Etikette\n\n\n\n**Når du sender manuelle emails via Customer 360:**

✅ **Gør:**\n\n- Brug professionel tone\n\n- Svar indenfor 24 timer\n\n- Inkluder alle relevante detaljer\n\n- Sign med dit navn\n\n
❌ **Undgå:**\n\n- Slang eller uformelt sprog\n\n- At love ting vi ikke kan holde\n\n- At sende uden at læse hele tråden først\n\n\n\n### Lead Håndtering\n\n\n\n**Best practice flow:**
\n\n1. **Dag 1:** Lead modtages → AI sender auto-svar\n\n2. **Dag 2:** Kunde svarer → Opdater status til "Contacted"\n\n3. **Dag 3:** Ring til kunde → Få konkrete krav\n\n4. **Dag 4:** Opdater status til "Qualified"\n\n5. **Dag 5:** Send tilbud\n\n6. **Dag 7:** Follow up hvis intet svar\n\n7. **Dag 10:** Hvis stadig intet svar → Status "Lost"\n\n
**Conversion tips:**\n\n- Ring hellere end email (højere conversion)\n\n- Send tilbud samme dag som kvalificeret\n\n- Follow up efter 2-3 dage\n\n- Vær fleksibel med tider\n\n\n\n### Booking Management\n\n\n\n**Undgå double-booking:**\n\n1. Check calendar ALTID før du lover en tid\n\n2. Brug auto-accept calendar (RenOS Automatisk Booking)\n\n3. Opdater calendar straks ved ændringer\n\n4. Sæt reminders 24 timer før booking

---
\n\n## 🔐 Sikkerhed & Privacy\n\n\n\n### Kundedatabase GDPR\n\n\n\n**Vi overholder:**\n\n- ✅ Kun relevante data gemmes\n\n- ✅ Krypteret database forbindelse\n\n- ✅ Adgang kun via authentication (kommer snart)\n\n- ✅ Audit logs for alle ændringer\n\n- ✅ Ret til sletning (soft delete)\n\n
**Kunden har ret til:**\n\n- Se deres data (Customer 360)\n\n- Opdatere deres data (via os)\n\n- Slette deres data (soft delete)\n\n- Eksportere deres data (kontakt admin)\n\n\n\n### Email Sikkerhed\n\n\n\n**Gmail integration:**\n\n- ✅ OAuth 2.0 authentication\n\n- ✅ Service account med least-privilege\n\n- ✅ Domain-wide delegation\n\n- ✅ Emails sendes via info@rendetalje.dk (verified sender)\n\n
**AI-genererede emails:**\n\n- ✅ Dry-run mode for test\n\n- ✅ Manual approval flow (kommer snart)\n\n- ✅ Daglig limit (forhindrer spam)\n\n- ✅ Tracking af alle sendte emails\n\n
---
\n\n## 📈 Fremtidige Features\n\n\n\n### I Pipeline\n\n\n\n**Q4 2025:**\n\n- ✅ Email Approval Workflow (Todo #4) - 6-8 timer\n\n- ✅ Calendar Booking UI (Todo #5) - 6-8 timer\n\n- ✅ Quote Generation UI (Todo #6) - 3-4 timer\n\n
**2026:**\n\n- 📊 Advanced Analytics Dashboard med charts\n\n- 📱 Mobile app (iOS + Android)\n\n- 💬 Live chat integration på website\n\n- 🔔 SMS notifications til kunder\n\n- 📄 Automatisk faktura generering\n\n- 🎨 Custom email templates\n\n- 👥 Team collaboration features\n\n- 📈 Sales forecasting med AI\n\n
---
\n\n## 📚 Appendix\n\n\n\n### Keyboard Shortcuts\n\n\n\n| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Global søgning |\n\n| `Ctrl + N` | Ny kunde |\n\n| `Ctrl + L` | Gå til leads |\n\n| `Ctrl + B` | Gå til bookings |\n\n| `Escape` | Luk modal |
\n\n### Frequently Asked Questions\n\n\n\n**Q: Hvor lang tid tager auto-response?**  \n\nA: 30 sekunder efter lead modtagelse (for at sikre kvalitet)

**Q: Kan jeg disable auto-response?**  \n\nA: Ja, kontakt admin for at sætte `AUTO_RESPONSE_ENABLED=false`

**Q: Hvor mange emails kan sendes per dag?**  \n\nA: Default limit er 50. Kan øges efter behov.

**Q: Kan jeg se hvem der har ændret en kunde?**  \n\nA: Ja, via audit logs (kontakt admin)

**Q: Hvad sker der hvis et lead ikke har email?**  \n\nA: Lead gemmes, men ingen auto-response sendes. Status sættes til "New" og venter på manuel opfølgning.

**Q: Kan jeg eksportere kunde-data til Excel?**  \n\nA: Ja, brug "Export" knappen på kunde-siden (kommer snart)

---
\n\n## ✅ Checklists\n\n\n\n### Daglig Morgen Rutine\n\n\n\n- [ ] Check dashboard for nye leads\n\n- [ ] Gennemgå pending email responses (når UI er live)\n\n- [ ] Update lead status for igår's opfølgning\n\n- [ ] Check dagens bookings i calendar\n\n- [ ] Send reminders til kunder med bookings i dag\n\n\n\n### Ugentlig Rutine\n\n\n\n- [ ] Gennemgå "Lost" leads - kan de genaktiveres?\n\n- [ ] Follow up på "Qualified" leads uden tilbud\n\n- [ ] Review analytics - hvor kommer leads fra?\n\n- [ ] Clean up old quotes (>30 dage expired)\n\n- [ ] Backup vigtig data (admin)\n\n
---

**Version:** 1.0  
**Sidst opdateret:** 2. oktober 2025  
**Næste review:** 1. november 2025\n\n
For spørgsmål eller feedback til denne guide, kontakt admin.

---

🎉 **Velkommen til RenOS!** Vi håber dette system gør dit arbejde lettere og mere effektivt! 🚀\n\n
