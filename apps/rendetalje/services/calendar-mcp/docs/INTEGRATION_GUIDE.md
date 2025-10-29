# RenOS Calendar MCP - Integration Guide

## Oversigt

Denne guide beskriver hvordan du integrerer RenOS Calendar MCP med eksisterende systemer og workflows.

## Billy.dk Integration

### Setup

```typescript
// Environment variables
BILLY_API_KEY=your_billy_api_key
BILLY_ORGANIZATION_ID=your_org_id
ENABLE_AUTO_INVOICE=true
```

### Automatisk Faktura Oprettelse

```typescript
import { autoCreateInvoice } from './src/tools/invoice-automation';

const result = await autoCreateInvoice({
  bookingId: 'booking-123',
  sendImmediately: false
});

console.log(result);
// Output: { invoiceId: 'inv_123', status: 'created', totalAmount: 1047 }
```

### Payment Monitoring

```typescript
// Automatisk overvågning af betalinger
const paymentStatus = await checkPaymentStatus({
  invoiceId: 'inv_123'
});

if (paymentStatus.paid) {
  console.log('Faktura betalt!');
}
```

## Google Calendar Integration

### Setup

```typescript
// Environment variables
GOOGLE_CLIENT_EMAIL=renos-319@renos-465008.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_PROJECT_ID=renos-465008
GOOGLE_CALENDAR_ID=your_calendar_id
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
```

### Event Oprettelse

```typescript
import { createCalendarEvent } from './src/integrations/google-calendar';

const event = await createCalendarEvent({
  summary: 'Rengøring - Kunde Navn',
  description: 'Fast rengøring hos kunde',
  start: '2025-01-20T09:00:00+01:00',
  end: '2025-01-20T12:00:00+01:00',
  location: 'Kunde Adresse'
});

console.log(event.id); // Google Calendar event ID
```

### Konflikt Detektion

```typescript
import { checkBookingConflicts } from './src/tools/booking-validator';

const conflicts = await checkBookingConflicts({
  startTime: '09:00',
  endTime: '12:00',
  excludeBookingId: 'booking-123'
});

if (conflicts.hasConflicts) {
  console.log('Konflikt detekteret!');
  console.log(conflicts.conflicts);
}
```

## Twilio Voice Integration

### Setup

```typescript
// Environment variables
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

### Voice Alerts

```typescript
import { sendVoiceAlert } from './src/integrations/twilio-voice';

// Overtid alert
await sendVoiceAlert({
  to: '+4512345678',
  message: 'Overtid detekteret! Booking er 2 timer over estimatet.',
  priority: 'high'
});

// Dobbeltbooking alert
await sendVoiceAlert({
  to: '+4512345678',
  message: 'Dobbeltbooking detekteret! Tjek kalenderen umiddelbart.',
  priority: 'critical'
});
```

## Supabase Database Integration

### Setup

```typescript
// Environment variables
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### Customer Intelligence

```typescript
import { getCustomerMemory } from './src/tools/customer-memory';

const intelligence = await getCustomerMemory({
  includeHistory: true,
  customerId: 'customer-123'
});

console.log(intelligence.intelligence);
// Output: Customer preferences, booking patterns, etc.
```

### Overtime Tracking

```typescript
import { trackOvertimeRisk } from './src/tools/overtime-tracker';

const overtime = await trackOvertimeRisk({
  bookingId: 'booking-123',
  currentDuration: 300, // 5 hours
  estimatedDuration: 180 // 3 hours
});

if (overtime.status === 'alert') {
  console.log('Overtid detekteret!');
  console.log(`Overtid: ${overtime.overtimeMinutes} minutter`);
}
```

## Tekup-Billy MCP Integration

### Billy.dk API Calls

```typescript
// Automatisk faktura oprettelse via Billy.dk
const invoice = await createBillyInvoice({
  customerId: 'customer-123',
  items: [
    {
      description: 'Rengøring - 3 timer',
      quantity: 3,
      unitPrice: 349
    }
  ],
  dueDate: '2025-02-20'
});

console.log(invoice.invoiceId);
```

### Payment Status Monitoring

```typescript
// Overvåg betalingsstatus
const paymentStatus = await getPaymentStatus({
  invoiceId: 'inv_123'
});

if (paymentStatus.status === 'paid') {
  console.log('Faktura betalt!');
  // Opdater booking status
  await updateBookingStatus('booking-123', 'completed');
}
```

## Mobile PWA Dashboard Integration

### API Endpoints

```typescript
// Backend API endpoints
const API_BASE = 'https://renos-calendar-mcp.onrender.com';

// Health check
const health = await fetch(`${API_BASE}/health`);

// Tools endpoint
const tools = await fetch(`${API_BASE}/tools`);

// Specific tool calls
const validation = await fetch(`${API_BASE}/validate-booking`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2025-01-20',
    expectedDayName: 'mandag',
    customerId: 'customer-123'
  })
});
```

### Real-time Updates

```typescript
// WebSocket connection for real-time updates
const ws = new WebSocket('wss://renos-calendar-mcp.onrender.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'overtime_alert') {
    showOvertimeAlert(data.message);
  }
  
  if (data.type === 'booking_conflict') {
    showConflictWarning(data.conflicts);
  }
};
```

## Error Handling & Fail-Safe Mode

### Confidence-based Automation

```typescript
// Fail-safe mode aktiveres automatisk ved lav confidence
const validation = await validateBookingDate({
  date: '2025-01-20',
  expectedDayName: 'mandag',
  customerId: 'customer-123'
});

if (validation.confidence < 0.8) {
  console.log('Fail-safe mode: Manual review required');
  // Send til manual review queue
  await sendToManualReview(validation);
}
```

### Undo Function

```typescript
import { undoManager } from './src/utils/undo-manager';

// Registrer undoable action
const undoId = undoManager.registerAction({
  type: 'booking_created',
  entityId: 'booking-123',
  before: null,
  after: bookingData,
  performedBy: 'system'
});

// Undo action (5-minute window)
await undoManager.undo(undoId);
```

## Performance Optimization

### Redis Caching

```typescript
// Cache customer intelligence
const cachedIntelligence = await redis.get(`customer:${customerId}`);
if (cachedIntelligence) {
  return JSON.parse(cachedIntelligence);
}

// Cache for 1 hour
await redis.setex(`customer:${customerId}`, 3600, JSON.stringify(intelligence));
```

### Database Connection Pooling

```typescript
// Supabase connection pooling
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  }
);
```

## Monitoring & Logging

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      supabase: await checkSupabaseConnection(),
      google: await checkGoogleCalendarConnection(),
      twilio: await checkTwilioConnection(),
      billy: await checkBillyConnection()
    }
  };
  
  res.json(health);
});
```

### Logging

```typescript
import { logger } from './src/utils/logger';

// Log alle kritiske events
logger.info('Booking created', {
  bookingId: 'booking-123',
  customerId: 'customer-123',
  timestamp: new Date().toISOString()
});

logger.error('Overtime detected', {
  bookingId: 'booking-123',
  overtimeMinutes: 120,
  alertSent: true
});
```

## Troubleshooting

### Common Issues

1. **Google Calendar API Errors**
   - Check service account permissions
   - Verify calendar ID
   - Ensure impersonation is set up correctly

2. **Supabase Connection Issues**
   - Verify URL and keys
   - Check database permissions
   - Ensure tables exist

3. **Twilio Voice Failures**
   - Check account SID and auth token
   - Verify phone number format
   - Ensure sufficient credits

4. **Billy.dk API Errors**
   - Verify API key and organization ID
   - Check customer exists in Billy
   - Ensure proper authentication

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG = 'renos-calendar-mcp:*';

// Verbose logging
process.env.LOG_LEVEL = 'debug';
```

## Security Considerations

### Environment Variables

- Never commit secrets to Git
- Use Render Environment Groups
- Rotate keys regularly

### API Security

- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Authentication tokens

### Data Protection

- Encrypt sensitive data
- GDPR compliance
- Data retention policies
- Audit logging

---

*Denne guide dækker alle aspekter af RenOS Calendar MCP integration.*
