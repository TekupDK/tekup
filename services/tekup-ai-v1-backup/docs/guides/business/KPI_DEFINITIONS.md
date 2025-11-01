# 📊 KPI Definitions - RenOS Dashboard

\n\n
\n\n> **Version**: 1.0.0  
\n\n> **Last Updated**: 30. September 2025  
> **Owner**: Product Team

---

\n\n## 📖 Overview
\n\n
\n\nDette dokument definerer alle Key Performance Indicators (KPIs) vist i RenOS Dashboard.
Hver KPI har dokumenteret datakilde, beregningsmetode, opdateringsfrekvens og forretningsværdi.

---

\n\n## 📈 Dashboard KPIs
\n\n
\n\n### 1. Kunder (Total Active Customers)
\n\n
\n\n**📍 Display Location**: Dashboard - Top Left Stat Card
\n\n
**📊 Definition**:  
Totalt antal aktive betalende kunder i systemet.

**💾 Data Source**:

\n\n```sql
SELECT COUNT(*) as total_customers
FROM customers
WHERE status = 'active'
  AND deleted_at IS NULL
\n\n```

**📅 Period**: Real-time snapshot  
**🔄 Update Frequency**: Hver 5 minutter  
**📏 Metric Type**: Absolute count  

**💡 Business Value**:  
Viser virksomhedens kundegrundlag. Stigende trend indikerer vækst i kundebase.

**🎯 Target**: Minimum 100 aktive kunder  
**⚠️ Alert Threshold**: < 80 kunder (20% drop)

**📱 Example Display**:

\n\n```
Kunder
1,247
↑ 12% vs last måned
\n\n```

---

\n\n### 2. Nye Leads (New Leads This Week)
\n\n
\n\n**📍 Display Location**: Dashboard - Top Center-Left
\n\n
**📊 Definition**:  
Antal nye leads modtaget i de sidste 7 dage.

**💾 Data Source**:

\n\n```sql
SELECT COUNT(*) as new_leads
FROM leads
WHERE created_at >= NOW() - INTERVAL '7 days'
\n\n  AND status != 'spam'
\n\n```

**📅 Period**: Sidste 7 dage (rolling window)  
**🔄 Update Frequency**: Hver 15 minutter  
**📏 Metric Type**: Count over time period  

**📊 Comparison**:  
Procent ændring beregnes ved:

\n\n```sql
-- Current week
\n\nSELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'
\n\n
-- Previous week
\n\nSELECT COUNT(*) FROM leads
WHERE created_at >= NOW() - INTERVAL '14 days'
\n\n  AND created_at < NOW() - INTERVAL '7 days'
\n\n
-- Change % = ((current - previous) / previous) * 100
\n\n```

**💡 Business Value**:  
Indikerer effektivitet af marketing og salgsaktiviteter. Bruges til at måle lead generation performance.

**🎯 Target**: Minimum 50 leads/uge  
**⚠️ Alert Threshold**: < 30 leads/uge (40% under target)

**📱 Example Display**:

\n\n```
Nye Leads
87
↑ 23% vs forrige uge
\n\n```

---

\n\n### 3. Bookinger (Confirmed Bookings This Month)
\n\n
\n\n**📍 Display Location**: Dashboard - Top Center-Right
\n\n
**📊 Definition**:  
Antal bekræftede bookinger for indeværende måned (Month-To-Date).

**💾 Data Source**:

\n\n```sql
SELECT COUNT(*) as confirmed_bookings
FROM bookings
WHERE status = 'confirmed'
  AND start_date >= DATE_TRUNC('month', NOW())
  AND start_date < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
\n\n```

**📅 Period**: Indeværende måned (MTD - Month To Date)  
**🔄 Update Frequency**: Hver time  
**📏 Metric Type**: Count MTD  

**📊 Comparison**:  
Sammenlign med samme periode sidste måned:

\n\n```sql
-- Same period last month
\n\nSELECT COUNT(*) FROM bookings
WHERE status = 'confirmed'
  AND start_date >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
\n\n  AND start_date < DATE_TRUNC('month', NOW() - INTERVAL '1 month') +
\n\n      (NOW() - DATE_TRUNC('month', NOW()))
\n\n```

**💡 Business Value**:  
Viser conversion rate fra leads til bookinger. Kritisk for revenue forecasting.

**🎯 Target**: Minimum 200 bookinger/måned  
**⚠️ Alert Threshold**: < 150 bookinger ved måned slutning

**📱 Example Display**:

\n\n```
Bookinger
156
↑ 8% vs forrige måned (MTD)
\n\n```

---

\n\n### 4. Omsætning (Revenue This Month)
\n\n
\n\n**📍 Display Location**: Dashboard - Top Right
\n\n
**📊 Definition**:  
Total faktisk betalt omsætning i indeværende måned.

**💾 Data Source**:

\n\n```sql
SELECT SUM(amount) as revenue
FROM invoices
WHERE status = 'paid'
  AND paid_at >= DATE_TRUNC('month', NOW())
  AND paid_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
\n\n```

**📅 Period**: Indeværende måned (MTD)  
**🔄 Update Frequency**: Hver time  
**📏 Metric Type**: Sum (DKK)  
**💱 Currency**: DKK (Danish Kroner)  

**📊 Comparison**:  
Sammenlign med samme MTD periode sidste måned.

**💡 Business Value**:  
Primær revenue metric. Bruges til cashflow forecast og financial reporting.

**🎯 Target**: Minimum 500.000 DKK/måned  
**⚠️ Alert Threshold**: < 400.000 DKK ved måned slutning

**📱 Example Display**:

\n\n```
Omsætning
284.500 kr
↑ 15% vs forrige måned (MTD)

Kilde: Fakturaer (betalte)
Opdateret: for 23 minutter siden
\n\n```

---

\n\n### 5. Aktive Samtaler (Active Chats Today)
\n\n
\n\n**📍 Display Location**: Sidebar - Chat Section
\n\n
**📊 Definition**:  
Antal unikke chat sessions startet i dag som stadig er aktive eller afsluttet i dag.

**💾 Data Source**:

\n\n```sql
SELECT COUNT(*) as active_chats
FROM chat_sessions
WHERE DATE(created_at) = CURRENT_DATE
  AND (status = 'active' OR status = 'completed')
\n\n```

**📅 Period**: I dag (midnight til nu)  
**🔄 Update Frequency**: Real-time (WebSocket updates)  
**📏 Metric Type**: Count (daily)  

**💡 Business Value**:  
Viser engagement level med AI assistant. Indikerer customer support load.

**🎯 Target**: 50-100 chats/dag  
**⚠️ Alert Threshold**: > 200 (overload), < 20 (low engagement)

**📱 Example Display**:

\n\n```
Aktive samtaler
42
↑ 8% vs i går
\n\n```

---

\n\n### 6. Gennemsnitlig Responstid (Average Response Time)
\n\n
\n\n**📍 Display Location**: Dashboard - Performance Section
\n\n
**📊 Definition**:  
Gennemsnitlig tid fra chat message sendt til AI response modtaget.

**💾 Data Source**:

\n\n```sql
SELECT AVG(response_time_ms) / 1000.0 as avg_response_seconds
FROM chat_messages
WHERE created_at >= NOW() - INTERVAL '24 hours'
\n\n  AND type = 'ai_response'
  AND response_time_ms IS NOT NULL
\n\n```

**📅 Period**: Sidste 24 timer  
**🔄 Update Frequency**: Hver 10 minutter  
**📏 Metric Type**: Average (seconds)  

**💡 Business Value**:  
Performance indicator for AI system. Påvirker user experience direkte.

**🎯 Target**: < 2 sekunder  
**⚠️ Alert Threshold**: > 5 sekunder (performance degradation)

**📱 Example Display**:

\n\n```
Gennemsnitlig Responstid
1.8s
↓ 12% vs i går
\n\n```

---

\n\n### 7. Konverteringsrate (Lead to Booking Conversion)
\n\n
\n\n**📍 Display Location**: Dashboard - Performance Section
\n\n
**📊 Definition**:  
Procentdel af leads der konverteres til bekræftede bookinger inden for 30 dage.

**💾 Data Source**:

\n\n```sql
WITH leads_30days AS (
  SELECT id FROM leads
  WHERE created_at >= NOW() - INTERVAL '30 days'
\n\n),
converted_leads AS (
  SELECT DISTINCT l.id
  FROM leads l
  JOIN bookings b ON b.lead_id = l.id
  WHERE l.created_at >= NOW() - INTERVAL '30 days'
\n\n    AND b.status = 'confirmed'
    AND b.created_at <= l.created_at + INTERVAL '30 days'
\n\n)
SELECT
  (COUNT(converted_leads.id)::float / COUNT(leads_30days.id)) * 100
\n\n  AS conversion_rate
FROM leads_30days
LEFT JOIN converted_leads ON converted_leads.id = leads_30days.id
\n\n```

**📅 Period**: Sidste 30 dage (rolling)  
**🔄 Update Frequency**: Daglig (00:00)  
**📏 Metric Type**: Percentage  

**💡 Business Value**:  
Key efficiency metric for sales process. Viser kvalitet af leads og sales team performance.

**🎯 Target**: Minimum 15%  
**⚠️ Alert Threshold**: < 10% (poor conversion)

**📱 Example Display**:

\n\n```
Konverteringsrate
18.5%
↑ 2.3pp vs forrige måned
\n\n```

---

\n\n## 🎨 Display Formatting Standards
\n\n
\n\n### Number Formatting
\n\n
\n\n| Type | Format | Example |
|------|--------|---------|
| Små tal (< 1,000) | Ingen separator | `487` |
| Mellemstore (1K-10K) | Tusind-separator | `3.456` |
| Store (> 10K) | Tusind-separator | `284.500` |
| Valuta | DKK med space | `284.500 kr` |
| Procent | 1 decimal | `18.5%` |
| Procent ændring | +/- prefix | `+15%`, `-3%` |
\n\n| Decimal tal | Dansk format (komma) | `3,14` |

\n\n### Period Labels
\n\n
\n\nAlle percentage changes skal have periode label:

✅ **Correct**:

\n\n- `↑ 15% vs forrige måned`
\n\n- `↓ 3% vs i går`
\n\n- `↑ 8% vs forrige uge`
\n\n- `↑ 2.3pp vs Q2` (percentage points for rates)
\n\n
❌ **Incorrect**:

\n\n- `↑ 15%` (missing period reference)
\n\n- `+15%` (no trend indicator)
\n\n
\n\n### Timestamp Formatting
\n\n
\n\nAlle metrics skal vise "last updated" timestamp:

\n\n```
Opdateret: for 23 minutter siden
Opdateret: i dag kl. 14:32
Opdateret: i går kl. 09:15
\n\n```

Brug `date-fns` `formatDistanceToNow()` med Danish locale:

\n\n```typescript
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

const timestamp = formatDistanceToNow(lastUpdated, {
  addSuffix: true,
  locale: da
});
// => "for 23 minutter siden"
\n\n```

---

\n\n## 🔄 Data Refresh Schedule
\n\n
\n\n| KPI | Frequency | Method | Cache TTL |
|-----|-----------|--------|-----------|
| Kunder | 5 min | Cron job | 5 min |
| Nye Leads | 15 min | Cron job | 15 min |
| Bookinger | 1 hour | Cron job | 1 hour |
| Omsætning | 1 hour | Cron job | 1 hour |
| Aktive Samtaler | Real-time | WebSocket | N/A |
| Responstid | 10 min | Background job | 10 min |
| Konverteringsrate | Daily | Cron (00:00) | 24 hours |

---

\n\n## 🚨 Alert Thresholds
\n\n
\n\n### Critical Alerts (Immediate Slack notification)
\n\n
\n\n- Omsætning < 300.000 kr ved måned slutning
\n\n- Konverteringsrate < 8%
\n\n- Gennemsnitlig responstid > 10 sekunder
\n\n- Aktive kunder < 60 (50% drop)
\n\n
\n\n### Warning Alerts (Daily digest)
\n\n
\n\n- Nye leads < 40/uge
\n\n- Bookinger < 180/måned ved dag 25
\n\n- Responstid > 5 sekunder
\n\n- Aktive chats > 150/dag
\n\n
---

\n\n## 📊 Sample Data vs Production Data
\n\n
\n\n**⚠️ VIGTIGT**: Dashboard viser sample data i development mode.

\n\n### Development Mode
\n\n
\n\n```typescript
\n\nif (process.env.NODE_ENV === 'development') {
  // Use mock data from fixtures/dashboard-sample.json
  return SAMPLE_DATA;
}
\n\n```

\n\n### Production Mode
\n\n
\n\n```typescript
\n\n// Fetch from real database
const data = await fetchRealMetrics();
\n\n```

**Visual Indicator**: Development mode viser "🎨 Sample Data" badge i top bar.

---

\n\n## 📚 Change Log
\n\n
\n\n| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-09-30 | 1.0.0 | Initial KPI definitions | GitHub Copilot |

---

\n\n## 🔗 Related Documentation
\n\n
\n\n- [Dashboard UI Specs](./docs/ui/DASHBOARD.md)
\n\n- [Database Schema](./docs/database/SCHEMA.md)
\n\n- [API Endpoints](./docs/api/ENDPOINTS.md)
\n\n- [Analytics Implementation](./docs/analytics/IMPLEMENTATION.md)
\n\n
---

**Review Schedule**: Quarterly (every 3 months)  
**Next Review**: 2025-12-31
