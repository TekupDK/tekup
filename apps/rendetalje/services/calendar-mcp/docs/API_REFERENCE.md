# RenOS Calendar Intelligence MCP - API Reference

Komplet dokumentation af alle 5 MCP tools.

## Table of Contents
1. [validate_booking_date](#1-validate_booking_date)
2. [check_booking_conflicts](#2-check_booking_conflicts)
3. [auto_create_invoice](#3-auto_create_invoice)
4. [track_overtime_risk](#4-track_overtime_risk)
5. [get_customer_memory](#5-get_customer_memory)

---

## 1. validate_booking_date

**Formål**: Validér booking dato og tjek mod ugedag. Stopper "28. oktober er mandag" fejl (det er tirsdag!).

### Input Parameters

```typescript
{
  date: string;              // ISO date string (YYYY-MM-DD)
  expectedDayName?: string;  // Forventet ugedag (f.eks. "mandag")
  customerId?: string;       // Kunde ID for mønster-check
}
```

### Output

```typescript
{
  valid: boolean;              // Er datoen valid?
  confidence: number;          // 0-100 confidence score
  warnings: ValidationWarning[];
  errors: ValidationError[];
  suggestion?: string;
  requiresManualReview: boolean;
}
```

### Eksempel: Fejl-detektion

**Request**:
```json
{
  "date": "2025-10-28",
  "expectedDayName": "mandag",
  "customerId": "jes-vestergaard"
}
```

**Response**:
```json
{
  "valid": false,
  "confidence": 40,
  "warnings": [],
  "errors": [{
    "type": "date_mismatch",
    "message": "Fejl: 28. oktober er tirsdag, ikke mandag!",
    "field": "date",
    "data": {
      "date": "2025-10-28",
      "actualDay": "tirsdag",
      "expectedDay": "mandag"
    }
  }],
  "suggestion": "Ret følgende fejl før booking: date_mismatch",
  "requiresManualReview": false
}
```

### Eksempel: Mønster-violation

**Request** (Jes booker normalt mandage):
```json
{
  "date": "2025-10-29",
  "customerId": "jes-vestergaard"
}
```

**Response**:
```json
{
  "valid": true,
  "confidence": 75,
  "warnings": [{
    "type": "pattern_violation",
    "message": "Afviger fra kundens faste mønster: Jes Vestergaard booker normalt om mandag",
    "severity": "medium",
    "data": {
      "fixedDayOfWeek": 1,
      "bookingDayOfWeek": 3,
      "confidence": 95
    }
  }],
  "errors": [],
  "suggestion": "Vær opmærksom på advarslerne før du fortsætter",
  "requiresManualReview": false
}
```

### Use Cases

✅ Fang dato/ugedag mismatch INDEN booking sendes  
✅ Tjek mod kunders faste mønstre (Jes = mandage)  
✅ Blokér weekend-bookinger automatisk  
✅ Advar ved usædvanlige bookings

---

## 2. check_booking_conflicts

**Formål**: Tjek for dobbeltbookinger i Google Calendar. 0 dobbeltbookinger garanteret!

### Input Parameters

```typescript
{
  startTime: string;          // ISO datetime string
  endTime: string;            // ISO datetime string
  excludeBookingId?: string;  // Ekskluder specifik booking (ved reschedule)
}
```

### Output

```typescript
{
  valid: boolean;
  confidence: number;
  warnings: ValidationWarning[];
  errors: ValidationError[];  // Conflicts listed her!
  suggestion?: string;
  requiresManualReview: boolean;
}
```

### Eksempel: Ingen konflikter

**Request**:
```json
{
  "startTime": "2025-10-22T09:00:00+02:00",
  "endTime": "2025-10-22T12:00:00+02:00"
}
```

**Response**:
```json
{
  "valid": true,
  "confidence": 100,
  "warnings": [],
  "errors": [],
  "suggestion": "Booking ser god ud! Alt OK.",
  "requiresManualReview": false
}
```

### Eksempel: Dobbeltbooking detekteret!

**Request**:
```json
{
  "startTime": "2025-10-22T10:00:00+02:00",
  "endTime": "2025-10-22T14:00:00+02:00"
}
```

**Response**:
```json
{
  "valid": false,
  "confidence": 0,
  "warnings": [],
  "errors": [{
    "type": "double_booking",
    "message": "DOBBELTBOOKING DETEKTERET! Konflikter: Flytterengøring #3 - Erik Gideon (2025-10-22T10:00:00+02:00)",
    "field": "time",
    "data": {
      "conflicts": [{
        "id": "event_abc123",
        "summary": "Flytterengøring #3 - Erik Gideon",
        "start": "2025-10-22T10:00:00+02:00",
        "end": "2025-10-22T13:00:00+02:00"
      }]
    }
  }],
  "suggestion": "Ret følgende fejl før booking: double_booking",
  "requiresManualReview": false
}
```

### Use Cases

✅ 100% garanti mod dobbeltbookinger  
✅ Real-time check mod Google Calendar  
✅ Inkluder konflikter i fejl-besked  
✅ Support for reschedule (ekskluder eksisterende booking)

---

## 3. auto_create_invoice

**Formål**: Automatisk opret faktura via Billy.dk MCP efter booking. Ingen glemte fakturaer nogensinde!

### Input Parameters

```typescript
{
  bookingId: string;          // Booking ID
  sendImmediately?: boolean;  // Send faktura med det samme? (default: false)
}
```

### Output

```typescript
{
  bookingId: string;
  customerId: string;
  status: 'pending' | 'created' | 'sent' | 'paid' | 'failed';
  billyInvoiceId?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt?: string;
  sentAt?: string;
  errors?: string[];
}
```

### Eksempel: Faktura oprettet

**Request**:
```json
{
  "bookingId": "booking-123",
  "sendImmediately": false
}
```

**Response**:
```json
{
  "bookingId": "booking-123",
  "customerId": "jes-vestergaard",
  "status": "created",
  "billyInvoiceId": "invoice_xyz789",
  "items": [{
    "productId": "REN-002",
    "description": "Flytterengøring - 3 timer",
    "quantity": 3,
    "unitPrice": 349,
    "total": 1047
  }],
  "subtotal": 1047,
  "tax": 261.75,
  "total": 1308.75,
  "createdAt": "2025-10-21T12:00:00Z"
}
```

### Eksempel: Send med det samme

**Request**:
```json
{
  "bookingId": "booking-456",
  "sendImmediately": true
}
```

**Response**:
```json
{
  "status": "sent",
  "sentAt": "2025-10-21T12:01:00Z",
  ...
}
```

### Use Cases

✅ Auto-faktura efter hver booking  
✅ Daglig scan for manglende fakturaer  
✅ Direkte integration med Billy MCP  
✅ Optional immediate send

---

## 4. track_overtime_risk

**Formål**: Track job duration og send voice alerts ved overtid. Stopper Vinni/Kate situationer (9 timer vs 6 timer)!

### Input Parameters

```typescript
{
  bookingId: string;          // Booking ID
  currentDuration: number;    // Nuværende varighed i MINUTTER
  estimatedDuration: number;  // Estimeret varighed i MINUTTER
}
```

### Output

```typescript
{
  status: 'ok' | 'warning' | 'alert';
  overtimeMinutes: number;
  alertSent: boolean;
  message: string;
  log?: OvertimeLog;
}
```

### Eksempel: På plan

**Request**:
```json
{
  "bookingId": "booking-123",
  "currentDuration": 90,
  "estimatedDuration": 120
}
```

**Response**:
```json
{
  "status": "ok",
  "overtimeMinutes": -30,
  "alertSent": false,
  "message": "Job på plan: 90 minutter af 120 minutter"
}
```

### Eksempel: Overtids-alarm!

**Request**:
```json
{
  "bookingId": "booking-123",
  "currentDuration": 180,
  "estimatedDuration": 120
}
```

**Response**:
```json
{
  "status": "alert",
  "overtimeMinutes": 60,
  "alertSent": true,
  "message": "OVERTIDS-ALARM! 60 minutter overtid (1.0 timer)",
  "log": {
    "id": "log_abc123",
    "bookingId": "booking-123",
    "estimatedHours": 2,
    "actualHours": 3,
    "overtimeHours": 1,
    "alertSentAt": "2025-10-21T12:00:00Z",
    "alertMethod": "voice",
    "communicationLog": [{
      "timestamp": "2025-10-21T12:00:00Z",
      "type": "call",
      "direction": "outgoing",
      "content": "Voice alert sent: Overtids-alarm! Kunde Vinni Hansen...",
      "outcome": "completed"
    }],
    "customerNotified": false
  }
}
```

### Use Cases

✅ Live tracking af job varighed  
✅ Auto voice call ved +60 min overtid  
✅ Log alle kommunikationer  
✅ Lærer mønstre ("Flytterengøring = +50% tid")

---

## 5. get_customer_memory

**Formål**: Hent komplet kunde-intelligence: mønstre, præferencer, historik. Husker "Jes = kun mandage", "nøgle under potte", etc.

### Input Parameters

```typescript
{
  customerId?: string;         // Kunde ID
  customerName?: string;       // Kunde navn (fuzzy search)
  includeHistory?: boolean;    // Inkluder booking historik (default: true)
}
```

### Output

```typescript
{
  found: boolean;
  intelligence?: CustomerIntelligence;
  suggestions?: string[];  // Hjælpsomme forslag
  message: string;
}
```

### Eksempel: Jes Vestergaard

**Request**:
```json
{
  "customerId": "jes-vestergaard"
}
```

**Response**:
```json
{
  "found": true,
  "intelligence": {
    "id": "...",
    "customerId": "jes-vestergaard",
    "customerName": "Jes Vestergaard",
    "accessNotes": "Ekstranøgle under potteplante ved hoveddør",
    "preferences": {
      "confirmationRequired": true,
      "preferredDays": [1],
      "avoidWeekends": true
    },
    "fixedSchedule": {
      "dayOfWeek": 1,
      "time": "08:30",
      "frequency": "weekly",
      "confidence": 95
    },
    "totalBookings": 24,
    "completedBookings": 24,
    "averageJobDuration": 2.5,
    "riskScore": 15,
    "totalRevenue": 21000,
    "averageBookingValue": 875,
    "satisfactionScore": 4.8,
    "paymentHistory": "excellent"
  },
  "suggestions": [
    "📍 Adgang: Ekstranøgle under potteplante ved hoveddør",
    "📅 Fast rytme: mandag kl. 08:30 (95% sikker)",
    "💚 Foretrukne dage: man",
    "✅ VIGTIGT: Bekræft altid ugedag med denne kunde!",
    "🚫 Undgår weekender - book IKKE lørdag/søndag",
    "📊 24 bookinger, 100% gennemført",
    "⏱️ Typisk varighed: 2.5 timer",
    "⭐⭐⭐⭐⭐ Tilfredshed: 4.8/5",
    "💵 Total omsætning: 21.000 kr (gns. 875 kr/booking)"
  ],
  "message": "Kunde-intelligence for Jes Vestergaard hentet succesfuldt"
}
```

### Eksempel: Fuzzy search

**Request**:
```json
{
  "customerName": "Vibeke"
}
```

**Response**: Finder "Vibeke Bregnballe" med delvist match.

### Use Cases

✅ Auto-inject kunde-info når booking oprettes  
✅ Vis advarsler baseret på historik  
✅ Husk faste mønstre (Jes = mandage)  
✅ Risk assessment (tidligere no-shows, etc)

---

## Error Handling

Alle tools returnerer standardiseret fejl-format:

```typescript
{
  success: false,
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
}
```

### Eksempel fejl:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format"
  }
}
```

## Rate Limiting

HTTP API er rate limited til:
- **100 requests per 15 minutter** per IP
- Status 429 ved overskridelse

## Authentication

For HTTP mode, brug header:
```
X-API-Key: your_mcp_api_key
```

## Fail-Safe Mode

Når `confidence < 80%`, kræves manuel review:

```json
{
  "valid": true,
  "confidence": 75,
  "requiresManualReview": true,
  "warnings": [{
    "type": "pattern_violation",
    "message": "Lav confidence (75%) - manuel gennemgang påkrævet!",
    "severity": "high"
  }]
}
```

---

**Næste**: Se [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for hvordan du integrerer med RenOS backend.

