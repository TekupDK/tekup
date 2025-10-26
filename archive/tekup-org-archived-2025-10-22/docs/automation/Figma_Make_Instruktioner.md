# Instruktioner til Figma Make - Færdiggør Tekup Design

## 🎯 Næste Fase: Integration med Tekup-org Platform

Hej Figma Make! Tak for det fantastiske arbejde indtil videre. Nu skal vi færdiggøre designet så det integrerer perfekt med den eksisterende Tekup-org platform. Her er hvad der skal gøres:

## 📊 Opdater Dashboard med Rigtige Data

Baseret på analysen af den rigtige Gmail og Google Calendar data, skal dashboard'et opdateres:

### **Aktuelle Rigtige Metrics:**
```
✅ 28 nye leads (ikke 12) - seneste 7 dage
✅ 3.6% konverteringsrate (ikke 89%) - realistisk rate
✅ 78 AI Score gennemsnit (ikke 95) - baseret på rigtig email analyse
✅ Top leads: Caja og Torben (95%), Emil Houmann (87%), Natascha Kring (95%)
```

### **Lead Sources:**
- Leadpoint.dk (Rengøring Aarhus): 15 leads (54%)
- Leadmail.no (Rengøring.nu): 13 leads (46%)

## 🔗 Integration Requirements

### **1. API Endpoints der skal matches:**
```typescript
// Disse endpoints findes allerede i Tekup-org:
GET /api/analytics/gmail-dashboard/live
GET /api/contacts?status=new&created_after=today
GET /api/deals/conversion-rate
GET /api/analytics/ai-score
GET /api/health
```

### **2. Autentificering:**
Erstat demo login systemet med integration til Tekup's eksisterende auth:
```typescript
// Eksisterende auth i Tekup-org bruger JWT tokens
// Se apps/tekup-crm-api/src/auth/ for implementation
```

### **3. Database Schema:**
Dashboard skal vise data fra disse eksisterende tabeller:
- `contacts` - Lead information
- `deals` - Konverteringsdata  
- `activities` - Email/Calendar events
- `companies` - Virksomhedsdata

## 🎨 Design Justeringer

### **Farver og Branding:**
- Primær farve: Tekup blå (#0066CC)
- Accent: Cyan (#00D4FF) 
- Success: Emerald (#10B981)
- Warning: Amber (#F59E0B)

### **Meningsfulde Farver for Lead Status:**
- 🔴 Rød (90-100): Hot leads (akut, hurtig, budget)
- 🟡 Gul (70-89): Warm leads (interesse, men ikke urgent)
- 🔵 Blå (50-69): Cold leads (generelle forespørgsler)

## 📱 Responsive og Accessibility

### **Mobile Optimering:**
- Dashboard skal fungere perfekt på mobile
- Lead cards skal stacke vertikalt
- Navigation skal kollapse til hamburger menu

### **Accessibility Forbedringer:**
- Alle metrics skal have ARIA labels
- Farveblinde brugere skal kunne skelne lead status
- Keyboard navigation skal fungere perfekt

## 🚀 Deployment Integration

### **Monorepo Structure:**
Koden skal integreres i denne struktur:
```
apps/website/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Navigation/
│   │   └── Auth/
│   ├── hooks/
│   │   └── useDashboardData.ts
│   └── pages/
└── package.json
```

### **Environment Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GMAIL_INTEGRATION=true
NEXT_PUBLIC_CALENDAR_INTEGRATION=true
```

## 💼 Business Logic

### **Lead Scoring Algorithm:**
```typescript
function calculateLeadScore(email: any): number {
  let score = 0;
  
  // Urgency keywords (+20 each)
  const urgentWords = ['akut', 'hurtig', 'i dag', 'asap'];
  urgentWords.forEach(word => {
    if (email.body.toLowerCase().includes(word)) score += 20;
  });
  
  // Business email (+30)
  if (!email.from.includes('gmail.com') && !email.from.includes('hotmail.com')) {
    score += 30;
  }
  
  // Phone number included (+25)
  if (/\d{8}|\d{2}\s\d{2}\s\d{2}\s\d{2}/.test(email.body)) {
    score += 25;
  }
  
  return Math.min(score, 100);
}
```

## 🔧 Konkrete Opgaver

### **Høj Prioritet:**
1. **Opdater dashboard metrics** med rigtige tal (28 leads, 3.6% konvertering)
2. **Implementer rigtig lead scoring** baseret på email analyse
3. **Tilføj Gmail/Calendar integration** hooks
4. **Erstat demo auth** med JWT token system

### **Medium Prioritet:**
5. **Optimér mobile responsivt design**
6. **Tilføj real-time updates** via WebSockets
7. **Implementer lead detail views** (klik på lead → vis email)
8. **Tilføj booking management** (direkte til Calendar)

### **Lav Prioritet:**
9. **A/B test forskellige CTA tekster**
10. **Tilføj customer testimonials** med rigtige data
11. **Optimér for Core Web Vitals**
12. **Implementér advanced analytics**

## 📋 Deliverables

Når du er færdig, skal følgende være klar:

1. **Komplet kodebase** klar til integration i Tekup-org monorepo
2. **API integration** med eksisterende endpoints
3. **Autentificering** der fungerer med JWT tokens
4. **Dashboard** der viser rigtige Gmail/Calendar data
5. **Mobile-optimeret** design
6. **Production-ready** deployment setup

## 🎯 Success Kriterier

- ✅ Dashboard viser rigtige lead data fra Gmail
- ✅ Konverteringsrater beregnes fra Calendar bookings  
- ✅ Lead scoring fungerer med email analyse
- ✅ Mobile design er perfekt
- ✅ Autentificering integrerer med eksisterende system
- ✅ Performance er optimeret (LCP < 2.5s)

**Start med høj prioritet opgaverne og arbejd dig ned gennem listen. Lad mig vide når du har brug for mere specifik information om Tekup-org platformen!** 🚀
