# Calendar Synchronization & Customer Import System

Komplet system til 1:1 Google Calendar-synkronisering og forbedret kundeimport med validering og automatisk kalenderintegration.

## 📋 Indholdsfortegnelse

- [Oversigt](#oversigt)
- [Funktioner](#funktioner)
- [Arkitektur](#arkitektur)
- [API Reference](#api-reference)
- [CLI Kommandoer](#cli-kommandoer)
- [Workflows](#workflows)
- [Database Schema](#database-schema)
- [Konfiguration](#konfiguration)
- [Integration](#integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Oversigt

Dette dokument beskriver det nye system til 1:1 Google Calendar-synkronisering og forbedret kundeimport, der er implementeret i RenOS. Systemet sikrer, at alle kalenderbegivenheder er korrekt synkroniseret mellem Google Calendar og RenOS-databasen, og giver omfattende funktionalitet til import af kunder med validering og automatisk kalenderintegration.

## ✨ Funktioner

### Calendar Synchronization Service

**Filsti:** `src/services/calendarSyncService.ts`

**Funktioner:**
- ✅ **Bidirektional synkronisering** mellem Google Calendar og RenOS database
- ✅ **Unidirektional synkronisering** (Google → DB eller DB → Google)
- ✅ **Automatisk oprettelse** af bookinger fra Google Calendar events
- ✅ **Automatisk oprettelse** af Google Calendar events fra database bookinger
- ✅ **Konfliktløsning** og fejlhåndtering
- ✅ **Sync status tracking** og rapportering

**API Endpoints:**
- `POST /api/calendar-sync/sync` - Fuldt synkronisering
- `GET /api/calendar-sync/status` - Sync status
- `POST /api/calendar-sync/sync-google-to-db` - Google → Database
- `POST /api/calendar-sync/sync-db-to-google` - Database → Google

### 2. Enhanced Customer Import Service

**Filsti:** `src/services/enhancedCustomerImportService.ts`

**Funktioner:**
- ✅ **CSV og JSON import** med validering
- ✅ **Automatisk kundeoprettelse** med duplicate detection
- ✅ **Booking oprettelse** med Google Calendar integration
- ✅ **Data validering** og fejlrapportering
- ✅ **Batch processing** for store datasæt
- ✅ **Export funktionalitet** til CSV

**API Endpoints:**
- `POST /api/customer-import/import` - JSON import
- `POST /api/customer-import/import-csv` - CSV import
- `GET /api/customer-import/export` - Export til CSV
- `GET /api/customer-import/statistics` - Import statistikker
- `POST /api/customer-import/validate` - Data validering

## 🛠️ CLI Værktøjer

### Calendar Sync Tool

**Filsti:** `src/tools/calendarSyncTool.ts`

**Kommandoer:**
```bash
# Fuldt synkronisering
npm run calendar:sync sync

# Vis sync status
npm run calendar:status

# Google Calendar → Database
npm run calendar:google-to-db

# Database → Google Calendar
npm run calendar:db-to-google
```

### Customer Import Tool

**Filsti:** `src/tools/customerImportTool.ts`

**Kommandoer:**
```bash
# Import fra JSON fil
npm run customer:import import customers.json

# Import fra CSV fil
npm run customer:import-csv import-csv customers.csv --create-bookings

# Export til CSV
npm run customer:export export customers_export.csv

# Vis statistikker
npm run customer:import-stats statistics

# Valider data
npm run customer:validate validate customers.json
```

## 📊 Data Strukturer

### Calendar Sync Options

```typescript
interface CalendarSyncOptions {
    calendarId?: string;                    // Default: "primary"
    syncDirection?: "bidirectional" | "google_to_db" | "db_to_google";
    forceSync?: boolean;                   // Default: false
    maxEvents?: number;                    // Default: 1000
}
```

### Customer Import Data

```typescript
interface CustomerImportData {
    name: string;                          // Påkrævet
    email?: string;                        // Valgfri
    phone?: string;                        // Valgfri
    address?: string;                      // Valgfri
    companyName?: string;                  // Valgfri
    notes?: string;                        // Valgfri
    tags?: string[];                       // Valgfri
    totalLeads?: number;                   // Historisk data
    totalBookings?: number;                // Historisk data
    totalRevenue?: number;                 // Historisk data
    lastContactAt?: Date;                  // Historisk data
    bookings?: Array<{                     // Booking data
        startTime: Date;
        endTime: Date;
        serviceType: string;
        status: string;
        notes?: string;
    }>;
}
```

## 🔄 Workflows

### Calendar Synchronization Workflow

```mermaid
graph TD
    A[Start Sync] --> B[Fetch Google Events]
    B --> C[Fetch Database Bookings]
    C --> D[Create Event Maps]
    D --> E{Sync Direction?}
    E -->|Bidirectional| F[Update Existing]
    E -->|Google→DB| G[Create Bookings from Events]
    E -->|DB→Google| H[Create Events from Bookings]
    F --> I[Handle Deleted Events]
    G --> I
    H --> I
    I --> J[Update Sync Time]
    J --> K[Return Results]
```

### Customer Import Workflow

```mermaid
graph TD
    A[Start Import] --> B[Validate Data]
    B --> C{Valid?}
    C -->|No| D[Report Errors]
    C -->|Yes| E[Process Batch]
    E --> F[Find/Create Customer]
    F --> G{Create Bookings?}
    G -->|Yes| H[Create Bookings with Calendar]
    G -->|No| I[Update Customer Stats]
    H --> I
    I --> J[Next Customer]
    J --> K{More Customers?}
    K -->|Yes| E
    K -->|No| L[Return Results]
```

## 📋 Eksempler

### 1. Calendar Synchronization

```typescript
import { syncCalendar, getCalendarSyncStatus } from './services/calendarSyncService';

// Fuldt synkronisering
const result = await syncCalendar({
    calendarId: "primary",
    syncDirection: "bidirectional",
    maxEvents: 1000
});

console.log(`Processed: ${result.eventsProcessed}`);
console.log(`Created: ${result.eventsCreated}`);
console.log(`Updated: ${result.eventsUpdated}`);

// Vis sync status
const status = await getCalendarSyncStatus();
console.log(`Last sync: ${status.lastSync}`);
console.log(`Total events: ${status.totalEvents}`);
```

### 2. Customer Import

```typescript
import { importCustomers, importFromCSV } from './services/enhancedCustomerImportService';

// Import fra JSON
const customers = [
    {
        name: "John Doe",
        email: "john@example.com",
        phone: "+45 12345678",
        address: "Testvej 123, 8000 Aarhus",
        tags: ["vip", "regular"],
        bookings: [{
            startTime: new Date("2025-10-15T10:00:00Z"),
            endTime: new Date("2025-10-15T12:00:00Z"),
            serviceType: "Fast rengøring",
            status: "scheduled"
        }]
    }
];

const result = await importCustomers(customers, {
    validateData: true,
    createBookings: true,
    sendConfirmations: false,
    dryRun: false
});

// Import fra CSV
const csvData = `Name,Email,Phone,Address
John Doe,john@example.com,+45 12345678,Testvej 123
Jane Smith,jane@example.com,+45 87654321,Testgade 456`;

const csvResult = await importFromCSV(csvData, {
    validateData: true,
    createBookings: true
});
```

### 3. API Brug

```bash
# Calendar sync
curl -X POST http://localhost:3000/api/calendar-sync/sync \
  -H "Content-Type: application/json" \
  -d '{"syncDirection": "bidirectional", "maxEvents": 500}'

# Customer import
curl -X POST http://localhost:3000/api/customer-import/import \
  -H "Content-Type: application/json" \
  -d '{
    "customers": [
      {
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "+45 12345678"
      }
    ],
    "options": {
      "validateData": true,
      "createBookings": false
    }
  }'

# Export customers
curl -X GET http://localhost:3000/api/customer-import/export \
  -H "Accept: text/csv" \
  -o customers.csv
```

## 🔧 Konfiguration

### Environment Variables

```env
# Google Calendar (eksisterende)
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk

# Database (eksisterende)
DATABASE_URL="postgresql://user:password@localhost:5432/rendetalje"

# Sync konfiguration (nye)
CALENDAR_SYNC_ENABLED=true
CALENDAR_SYNC_INTERVAL=3600000  # 1 time i millisekunder
CUSTOMER_IMPORT_BATCH_SIZE=50
CUSTOMER_IMPORT_VALIDATE_EMAIL=true
```

### Database Schema

Systemet bruger eksisterende Prisma schema med følgende modeller:
- `Customer` - Kunde data
- `Booking` - Booking data med calendar integration
- `Analytics` - Sync status tracking

## 🚀 Deployment

### Render.com Deployment

1. **Environment Variables:**
   - Sæt alle nødvendige Google Calendar credentials
   - Sæt DATABASE_URL til production database
   - Sæt CALENDAR_SYNC_ENABLED=true

2. **Build Process:**
   ```bash
   npm run build
   npm run db:migrate
   ```

3. **Startup:**
   ```bash
   npm run start:prod
   ```

### CLI Tools i Production

```bash
# Calendar sync
npm run calendar:sync sync

# Customer import
npm run customer:import import-csv customers.csv --create-bookings

# Status check
npm run calendar:status
npm run customer:import-stats statistics
```

## 📈 Performance

### Calendar Sync
- **Processing time:** ~2-5 sekunder per 100 events
- **Memory usage:** ~50MB for 1000 events
- **Database queries:** Optimized med batching

### Customer Import
- **Processing time:** ~100ms per customer
- **Batch size:** 50 customers per batch (konfigurerbar)
- **Memory usage:** ~10MB per 1000 customers

## 🔍 Monitoring

### Logs
- Alle operationer logges med structured logging
- Error tracking og performance metrics
- Sync status og import statistikker

### Health Checks
- Database connection status
- Google Calendar API status
- Sync status og last sync time

## 🐛 Troubleshooting

### Common Issues

1. **Calendar Sync Fails**
   - Check Google Calendar API credentials
   - Verify database connection
   - Check RUN_MODE setting

2. **Customer Import Errors**
   - Validate data format
   - Check required fields
   - Verify email format

3. **Performance Issues**
   - Reduce batch size
   - Check database performance
   - Monitor memory usage

### Debug Commands

```bash
# Test calendar sync
npm run calendar:status

# Test customer import
npm run customer:validate validate customers.json

# Check database
npm run db:studio
```

## 📚 Se Også

- [Calendar Booking System](./CALENDAR_BOOKING.md)
- [Customer Database Integration](./CUSTOMER_DATABASE.md)
- [API Documentation](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)

