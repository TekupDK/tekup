# COPY THIS TO FIGMA MAKE CHAT

Please proceed with finalizing the Tekup website design for integration with our existing platform. Here are the specific improvements needed:

## 🎯 PRIORITY 1: Update Dashboard with Real Data

**Current Mock Data → Real Business Metrics:**
- Change "12 nye leads" to "28 nye leads" (from actual Gmail analysis)
- Change "89% konvertering" to "3.6% konvertering" (realistic business metric)
- Change "95 AI Score" to "78 AI Score" (based on real email content analysis)
- Update top leads list to show: "Caja og Torben (95%)", "Emil Houmann (87%)", "Natascha Kring (95%)"

## 🔗 PRIORITY 2: API Integration Setup

**Replace demo system with real API endpoints:**
```typescript
// Connect to existing Tekup-org endpoints:
GET /api/analytics/gmail-dashboard/live
GET /api/contacts?status=new&created_after=today
GET /api/deals/conversion-rate
GET /api/analytics/ai-score
```

**Authentication Integration:**
- Replace demo login (demo@tekup.dk/demo123) with JWT token system
- Integrate with existing auth from apps/tekup-crm-api/src/auth/

## 🎨 PRIORITY 3: Design Refinements

**Lead Status Colors (meaningful):**
- Red (90-100): Hot leads (urgent keywords: "akut", "hurtig", "i dag")
- Yellow (70-89): Warm leads (has budget/price mentions)
- Blue (50-69): Cold leads (general inquiries)

**Brand Colors:**
- Primary: #0066CC (Tekup blue)
- Accent: #00D4FF (cyan)
- Success: #10B981 (emerald)

## 📱 PRIORITY 4: Mobile Optimization

- Dashboard cards must stack vertically on mobile
- Navigation should collapse to hamburger menu
- Lead list should be touch-friendly with larger tap targets
- Ensure all text remains readable on small screens

## 💼 PRIORITY 5: Business Logic Implementation

**Lead Scoring Algorithm:**
```typescript
// Score based on email content analysis:
// +20 points for urgency keywords ("akut", "hurtig", "asap")
// +30 points for business email (not gmail/hotmail)
// +25 points for phone number included
// Max score: 100
```

**Real Lead Sources:**
- Leadpoint.dk (Rengøring Aarhus): 15 leads (54%)
- Leadmail.no (Rengøring.nu): 13 leads (46%)

## 🚀 DELIVERABLES NEEDED

1. **Complete codebase** ready for integration into apps/website/ folder
2. **API integration hooks** that connect to our existing endpoints
3. **JWT authentication** compatible with our current system
4. **Mobile-responsive** dashboard and navigation
5. **Real data visualization** showing actual business metrics
6. **Production-ready** deployment configuration

## 📋 INTEGRATION REQUIREMENTS

**Monorepo Structure:**
```
apps/website/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Navigation/
│   │   └── Auth/
│   ├── hooks/
│   │   └── useDashboardData.ts
│   └── pages/
└── package.json
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GMAIL_INTEGRATION=true
NEXT_PUBLIC_CALENDAR_INTEGRATION=true
```

Please implement these changes and provide the complete, production-ready codebase that integrates with our existing Tekup-org platform. Focus on making the dashboard show real business data instead of mock data.

Start with Priority 1 (real data) and work through the priorities in order. Let me know when each priority is complete!
