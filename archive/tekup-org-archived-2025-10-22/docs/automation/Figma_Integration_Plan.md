# Tekup Figma Design → Platform Integration Plan

## 📊 Opdateret Design Analyse

### Nye Ændringer i Designet:
1. **Overskrift ændret**: "AI-drevet CRM for SMB'er" (tidligere "Unified IT Support...")
2. **Fokus på CRM**: Mere specifikt fokus på CRM-funktionalitet
3. **Dashboard metrics opdateret**:
   - 12 Nye leads
   - 89% Konvertering
   - 95 AI Score
   - OK Live Status
4. **Top leads sektion**: TechStart ApS (95%), Digital Solutions (87%)
5. **Integrationer vist**: Microsoft, Salesforce, HubSpot, Zendesk

## 🎯 Integration Strategi

### Fase 1: Backend API Mapping
Designet matcher perfekt med jeres eksisterende **tekup-crm-api**:

#### Dashboard Metrics → API Endpoints:
```typescript
// Nye leads (12)
GET /api/contacts?status=new&created_after=today

// Konvertering (89%)
GET /api/deals/conversion-rate

// AI Score (95)
GET /api/analytics/ai-score

// Live Status (OK)
GET /api/health

// Top leads
GET /api/contacts?sort=score&limit=10
```

### Fase 2: Frontend Komponenter

#### 1. Dashboard Widget Komponenter:
```typescript
// MetricCard.tsx
interface MetricCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'cyan';
}

// LeadsList.tsx
interface Lead {
  company: string;
  score: number;
  status: 'hot' | 'warm' | 'cold';
}

// LiveStatus.tsx
interface StatusProps {
  status: 'OK' | 'WARNING' | 'ERROR';
  uptime: string;
}
```

#### 2. Integration med Eksisterende CRM API:

```typescript
// hooks/useDashboardData.ts
export const useDashboardData = () => {
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/api/analytics/dashboard'),
  });

  const { data: leads } = useQuery({
    queryKey: ['top-leads'],
    queryFn: () => api.get('/api/contacts/top-leads'),
  });

  return { metrics, leads };
};
```

## 🔧 Teknisk Implementation

### 1. API Endpoints der skal implementeres:

```typescript
// apps/tekup-crm-api/src/analytics/analytics.controller.ts
@Controller('analytics')
export class AnalyticsController {
  
  @Get('dashboard')
  async getDashboardMetrics(@Req() req) {
    return {
      newLeads: await this.getNewLeadsCount(),
      conversionRate: await this.getConversionRate(),
      aiScore: await this.getAIScore(),
      liveStatus: await this.getSystemStatus()
    };
  }

  @Get('ai-score')
  async getAIScore() {
    // Beregn AI score baseret på lead kvalitet, konverteringsrater, etc.
    return { score: 95, trend: 'up' };
  }
}
```

### 2. Database Schema Udvidelser:

```sql
-- Tilføj AI scoring til contacts
ALTER TABLE contacts ADD COLUMN ai_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN lead_temperature VARCHAR(10) DEFAULT 'cold';

-- Tracking af konverteringsrater
CREATE TABLE conversion_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_leads INTEGER DEFAULT 0,
  converted_leads INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00
);
```

### 3. Frontend Integration:

```typescript
// apps/website/src/components/Dashboard.tsx
export const Dashboard = () => {
  const { metrics, leads, isLoading } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="dashboard-container">
      <div className="metrics-grid">
        <MetricCard
          value={metrics.newLeads}
          label="Nye leads"
          icon={<TrendingUp />}
          color="green"
        />
        <MetricCard
          value={`${metrics.conversionRate}%`}
          label="Konvertering"
          icon={<Users />}
          color="blue"
        />
        <MetricCard
          value={metrics.aiScore}
          label="AI Score"
          icon={<Brain />}
          color="purple"
        />
        <MetricCard
          value={metrics.liveStatus}
          label="Live Status"
          icon={<Shield />}
          color="cyan"
        />
      </div>
      
      <LeadsList leads={leads} />
    </div>
  );
};
```

## 🚀 Implementation Roadmap

### Sprint 1 (Uge 1-2): Backend Foundation
- [ ] Implementer analytics endpoints i tekup-crm-api
- [ ] Tilføj AI scoring logik
- [ ] Implementer konverteringsrate beregninger
- [ ] Tilføj health check endpoints

### Sprint 2 (Uge 3-4): Frontend Komponenter
- [ ] Byg Dashboard komponenter
- [ ] Implementer MetricCard komponenter
- [ ] Skab LeadsList komponent
- [ ] Tilføj real-time updates

### Sprint 3 (Uge 5-6): Integration & Styling
- [ ] Integrér med eksisterende auth system
- [ ] Implementer Figma design 1:1
- [ ] Tilføj responsive design
- [ ] Performance optimering

### Sprint 4 (Uge 7-8): Testing & Deployment
- [ ] Unit tests for alle komponenter
- [ ] Integration tests
- [ ] E2E tests med Playwright
- [ ] Production deployment

## 📋 Konkrete Næste Skridt

### 1. Øjeblikkelig (I dag):
```bash
# Klon og setup development environment
cd apps/tekup-crm-api
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### 2. Denne uge:
- Implementer analytics controller
- Tilføj AI scoring algoritme
- Skab dashboard API endpoints
- Test med Postman/Thunder Client

### 3. Næste uge:
- Start frontend komponenter
- Integrér med CRM API
- Implementer real-time updates
- Style efter Figma design

## 🔗 API Integration Points

### Eksisterende Endpoints der kan genbruges:
- `/api/contacts` - For lead management
- `/api/deals` - For konverteringsdata
- `/api/companies` - For virksomhedsdata
- `/api/activities` - For aktivitetssporing

### Nye Endpoints der skal bygges:
- `/api/analytics/dashboard` - Dashboard metrics
- `/api/analytics/ai-score` - AI scoring
- `/api/analytics/conversion-rate` - Konverteringsrater
- `/api/system/health` - System status

## 💡 Tekniske Overvejelser

1. **Real-time Updates**: Brug WebSockets eller Server-Sent Events for live data
2. **Caching**: Redis cache for dashboard metrics (opdater hver 5 min)
3. **Performance**: Lazy loading af dashboard komponenter
4. **Security**: Sørg for tenant isolation i alle API calls
5. **Monitoring**: Tilføj logging og metrics til nye endpoints

Denne plan giver jer en klar roadmap for at implementere Figma-designet med jeres eksisterende Tekup-platform. Skal jeg uddybe nogle af punkterne eller hjælpe med at starte implementeringen?
