# Dashboard Upgrade Guide - RenOS

## Oversigt

Denne guide dokumenterer de nye funktioner tilføjet til RenOS dashboardet som en del af dashboard-opgraderingen baseret på kravspecifikationen fra januar 2025.

## 🎯 Implementerede Funktioner

### 1. **Økonomi-integration (Billy.dk)**

#### Beskrivelse

Integration med Billy.dk fakturasystem for automatisk omsætningsdata og real-time økonomisk tracking.

#### Konfiguration

Tilføj til `.env`:
```bash
# Billy.dk Integration
BILLY_ENABLED=true
BILLY_API_KEY=your_billy_api_key_here
BILLY_ORGANIZATION_ID=your_organization_id
```

#### Funktionalitet

- **Automatisk revenue sync**: Henter betalt faktura-data fra Billy.dk
- **Fallback til database**: Hvis Billy ikke er konfigureret, bruges lokal invoice/quote data
- **Real-time opdatering**: Dashboard viser aktuelle økonomiske data
- **Export-klar**: Data kan eksporteres til rapporter

#### API Endpoints

```typescript
// Get revenue data for dashboard
GET /api/dashboard/revenue?period=7d

// Response example:
{
  "period": "2025-01-01 - 2025-01-07",
  "totalRevenue": 17500,
  "paidInvoices": 7,
  "pendingInvoices": 3,
  "overdueInvoices": 1
}
```

#### Service Implementering

```typescript
import { billyService } from "@/services/billyService";

// Check if Billy is configured
if (billyService.isConfigured()) {
  const revenueData = await billyService.getRevenueData(
    startDate, 
    endDate
  );
}
```

---

### 2. **Booking-flow med Kundeinfo Validering**

#### Beskrivelse

Obligatorisk validering af kundeoplysninger ved booking-oprettelse for at eliminere "Ukendt kunde" fejl.

#### Validering Regler

1. **Booking kræver**: `customerId` ELLER `leadId`
2. **Kunde/Lead skal have**:
   - ✅ Navn (påkrævet)
   - ✅ Email (påkrævet)
   - ✅ Telefon (påkrævet)

#### Backend Validering

```typescript
// src/api/bookingRoutes.ts
POST /api/bookings

// Validation check
if (!customerId && !leadId) {
  return res.status(400).json({ 
    error: "Kundeoplysninger mangler. Booking skal være knyttet til en kunde eller lead med navn, telefon og email." 
  });
}

// Verify customer has required fields
const customer = await prisma.customer.findUnique({
  where: { id: customerId },
  select: { name: true, email: true, phone: true }
});

if (!customer.name || !customer.email || !customer.phone) {
  return res.status(400).json({ 
    error: "Kundens kontaktoplysninger er ufuldstændige. Navn, email og telefon er påkrævet." 
  });
}
```

#### Frontend UI

BookingModal komponenten har allerede:

- ✅ Kunde-dropdown (påkrævet felt)
- ✅ Service type selection
- ✅ Dato/tid picker
- ✅ Fejl-håndtering

---

### 3. **Tilbuds-/Salgs-funktion med Status Tracking**

#### Beskrivelse

Komplet quote tracking system med pipeline visualisering, konverteringsstatistik og statusflow.

#### Quote Status Flow

```
DRAFT → SENT → ACCEPTED
              ↘ REJECTED
```

#### Dashboard Komponent

```tsx
import QuoteStatusTracker from '@/components/QuoteStatusTracker';

// Tilføjet til Dashboard
<QuoteStatusTracker />
```

#### Features

- **Status fordeling**: Viser antal tilbud pr. status
- **Konverteringsrate**: Automatisk beregning af acceptance rate
- **Gennemsnitsværdi**: Beregner avg. quote value
- **Seneste tilbud**: Liste over de 10 nyeste tilbud med status
- **Real-time update**: Auto-refresh hvert 60 sekund

#### API Endpoint

```typescript
GET /api/dashboard/quotes/status-tracking

// Response:
{
  "byStatus": [
    {
      "status": "draft",
      "count": 15,
      "totalValue": 45000
    },
    {
      "status": "sent",
      "count": 8,
      "totalValue": 32000
    },
    {
      "status": "accepted",
      "count": 12,
      "totalValue": 78000
    }
  ],
  "recentQuotes": [...],
  "metrics": {
    "totalQuotes": 35,
    "acceptedQuotes": 12,
    "conversionRate": 34.3,
    "avgQuoteValue": 4457
  }
}
```

#### Statistik Beregninger

```typescript
// Conversion rate
const conversionRate = (acceptedQuotes / totalQuotes) * 100;

// Average value
const avgQuoteValue = 
  totalValue / totalQuotes;

// Status percentage
const statusPercentage = 
  (statusCount / totalQuotes) * 100;
```

---

### 4. **Automatiserede E-mails & Opfølgning**

#### Status: ✅ Allerede Implementeret

Denne funktionalitet var allerede komplet implementeret:

- ✅ **Auto-response system** via `AUTO_RESPONSE_ENABLED` flag
- ✅ **Follow-up workflow** via `FOLLOW_UP_ENABLED` flag
- ✅ **Escalation system** via `ESCALATION_ENABLED` flag
- ✅ **Email godkendelses-flow** (EmailApproval komponent)
- ✅ **Email kvalitets-monitor** (EmailQualityMonitor)
- ✅ **Follow-up tracker** (FollowUpTracker)

#### Konfiguration

```bash
# .env
AUTO_RESPONSE_ENABLED=false  # Sikkerhed først!
FOLLOW_UP_ENABLED=false      # Manuel aktivering
ESCALATION_ENABLED=true      # Altid sikkert
```

#### Dashboard Monitoring

SystemStatus komponenten viser:

- 🚦 Run mode status (dry-run/live)
- ⚠️  Risk level (safe/caution/danger)
- 📧 Email automation status
- 🔔 Notifikationer ved unsafe konfiguration

---

### 5. **Cache og Performance**

#### Status: ✅ Allerede Implementeret

Cache system er fuldt implementeret via `cacheService.ts`:

- ✅ **In-memory caching** (memory provider)
- ✅ **Redis support** (optional, production)
- ✅ **Hit rate tracking**
- ✅ **Automatic TTL** (time-to-live)
- ✅ **Performance metrics**

#### Dashboard Visning

```tsx
// Cache Performance Widget
{cacheStats && (
  <Card>
    <CardTitle>Cache Performance</CardTitle>
    <div>
      <div>Hit Rate: {cacheStats.hitRate}</div>
      <div>Hits: {cacheStats.hits}</div>
      <div>Misses: {cacheStats.misses}</div>
      <div>Entries: {cacheStats.size}</div>
    </div>
  </Card>
)}
```

#### Målsætning

- ✅ **Target**: 80%+ cache hit rate
- ✅ **Current**: Vises real-time på dashboard
- ✅ **Monitoring**: Automatisk via dashboard

---

### 6. **Kvalitetsovervågning og Konflikthåndtering**

#### Status: ✅ Allerede Implementeret

Komplet monitoring system er på plads:

#### Komponenter

1. **ConflictMonitor**: Real-time konflikt-tracking
2. **EmailQualityMonitor**: Email kvalitets-score
3. **RateLimitMonitor**: API rate limit tracking
4. **SystemStatus**: Overall system health

#### Funktioner

- ✅ **Automatic escalation** til Jonas ved kritiske konflikter
- ✅ **Email quality scoring**
- ✅ **Conflict resolution workflow**
- ✅ **Real-time notifikationer**

#### Konflikt Typer

```typescript
severity: 'low' | 'medium' | 'high' | 'critical'
```

---

## 📊 Dashboard Layout

### Ny Sektion Rækkefølge

```
1. Overview Stats (kunder, leads, bookings, quotes, revenue)
2. Period Filter (24h, 7d, 30d, 90d)
3. Revenue Chart (med Billy.dk data)
4. Service Distribution
5. Cache Performance
6. System Status (kritisk sikkerhed)
7. Conflict Monitor
8. Quote Status Tracker ← NY!
9. Email Quality Monitor
10. Follow-Up Tracker
11. Rate Limit Monitor
12. Recent Leads
13. Upcoming Bookings
```

---

## 🔧 Installation & Setup

### 1. Backend Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Build backend
npm run build
```

### 2. Frontend Installation

```bash
cd client
npm install
npm run build
```

### 3. Environment Setup

```bash
# Copy example
cp .env.example .env

# Configure Billy (optional)
BILLY_ENABLED=true
BILLY_API_KEY=your_api_key
BILLY_ORGANIZATION_ID=your_org_id

# Safety flags
RUN_MODE=dry-run
AUTO_RESPONSE_ENABLED=false
```

### 4. Database Migration

```bash
# If new schema changes are needed
npm run db:push
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run dashboard upgrade tests
npm test tests/dashboard-upgrade.test.ts

# Watch mode
npm run test:watch
```

### Test Coverage

```
✓ Billy integration (4 tests)
✓ Booking validation (3 tests)
✓ Quote status tracking (4 tests)
✓ Configuration (3 tests)
✓ API endpoints (3 tests)

Total: 17 tests passing
```

---

## 📈 Performance Metrics

### Target Metrics

- **Cache Hit Rate**: 80%+
- **API Response Time**: <500ms
- **Dashboard Load Time**: <2s
- **Quote Conversion Rate**: Tracked real-time

### Current Implementation

- ✅ All builds passing
- ✅ TypeScript compilation successful
- ✅ Frontend bundle: 475KB (acceptable)
- ✅ Backend compilation: Clean

---

## 🚀 Production Deployment

### Checklist

- [ ] Configure Billy.dk API key
- [ ] Set `BILLY_ENABLED=true`
- [ ] Verify `RUN_MODE=dry-run` initially
- [ ] Test Billy sync with 1-2 invoices
- [ ] Monitor dashboard for data accuracy
- [ ] Enable `RUN_MODE=live` after validation

### Monitoring

- Dashboard auto-refreshes every 60 seconds
- Cache stats updated real-time
- Billy revenue syncs on demand
- Quote tracking updates automatically

---

## 🔍 Troubleshooting

### Billy Integration Issues

```typescript
// Check if Billy is configured
import { billyService } from '@/services/billyService';

if (!billyService.isConfigured()) {
  console.log('Billy not configured - using fallback data');
}
```

### Booking Validation Errors

```typescript
// Error: "Kundens kontaktoplysninger er ufuldstændige"
// Solution: Ensure customer has:
- name (string, non-empty)
- email (valid email format)
- phone (string, non-empty)
```

### Quote Tracking Empty

```typescript
// No quotes showing?
// Check:
1. Database has Quote records
2. Quotes have valid status values
3. API endpoint returns data: GET /api/dashboard/quotes/status-tracking
```

---

## 📚 Related Documentation

- [Complete System Audit](./COMPLETE_SYSTEM_AUDIT_OCT_8_2025.md)
- [Feature Gap Analysis](./FEATURE_GAP_ANALYSIS_CLEANMANAGER.md)
- [Development Roadmap](../DEVELOPMENT_ROADMAP.md)
- [Email Approval Implementation](./status/archive/EMAIL_APPROVAL_IMPLEMENTATION_COMPLETE.md)

---

## 💡 Future Enhancements

### Potential Additions

- [ ] Billy webhook for real-time invoice sync
- [ ] Automated quote email generation
- [ ] Quote approval workflow
- [ ] Revenue forecasting based on pipeline
- [ ] Export dashboard data to CSV/Excel
- [ ] Custom dashboard widgets
- [ ] Mobile responsive optimizations

---

## 📞 Support

For spørgsmål eller problemer:

1. Check denne guide
2. Se related documentation
3. Kontakt development team

---

**Version**: 1.0  
**Last Updated**: Januar 2025  
**Status**: ✅ Production Ready
