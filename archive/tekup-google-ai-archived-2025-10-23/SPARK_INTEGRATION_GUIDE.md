# 🚀 GitHub Spark → RenOS Frontend Integration Guide

## 📥 Trin 1: Få Koden fra Spark

### Option A: Publish & Download (Anbefalet)
1. I GitHub Spark, klik **"Publish"** knappen (øverst til højre)
2. Spark deployer til GitHub og giver dig et repository
3. Clone repository eller download zip fil

### Option B: Manuel Copy-Paste
1. I Spark sidebar, se listen over filer
2. Kopier indholdet af hver fil manuelt
3. Paste ind i tilsvarende filer i `renos-frontend`

---

## 📁 Trin 2: Organiser Komponenterne

Flyt Spark's filer til denne struktur:

```
renos-frontend/src/
├── pages/
│   ├── Dashboard.tsx          ← Fra Spark: Dashboard.tsx
│   ├── Bookings.tsx           ← Fra Spark: Bookings.tsx
│   ├── Customers.tsx          ← Fra Spark: Customers.tsx (hvis lavet)
│   ├── Emails.tsx             ← Fra Spark: Emails.tsx (hvis lavet)
│   └── Quotes.tsx             ← Fra Spark: Quotes.tsx (hvis lavet)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx        ← Fra Spark: Sidebar.tsx
│   │   └── Header.tsx         ← Fra Spark: Header.tsx (hvis der er en)
│   │
│   ├── dashboard/
│   │   ├── MetricCard.tsx     ← Fra Spark: MetricCard.tsx
│   │   ├── ActivityTimeline.tsx ← Fra Spark: ActivityTimeline.tsx
│   │   └── QuickActions.tsx   ← Fra Spark: QuickActions.tsx
│   │
│   ├── bookings/
│   │   ├── BookingCard.tsx    ← Fra Spark: BookingCard.tsx
│   │   └── CalendarView.tsx   ← Fra Spark: Bookings.tsx komponenter
│   │
│   └── ui/
│       ├── Button.tsx         ← Hvis Spark har lavet custom buttons
│       └── Card.tsx           ← Hvis Spark har lavet custom cards
│
└── types/
    └── index.ts               ← Types fra Spark's datastruktur
```

---

## 🔧 Trin 3: Fix Imports

Når du flytter filer, skal imports opdateres:

**Før (i Spark):**
```typescript
import { MetricCard } from './MetricCard';
```

**Efter (i renos-frontend):**
```typescript
import { MetricCard } from '@/components/dashboard/MetricCard';
```

**Aktivér path alias** - Tilføj til `vite.config.ts`:
```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Og i `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🔗 Trin 4: Tilslut til Backend API

### A. Opdater API Client

Spark bruger mock data. Skift til rigtig API:

**Før (Spark mock data):**
```typescript
const [metrics, setMetrics] = useState({
  totalCustomers: { value: 24, trend: 8.5 },
  pendingBookings: 3,
  unreadEmails: 2,
  activeQuotes: { count: 3, totalValue: 5500 }
});
```

**Efter (Backend API med TanStack Query):**
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

const { data: metrics, isLoading } = useQuery({
  queryKey: ['dashboard-metrics'],
  queryFn: async () => {
    const response = await apiClient.get('/api/dashboard/metrics');
    return response.data;
  },
  refetchInterval: 30000, // Refresh every 30 seconds
});
```

### B. Opret Backend Endpoints (i renos-backend)

**1. Dashboard Metrics Endpoint**

Tilføj til `renos-backend/src/index.ts`:

```typescript
// Dashboard metrics
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const customersCount = await prisma.customer.count();
    const lastMonthCount = await prisma.customer.count({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    const customerTrend = customersCount > 0 
      ? ((customersCount - lastMonthCount) / lastMonthCount) * 100 
      : 0;

    const pendingBookings = await prisma.booking.count({
      where: { status: 'PENDING' }
    });

    const unreadEmails = await prisma.emailThread.count({
      where: { status: 'UNREAD' }
    });

    const activeQuotes = await prisma.quote.findMany({
      where: { 
        status: { in: ['DRAFT', 'SENT'] }
      }
    });

    res.json({
      totalCustomers: {
        value: customersCount,
        trend: customerTrend,
        period: 'month'
      },
      pendingBookings,
      unreadEmails,
      activeQuotes: {
        count: activeQuotes.length,
        totalValue: activeQuotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0)
      }
    });
  } catch (error) {
    logger.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Recent activity
app.get('/api/activity/recent', async (req, res) => {
  try {
    // Hent recent customers
    const recentCustomers = await prisma.customer.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true }
    });

    // Hent recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });

    // Hent recent quotes
    const recentQuotes = await prisma.quote.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });

    // Kombiner og sorter
    const activities = [
      ...recentCustomers.map(c => ({
        id: `customer-${c.id}`,
        type: 'customer' as const,
        title: 'New Customer Registration',
        description: `New customer ${c.name} added to the system`,
        timestamp: c.createdAt.toISOString()
      })),
      ...recentBookings.map(b => ({
        id: `booking-${b.id}`,
        type: 'booking' as const,
        title: 'Booking Confirmed',
        description: `${b.serviceType} scheduled for ${b.customer?.name}`,
        timestamp: b.createdAt.toISOString()
      })),
      ...recentQuotes.map(q => ({
        id: `quote-${q.id}`,
        type: 'quote' as const,
        title: 'Quote Generated',
        description: `Quote ${q.quoteNumber} created for ${q.customer?.name}`,
        timestamp: q.createdAt.toISOString()
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    res.json(activities);
  } catch (error) {
    logger.error('Recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});
```

---

## 🎨 Trin 5: Setup Routing

Opdater `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './pages/Dashboard';
import { Bookings } from './pages/Bookings';
import { Customers } from './pages/Customers';
import { Emails } from './pages/Emails';
import { Quotes } from './pages/Quotes';
import { Sidebar } from './components/layout/Sidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/emails" element={<Emails />} />
              <Route path="/quotes" element={<Quotes />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## ✅ Trin 6: Test Alt

```powershell
# Terminal 1: Start backend
cd C:\Users\empir\renos-backend
npm run dev

# Terminal 2: Start frontend
cd C:\Users\empir\renos-frontend
npm run dev
```

Åbn browser: <http://localhost:5173>

**Tjek:**
- ✅ Dashboard loader metrics fra backend
- ✅ Navigation virker mellem pages
- ✅ Tailwind CSS styles vises korrekt
- ✅ Ingen console errors

---

## 🐛 Troubleshooting

### Problem: "Cannot find module '@/api/client'"

**Fix:** Tilføj path alias til `vite.config.ts` og `tsconfig.json` (se Trin 3)

### Problem: CORS error når du kalder API

**Fix i backend** (`renos-backend/src/index.ts`):
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Problem: Data vises ikke

**Check:**
1. Backend kører på port 3000
2. `.env` i frontend har `VITE_API_URL=http://localhost:3000`
3. Backend endpoints returnerer data (test i Postman/browser)

### Problem: Tailwind styles virker ikke

**Fix:**
1. Check at `src/index.css` har Tailwind directives
2. Check at `tailwind.config.js` content inkluderer tsx filer
3. Restart dev server

---

## 🎉 Du er Klar

Nu har du:
- ✅ Spark UI integreret i dit projekt
- ✅ Tilsluttet til backend API
- ✅ Routing setup
- ✅ Modern tech stack klar

**Næste skridt:**
- Byg flere pages (Customers, Emails, Quotes)
- Tilføj authentication
- Implementer CRUD operations
- Deploy til produktion

---

**Held og lykke! 🚀**
