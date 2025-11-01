# 🏗️ RenOS - Visual Architecture Diagram

\n\n
\n\n## System Oversigt
\n\n
\n\n```
\n\n┌─────────────────────────────────────────────────────────────────────┐
│                         RenOS Application                            │
│                    (React 18 + TypeScript + Vite)                   │
\n\n└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │      client/index.html      │
                    │  (Danish, PWA, Inter font)  │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      client/src/main.tsx    │
                    │   (React + Clerk Provider)  │
\n\n                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      client/src/App.tsx     │
                    │   (Route Manager + Auth)    │
\n\n                    └─────────────┬──────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│  SignedOut    │        │  SignedIn     │        │ ErrorBoundary │
│  (Landing)    │        │  (Main App)   │        │   (Fallback)  │
└───────────────┘        └───────┬───────┘        └───────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Layout.tsx             │
                    │  (Persistent Shell)     │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Sidebar     │       │   Top Bar     │       │ Content Area  │
│  Navigation   │       │ Search + User │       │ (Pages Router)│
\n\n└───────────────┘       └───────────────┘       └───────┬───────┘
                                                          │
                          ┌───────────────────────────────┼───────────────────────────────┐
                          │                               │                               │
        ┌─────────────────┼───────────────────────────────┼───────────────────────────────┼─────────────────┐
        │                 │                               │                               │                 │
        ▼                 ▼                               ▼                               ▼                 ▼
┌───────────────┐ ┌───────────────┐            ┌───────────────┐            ┌───────────────┐   ┌───────────────┐
│   Dashboard   │ │     Chat      │            │   Customers   │            │     Leads     │   │   Bookings    │
│   (Stats +    │ │  (AI Friday)  │            │  (CRUD Table) │            │ (AI Quotes)   │   │  (Calendar)   │
\n\n│   Charts)     │ │               │            │               │            │               │   │               │
└───────┬───────┘ └───────┬───────┘            └───────┬───────┘            └───────┬───────┘   └───────┬───────┘
        │                 │                            │                            │                   │
        │                 │                            │                            │                   │
        ▼                 ▼                            ▼                            ▼                   ▼
┌───────────────┐ ┌───────────────┐            ┌───────────────┐            ┌───────────────┐   ┌───────────────┐
│ Customer360   │ │ Email Approval│            │   Services    │            │    Quotes     │   │   Analytics   │
│ (Unified View)│ │  (Workflow)   │            │   (Catalog)   │            │ (Management)  │   │     (BI)      │
└───────────────┘ └───────────────┘            └───────────────┘            └───────────────┘   └───────────────┘
                                                                                                          │
                                                                                                          ▼
                                                                                                  ┌───────────────┐
                                                                                                  │   Settings    │
                                                                                                  │ (Preferences) │
                                                                                                  └───────────────┘
\n\n```

---

\n\n## Component Hierarki
\n\n
\n\n```
\n\nApp.tsx
 ├─ ErrorBoundary
 │   └─ (Error Fallback UI)
 │
 ├─ SignedOut (Clerk)
 │   └─ Landing/Login Page
 │
 └─ SignedIn (Clerk)
     └─ Layout.tsx
         ├─ Sidebar
         │   ├─ Logo
         │   ├─ Navigation Items (10)
         │   │   ├─ Home (Dashboard)
         │   │   ├─ Chat
         │   │   ├─ Customers
         │   │   ├─ Leads
         │   │   ├─ Email Approval
         │   │   ├─ Bookings
         │   │   ├─ Quotes
         │   │   ├─ Analytics
         │   │   └─ Settings
         │   └─ UserButton (Clerk)
         │
         ├─ Top Bar
         │   ├─ GlobalSearch (Ctrl+K)
         │   ├─ Notifications
         │   └─ Theme Toggle (future)
         │
         └─ Content Area
             └─ {currentPage} (state-based routing)
                 ├─ Dashboard.tsx
                 ├─ ChatInterface.tsx
                 ├─ Customers.tsx
                 ├─ Customer360.tsx
                 ├─ Leads.tsx
                 ├─ EmailApproval.tsx
                 ├─ Bookings.tsx
                 ├─ Services.tsx
                 ├─ Quotes.tsx
                 ├─ Analytics.tsx
                 └─ Settings.tsx
\n\n```

---

\n\n## Design System Lag
\n\n
\n\n```
\n\n┌──────────────────────────────────────────────────────┐
│                 Application Layer                     │
│  (Pages: Dashboard, Chat, Customers, etc.)           │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│              Feature Components Layer                 │
│  (CreateLeadModal, AIQuoteModal, BookingModal, etc.) │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│               UI Components Layer (62)                │
│  (Button, Card, Dialog, Table, Badge, etc.)          │
│  Location: client/src/components/ui/                 │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│            Radix UI Primitives (30+)                  │
│  (@radix-ui/react-dialog, react-select, etc.)        │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│           Tailwind CSS v4 + Design Tokens             │
\n\n│  (client/src/App.css - 1122 lines)                   │
\n\n│  - Color variables (40+)                             │
\n\n│  - Spacing tokens                                    │
\n\n│  - Typography scale                                  │
\n\n│  - Animation definitions                             │
\n\n└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│                   CSS Variables                       │
│  - --primary, --accent, --success, etc.              │
\n\n│  - --radius-sm/md/lg/xl                              │
\n\n│  - --chart-1 through --chart-5                       │
\n\n└──────────────────────────────────────────────────────┘
\n\n```

---

\n\n## Data Flow (Lead til Booking Eksempel)
\n\n
\n\n```
\n\nUser Action: "Opret Lead"
        │
        ├─ CreateLeadModal.tsx
        │   └─ Form validation
        │   └─ User input capture
        │
        ▼
POST /api/leads
        │
        ├─ Backend: leadController.ts
        │   ├─ Validate data
        │   ├─ Prisma ORM insert
        │   └─ Return Lead object
        │
        ▼
Database: PostgreSQL (Prisma)
  └─ Lead table insert
        │
        ▼
Frontend: leads state update
        │
        ├─ Re-render Leads.tsx
        │   └─ New lead appears in table
        │
        └─ Toast notification
            └─ "Lead oprettet succesfuldt"

───────────────────────────────────

User Action: "Generate AI Quote" (sparkles icon)
        │
        ├─ AIQuoteModal.tsx opens
        │
        ▼
POST /api/ai/generate-quote
        │
        ├─ Backend: aiController.ts
        │   ├─ Parse lead data
        │   ├─ Call Gemini API
        │   └─ Format response
        │
        ▼
AI Processing: Gemini 1.5 Flash
  └─ Generate tailored quote text
        │
        ▼
Frontend: AIQuoteModal displays
        │
        ├─ Editable quote textarea
        ├─ Customer info summary
        │
        └─ User Action: "Send Email"
            │
            ▼
POST /api/email/compose
            │
            ├─ Backend: emailController.ts
            │   ├─ Create EmailResponse record
            │   ├─ Status: "pending"
            │   └─ Queue for approval
            │
            ▼
Database: EmailResponse table
  └─ Insert with status "pending"
            │
            ▼
Toast: "Email sendt til godkendelse"
            │
            └─ User navigates to /email-approval

───────────────────────────────────

Email Approval Flow:
        │
        ├─ EmailApproval.tsx
        │   └─ Fetch pending emails
        │       └─ GET /api/email/pending
        │
        ▼
Display email cards
        │
        ├─ User clicks "Approve"
        │   └─ PATCH /api/email/:id/approve
        │       └─ Status: "pending" → "approved"
        │
        ▼
Cron Job: email:monitor
        │
        ├─ Checks for approved emails
        │   └─ SELECT * FROM EmailResponse WHERE status='approved'
\n\n        │
        ▼
Send via Gmail API
        │
        ├─ gmailService.sendEmail()
        │   ├─ Thread detection
        │   ├─ Compose message
        │   └─ Send
        │
        ▼
Update database
  └─ Status: "approved" → "sent"
        │
        ▼
Customer receives email ✅
\n\n```

---

\n\n## UI Component Dependency Graph
\n\n
\n\n```
\n\nPages (36)
 │
 ├─ Dashboard.tsx
 │   ├─ Card (from ui)
 │   │   ├─ CardHeader
 │   │   ├─ CardTitle
 │   │   └─ CardContent
 │   ├─ Badge
 │   ├─ Button
 │   ├─ Skeleton (loading)
 │   └─ Recharts
 │       ├─ AreaChart
 │       ├─ PieChart
 │       ├─ XAxis
 │       ├─ YAxis
 │       ├─ CartesianGrid
 │       ├─ Tooltip
 │       └─ ResponsiveContainer
 │
 ├─ ChatInterface.tsx
 │   ├─ Button
 │   ├─ Input
 │   ├─ Card
 │   ├─ ScrollArea
 │   ├─ ReactMarkdown
 │   │   └─ remarkGfm
 │   ├─ Lucide Icons (15+)
 │   └─ LoadingSpinner
 │
 ├─ Leads.tsx
 │   ├─ Button
 │   ├─ Input (search)
 │   ├─ Select (filter)
 │   ├─ Badge
 │   ├─ Table
 │   ├─ CreateLeadModal
 │   │   ├─ Dialog
 │   │   ├─ Form
 │   │   ├─ Input
 │   │   ├─ Textarea
 │   │   ├─ Select
 │   │   └─ Button
 │   ├─ AIQuoteModal
 │   │   ├─ Dialog
 │   │   ├─ Textarea (editable)
 │   │   └─ Button
 │   └─ EmptyState
 │
 ├─ Customers.tsx
 │   ├─ Button
 │   ├─ Input
 │   ├─ Table
 │   │   ├─ TableHeader
 │   │   ├─ TableBody
 │   │   ├─ TableRow
 │   │   └─ TableCell
 │   ├─ Badge
 │   ├─ Dialog (Create/Edit)
 │   │   ├─ DialogHeader
 │   │   ├─ DialogTitle
 │   │   ├─ DialogContent
 │   │   └─ DialogFooter
 │   └─ AlertDialog (Delete confirmation)
 │
 └─ Bookings.tsx
     ├─ Button
     ├─ Calendar (date picker)
     ├─ Select (time picker)
     ├─ Table
     ├─ Badge
     ├─ BookingModal
     │   ├─ Dialog
     │   ├─ Form
     │   ├─ Calendar
     │   ├─ Select (customer + service)
\n\n     │   └─ Input (duration)
     └─ Toast (confirmations)
\n\n```

---

\n\n## State Management Flow
\n\n
\n\n```
\n\n┌─────────────────────────────────────────────────────┐
│              No Global State Manager                 │
│         (Intentionally simple architecture)          │
└─────────────────────────────────────────────────────┘

Component-Level State (useState):
├─ currentPage (App.tsx) → routes pages
├─ leads (Leads.tsx) → lead data
├─ customers (Customers.tsx) → customer data
├─ bookings (Bookings.tsx) → booking data
├─ messages (ChatInterface.tsx) → chat history
├─ isLoading (multiple) → loading states
├─ error (multiple) → error states
└─ formData (modals) → form inputs

Context (React Context API):
├─ Clerk Authentication Context
│   ├─ user
│   ├─ session
│   ├─ isSignedIn
│   └─ signOut()
│
└─ Toast Context (from use-toast)
    ├─ toast()
    ├─ toasts[]
    └─ dismiss()

Server State (Fetch API):
├─ No React Query (not needed yet)
├─ No SWR
├─ Direct fetch() calls
└─ Local caching in component state

Why No Redux/Zustand?
✅ Simple application (not complex state)
✅ Most state is server-driven
✅ Component-level state sufficient
✅ Clerk handles auth state
⚠️ Consider React Query for future caching needs
\n\n```

---

\n\n## API Integration Pattern
\n\n
\n\n```
\n\nFrontend Component
        │
        ├─ User action (button click)
        │
        ▼
async function fetchData() {
  setLoading(true);
  try {
    const res = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('API Error');
    
    const json = await res.json();
    setData(json);
    
    toast({
      title: "Success",
      description: "Data saved"
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
}
        │
        ▼
Backend API Route
        │
        ├─ Express Router
        │   └─ /api/endpoint
        │
        ▼
Controller Function
        │
        ├─ Validate request
        ├─ Business logic
        ├─ Database interaction (Prisma)
        └─ Return JSON response
        │
        ▼
Database (PostgreSQL via Prisma)
  └─ CRUD operations
\n\n```

---

\n\n## Responsive Behavior Matrix
\n\n
\n\n| Element        | Mobile (<640px)      | Tablet (640-1024px)  | Desktop (>1024px)    |
|----------------|----------------------|----------------------|----------------------|
| **Sidebar**    | Hidden (hamburger)   | Collapsible          | Always visible       |
\n\n| **Grid**       | 1 column             | 2 columns            | 3-4 columns          |
\n\n| **Tables**     | Cards (stacked)      | Horizontal scroll    | Full table           |
\n\n| **Modals**     | Full screen          | 80% width            | 600px max-width      |
\n\n| **Stat Cards** | 1 column             | 2 columns            | 4 columns            |
\n\n| **Charts**     | Full width           | Full width           | Side-by-side         |
\n\n| **Forms**      | Single column        | Single column        | Two columns          |
\n\n| **Buttons**    | Full width           | Auto width           | Auto width           |
\n\n
---

\n\n## Performance Optimization Layers
\n\n
\n\n```
\n\n1. Build Level
   ├─ Vite code splitting
   ├─ Tree shaking (Lucide icons)
   ├─ Minification
   └─ Gzip compression

\n\n2. Code Level
   ├─ React.lazy() for pages
   ├─ Dynamic imports
   ├─ Memoization (useMemo, useCallback)
   └─ Debounced search (300ms)

\n\n3. Network Level
   ├─ API response caching (5 min TTL)
   ├─ Service Worker (PWA)
   └─ CDN for static assets (future)

\n\n4. Render Level
   ├─ Virtualized lists (if 1000+ items)
\n\n   ├─ Skeleton loaders
   ├─ Optimistic UI updates
   └─ Conditional rendering

\n\n5. Asset Level
   ├─ WebP images with fallbacks
   ├─ Lazy loading images
   ├─ Responsive images (srcset)
   └─ SVG icons (not PNGs)
\n\n```

---

\n\n## Icon System Architecture
\n\n
\n\n```
\n\nLucide React (Tree-shakeable)
 │
 ├─ Total icons available: 1000+
 ├─ Icons used in RenOS: ~50
 │
 └─ Icon Categories:
     ├─ Navigation (10)
     │   └─ Home, MessageCircle, Users, Mail, Target,
     │       CheckCircle, Calendar, FileText, BarChart3, Settings
     │
     ├─ Actions (15)
     │   └─ Plus, Trash2, Edit, Search, Filter, Send,
     │       Copy, CheckCheck, RotateCcw, RefreshCw, X, Check
     │
     ├─ Status (8)
     │   └─ Clock, CheckCircle, XCircle, AlertTriangle,
     │       Info, Loader2, Sparkles, TrendingUp
     │
     ├─ Communication (7)
     │   └─ Mail, Phone, MessageSquare, Bell,
     │       Mic, MicOff, Bot
     │
     └─ UI Elements (10)
         └─ ChevronDown, ChevronRight, MoreVertical,
             Eye, EyeOff, Download, Upload, Calendar, Clock, User

Icon Usage Pattern:
import { IconName } from 'lucide-react';

<IconName
  className="w-5 h-5 text-primary"
  strokeWidth={2}
/>

Standard sizes:
\n\n- xs: w-3 h-3 (12px)
\n\n- sm: w-4 h-4 (16px)
\n\n- base: w-5 h-5 (20px) ← Most common
\n\n- lg: w-6 h-6 (24px)
\n\n- xl: w-8 h-8 (32px)
\n\n```

---

_Denne arkitektur diagram giver et komplet overblik over RenOS's visuelle struktur, komponent hierarki, data flow og design system._

**Version:** 1.0  
**Dato:** 3. Oktober 2025
