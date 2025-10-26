# Tekup API Integration Guide - Figma til Production

## 🎯 Step-by-Step Integration Process

### Step 1: Kopier Figma Make Koden til Jeres Monorepo

```bash
# I jeres Tekup-org root directory:
cd apps/website/

# Backup eksisterende kode
mv src src_backup_$(date +%Y%m%d)

# Kopier Figma Make koden
# (Figma Make vil give jer en zip fil eller GitHub link)
```

### Step 2: Opdater Package.json Dependencies

```json
// apps/website/package.json
{
  "dependencies": {
    "@tekup/shared": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.0.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.400.0"
  }
}
```

### Step 3: Opret API Integration Hooks

```typescript
// apps/website/src/hooks/useTekupAPI.ts
import { useQuery, useMutation } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/analytics/gmail-dashboard/live`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tekup_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchInterval: 30000 // Opdater hver 30 sekund
  });
};

export const useLeadData = () => {
  return useQuery({
    queryKey: ['leads-today'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/contacts?status=new&created_after=today`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tekup_token')}`,
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
    refetchInterval: 60000 // Opdater hvert minut
  });
};

export const useConversionRate = () => {
  return useQuery({
    queryKey: ['conversion-rate'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/deals/conversion-rate`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tekup_token')}`,
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch conversion rate');
      return response.json();
    }
  });
};
```

### Step 4: Opdater Dashboard Komponenten

```typescript
// apps/website/src/components/Dashboard/LiveDashboard.tsx
import { useDashboardMetrics, useLeadData, useConversionRate } from '@/hooks/useTekupAPI';

export const LiveDashboard = () => {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: leads, isLoading: leadsLoading } = useLeadData();
  const { data: conversionData } = useConversionRate();

  if (metricsLoading || leadsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-grid">
      <MetricCard
        value={metrics?.newLeads || 0}
        label="Nye leads"
        trend={metrics?.leadsTrend}
        color="green"
      />
      <MetricCard
        value={`${conversionData?.rate || 0}%`}
        label="Konvertering"
        trend={conversionData?.trend}
        color="blue"
      />
      <MetricCard
        value={metrics?.aiScore || 0}
        label="AI Score"
        trend="stable"
        color="purple"
      />
      <MetricCard
        value={metrics?.systemStatus || 'Unknown'}
        label="Live Status"
        color="cyan"
      />
      
      <LeadsList leads={leads} />
    </div>
  );
};
```

### Step 5: Implementer Ægte Authentication

```typescript
// apps/website/src/hooks/useAuth.ts
import { useMutation, useQuery } from '@tanstack/react-query';

export const useAuth = () => {
  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      localStorage.setItem('tekup_token', data.token);
      localStorage.setItem('tekup_user', JSON.stringify(data.user));
      
      return data;
    }
  });

  const logout = () => {
    localStorage.removeItem('tekup_token');
    localStorage.removeItem('tekup_user');
    window.location.href = '/';
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('tekup_token');
  };

  return { login, logout, isAuthenticated };
};
```

### Step 6: Opret API Endpoints i Backend

```typescript
// apps/tekup-crm-api/src/analytics/gmail-dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GoogleWorkspaceService } from '../integrations/google-workspace.service';
import { CalendarBookingService } from '../integrations/calendar-booking.service';

@Controller('analytics/gmail-dashboard')
@UseGuards(JwtAuthGuard)
export class GmailDashboardController {
  constructor(
    private googleWorkspaceService: GoogleWorkspaceService,
    private calendarBookingService: CalendarBookingService
  ) {}

  @Get('live')
  async getLiveDashboardData() {
    const [newLeads, conversionRate, aiScore, topLeads] = await Promise.all([
      this.getNewLeadsToday(),
      this.calculateConversionRate(),
      this.calculateAverageAIScore(),
      this.getTopScoredLeads()
    ]);

    return {
      newLeads,
      conversionRate,
      aiScore,
      systemStatus: 'OK',
      topLeads,
      lastUpdated: new Date().toISOString()
    };
  }

  private async getNewLeadsToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const queries = [
      `from:leadpoint.dk after:${today}`,
      `from:leadmail.no after:${today}`,
      `from:3match.dk after:${today}`,
    ];
    
    let totalNewLeads = 0;
    for (const query of queries) {
      const emails = await this.googleWorkspaceService.searchEmails(query);
      totalNewLeads += emails.length;
    }
    
    return totalNewLeads;
  }

  private async calculateConversionRate(): Promise<number> {
    const leads = await this.getNewLeadsThisWeek();
    const bookings = await this.calendarBookingService.getBookingsThisWeek();
    
    if (leads === 0) return 0;
    return Math.round((bookings.length / leads) * 100);
  }

  private async calculateAverageAIScore(): Promise<number> {
    const recentEmails = await this.googleWorkspaceService.getUnreadLeadEmails();
    
    if (recentEmails.length === 0) return 0;
    
    let totalScore = 0;
    for (const email of recentEmails) {
      const score = await this.analyzeLeadQuality(email);
      totalScore += score;
    }
    
    return Math.round(totalScore / recentEmails.length);
  }

  private async analyzeLeadQuality(email: any): Promise<number> {
    let score = 0;
    
    // Urgency keywords
    const urgentWords = ['akut', 'hurtig', 'i dag', 'asap'];
    const body = email.body.toLowerCase();
    
    urgentWords.forEach(word => {
      if (body.includes(word)) score += 20;
    });
    
    // Business email
    if (!email.from.includes('gmail.com') && !email.from.includes('hotmail.com')) {
      score += 30;
    }
    
    // Phone number
    if (/\d{8}|\d{2}\s\d{2}\s\d{2}\s\d{2}/.test(email.body)) {
      score += 25;
    }
    
    return Math.min(score, 100);
  }
}
```

### Step 7: Opdater Environment Variables

```env
# apps/website/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GMAIL_INTEGRATION=true
NEXT_PUBLIC_CALENDAR_INTEGRATION=true

# apps/tekup-crm-api/.env
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
JWT_SECRET=your-jwt-secret
DATABASE_URL=your-database-url
```

### Step 8: Opdater Main App Component

```typescript
// apps/website/src/app/layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutter
      retry: 3,
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Step 9: Test Integration

```bash
# Start backend
cd apps/tekup-crm-api
npm run dev

# Start frontend (ny terminal)
cd apps/website
npm run dev

# Test endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/analytics/gmail-dashboard/live
```

### Step 10: Deploy til Production

```bash
# Build website
cd apps/website
npm run build

# Deploy backend
cd apps/tekup-crm-api
npm run build
npm run start:prod
```

## 🔧 Troubleshooting

### Almindelige Problemer:

1. **CORS fejl**: Tilføj frontend URL til CORS whitelist i backend
2. **Auth fejl**: Verificer JWT token format og expiry
3. **API timeout**: Øg timeout i React Query konfiguration
4. **Gmail rate limits**: Implementer caching og rate limiting

### Debug Commands:

```bash
# Check API health
curl http://localhost:3001/api/health

# Verify JWT token
node -e "console.log(require('jsonwebtoken').decode('YOUR_TOKEN'))"

# Test Gmail connection
cd apps/tekup-crm-api
npm run test:gmail
```

## ✅ Success Kriterier

- [ ] Dashboard viser rigtige Gmail leads (ikke mock data)
- [ ] Konverteringsrate beregnes fra Calendar bookings
- [ ] JWT authentication fungerer
- [ ] Real-time updates hver 30 sekund
- [ ] Mobile responsive design
- [ ] Production deployment klar

**Nu har du en komplet guide til at integrere Figma-designet med jeres rigtige Tekup API!** 🚀
