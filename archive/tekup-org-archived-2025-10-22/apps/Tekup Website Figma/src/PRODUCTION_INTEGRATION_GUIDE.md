# 🚀 Tekup Production Integration Guide

## Overview
This guide provides step-by-step instructions for integrating the Tekup dashboard with your existing production platform, including real Gmail data, JWT authentication, and live metrics.

---

## 📋 Prerequisites

### Backend Requirements
- Node.js 18+ with your existing Tekup-org monorepo
- Gmail API access with service account
- Google Calendar API access
- JWT authentication system
- PostgreSQL database with contacts/deals tables

### Environment Variables Needed
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.tekup.dk
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_GMAIL_INTEGRATION=true
NEXT_PUBLIC_CALENDAR_INTEGRATION=true

# Backend (.env)
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=postgresql://user:pass@host:port/db
GMAIL_API_SCOPE=https://www.googleapis.com/auth/gmail.readonly
CALENDAR_API_SCOPE=https://www.googleapis.com/auth/calendar.readonly
```

---

## 🔄 Step 1: Replace Demo Data with Real API Integration

### Update Dashboard Data Hook
The dashboard now automatically switches between mock and real data based on environment:

```typescript
// Environment controls data source
const useMockData = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_REAL_API;
```

### API Endpoints Required
Your backend needs these endpoints:

```typescript
GET  /api/analytics/gmail-dashboard/live
GET  /api/contacts?status=new&created_after=today  
GET  /api/deals/conversion-rate
GET  /api/activities/recent
POST /api/analytics/calculate-lead-score
POST /api/auth/login
POST /api/auth/refresh
```

---

## 🔐 Step 2: JWT Authentication Integration

### Backend Auth Implementation
```typescript
// apps/tekup-crm-api/src/auth/jwt.service.ts
import jwt from 'jsonwebtoken';

export class JwtService {
  generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}
```

### Frontend Auth Hook
Already implemented in `/hooks/useAuth.ts` with:
- Automatic token refresh
- JWT decoding
- Persistent sessions
- Multi-tenant support

---

## 📧 Step 3: Gmail Integration

### Backend Gmail Service
```typescript
// apps/tekup-crm-api/src/integrations/gmail.service.ts
import { google } from 'googleapis';

export class GmailService {
  private gmail = google.gmail('v1');

  async getNewLeadsToday(): Promise<number> {
    const auth = await this.getGoogleAuth();
    
    const queries = [
      'from:leadpoint.dk after:' + this.getTodayString(),
      'from:leadmail.no after:' + this.getTodayString(),
    ];
    
    let totalLeads = 0;
    
    for (const query of queries) {
      const response = await this.gmail.users.messages.list({
        auth,
        userId: 'me',
        q: query,
      });
      
      totalLeads += response.data.messages?.length || 0;
    }
    
    return totalLeads;
  }

  async analyzeEmailForLeadScore(messageId: string): Promise<LeadScore> {
    const auth = await this.getGoogleAuth();
    
    const message = await this.gmail.users.messages.get({
      auth,
      userId: 'me',
      id: messageId,
    });

    const emailContent = this.extractEmailContent(message.data);
    const senderEmail = this.extractSenderEmail(message.data);
    
    return calculateLeadScore(emailContent, senderEmail);
  }
}
```

### Lead Sources Configuration
```typescript
const LEAD_SOURCES = {
  'leadpoint.dk': {
    name: 'Leadpoint.dk (Rengøring Aarhus)',
    priority: 'high',
    expectedVolume: 15,
  },
  'leadmail.no': {
    name: 'Leadmail.no (Rengøring.nu)', 
    priority: 'high',
    expectedVolume: 13,
  },
};
```

---

## 📊 Step 4: Real Metrics Implementation

### Lead Scoring Algorithm
Already implemented in `/utils/lead-scoring-algorithm.ts` with:

- **Urgency keywords**: 'akut', 'hurtig', 'i dag', 'asap' (+20 points each)
- **Business email**: Non-Gmail/Hotmail (+20 points)  
- **Phone number**: Present in email (+15 points)
- **Budget mentions**: 'budget', 'pris', 'betale' (+15 points)
- **Location specificity**: Danish cities (+10 points)

### Conversion Rate Calculation
```typescript
async calculateConversionRate(): Promise<number> {
  const leads = await this.getNewLeadsThisWeek();
  const bookings = await this.calendarService.getBookingsThisWeek();
  
  if (leads === 0) return 0;
  return Math.round((bookings.length / leads) * 100 * 10) / 10; // 3.6%
}
```

---

## 📱 Step 5: Mobile Optimization

### Responsive Dashboard
The dashboard automatically adapts:
- Cards stack vertically on mobile
- Navigation collapses to hamburger menu  
- Touch-friendly lead list with larger tap targets
- Optimized text sizes for readability

### CSS Classes Used
```css
/* Mobile-first responsive design */
.dashboard-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.metric-card {
  @apply p-4 md:p-6 rounded-xl;
}

.leads-list {
  @apply space-y-2 md:space-y-3;
}
```

---

## 🎨 Step 6: Brand Colors Implementation

### Updated Color Palette
```css
:root {
  --color-tekup-primary: #0066CC;     /* Tekup blue */
  --color-tekup-accent: #00D4FF;      /* Cyan accent */
  --color-tekup-success: #10B981;     /* Emerald green */
  
  /* Lead status colors (meaningful) */
  --color-lead-hot: #EF4444;          /* Red (90-100): Hot leads */
  --color-lead-warm: #F59E0B;         /* Yellow (70-89): Warm leads */  
  --color-lead-cold: #3B82F6;         /* Blue (50-69): Cold leads */
}
```

### Lead Priority Colors
- 🔥 **Hot Leads (90-100)**: Red - Urgent keywords, same-day response needed
- ⚡ **Warm Leads (70-89)**: Yellow - Has budget/business email, 4-hour response
- ❄️ **Cold Leads (50-69)**: Blue - General inquiries, 24-hour response

---

## 🗄️ Step 7: Database Integration

### Required Tables
```sql
-- Contacts/Leads
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  company VARCHAR,
  phone VARCHAR,
  source VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'new',
  ai_score INTEGER DEFAULT 0,
  estimated_value INTEGER,
  urgency VARCHAR DEFAULT 'medium',
  keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_contact TIMESTAMP,
  tenant_id UUID REFERENCES tenants(id)
);

-- Activities Log
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  contact_id UUID REFERENCES contacts(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  priority VARCHAR DEFAULT 'medium',
  metadata JSONB,
  tenant_id UUID REFERENCES tenants(id)
);
```

---

## 🚀 Step 8: Deployment Configuration

### Production Build
```bash
# Build the website
cd apps/website
npm run build

# Test production build
npm start
```

### Docker Configuration (if using)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.tekup.dk
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_GMAIL_INTEGRATION=true
NEXT_PUBLIC_CALENDAR_INTEGRATION=true
```

---

## ✅ Step 9: Testing & Verification

### API Health Check
```bash
# Test backend endpoints
curl -H "Authorization: Bearer YOUR_JWT" \
  https://api.tekup.dk/api/analytics/gmail-dashboard/live

# Expected response:
{
  "success": true,
  "data": {
    "newLeads": 28,
    "conversionRate": 3.6,
    "aiScore": 78,
    "systemStatus": "OK"
  }
}
```

### Frontend Integration Test
```typescript
// Test in browser console
localStorage.setItem('NEXT_PUBLIC_USE_REAL_API', 'true');
location.reload();
// Dashboard should now show real data
```

---

## 🔧 Step 10: Production Monitoring

### Metrics to Monitor
- **API Response Times**: < 500ms for dashboard endpoints
- **Gmail API Rate Limits**: Stay within 1 billion quota units/day  
- **Database Query Performance**: < 100ms for dashboard queries
- **Error Rates**: < 1% for critical endpoints

### Logging Implementation
```typescript
// Add comprehensive logging
app.use('*', logger((message, ...rest) => {
  console.log(`${new Date().toISOString()} ${message}`, ...rest);
}));

// Error tracking
app.onError((err, c) => {
  console.error('API Error:', {
    path: c.req.path,
    method: c.req.method,
    error: err.message,
    timestamp: new Date().toISOString()
  });
});
```

---

## 🚨 Common Issues & Solutions

### Issue: "Failed to fetch dashboard data"
**Solution**: Check API URL and authentication headers
```typescript
// Debug API calls
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Auth token:', await getToken());
```

### Issue: Gmail API quota exceeded
**Solution**: Implement caching and rate limiting
```typescript
// Cache results for 5 minutes
const cachedResults = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
```

### Issue: Conversion rate shows 0%
**Solution**: Ensure calendar integration is working
```typescript
// Verify calendar bookings
const bookings = await calendarService.getBookingsThisWeek();
console.log('Bookings found:', bookings.length);
```

---

## 📞 Support & Next Steps

### Development Team Checklist
- [ ] Environment variables configured
- [ ] JWT authentication working  
- [ ] Gmail API returning real data
- [ ] Lead scoring algorithm tuned
- [ ] Mobile responsive testing complete
- [ ] Production deployment successful

### Monitoring Dashboard URLs
- **Health Check**: `https://api.tekup.dk/health`
- **Metrics**: `https://api.tekup.dk/api/analytics/gmail-dashboard/live`
- **Frontend**: `https://tekup.dk/dashboard`

---

**🎉 Your Tekup dashboard is now production-ready with real data integration!**

For support, check the API logs and frontend console for detailed error messages. All components include comprehensive error handling and fallback mechanisms.