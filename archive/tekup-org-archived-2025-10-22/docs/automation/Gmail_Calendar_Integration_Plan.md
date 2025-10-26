# Tekup Dashboard: Gmail & Google Calendar Integration Plan

## 🎯 Revideret Forståelse

Nu forstår jeg! Jeres **rigtige leads og kundedata** kommer fra:
- **Gmail**: Leads fra leadpoint.dk, leadmail.no, 3match.dk
- **Google Calendar**: Bookings, aftaler og møder
- **Fakturaer**: Sandsynligvis også via Gmail eller Google Drive

Dette giver meget mere mening end mock data - I har allerede en fungerende business med rigtige kunder!

## 📊 Dashboard Data Mapping

### Figma Design → Rigtige Data Sources:

#### 1. "12 Nye leads" → Gmail Integration
```typescript
// apps/tekup-lead-platform/src/integrations/rendetalje/google-workspace.service.ts
async getNewLeadsToday(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const queries = [
    `from:leadpoint.dk after:${today}`,
    `from:leadmail.no after:${today}`,
    `from:3match.dk after:${today}`,
  ];
  
  let totalNewLeads = 0;
  for (const query of queries) {
    const emails = await this.searchEmails(query);
    totalNewLeads += emails.length;
  }
  
  return totalNewLeads;
}
```

#### 2. "89% Konvertering" → Gmail + Calendar
```typescript
async getConversionRate(): Promise<number> {
  // Leads fra Gmail
  const totalLeads = await this.getTotalLeadsThisMonth();
  
  // Bookings fra Google Calendar
  const bookings = await this.calendarService.getBookingsThisMonth();
  
  return Math.round((bookings.length / totalLeads) * 100);
}
```

#### 3. "95 AI Score" → Email Analysis
```typescript
async calculateAIScore(): Promise<number> {
  const recentEmails = await this.getUnreadLeadEmails();
  
  let totalScore = 0;
  for (const email of recentEmails) {
    // Analyser email indhold for lead kvalitet
    const score = await this.analyzeLeadQuality(email);
    totalScore += score;
  }
  
  return Math.round(totalScore / recentEmails.length);
}
```

#### 4. "Top leads i dag" → Gmail Lead Scoring
```typescript
async getTopLeadsToday(): Promise<Lead[]> {
  const todaysEmails = await this.getUnreadLeadEmails();
  
  const scoredLeads = await Promise.all(
    todaysEmails.map(async (email) => ({
      company: this.extractCompanyName(email),
      score: await this.analyzeLeadQuality(email),
      status: this.determineLeadTemperature(email),
      email: email
    }))
  );
  
  return scoredLeads
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
```

## 🔧 Teknisk Implementation

### 1. Ny Analytics Controller for Dashboard:

```typescript
// apps/tekup-crm-api/src/analytics/gmail-analytics.controller.ts
@Controller('analytics/gmail')
export class GmailAnalyticsController {
  constructor(
    private googleWorkspaceService: GoogleWorkspaceService,
    private calendarBookingService: CalendarBookingService
  ) {}

  @Get('dashboard')
  async getDashboardMetrics() {
    const [newLeads, conversionRate, aiScore, topLeads] = await Promise.all([
      this.googleWorkspaceService.getNewLeadsToday(),
      this.calculateConversionRate(),
      this.calculateAIScore(),
      this.googleWorkspaceService.getTopLeadsToday()
    ]);

    return {
      newLeads,
      conversionRate,
      aiScore,
      liveStatus: 'OK', // System health
      topLeads
    };
  }

  @Get('leads/recent')
  async getRecentLeads(@Query('days') days: number = 7) {
    return this.googleWorkspaceService.getLeadsFromLastDays(days);
  }

  @Get('bookings/today')
  async getTodaysBookings() {
    return this.calendarBookingService.getTodaysBookings();
  }
}
```

### 2. Lead Analysis Service:

```typescript
// apps/tekup-lead-platform/src/services/lead-analysis.service.ts
@Injectable()
export class LeadAnalysisService {
  
  async analyzeLeadQuality(email: any): Promise<number> {
    let score = 0;
    
    // Analyser email indhold
    const keywords = ['akut', 'hurtig', 'budget', 'projekt', 'deadline'];
    const urgencyWords = email.body.toLowerCase();
    
    keywords.forEach(keyword => {
      if (urgencyWords.includes(keyword)) score += 20;
    });
    
    // Tjek email domæne (virksomheds-email = højere score)
    if (!email.from.includes('gmail.com') && !email.from.includes('hotmail.com')) {
      score += 30;
    }
    
    // Tjek for telefonnummer (højere engagement)
    if (/\d{8}|\d{2}\s\d{2}\s\d{2}\s\d{2}/.test(email.body)) {
      score += 25;
    }
    
    return Math.min(score, 100);
  }

  extractCompanyName(email: any): string {
    // Udtræk virksomhedsnavn fra email
    const fromDomain = email.from.split('@')[1];
    return fromDomain.split('.')[0].toUpperCase();
  }

  determineLeadTemperature(email: any): 'hot' | 'warm' | 'cold' {
    const urgentWords = ['akut', 'hurtig', 'i dag', 'asap'];
    const body = email.body.toLowerCase();
    
    if (urgentWords.some(word => body.includes(word))) return 'hot';
    if (body.includes('budget') || body.includes('pris')) return 'warm';
    return 'cold';
  }
}
```

### 3. Real-time Dashboard Updates:

```typescript
// apps/website/src/hooks/useGmailDashboard.ts
export const useGmailDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    // Hent data hver 5. minut
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/gmail/dashboard');
        const data = await response.json();
        
        setMetrics({
          newLeads: data.newLeads,
          conversionRate: data.conversionRate,
          aiScore: data.aiScore,
          liveStatus: data.liveStatus
        });
        
        setLeads(data.topLeads);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 min

    return () => clearInterval(interval);
  }, []);

  return { metrics, leads, isLoading: !metrics };
};
```

## 🚀 Implementation Roadmap

### Sprint 1: Gmail Integration Enhancement
- [ ] **Udvid GoogleWorkspaceService** med dashboard-specifikke metoder
- [ ] **Implementer lead scoring algoritme** baseret på email indhold
- [ ] **Tilføj company extraction** fra email domæner
- [ ] **Test med rigtige Gmail data**

### Sprint 2: Calendar Integration
- [ ] **Hent dagens bookings** fra Google Calendar
- [ ] **Beregn konverteringsrater** (leads → bookings)
- [ ] **Implementer booking status tracking**
- [ ] **Tilføj revenue tracking** fra fakturaer

### Sprint 3: Dashboard API
- [ ] **Byg analytics endpoints** der bruger rigtige data
- [ ] **Implementer caching** for performance (Redis)
- [ ] **Tilføj real-time updates** via WebSockets
- [ ] **Test med production Gmail/Calendar data**

### Sprint 4: Frontend Dashboard
- [ ] **Implementer Figma design** med rigtige data
- [ ] **Tilføj lead detail views** (klik på lead → vis email)
- [ ] **Implementer booking management** (direkte til Calendar)
- [ ] **Tilføj notifications** for nye leads

## 📋 Konkrete Næste Skridt

### 1. Test Eksisterende Integration (I dag):
```bash
# Test Gmail connection
cd apps/tekup-lead-platform
node -e "
const { GoogleWorkspaceService } = require('./src/integrations/rendetalje/google-workspace.service.ts');
const service = new GoogleWorkspaceService();
service.getUnreadLeadEmails().then(console.log);
"
```

### 2. Implementer Dashboard Endpoints (Denne uge):
```typescript
// Tilføj til tekup-crm-api
GET /api/analytics/gmail/dashboard
GET /api/analytics/gmail/leads/today
GET /api/analytics/calendar/bookings/today
```

### 3. Frontend Integration (Næste uge):
- Tilslut dashboard til rigtige Gmail/Calendar data
- Test med jeres faktiske leads og bookings
- Implementer real-time updates

## 💡 Fordele ved Denne Tilgang

1. **Rigtige Data**: Dashboard viser faktiske business metrics
2. **Automatisk Opdatering**: Nye leads vises automatisk fra Gmail
3. **Lead Scoring**: AI analyserer email indhold for lead kvalitet
4. **Konvertering Tracking**: Fra email lead til Calendar booking
5. **Business Intelligence**: Rigtige insights i jeres forretning

Dette giver jer et **ægte business dashboard** i stedet for mock data! Skal jeg starte med at implementere Gmail analytics endpoints?
