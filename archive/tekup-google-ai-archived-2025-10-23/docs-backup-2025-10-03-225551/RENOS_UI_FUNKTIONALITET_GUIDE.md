# 🖥️ RenOS UI Funktionalitet Guide\n\n\n\n**Komplet oversigt over alle pages, buttons og funktioner i RenOS**

---
\n\n## 📱 Navigation & Pages\n\n\n\nRenOS har 10 hovedsider tilgængelige via sidebar navigation:
\n\n### 1. **Dashboard** 🏠\n\n**URL**: `/dashboard`  \n\n**Ikon**: Home  
**Formål**: Hovedoversigt med nøgletal og aktivitet

**Indhold**:\n\n- 6 statistik-kort:\n\n  - Kunder (antal)\n\n  - Leads (antal)\n\n  - Bookinger (antal)\n\n  - Tilbud (antal)\n\n  - Omsætning (kr)\n\n  - Samtaler (antal)\n\n- Cache Performance monitor (hit rate, størrelse)\n\n- Seneste leads (5 nyeste)\n\n- Kommende bookinger (5 næste)\n\n- Revenue graf (AreaChart)\n\n- Service distribution (PieChart)\n\n- Auto-refresh hver 30. sekund\n\n
**Buttons**: \n\n- Period selector (24h, 7d, 30d, 90d)\n\n- Ingen action buttons (kun visning)\n\n
---
\n\n### 2. **AI Chat** 💬\n\n**URL**: `/chat`  \n\n**Ikon**: MessageCircle  
**Formål**: AI-assistent interface

**Funktioner**:\n\n- Chat med AI assistent\n\n- Quick action buttons:\n\n  - 📧 "Se nye leads"\n\n  - 📅 "Find ledig tid"\n\n  - ✉️ "Skriv tilbud"\n\n  - 📊 "Vis statistik"\n\n- Copy message funktion\n\n- Retry message\n\n- Markdown rendering\n\n- Intent visualization\n\n
**AI Capabilities**:\n\n- Lead processing\n\n- Email generation\n\n- Calendar management\n\n- Customer lookup\n\n- Quote creation\n\n
---
\n\n### 3. **Kunder** 👥\n\n**URL**: `/customers`  \n\n**Ikon**: Users  
**Formål**: Customer management

**Funktioner**:\n\n- Liste over alle kunder\n\n- Søgefunktion\n\n- Status filter (Active/Inactive)\n\n- Customer cards med:\n\n  - Navn, email, telefon\n\n  - Status badge\n\n  - Antal bookinger\n\n  - Samlet omsætning\n\n
**Buttons**:\n\n- ➕ "Tilføj Kunde" → Åbner create modal\n\n- ✏️ Edit button per kunde → Åbner edit modal\n\n- 🗑️ Delete button per kunde → Confirmation dialog\n\n
**Modals**:\n\n- Create Customer Modal (navn, email, telefon, status)\n\n- Edit Customer Modal (samme felter)\n\n
---
\n\n### 4. **Customer 360** 📧\n\n**URL**: `/customer360`  \n\n**Ikon**: Mail  
**Formål**: 360-graders kundevisning med email historik

**Funktioner**:\n\n- Kunde-vælger dropdown\n\n- Email thread visning\n\n- Fuld besked-visning\n\n- Reply funktion direkte i UI\n\n
**Visning**:\n\n- Kunde info header\n\n- Email threads grupperet\n\n- Besked detaljer (fra, til, dato, indhold)\n\n- Thread expansion/collapse\n\n
**Buttons**:\n\n- Customer selector dropdown\n\n- Reply button per email\n\n- Send button i reply form\n\n
---
\n\n### 5. **Leads** 🎯\n\n**URL**: `/leads`  \n\n**Ikon**: Target  
**Formål**: Lead management og AI processing

**Funktioner**:\n\n- Lead liste med detaljer\n\n- Status tracking (New, Contacted, Quoted, Won, Lost)\n\n- Lead source visning\n\n- AI integration\n\n
**Buttons**:\n\n- ➕ "Tilføj Lead" → CreateLeadModal\n\n- ✨ "AI Process" (grøn sparkles) → AI quote generation\n\n- 🗑️ Delete lead → Confirmation\n\n- 📧 Email/📱 Phone links\n\n
**AI Process Workflow**:\n\n1. Click sparkles button\n\n2. Backend parser lead info\n\n3. Checker for duplicate\n\n4. Finder 5 ledige tider\n\n5. Genererer tilbud med AI\n\n6. Viser AIQuoteModal til review/edit

**AIQuoteModal Features**:\n\n- 2-column layout (parsed info + quote)\n\n- Edit mode toggle\n\n- Duplicate warning hvis relevant\n\n- Confidence badge\n\n- Send button (TODO: backend endpoint)\n\n
---
\n\n### 6. **Email Godkendelse** ✅\n\n**URL**: `/email-approval`  \n\n**Ikon**: CheckCircle  
**Formål**: Review og godkend AI-genererede emails

**Funktioner**:\n\n- Liste over pending emails\n\n- 2-panel layout (liste + preview)\n\n- Inline editing af emails\n\n- Approval/rejection workflow\n\n
**Buttons**:\n\n- ✅ "Godkend & Send" → Sender via Gmail\n\n- ❌ "Afvis" → Marker som rejected\n\n- ✏️ "Rediger" → Toggle edit mode\n\n
**Status**:\n\n- Pending (afventer godkendelse)\n\n- Sent (godkendt og sendt)\n\n- Rejected (afvist)\n\n
---
\n\n### 7. **Bookinger** 📅\n\n**URL**: `/bookings`  \n\n**Ikon**: Calendar  
**Formål**: Booking og kalender management

**Funktioner**:\n\n- Booking liste med detaljer\n\n- Status badges (Confirmed, Scheduled, Completed, Cancelled)\n\n- Søgning og filtrering\n\n- Booking statistik kort\n\n
**Buttons**:\n\n- ➕ "Ny Booking" → BookingModal\n\n- Status filter dropdown\n\n- Søgefelt\n\n
**BookingModal**:\n\n- Customer selector\n\n- Service type dropdown (6 typer)\n\n- Date/time picker\n\n- Duration selector\n\n- Address input\n\n- Notes felt\n\n- "Opret Booking" → Creates Google Calendar event\n\n
**Google Calendar Integration**:\n\n- ❌ **VIGTIGT**: Calendar vises IKKE direkte i RenOS!\n\n- Bookinger oprettes i Google Calendar via API\n\n- Brugere skal stadig bruge Google Calendar til at se kalender-view\n\n- RenOS viser kun booking-liste, ikke kalender-grid\n\n
---
\n\n### 8. **Tilbud** 📄\n\n**URL**: `/quotes`  \n\n**Ikon**: FileText  
**Formål**: Quote management

**Funktioner**:\n\n- Quote liste\n\n- Status tracking (Draft, Sent, Accepted, Rejected)\n\n- Pris og dato visning\n\n
**Buttons**:\n\n- ➕ "Opret Tilbud" → CreateQuoteModal\n\n- 📤 Send quote\n\n- 🗑️ Delete quote\n\n
**CreateQuoteModal**:\n\n- Lead selector\n\n- Service details\n\n- Estimeret timer\n\n- Timepris (default: 349 kr)\n\n- Moms % (default: 25%)\n\n- Notes\n\n- Valid until date\n\n
---
\n\n### 9. **Statistik** 📊\n\n**URL**: `/analytics`  \n\n**Ikon**: BarChart3  
**Formål**: Business intelligence og analytics

**Visninger**:\n\n- Lead pipeline funnel\n\n- Revenue trends (line chart)\n\n- Conversion rates\n\n- Top customers by revenue\n\n- Service type distribution\n\n- Average booking value\n\n- Lead sources performance\n\n
**Interaktivitet**:\n\n- Period selectors\n\n- Chart hover tooltips\n\n- Exportable data (CSV)\n\n
---
\n\n### 10. **Indstillinger** ⚙️\n\n**URL**: `/settings`  \n\n**Ikon**: Settings  
**Formål**: System konfiguration

**Tabs**:\n\n1. **Profil** - Bruger info (kun UI, ingen backend)\n\n2. **Notifikationer** - Email/SMS preferences (placeholder)\n\n3. **Sikkerhed** - Password change (placeholder)\n\n4. **Email** - Email settings (placeholder)\n\n5. **Udseende** - Theme settings (placeholder)\n\n6. **System** - System settings (placeholder)\n\n
**Status**: Mest placeholder UI - backend mangler\n\n
---
\n\n## 🔧 Globale UI Elementer\n\n\n\n### Header Bar\n\n- 🔍 Global søgefunktion\n\n- 🔔 Notifikations-ikon\n\n- 👤 User menu (via Clerk UserButton)\n\n- Menu toggle (mobile)\n\n\n\n### Sidebar\n\n- Logo og app navn\n\n- 10 navigation items\n\n- Current page highlight\n\n- Collapse på mobile\n\n\n\n### Design System\n\n- **Glassmorphism**: Gennemsigtige kort med blur\n\n- **Neon accents**: Grøn (#00A651) primary color\n\n- **Dark mode**: Standard (ingen light mode)\n\n- **Responsive**: Mobile-first design\n\n- **Animations**: Hover effects, transitions\n\n
---
\n\n## 📱 Mobile Funktionalitet\n\n\n\n- Hamburger menu for navigation\n\n- Touch-optimized buttons\n\n- Swipe gestures (ikke implementeret)\n\n- Responsive tables → cards på mobile\n\n- Bottom sheet modals på små skærme\n\n
---
\n\n## ⚡ Quick Actions & Shortcuts\n\n\n\n### Lead Processing\n\n1. Gå til Leads\n\n2. Find lead\n\n3. Click ✨ AI Process\n\n4. Review AI output\n\n5. Edit hvis nødvendigt\n\n6. Send tilbud
\n\n### Booking Creation\n\n1. Gå til Bookinger\n\n2. Click "Ny Booking"\n\n3. Vælg kunde\n\n4. Vælg service og tid\n\n5. Opret → Syncs til Google Calendar
\n\n### Customer 360 View\n\n1. Gå til Customer 360\n\n2. Vælg kunde fra dropdown\n\n3. Se alle email threads\n\n4. Reply direkte fra UI

---
\n\n## 🚫 Hvad RenOS IKKE Gør\n\n\n\n1. **Viser IKKE Google Calendar direkte**
   - Ingen måneds/uge/dag view\n\n   - Ingen drag-drop booking\n\n   - Kun liste-visning af bookinger\n\n\n\n2. **Sender IKKE emails automatisk** (i dry-run mode)\n\n   - Kræver RUN_MODE=live\n\n   - Email approval workflow er påkrævet\n\n\n\n3. **Håndterer IKKE betaling**
   - Ingen Billy.dk integration (endnu)\n\n   - Ingen faktura-generering\n\n\n\n4. **Har IKKE mobile apps**
   - Kun web-baseret\n\n   - Responsive design, men ikke native\n\n
---
\n\n## 🎯 Konklusion\n\n\n\nRenOS er et **omfattende CRM system** med:\n\n- 10 hovedsider\n\n- 50+ interaktive komponenter\n\n- AI-powered automation\n\n- Gmail & Calendar API integration\n\n- Professional UI med glassmorphism\n\n
Men det erstatter IKKE Google Calendar for kalender-visning - det komplementerer det ved at automatisere booking-creation og management.\n\n
**Næste skridt for fuld funktionalitet**:\n\n1. Skift RUN_MODE til "live"\n\n2. Implementer settings backend\n\n3. Tilføj kalender-widget (optional)\n\n4. Integrer billing system