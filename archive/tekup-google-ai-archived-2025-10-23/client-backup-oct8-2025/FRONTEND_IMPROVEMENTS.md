# RenOS Frontend - Development Guide

**Domain:** [www.renos.dk](https://www.renos.dk)  
**Current Status:** Fully functional React + TypeScript dashboard with Clerk auth

---

## ✅ What's Already Built

The frontend is **90% complete** with the following features:

### Existing Components & Pages

- ✅ **Layout.tsx** - Sidebar, topbar, responsive navigation
- ✅ **Dashboard** - KPIs, statistics, charts (Recharts)
- ✅ **Customers** - Table view, CRUD operations
- ✅ **Customer360** - Detailed customer profile
- ✅ **Leads** - Lead management and filtering
- ✅ **Bookings** - Booking creation and management
- ✅ **Calendar** - Calendar view component
- ✅ **EmailApproval** - AI response approval workflow
- ✅ **Analytics** - Revenue and service analytics
- ✅ **ChatInterface** - AI chat assistant
- ✅ **Settings** - System configuration

### Tech Stack

- React 18.3 + TypeScript 5
- Tailwind CSS + Custom design system
- React Query (not installed yet - add it!)
- React Router v6
- Clerk Authentication
- Vite build tool

---

## 🎯 Improvements Needed (Based on Aura Design)

### 1. Modernize Layout
**File:** `client/src/components/Layout.tsx`

**Current:** Functional sidebar with basic navigation  
**Needs:** 
- Better visual hierarchy
- Improved search bar in topbar
- User menu dropdown with avatar
- Mobile-responsive hamburger menu
- Breadcrumb navigation

### 2. Enhance Dashboard
**File:** `client/src/pages/Dashboard/Dashboard.tsx`

**Current:** Basic stats and charts  
**Needs:**
- Modern KPI cards with trend indicators (`+8.4%` with arrow icons)
- Quick Stats section (3-column grid)
- Upcoming Tasks list with color-coded status dots
- Recent Activity feed with timestamps
- Drag & Drop task board (Kanban style)

### 3. Add Lead Pipeline Kanban
**File:** `client/src/pages/Leads/Leads.tsx`

**Current:** Table view only  
**Needs:**
- Kanban board: New → Contacted → Qualified → Converted
- Drag & drop between columns
- Lead conversion modal (create customer + booking in one flow)

### 4. Improve Calendar
**File:** `client/src/components/Calendar.tsx`

**Current:** Basic calendar  
**Needs:**
- Month/Week/Day view toggle
- Color-coded bookings (Pending=Amber, Confirmed=Blue, Completed=Green)
- Drag & drop to reschedule
- Conflict detection warning
- Click empty slot → create booking modal

### 5. Enhance Email Approval
**File:** `client/src/components/EmailApproval.tsx`

**Current:** Basic list  
**Needs:**
- Preview cards with original + generated response
- Sentiment badges (Positive/Neutral/Negative)
- Bulk approve/reject actions
- Status filter (Pending/Approved/Rejected/Sent)

---

## 🚀 Quick Start

```powershell
# Install missing dependencies
cd client
npm install @tanstack/react-query react-router-dom lucide-react recharts axios date-fns clsx tailwind-merge

# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

---

## 📝 Development Checklist

### Phase 1: Core Improvements (Priority)
- [ ] Install @tanstack/react-query and setup QueryClient
- [ ] Add React Query hooks for all API calls (`useCustomers`, `useLeads`, etc.)
- [ ] Modernize KPI cards on Dashboard with trend indicators
- [ ] Add Quick Stats 3-column section
- [ ] Add Recent Activity feed

### Phase 2: Advanced Features
- [ ] Build Kanban board for Leads page
- [ ] Add drag & drop to Kanban
- [ ] Implement lead conversion modal
- [ ] Add Month/Week/Day toggle to Calendar
- [ ] Implement calendar drag & drop for bookings

### Phase 3: Polish
- [ ] Add loading skeletons for all pages
- [ ] Improve error handling with toast notifications
- [ ] Add dark mode toggle (optional)
- [ ] Update branding to <www.renos.dk>
- [ ] Add keyboard shortcuts guide modal

---

## 🔧 Key Files to Modify

```
client/src/
├── lib/
│   ├── api.ts              ✅ Done - Axios client configured
│   ├── types.ts            ✅ Done - TypeScript interfaces
│   └── utils.ts            ✅ Done - Helper functions
├── components/
│   └── Layout.tsx          🔄 Needs modernization
├── pages/
│   ├── Dashboard/
│   │   └── Dashboard.tsx   🔄 Needs KPI improvements
│   ├── Leads/
│   │   └── Leads.tsx       🔄 Needs Kanban board
│   └── Customers/
│       └── Customers.tsx   🔄 Minor tweaks
```

---

## 🎨 Design Reference

Use the HTML prototype from Aura as reference:
- Modern card designs
- Color-coded status badges
- Drag & drop interactions
- Responsive grid layouts

---

## 📚 Next Steps

1. **Install React Query:**
   ```powershell
   cd client
   npm install @tanstack/react-query
   ```

2. **Setup QueryClient in main.tsx:**
   ```tsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   
   const queryClient = new QueryClient();
   
   <QueryClientProvider client={queryClient}>
     <App />
   </QueryClientProvider>
   ```

3. **Create custom hooks:**
   - `hooks/useCustomers.ts`
   - `hooks/useLeads.ts`
   - `hooks/useBookings.ts`

4. **Start building modern components!**

---

**Remember:** The foundation is solid. We're just adding polish and modern UX patterns! 🚀
