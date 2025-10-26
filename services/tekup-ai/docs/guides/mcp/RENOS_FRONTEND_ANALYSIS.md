# RenOS Frontend - Architecture Analysis

**Dato:** 16. oktober 2025  
**Version:** spark-template  
**Repo:** C:\Users\empir\renos-frontend

---

## 🏗️ Architecture

**Pattern:** Component-Based Architecture (React) + Feature-Sliced Design

### Tech Stack
- **Framework:** React 19.0 (cutting edge!)
- **Bundler:** Vite 6.3
- **UI Library:** Radix UI (20+ components)
- **Design System:** GitHub Spark
- **Styling:** Tailwind CSS 4.1
- **State:** TanStack React Query 5.90
- **Forms:** React Hook Form 7.54
- **Routing:** React Router 7.9
- **Validation:** Zod 3.25
- **Icons:** Lucide, Heroicons, Phosphor
- **Animations:** Framer Motion 12.6
- **Notifications:** Sonner (toast)

---

## 📁 Structure

```
src/
├── api/                      # API client layer
│   ├── client.ts            # RenOSApiClient class
│   ├── customers.ts         # Customer API
│   ├── leads.ts             # Leads API
│   └── ... (7 API modules)
├── components/              # React components
│   ├── ui/                  # Radix UI components (40+)
│   ├── pages/               # Page components
│   ├── customers/           # Feature components
│   ├── bookings/
│   ├── emails/
│   └── workflows/           # Workflow automation UI
├── hooks/                   # Custom React hooks
│   ├── useApiState.ts       # API state management
│   ├── useCustomers.ts      # Feature hooks
│   └── useRealtime*.ts      # Supabase realtime (3 hooks)
├── lib/                     # Utilities
│   ├── api.ts               # Legacy API functions
│   ├── supabase.ts          # Supabase client
│   ├── types.ts             # Type definitions
│   └── utils.ts             # Helpers
├── agents/                  # AI Agent system (!)
│   ├── communication-hub.ts
│   └── orchestrator.ts
└── types/                   # TypeScript types
    └── database.types.ts
```

---

## 🎯 Key Patterns

### API Client Pattern
**Class-based with Interceptors:**
```typescript
export class RenOSApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: 'https://renos-backend.onrender.com',
      timeout: 30000
    });
    
    // Request: Add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    
    // Response: Toast notifications for errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Status-based toast messages
        switch (error.response.status) {
          case 400: toast.error('Invalid request...');
          case 401: toast.error('Please log in...');
          // ... etc
        }
        return Promise.reject(error);
      }
    );
  }
  
  async get<T>(url: string): Promise<T> { ... }
  async post<T>(url: string, data?: any): Promise<T> { ... }
}
```

**Pattern Strengths:**
- Centralized error handling
- Automatic auth injection
- User-friendly toast notifications
- Type-safe methods
- Single client instance

### Component Organization
**Feature-Based:**
- `components/customers/` - Customer-related components
- `components/bookings/` - Booking components
- `components/emails/` - Email components

**Shared UI:**
- `components/ui/` - Reusable Radix UI components (40+)

### Custom Hooks Pattern
**API State Management:**
```typescript
// useCustomers.ts
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.get('/api/customers')
  });
}

// useRealtimeLeads.ts - Supabase realtime
export function useRealtimeLeads() {
  const [leads, setLeads] = useState([]);
  // Subscribe to realtime updates
}
```

### Error Handling
- **Axios Interceptor:** Catch all API errors
- **Toast Notifications:** User-friendly messages
- **Error Boundary:** React Error Boundary component
- **Status Code Mapping:** Different messages per status

---

## 🤖 AI Agents (!!)

**Notable:** Frontend har AI agent system!
- `agents/communication-hub.ts`
- `agents/orchestrator.ts`

**Scripts:**
```json
"agents:test": "tsx src/agents/communication-hub.ts",
"agents:demo": "tsx src/agents/orchestrator.ts",
"agents:status": "node -e \"...\""
```

Agents: frontend, backend, testing, devops, integration, docs

---

## 💡 Key Takeaways for AI Assistant

### Must Adopt
1. **Class-Based API Client:** RenOSApiClient pattern
2. **Toast Notifications:** User feedback for operations
3. **Axios Interceptors:** Centralized auth + error handling
4. **TanStack Query:** For server state management
5. **Radix UI:** Professional component library

### TypeScript Patterns
- Strict mode enabled
- Generic type parameters on API methods
- Interface-based prop typing
- Zod validation for forms

---

**Status:** ✅ Complete  
**Time:** ~15 minutter  
**Insights:** Modern React patterns, excellent DX

