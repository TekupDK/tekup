# RendetaljeOS - Complete Implementation Plan & Coding Checklist
**Based on Competitive Analysis & Design Document**

## Document Overview
- **Created**: 2025-10-19
- **Source**: Competitive Analysis Report v1.0
- **Target Systems**: 
  - RendetaljeOS Backend (C:\Users\empir\RendetaljeOS\apps\backend)
  - RendetaljeOS Frontend (C:\Users\empir\RendetaljeOS\apps\frontend)
  - RendetaljeOS-Mobile (C:\Users\empir\Tekup-Cloud\RendetaljeOS-Mobile)
- **Implementation Timeline**: 90 days (3 phases)

---

## 🎯 PHASE 1: Foundation & Stabilization (Weeks 1-4)

### 1.1 Repository Cleanup & Git Management

#### ✅ Task 1.1.1: Backend Repository Stabilization
**Priority**: 🔴 Critical | **Est**: 2h

**Actions**:
- [ ] Navigate to backend: `cd C:\Users\empir\RendetaljeOS\apps\backend`
- [ ] Review uncommitted files: `git status`
- [ ] Commit in logical groups with descriptive messages
- [ ] Push all branches to remote
- [ ] Document branch strategy in DEVELOPMENT.md

---

#### ✅ Task 1.1.2: Frontend Branch Resolution  
**Priority**: 🔴 Critical | **Est**: 3h

**Actions**:
- [ ] Checkout feature/frontend-redesign branch
- [ ] Test redesign: `pnpm dev`
- [ ] Merge to main OR document remaining work
- [ ] Update CHANGELOG.md

---

### 1.2 Testing Framework Implementation

#### ✅ Task 1.2.1: Backend Testing Infrastructure
**Priority**: 🔴 Critical | **Est**: 8h

**Setup**:
```bash
cd C:\Users\empir\RendetaljeOS\apps\backend
pnpm add -D @playwright/test playwright vitest @vitest/ui
```

**Create Structure**:
```
backend/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── vitest.config.ts
└── playwright.config.ts
```

**Critical Test Flows**:
- [ ] Email lead → Intent classification → Auto-response
- [ ] Lead → Customer → Booking creation
- [ ] Booking → Calendar sync → Invoice
- [ ] Billy.dk integration
- [ ] AI agent workflow

**Target**: 40% code coverage

---

### 1.3 Production Monitoring

#### ✅ Task 1.3.1: Activate Sentry
**Priority**: 🔴 Critical | **Est**: 3h

**Environment Variables**:
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

**Configure**:
- [ ] Backend: Verify DSN, test error capture
- [ ] Frontend: Add error boundary, performance monitoring  
- [ ] Mobile: Install sentry-expo, configure app.json

---

#### ✅ Task 1.3.2: Uptime Monitoring
**Priority**: 🔴 Critical | **Est**: 2h

**Create Health Endpoint**:
```typescript
// apps/backend/src/routes/health.ts
router.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    gmail: await checkGmailAPI(),
    calendar: await checkCalendarAPI(),
    billy: await checkBillyAPI(),
  };
  res.json({ status: 'ok', checks, timestamp: new Date() });
});
```

**Setup Monitors**:
- [ ] Choose service (UptimeRobot/Better Uptime)
- [ ] Monitor API, frontend, database
- [ ] Configure email/SMS alerts
- [ ] Target: 99.9% uptime

---

## 🚀 PHASE 2: Customer Essentials (Weeks 5-8)

### 2.1 Online Booking Widget

#### ✅ Task 2.1.1: Backend API
**Priority**: 🔴 Critical | **Est**: 12h

**Endpoints**:
```typescript
GET  /api/v1/widget/availability?date=2025-10-20&serviceType=deep-clean
GET  /api/v1/widget/services
POST /api/v1/widget/bookings
```

**Implementation**:
- [ ] Calculate available slots from Calendar + DB
- [ ] Auto-create lead → customer on booking
- [ ] Sync to Google Calendar
- [ ] Send confirmation email
- [ ] Add rate limiting (10 req/15min per IP)
- [ ] Configure CORS for embedding

---

#### ✅ Task 2.1.2: Frontend Widget Component
**Priority**: 🔴 Critical | **Est**: 16h

**Widget Flow**:
1. Service selection → 2. Date/time picker → 3. Customer details → 4. Confirmation

**Features**:
- [ ] Mobile-responsive design
- [ ] Danish language support
- [ ] Theme customization (colors)
- [ ] Real-time availability
- [ ] Form validation
- [ ] GDPR consent checkbox
- [ ] Loading/error states

**Embedding Code**:
```html
<div id="rendetalje-booking-widget"></div>
<script src="https://cdn.rendetalje.dk/widget/v1/booking-widget.js"></script>
<script>
  RendetaljeBookingWidget.init({
    element: '#rendetalje-booking-widget',
    apiKey: 'your-api-key',
    businessId: 'your-business-id',
    primaryColor: '#4F46E5',
    language: 'da'
  });
</script>
```

---

### 2.2 SMS Notification System

#### ✅ Task 2.2.1: Twilio Integration
**Priority**: 🔴 Critical | **Est**: 8h

**Setup**:
```bash
cd apps/backend
pnpm add twilio
```

**Environment**:
```env
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+4512345678
```

**SMS Service**:
```typescript
// apps/backend/src/services/sms.service.ts
class SMSService {
  async sendBookingConfirmation(booking, customer)
  async sendAppointmentReminder(booking, customer) // 24h before
  async sendCleanerEnroute(booking, customer, cleaner)
  async sendFeedbackRequest(booking, customer) // 2h after
}
```

**Database Schema**:
```prisma
model SmsLog {
  id          String   @id @default(cuid())
  to          String
  message     String
  twilioSid   String   @unique
  status      String
  sentAt      DateTime
  deliveredAt DateTime?
}
```

**Integrate**:
- [ ] Send confirmation on booking creation
- [ ] Schedule reminder 24h before
- [ ] Enroute notification when cleaner starts
- [ ] Feedback request 2h after completion

---

#### ✅ Task 2.2.2: SMS Scheduler with BullMQ
**Priority**: 🟡 Medium | **Est**: 6h

**Setup Queue**:
```bash
pnpm add bullmq ioredis
```

**Implementation**:
```typescript
// Schedule 24h reminder
await smsQueue.add('appointment-reminder', {
  type: 'APPOINTMENT_REMINDER',
  bookingId: booking.id
}, {
  delay: calculateDelay(booking.scheduledStart, 24 * 60 * 60 * 1000)
});
```

**Requirements**:
- [ ] Redis connection (Upstash for production)
- [ ] Worker to process jobs
- [ ] Retry logic for failed SMS
- [ ] Job monitoring dashboard

---

### 2.3 Customer Self-Service Portal

#### ✅ Task 2.3.1: Customer Authentication
**Priority**: 🔴 Critical | **Est**: 8h

**Auth Options**:
- Magic link email (passwordless)
- Phone OTP (via Twilio)
- Integration with existing Clerk setup

**Implementation**:
```typescript
// Send magic link
POST /api/v1/customer/auth/magic-link
Body: { email: "kunde@example.dk" }

// Verify token and login
GET /api/v1/customer/auth/verify?token=xxx
```

**Features**:
- [ ] Generate secure token (JWT)
- [ ] Email magic link
- [ ] Verify and create session
- [ ] Token expiration (15 min)
- [ ] Rate limiting

---

#### ✅ Task 2.3.2: Customer Portal Pages
**Priority**: 🔴 Critical | **Est**: 16h

**Pages to Build**:

1. **Dashboard** (`/portal/dashboard`)
   - Upcoming bookings (next 30 days)
   - Recent invoices
   - Quick actions (book new, contact support)

2. **Booking History** (`/portal/bookings`)
   - List all past/future bookings
   - Filter by status, date
   - View booking details
   - Download invoice

3. **Account Settings** (`/portal/settings`)
   - Update contact info (name, phone, email)
   - Update address
   - SMS notification preferences
   - Delete account (GDPR)

4. **Invoices** (`/portal/invoices`)
   - List all invoices
   - Download PDF
   - Payment status
   - Link to Billy.dk for payment

5. **New Booking** (`/portal/book`)
   - Reuse booking widget
   - Pre-filled customer info
   - Saved addresses

**Tech Stack**:
- Next.js App Router
- Tailwind CSS + shadcn/ui
- React Query for data fetching
- Zustand for state management

---

### 2.4 Quote Templates Library

#### ✅ Task 2.4.1: Quote Template System
**Priority**: 🟡 Medium | **Est**: 10h

**Database Schema**:
```prisma
model QuoteTemplate {
  id          String   @id @default(cuid())
  name        String   // "Standard Apartment Clean"
  description String?
  services    Json     // Array of service items
  pricing     Json     // Base price, modifiers
  duration    Int      // Estimated minutes
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Quote {
  id            String   @id @default(cuid())
  leadId        String?
  customerId    String?
  templateId    String?
  items         Json     // Line items
  subtotal      Decimal
  tax           Decimal
  total         Decimal
  validUntil    DateTime
  status        String   // DRAFT, SENT, ACCEPTED, REJECTED
  acceptedAt    DateTime?
  createdAt     DateTime @default(now())
}
```

**Template Examples**:
```json
{
  "name": "Standard Apartment (80m²)",
  "services": [
    { "name": "Kitchen deep clean", "price": 400, "duration": 60 },
    { "name": "Bathroom cleaning", "price": 250, "duration": 45 },
    { "name": "Floors (vacuum + mop)", "price": 200, "duration": 30 },
    { "name": "Dusting all surfaces", "price": 150, "duration": 30 }
  ],
  "total": 1000,
  "duration": 165
}
```

**Features**:
- [ ] Admin UI to create/edit templates
- [ ] Pricing calculator (base + modifiers for sqm, extras)
- [ ] One-click quote generation from template
- [ ] Email quote to customer
- [ ] Customer acceptance workflow
- [ ] Auto-convert accepted quote to booking

---

## 📱 PHASE 3: Mobile Enhancement (Weeks 9-12)

### 3.1 Mobile App Core Features

#### ✅ Task 3.1.1: Job Management Screen
**Priority**: 🔴 Critical | **Est**: 12h

**Screen**: Today's Schedule (`/app/(tabs)/dashboard.tsx`)

**Features**:
- [ ] List today's bookings
- [ ] Start/end job buttons
- [ ] Timer tracking
- [ ] Customer contact (call/SMS)
- [ ] Navigation to job site (Google Maps)
- [ ] Job details (address, notes, checklist)

**Implementation**:
```typescript
// components/cleaning/JobCard.tsx
export function JobCard({ booking }) {
  const [status, setStatus] = useState(booking.status);
  const [timer, setTimer] = useState(0);
  
  async function startJob() {
    // Start timer and GPS tracking
    await api.post(`/bookings/${booking.id}/start`, {
      startedAt: new Date(),
      location: await getCurrentLocation()
    });
    setStatus('IN_PROGRESS');
  }
  
  return (
    <View style={styles.card}>
      <Text style={styles.time}>{formatTime(booking.scheduledStart)}</Text>
      <Text style={styles.customer}>{booking.customer.name}</Text>
      <Text style={styles.address}>{booking.location}</Text>
      
      <View style={styles.actions}>
        <Button onPress={() => Linking.openURL(`tel:${booking.customer.phone}`)}>
          Ring kunde
        </Button>
        <Button onPress={() => openMaps(booking.location)}>
          Navigation
        </Button>
        {status === 'PENDING' && <Button onPress={startJob}>Start</Button>}
        {status === 'IN_PROGRESS' && <Button onPress={completeJob}>Afslut</Button>}
      </View>
    </View>
  );
}
```

---

#### ✅ Task 3.1.2: GPS & Time Tracking
**Priority**: 🔴 Critical | **Est**: 10h

**Install Dependencies**:
```bash
npx expo install expo-location expo-task-manager
```

**Implementation**:
```typescript
// hooks/useLocationTracking.ts
export function useLocationTracking() {
  const [location, setLocation] = useState(null);
  
  async function startTracking(bookingId: string) {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    
    // Start tracking
    await Location.startLocationUpdatesAsync('booking-tracking', {
      accuracy: Location.Accuracy.High,
      distanceInterval: 50, // Update every 50m
      foregroundService: {
        notificationTitle: 'Rengøring i gang',
        notificationBody: `Job: ${bookingId}`
      }
    });
  }
  
  return { location, startTracking };
}
```

**Features**:
- [ ] Clock-in with GPS verification (within 100m of job site)
- [ ] Track time spent on job
- [ ] Auto-pause timer on breaks
- [ ] Mileage tracking between jobs
- [ ] Submit timesheet at end of day

---

#### ✅ Task 3.1.3: Photo Upload & Job Completion
**Priority**: 🟡 Medium | **Est**: 8h

**Install**:
```bash
npx expo install expo-image-picker expo-file-system
```

**Implementation**:
```typescript
// screens/JobCompletionScreen.tsx
export function JobCompletionScreen({ bookingId }) {
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  
  async function takPhoto(type: 'before' | 'after') {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      exif: true // Include GPS data
    });
    
    if (!result.canceled) {
      const photo = result.assets[0];
      
      // Upload to backend
      const uploadUrl = await api.post('/bookings/upload-url', {
        bookingId,
        filename: `${type}-${Date.now()}.jpg`
      });
      
      await FileSystem.uploadAsync(uploadUrl.url, photo.uri);
      
      if (type === 'before') {
        setBeforePhotos([...beforePhotos, photo.uri]);
      } else {
        setAfterPhotos([...afterPhotos, photo.uri]);
      }
    }
  }
  
  return (
    <ScrollView>
      <Text>Før billeder</Text>
      <PhotoGrid photos={beforePhotos} onAdd={() => takePhoto('before')} />
      
      <Text>Efter billeder</Text>
      <PhotoGrid photos={afterPhotos} onAdd={() => takePhoto('after')} />
      
      <TextInput 
        placeholder="Noter til kunden..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      
      <Button onPress={completeJob}>Afslut rengøring</Button>
    </ScrollView>
  );
}
```

---

#### ✅ Task 3.1.4: Digital Checklist System
**Priority**: 🟡 Medium | **Est**: 8h

**Database Schema**:
```prisma
model CleaningChecklist {
  id        String   @id @default(cuid())
  name      String
  items     Json     // Array of checklist items
  isDefault Boolean  @default(false)
}

model BookingChecklist {
  id         String   @id @default(cuid())
  bookingId  String
  items      Json     // Items with completion status
  completedBy String?  // Cleaner ID
  completedAt DateTime?
}
```

**Mobile Component**:
```typescript
// components/cleaning/Checklist.tsx
export function Checklist({ bookingId }) {
  const [items, setItems] = useState([
    { id: 1, task: 'Støvsug alle gulve', completed: false },
    { id: 2, task: 'Rengør køkken', completed: false },
    { id: 3, task: 'Rengør badeværelse', completed: false },
    { id: 4, task: 'Tør støv af alle overflader', completed: false },
    { id: 5, task: 'Rengør vinduer', completed: false }
  ]);
  
  function toggleItem(itemId: number) {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, completed: !item.completed }
        : item
    ));
    
    // Auto-save to backend
    api.put(`/bookings/${bookingId}/checklist`, { items });
  }
  
  const progress = items.filter(i => i.completed).length / items.length;
  
  return (
    <View>
      <ProgressBar progress={progress} />
      <Text>{Math.round(progress * 100)}% færdig</Text>
      
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ChecklistItem
            task={item.task}
            completed={item.completed}
            onToggle={() => toggleItem(item.id)}
          />
        )}
      />
    </View>
  );
}
```

---

### 3.2 Push Notifications

#### ✅ Task 3.2.1: Push Notification Setup
**Priority**: 🔴 Critical | **Est**: 6h

**Install**:
```bash
npx expo install expo-notifications expo-device
```

**Backend Integration**:
```typescript
// apps/backend/src/services/push-notification.service.ts
import { Expo } from 'expo-server-sdk';

class PushNotificationService {
  private expo = new Expo();
  
  async sendJobAssignment(cleanerId: string, booking: Booking) {
    const cleaner = await prisma.user.findUnique({ where: { id: cleanerId }});
    
    if (!cleaner.pushToken) return;
    
    await this.expo.sendPushNotificationsAsync([{
      to: cleaner.pushToken,
      sound: 'default',
      title: 'Ny rengøring tildelt',
      body: `${booking.customer.name} - ${formatDate(booking.scheduledStart)}`,
      data: { bookingId: booking.id, screen: 'BookingDetails' }
    }]);
  }
  
  async sendScheduleChange(cleanerId: string, message: string) {
    // Similar implementation
  }
}
```

**Mobile Registration**:
```typescript
// app/_layout.tsx
async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') return;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Send to backend
  await api.post('/user/push-token', { token });
}
```

**Notification Types**:
- [ ] New job assignment
- [ ] Schedule change/cancellation
- [ ] Urgent message from office
- [ ] Payment received
- [ ] Daily schedule summary (morning)

---

### 3.3 Reporting Dashboard

#### ✅ Task 3.3.1: Analytics Backend
**Priority**: 🟡 Medium | **Est**: 12h

**Endpoints**:
```typescript
GET /api/v1/analytics/revenue?startDate=2025-01-01&endDate=2025-10-19
GET /api/v1/analytics/lead-funnel?period=30d
GET /api/v1/analytics/cleaner-performance?cleanerId=xxx
GET /api/v1/analytics/customer-satisfaction?period=90d
```

**Revenue Analytics**:
```typescript
// apps/backend/src/services/analytics.service.ts
async function getRevenueMetrics(startDate: Date, endDate: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: 'PAID'
    }
  });
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const avgInvoiceValue = totalRevenue / invoices.length;
  
  // Group by month
  const monthlyRevenue = groupBy(invoices, inv => 
    format(inv.createdAt, 'yyyy-MM')
  );
  
  return {
    totalRevenue,
    avgInvoiceValue,
    invoiceCount: invoices.length,
    monthlyBreakdown: monthlyRevenue,
    growth: calculateGrowth(monthlyRevenue)
  };
}
```

**Lead Funnel**:
```typescript
async function getLeadFunnel(period: string) {
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: subtractDays(new Date(), parsePeriod(period)) }}
  });
  
  const funnel = {
    total: leads.length,
    contacted: leads.filter(l => l.status !== 'NEW').length,
    quoted: leads.filter(l => l.quoteId !== null).length,
    converted: leads.filter(l => l.customerId !== null).length,
    conversionRate: leads.filter(l => l.customerId !== null).length / leads.length
  };
  
  return funnel;
}
```

---

#### ✅ Task 3.3.2: Dashboard Frontend
**Priority**: 🟡 Medium | **Est**: 16h

**Components to Build**:

1. **Revenue Chart** (Line chart showing monthly revenue)
2. **Lead Funnel Visualization** (Funnel diagram)
3. **Cleaner Performance Table** (Sortable table)
4. **Customer Satisfaction Gauge** (Circular progress)
5. **KPI Cards** (Total revenue, bookings, conversion rate)

**Tech**:
```bash
pnpm add recharts date-fns
```

**Example Component**:
```typescript
// apps/frontend/src/components/analytics/RevenueChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `${value} kr`} />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#4F46E5" 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Dashboard Layout**:
```
┌─────────────────────────────────────────────┐
│  KPI Cards: Revenue | Bookings | Customers  │
├──────────────────┬──────────────────────────┤
│  Revenue Chart   │  Lead Funnel             │
│  (12 months)     │  (Current month)         │
├──────────────────┴──────────────────────────┤
│  Cleaner Performance Table                  │
│  (Top 10 by completed jobs)                 │
├─────────────────────────────────────────────┤
│  Customer Satisfaction Trends               │
│  (NPS score over time)                      │
└─────────────────────────────────────────────┘
```

---

## 🤖 PHASE 4: AI Enhancements (Ongoing)

### 4.1 Advanced AI Features

#### ✅ Task 4.1.1: Predictive Scheduling
**Priority**: 🟢 Low | **Est**: 20h

**Goal**: Use ML to optimize cleaner schedules based on:
- Historical job duration data
- Travel time between locations
- Cleaner skill levels
- Customer preferences

**Approach**:
1. Collect training data (past bookings with actual durations)
2. Train model to predict job duration
3. Use optimization algorithm to create optimal daily routes
4. Suggest schedule to admin for approval

---

#### ✅ Task 4.1.2: Customer Churn Prediction
**Priority**: 🟢 Low | **Est**: 16h

**Goal**: Identify customers at risk of canceling

**Signals**:
- Declining booking frequency
- Negative feedback/ratings
- Reduced responsiveness to emails
- Payment delays

**Action**: Trigger retention campaigns automatically

---

#### ✅ Task 4.1.3: Dynamic Pricing Engine
**Priority**: 🟢 Low | **Est**: 20h

**Factors**:
- Time of day/week (peak pricing)
- Customer lifetime value (loyalty discounts)
- Supply vs demand
- Competitor pricing (via scraping)

**Implementation**: AI model suggests prices, admin approves

---

## 📋 IMPLEMENTATION CHECKLIST SUMMARY

### Week 1-2: Stabilization
- [x] Git repository cleanup
- [ ] Testing framework setup
- [ ] Sentry activation
- [ ] Uptime monitoring

### Week 3-4: Testing & Documentation
- [ ] Write critical smoke tests
- [ ] Achieve 40% backend coverage
- [ ] Document APIs
- [ ] Health check endpoint

### Week 5-6: Booking Widget
- [ ] Backend API (availability, bookings)
- [ ] Frontend widget component
- [ ] Embedding documentation
- [ ] Widget analytics

### Week 7-8: SMS & Portal
- [ ] Twilio integration
- [ ] SMS scheduler (BullMQ)
- [ ] Customer portal auth
- [ ] Portal pages (dashboard, bookings, settings)

### Week 9-10: Mobile Core
- [ ] Job management screen
- [ ] GPS tracking & time tracking
- [ ] Photo upload
- [ ] Digital checklist

### Week 11-12: Mobile Polish & Reporting
- [ ] Push notifications
- [ ] Analytics backend
- [ ] Dashboard frontend
- [ ] Final testing & bug fixes

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- [ ] Test coverage > 60% (backend)
- [ ] Test coverage > 40% (frontend)
- [ ] API response time p95 < 200ms
- [ ] Uptime > 99.9%
- [ ] Zero critical security vulnerabilities

### Product Metrics
- [ ] Booking widget conversion rate > 15%
- [ ] Customer portal adoption > 50%
- [ ] Mobile app DAU/MAU > 0.7
- [ ] SMS delivery rate > 98%
- [ ] Average lead response time < 15 minutes

### Business Metrics (by end of 90 days)
- [ ] 10+ beta customers onboarded
- [ ] NPS score > 50
- [ ] Customer satisfaction > 4.5/5
- [ ] Churn rate < 5%

---

## 📚 APPENDIX

### A. Technology Stack Reference

**Backend**:
- Express 4.19, TypeScript 5.9
- Prisma 6.16 + PostgreSQL
- OpenAI GPT-4 + Gemini
- Google Calendar/Gmail APIs
- Billy.dk MCP integration
- Twilio (SMS)
- BullMQ (job queue)

**Frontend**:
- Next.js, React 18, TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (analytics)
- React Query (data fetching)

**Mobile**:
- Expo, React Native 0.81
- TypeScript
- Expo Router (navigation)
- Expo Location, Image Picker, Notifications

**Infrastructure**:
- Render.com (hosting)
- Supabase (database)
- Redis (Upstash for queue)
- Sentry (monitoring)
- Twilio (SMS)

### B. Environment Variables Checklist

```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# AI
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Google APIs
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...

# Billy.dk
BILLY_API_KEY=...
BILLY_ORGANIZATION_ID=...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+45...

# Sentry
SENTRY_DSN=https://...

# Redis
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...

# App URLs
FRONTEND_URL=https://app.rendetalje.dk
API_URL=https://api.rendetalje.dk
WIDGET_URL=https://widget.rendetalje.dk
```

### C. Database Schema Additions Needed

```prisma
// New models to add

model SmsLog {
  id          String   @id @default(cuid())
  to          String
  message     String
  twilioSid   String   @unique
  status      String
  metadata    Json?
  sentAt      DateTime
  deliveredAt DateTime?
  createdAt   DateTime @default(now())
}

model QuoteTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  services    Json
  pricing     Json
  duration    Int
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Quote {
  id            String   @id @default(cuid())
  leadId        String?
  customerId    String?
  templateId    String?
  items         Json
  subtotal      Decimal
  tax           Decimal
  total         Decimal
  validUntil    DateTime
  status        String
  acceptedAt    DateTime?
  createdAt     DateTime @default(now())
}

model CleaningChecklist {
  id        String   @id @default(cuid())
  name      String
  items     Json
  isDefault Boolean  @default(false)
}

model BookingChecklist {
  id          String   @id @default(cuid())
  bookingId   String
  items       Json
  completedBy String?
  completedAt DateTime?
}

// Extensions to existing models

model Customer {
  // Add:
  smsPreferences Json? // { confirmations: true, reminders: true, ... }
  portalAccess   Boolean @default(false)
  lastLoginAt    DateTime?
}

model Booking {
  // Add:
  source         String? // 'WIDGET', 'PORTAL', 'MANUAL', 'EMAIL'
  photos         Json?   // Array of photo URLs
  checklistId    String?
  gpsStartLat    Float?
  gpsStartLng    Float?
  gpsEndLat      Float?
  gpsEndLng      Float?
}

model User {
  // Add (for cleaners):
  pushToken      String?
  lastLocationAt DateTime?
  isAvailable    Boolean @default(true)
}
```

---

## 🚀 GETTING STARTED

### Immediate Next Steps (Today):

1. **Repository Cleanup** (30 min):
   ```bash
   cd C:\Users\empir\RendetaljeOS\apps\backend
   git status
   git add .
   git commit -m "chore: commit pending backend changes"
   git push
   ```

2. **Create Feature Branches** (15 min):
   ```bash
   git checkout -b feature/booking-widget
   git checkout -b feature/sms-notifications
   git checkout -b feature/customer-portal
   git checkout -b feature/mobile-enhancements
   ```

3. **Install Testing Tools** (30 min):
   ```bash
   cd C:\Users\empir\RendetaljeOS\apps\backend
   pnpm add -D vitest @vitest/ui @playwright/test
   
   cd ../frontend
   pnpm add -D vitest @vitejs/plugin-react
   ```

4. **Activate Sentry** (1 hour):
   - Find Sentry DSN in existing code
   - Test error capture
   - Configure alerts

5. **Set up Uptime Monitoring** (30 min):
   - Create UptimeRobot account
   - Add monitors for API and frontend
   - Configure email alerts

**Total Time to Start**: ~3 hours

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-19  
**Next Review**: After Phase 1 completion (Week 4)
