# RenOS Calendar Intelligence MCP
## Diagnostics & Performance Snapshot

For a live system snapshot (øjebliksbillede):

1) Hit the diagnostics endpoint:

- Health: `GET /health`
- Snapshot: `GET /diagnostics/snapshot`

2) Generate snapshot file locally:

```bash
npm run snapshot:perf           # Node script → writes snapshots/snapshot-*.json
```

On Windows PowerShell:

```powershell
npm run snapshot:perf:ps        # PowerShell → writes snapshots/snapshot-*.json
```

Environment override:

```bash
MCP_URL=http://localhost:3001 npm run snapshot:perf
```


**Status**: 🚧 MVP Development (v0.1.0)  
**Live**: TBD (Deployment planned efter FASE 1)

En intelligent kalender-hjerne der automatisk forbinder Shortwave email-workflows, Google Calendar, Billy.dk fakturering og RenOS database. Systemet eliminerer gentagende fejl gennem proaktiv validering, automatisering og intelligent beslutningsstøtte.

## 🎯 Vision

Et nervesystem der har lært fra 1000+ emails og bookinger, og som automatisk forhindrer de 15 problemkategorier identificeret fra email-historik. Fungerer som en erfaren operations manager der aldrig glemmer, aldrig sover, og bliver klogere for hver booking.

## ⚡ De 5 Killer Features (MVP FASE 1)

### 1. 🗓️ Dato & Ugedag Validator
**Problem**: 30+ kalenderfejl ("28. oktober er mandag" → NEJ, det er tirsdag!)  
**Løsning**: Automatisk verificering af dato/ugedag match før booking oprettes

### 2. 🚫 Dobbeltbooking Checker
**Problem**: Overlappende bookinger skaber kaos  
**Løsning**: Real-time konflikt-detektion med 100% sikkerhed

### 3. 💰 Auto-Faktura Workflow
**Problem**: 15+ manglende fakturaer per måned  
**Løsning**: Automatisk faktura-oprettelse via Billy.dk MCP + daglig scanning

### 4. ⏰ Overtids Tracker & Voice Alerts
**Problem**: Vinni: 9 timer vs 6 timer - ingen kommunikation  
**Løsning**: Live tracking med Twilio voice alerts efter +1 time overtid

### 5. 🧠 Kunde-Memory Bank
**Problem**: Glemmer "Jes = kun mandage", gentager samme fejl  
**Løsning**: Intelligent database der husker alt og auto-injector info

## 📱 Bonus Features (MVP FASE 1)

- **Mobile PWA Dashboard** - Dagens bookinger, manglende fakturaer, quick actions
- **Fail-Safe Mode** - Confidence < 80% → manual review påkrævet  
- **Undo Function** - 5-minutters window på alle kritiske handlinger
- **Customer Satisfaction Tracking** - Simple signals fra kommunikation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Calendar API credentials
- Supabase account (free tier OK)
- Twilio account (for voice alerts)
- Tekup-Billy MCP kørende

### Installation

```bash
# Clone repository
cd Tekup-Cloud
cd renos-calendar-mcp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Build project
npm run build

# Run development mode
npm run dev

# Run HTTP server mode
npm run dev:http
```

### Environment Setup

Se `.env.example` for komplet liste. Vigtigste variabler:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CALENDAR_ID=primary
SUPABASE_URL=https://your-project.supabase.co
TWILIO_ACCOUNT_SID=ACxxxx
JONAS_PHONE_NUMBER=+4512345678
BILLY_MCP_URL=https://tekup-billy.onrender.com
```

## 🔧 MCP Tools (FASE 1 MVP)

### Core 5 Tools

1. **`validate_booking_date`** - Verificer dato matcher ugedag
2. **`check_booking_conflicts`** - Detektér dobbeltbookinger  
3. **`auto_create_invoice`** - Opret faktura via Billy MCP
4. **`track_overtime_risk`** - Live job duration tracking
5. **`get_customer_memory`** - Hent kundehistorik & præferencer

## 🚀 Deployment

### Quick Deploy (CLI Automation)

```powershell
# One-time setup
cd renos-calendar-mcp
./scripts/install-cli-tools.ps1
./scripts/login-cli-tools.ps1

# Deploy everything
./scripts/deploy-all.ps1

# Verify
./scripts/verify-deployment.ps1
```

**URLs after deployment**:
- Backend: https://renos-calendar-mcp.onrender.com
- Dashboard: https://renos-calendar-dashboard.onrender.com

See `deployment/README.md` for detailed deployment guide.

### Alternative: Git-based Auto-Deploy

```bash
git push origin main
# Render auto-detects render.yaml and deploys
```

## 📊 Architecture

```
renos-calendar-mcp/
├── src/
│   ├── index.ts              # MCP server entry
│   ├── http-server.ts        # HTTP REST API
│   ├── config.ts             # Configuration
│   ├── types.ts              # TypeScript types
│   ├── tools/                # MCP tool implementations
│   │   ├── booking-validator.ts
│   │   ├── invoice-automation.ts
│   │   ├── overtime-tracker.ts
│   │   └── customer-memory.ts
│   ├── integrations/         # External APIs
│   │   ├── google-calendar.ts
│   │   ├── billy-mcp.ts
│   │   ├── supabase.ts
│   │   └── twilio-voice.ts
│   ├── validators/           # Business logic validators
│   │   ├── date-validator.ts
│   │   ├── conflict-checker.ts
│   │   └── fail-safe.ts
│   ├── intelligence/         # AI & Pattern Learning
│   │   ├── pattern-analyzer.ts
│   │   └── customer-intelligence.ts
│   └── utils/                # Utilities
│       ├── logger.ts
│       └── undo-manager.ts
├── tests/
│   ├── test-integration.ts
│   └── test-tools.ts
├── docs/
│   ├── QUICK_START.md
│   ├── API_REFERENCE.md
│   └── INTEGRATION_GUIDE.md
└── package.json
```

## 🗄️ Database Schema

Se `docs/SCHEMA.md` for komplet Supabase schema. Vigtigste tabeller:

```sql
- customer_intelligence   # Kunde memory bank
- booking_validations     # Validerings-log
- overtime_logs          # Overtids tracking
- undo_actions           # Undo history (5 min)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:integration
npm run test:tools

# Watch mode (under udvikling)
npm run test:watch
```

**Test Coverage Target**: 95% på de 5 core tools

## 📈 Success Metrics (FASE 1)

### Tekniske KPIs
- ✅ 0 dobbeltbookinger
- ✅ 100% fakturaer oprettet inden 24t
- ✅ Alle overtid varslet inden +1t  
- ✅ API response time < 200ms

### Forretnings KPIs
- 💰 18.500 kr/måned sparet på fejl-elimination
- ⏱️ 10+ timer/uge sparet på administration
- 📊 0% kalenderfejl (vs 30+ per måned før)

## 🗺️ Roadmap

### ✅ FASE 1: MVP (Uge 1-2) - Current
- [x] Repository struktur  
- [ ] 5 core tools implementeret
- [ ] Mobile PWA dashboard
- [ ] Twilio voice integration
- [ ] Fail-safe & undo system
- [ ] Minimal Supabase schema
- [ ] Integration tests (95% coverage)
- [ ] Dansk dokumentation
- [ ] Deploy til Render.com

### 🔜 FASE 2: Intelligence (Uge 3-4)
- Team optimization
- Lead routing  
- Pattern learning
- Risk signal detection

### 🔮 FASE 3: Scale (Uge 5-6)
- ML predictions
- Customer portal
- Advanced analytics
- Resterende 20+ tools

## 🤝 Integration Points

### Tekup-Billy MCP (v1.4.0)
```typescript
// Auto-faktura via Billy MCP
const response = await billyMCP.createInvoice({
  customerId: customer.id,
  lines: bookingItems,
  dueDate: new Date()
});
```

### Google Calendar
```typescript
// 2-way sync med "RenOS Automatisk Booking"
const conflicts = await calendarService.checkConflicts(
  startTime, endTime
);
```

### Shortwave (Background Analysis)
```typescript
// Pattern learning fra 1000+ emails (background job)
const patterns = await shortwaveAnalyzer.extractCustomerPatterns();
```

## 📝 Dokumentation

- [QUICK_START.md](docs/QUICK_START.md) - 5-minutters setup
- [API_REFERENCE.md](docs/API_REFERENCE.md) - Alle MCP tools
- [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) - Integration med RenOS
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues

## 🔒 Security

- **API Keys**: AES-256-GCM encryption
- **Rate Limiting**: 100 requests/15 min per IP
- **Fail-Safe Mode**: Confidence < 80% → manual review
- **Undo System**: 5-min window på kritiske handlinger
- **Audit Logging**: Alle operations logget i Supabase

## 💡 Udviklet Til

**Rendetalje.dk** - Rengøringsfirma i Aarhus  
Integration med Shortwave, Google Calendar, Billy.dk

**Udvikler**: Jonas Abde (Tekup)  
**Baseret på**: Tekup-Billy MCP proven architecture

## 📄 License

MIT License - Se LICENSE fil for detaljer

---

**Status**: 🚧 Under Udvikling | **Target**: MVP live om 2 uger! 🚀

