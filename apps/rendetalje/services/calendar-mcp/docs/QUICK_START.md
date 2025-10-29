# RenOS Calendar Intelligence MCP - Quick Start

**5-minutters setup guide** til at få MVP'en kørende lokalt.

## Forudsætninger

✅ Node.js 18+ installeret  
✅ Google Calendar API credentials  
✅ Supabase projekt oprettet  
✅ Twilio account (for voice alerts)  
✅ Tekup-Billy MCP kørende (for faktura-automation)

## Trin 1: Installation

```bash
cd Tekup-Cloud/renos-calendar-mcp

# Installer dependencies
npm install
```

## Trin 2: Environment Setup

```bash
# Kopier .env.example til .env
cp .env.example .env

# Rediger .env med dine credentials
```

### Vigtige variabler

```env
# Google Calendar (KRITISK for MVP)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
GOOGLE_CALENDAR_ID=primary

# Supabase (KRITISK for customer memory)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Twilio (for voice alerts)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+4512345678
JONAS_PHONE_NUMBER=+4512345678

# Billy MCP
BILLY_MCP_URL=https://tekup-billy.onrender.com
BILLY_MCP_API_KEY=your_billy_mcp_api_key

# Business Rules
CUSTOMER_RATE=349
TEAM_FREELANCE_RATE=90
WEEKEND_BOOKINGS_ENABLED=false
OVERTIME_ALERT_THRESHOLD_MINUTES=60
```

## Trin 3: Database Setup

### Opret Supabase tabeller

1. Log ind på [supabase.com](https://supabase.com)
2. Vælg dit projekt
3. Gå til **SQL Editor**
4. Kør indholdet af `docs/SUPABASE_SCHEMA.sql`
5. Verificer at tabellerne er oprettet:
   - `customer_intelligence`
   - `booking_validations`
   - `overtime_logs`
   - `learned_patterns`
   - `undo_actions`

## Trin 4: Test Kørsel

### MCP Mode (Stdio)

```bash
npm run dev
```

### HTTP Server Mode

```bash
npm run dev:http
```

Serveren kører nu på `http://localhost:3001`

## Trin 5: Test de 5 Killer Features

### 1. Test Dato-Validator

```bash
curl -X POST http://localhost:3001/api/v1/tools/validate_booking_date \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-28",
    "expectedDayName": "mandag"
  }'
```

**Forventet resultat**: Fejl! 28. oktober 2025 er tirsdag, ikke mandag.

### 2. Test Dobbeltbooking Checker

```bash
curl -X POST http://localhost:3001/api/v1/tools/check_booking_conflicts \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2025-10-22T09:00:00+02:00",
    "endTime": "2025-10-22T12:00:00+02:00"
  }'
```

### 3. Test Auto-Faktura

```bash
curl -X POST http://localhost:3001/api/v1/tools/auto_create_invoice \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-booking-123",
    "sendImmediately": false
  }'
```

### 4. Test Overtids-Tracker

```bash
curl -X POST http://localhost:3001/api/v1/tools/track_overtime_risk \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-booking-123",
    "currentDuration": 180,
    "estimatedDuration": 120
  }'
```

**Forventet resultat**: Alert! 60 minutter overtid detekteret.

### 5. Test Kunde-Memory

```bash
curl -X POST http://localhost:3001/api/v1/tools/get_customer_memory \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "jes-vestergaard"
  }'
```

**Forventet resultat**: Komplet intelligence inkl. "kun mandage kl. 08:30" mønster.

## Trin 6: Health Check

```bash
curl http://localhost:3001/health
```

Verificer at alle integrations er "true":

- ✅ `database: true`
- ✅ `googleCalendar: true`
- ✅ `billyMcp: true`
- ✅ `twilio: true`

## Næste Skridt

✅ **MVP kører lokalt!**

Nu kan du:

1. Integrere med RendetaljeOS backend
2. Test med rigtige kunde-data
3. Deploy til Render.com
4. Byg mobile dashboard

## Troubleshooting

### Problem: "Google Calendar not configured"

**Løsning**: Tjek at du har sat ALLE Google env vars korrekt:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
```

### Problem: "Supabase not configured"

**Løsning**: Verificer at SUPABASE_URL og SUPABASE_SERVICE_KEY er sat korrekt.

### Problem: "Twilio voice alerts disabled"

**Løsning**:

1. Sæt `ENABLE_VOICE_ALERTS=true`
2. Konfigurer Twilio credentials
3. Genstart serveren

### Problem: Database tabeller eksisterer ikke

**Løsning**: Kør `docs/SUPABASE_SCHEMA.sql` i Supabase SQL Editor.

## Support

Hav problemer? Tjek:

- `README.md` - Komplet oversigt
- `docs/API_REFERENCE.md` - Alle tools dokumenteret
- `docs/TROUBLESHOOTING.md` - Common issues

---

**MVP Status**: 🚀 Klar til test!  
**Next**: Integration med RendetaljeOS + Mobile Dashboard
