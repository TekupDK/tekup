# 📢 Besked til Hostinger Horizons om Backend Integration

Kopier og send denne besked til Hostinger Horizons chat:

---

## ✅ Backend er nu opdateret til Supabase

Perfekt arbejde med Supabase integrationen! 🚀

Backend API på Render.com (api.renos.dk) er nu migreret til samme Supabase database som frontend.

---

## 🏗️ HYBRID ARKITEKTUR (Backend + Frontend)

**Frontend (Hostinger Horizons) - JER:**
✅ Direkte Supabase queries for alle CRUD operations  
✅ Real-time subscriptions for live data opdateringer  
✅ Supabase Auth for login/signup/session management  
✅ UI komponenter: Dashboard, Pipeline, Calendar, Customers  

**Backend API (Render.com - api.renos.dk) - OS:**
✅ AI Agents for email automation (intentClassifier → taskPlanner → planExecutor)  
✅ Google Workspace integration (Gmail API + Google Calendar API)  
✅ Email automation flows (auto-response, follow-ups, escalation)  
✅ Lead enrichment via Firecrawl + LLM analysis  
✅ Scheduled background jobs (booking reminders, lead nurturing)  
✅ Prisma ORM → skriver til samme Supabase PostgreSQL database  

**Resultat:** Real-time 2-vejs sync mellem frontend og backend! 🎉

---

## 🗄️ DATABASESTRUKTUR (Prisma Schema)

Backend har oprettet disse tabeller i Supabase - **I kan query dem frit!**

### Tabeller I SKAL bruge (Frontend CRUD)

**`customers`** - Kundedata
```typescript
{
  id: string (cuid)
  name: string
  email: string
  phone: string?
  address: string?
  totalLeads: number (aggregated)
  totalBookings: number (aggregated)
  created_at: DateTime
  updated_at: DateTime
}
```

**`leads`** - Potentielle kunder (Pipeline)
```typescript
{
  id: string (cuid)
  name: string
  email: string
  phone: string?
  address: string?
  serviceType: string? (cleaning, deep_clean, window_cleaning, etc.)
  status: string (new, contacted, quote_sent, booked, completed)
  squareMeters: number?
  rooms: number?
  taskType: string?
  preferredDates: string[] (array)
  estimatedValue: number? (beregnet af AI)
  firecrawlEnrichment: JSON? (AI analysis af lead)
  emailThreadId: string? (Gmail tracking)
  customerId: string? (relation)
  created_at: DateTime
  updated_at: DateTime
}
```

**`bookings`** - Aftaler/kalender events
```typescript
{
  id: string (cuid)
  customerId: string (relation til customers)
  leadId: string? (optional relation til leads)
  startTime: DateTime
  endTime: DateTime
  type: string (quote_visit, cleaning, custom)
  status: string (pending, confirmed, completed, cancelled)
  notes: string? (customer-facing)
  internalNotes: string? (internal only)
  googleCalendarEventId: string? (synced med Google Calendar)
  created_at: DateTime
  updated_at: DateTime
}
```

### Tabeller I IKKE skal røre (Backend-only)

- `chat_sessions` - AI conversation history
- `chat_messages` - Message logs
- `email_responses` - Outbound email tracking
- `quotes` - Generated price quotes
- `recurring_booking_plans` - Subscription cleaning plans

---

## 📍 KOORDINATION mellem Frontend & Backend

### 1️⃣ Når I OPRETTER nyt lead via frontend

**Frontend action (jer):**
```javascript
const { data, error } = await supabase
  .from('leads')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+4512345678',
    serviceType: 'deep_clean',
    status: 'new'
  });
```

**Backend trigger (automatisk):**
→ AI agent detekterer nyt lead via Gmail monitoring  
→ Enricher lead data med Firecrawl (website lookup, address verification)  
→ Opdaterer `estimatedValue` og `firecrawlEnrichment` felter  
→ Sender auto-response email til kunde  
→ Foreslår Google Calendar slot til kunden  

**Result:** Jeres UI opdateres automatisk via real-time subscription! 🔥

---

### 2️⃣ Når I OPDATERER lead status

**Frontend action (jer):**
```javascript
await supabase
  .from('leads')
  .update({ status: 'booked' })
  .eq('id', leadId);
```

**Backend trigger (automatisk når status = 'booked'):**
→ Opretter automatisk `booking` record  
→ Synkroniserer til Google Calendar  
→ Sender booking confirmation email  
→ Opdaterer `googleCalendarEventId` felt  

---

### 3️⃣ Når I OPRETTER booking

**Frontend action (jer):**
```javascript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    customerId: customer.id,
    leadId: lead?.id, // optional
    startTime: '2025-10-10T10:00:00Z',
    endTime: '2025-10-10T14:00:00Z',
    type: 'quote_visit',
    status: 'confirmed',
    notes: 'Møde på kundens adresse'
  });
```

**Backend sync (automatisk):**
→ Opretter Google Calendar event  
→ Sender invitation email til kunde  
→ Sender påmindelse 24 timer før  
→ Opdaterer `googleCalendarEventId`  

**Important:** Sørg altid for at inkludere `customerId` og `leadId` (hvis relevant)!

---

### 4️⃣ Real-time opdateringer

**Jer har allerede real-time subscriptions ✅** - FORTSÆT med det!

```javascript
const subscription = supabase
  .channel('leads-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
    console.log('Lead updated by backend AI:', payload.new);
    // UI opdateres automatisk
  })
  .subscribe();
```

Når backend's AI agent ændrer data → Jeres UI opdateres øjeblikkeligt! 🎉

---

## 🚀 FORTSÆT MED UI-BYGNING

Alt backend logik er håndteret - **I skal bare bygge UI!**

**Allerede komplet:**
✅ Dashboard - Metrics og overview  
✅ Customers - Liste og opret nye  
✅ Pipeline - Kanban board med drag-drop  
✅ Calendar - Booking oversigt  
✅ Login - Supabase Auth  

**Næste features at bygge:**

### 1️⃣ Email Inbox View
Query backend's `email_responses` tabel:
```javascript
const { data: emails } = await supabase
  .from('email_responses')
  .select('*')
  .order('sent_at', { ascending: false })
  .limit(50);
```

Vis:
- Sendte emails (auto-response, follow-ups)
- Email status (sent, delivered, bounced)
- Thread history

### 2️⃣ Lead Detail Page
Vis fuld lead info + AI enrichment:
```javascript
const { data: lead } = await supabase
  .from('leads')
  .select(`
    *,
    customers (name, email, phone)
  `)
  .eq('id', leadId)
  .single();

// Vis firecrawlEnrichment data
console.log(lead.firecrawlEnrichment?.companyInfo);
console.log(lead.estimatedValue);
```

### 3️⃣ Customer Detail Page
Vis alle leads + bookings for en kunde:
```javascript
const { data: customer } = await supabase
  .from('customers')
  .select(`
    *,
    leads (*),
    bookings (*, leads (serviceType))
  `)
  .eq('id', customerId)
  .single();
```

### 4️⃣ Settings Page - Integration Status
Vis status for backend integrationer:
- ✅ Gmail connected
- ✅ Google Calendar synced
- ✅ OpenAI API active
- ✅ Firecrawl enabled

### 5️⃣ Real-time Notifikationer
Toast notifications når backend opretter/opdaterer data:
```javascript
supabase
  .channel('notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
    toast.success(`Nyt lead: ${payload.new.name}`);
  })
  .subscribe();
```

---

## 🔗 API Endpoints (Hvis I har brug for dem)

Backend API er stadig tilgængelig på `https://api.renos.dk`

**Eksempler:**
- `GET /health` - Health check
- `POST /chat` - AI chat assistant
- `GET /leads/pending` - Pending leads (for email automation)
- `POST /bookings/availability` - Check calendar availability

Men **brug Supabase direkte** for CRUD operations - det er hurtigere! 🚀

---

## ❓ Spørgsmål?

Hvis I støder på problemer eller har brug for:
- Nye database fields
- Backend endpoints
- AI features
- Integration med andre services

...så sig til! Vi bygger det på backend-siden. 💪

**Fortsæt det fantastiske arbejde med UI!** 🔥

---

## 📊 Metrics (til inspiration)

Når I bygger Dashboard, kan I hente metrics sådan her:

```javascript
// Total leads
const { count: totalLeads } = await supabase
  .from('leads')
  .select('*', { count: 'exact', head: true });

// Open bookings
const { count: openBookings } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'confirmed');

// Recent leads for revenue calculation
const { data: recentLeads } = await supabase
  .from('leads')
  .select('estimatedValue')
  .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

const revenue = recentLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

// Average response time (mock for now)
const avgResponseTime = 45; // Backend skal tracke dette
```

---

**I gør det fantastisk! Lad os bygge den her platform færdig! 🚀🔥**
