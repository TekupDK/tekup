# Sales Tracking System - Visual Workflows

Visual representations of key workflows and data flows in the Internal Sales Tracking System.

---

## Complete Sale Lifecycle

```
LEAD STAGE
│
├─> Inquiry Arrives (Email/Phone/Website)
├─> Lead Created (Status: NEW, Priority assigned)
├─> Contact & Qualification (NEW → CONTACTED → QUALIFIED)
└─> Decision: Convert or Disqualify
        │
        │ CONVERT TO SALE
        ▼
SALES STAGE
│
├─> Quote Preparation (Status: QUOTE_SENT)
├─> Customer Decision (ACCEPTED / LOST / No response)
├─> Scheduling (SCHEDULED + Google Calendar event)
├─> Service Delivery (IN_PROGRESS → COMPLETED)
├─> Invoicing (Auto-create Billy.dk invoice)
├─> Payment Tracking (Webhook or polling)
└─> Status: PAID
        │
        ▼
POST-SALE
│
├─> Customer Satisfaction
├─> Re-engagement (30/60/90 days)
└─> Upsell Opportunities
```

---

## Invoice Automation Flow

```
Sale Status: COMPLETED
        │
        ▼
Backend Hook Triggered
        │
        ├─> Prepare invoice data (customer, line items, tax)
        ├─> POST to Tekup-Billy API
        ├─> Billy.dk creates invoice and returns ID
        ├─> Update sale: billy_invoice_id, payment_status=PENDING
        └─> Billy.dk emails invoice to customer
        │
        ▼
PAYMENT TRACKING (Two Methods)
        │
        ├─> Method 1: Polling every 15 minutes
        │   └─> Query Billy API for payment status
        │
        └─> Method 2: Webhook (real-time)
            └─> Billy.dk sends payment notification
        │
        ▼
Sale Status: PAID
```

---

## Authentication & Authorization

```
Client                          Server
  │                              │
  │ POST /auth/login             │
  │ {email, password}            │
  ├─────────────────────────────>│
  │                              │ Validate credentials
  │                              │ Generate JWT with:
  │                              │ - userId
  │                              │ - organizationId
  │                              │ - role
  │                              │
  │ {access_token, user}         │
  │<─────────────────────────────┤
  │                              │
  │ Store token in localStorage  │
  │                              │
  │ GET /sales                   │
  │ Authorization: Bearer {token}│
  ├─────────────────────────────>│
  │                              │ Verify JWT
  │                              │ Inject organizationId
  │                              │ Query database with filter
  │                              │
  │ {sales: [...]}               │
  │<─────────────────────────────┤
```

---

## Multi-Organization Data Isolation

```
User Login: admin@rendetalje.dk
JWT Token: {organizationId: "org-rendetalje-123", role: "ADMIN"}
        │
        ▼
Every API Request
├─> OrganizationGuard extracts organizationId from JWT
└─> All database queries automatically filtered:

    SELECT * FROM sales
    WHERE organization_id = 'org-rendetalje-123'  <-- Auto-injected
    AND [other filters...]

Result: User ONLY sees Rendetalje data

Database Structure:
├─ org-rendetalje-123 → 10,000 sales
├─ org-tekup-456 → 8,000 sales
└─ org-foodtruck-789 → 5,000 sales

Security: Row-Level Security policies enforce isolation
```

---

## Sale Status State Machine

```
QUOTE_SENT (initial)
    │
    ├─> ACCEPTED or LOST
    │
ACCEPTED
    │
    ├─> SCHEDULED or CANCELLED
    │
SCHEDULED
    │
    ├─> IN_PROGRESS or CANCELLED
    │
IN_PROGRESS
    │
    ├─> COMPLETED or CANCELLED
    │
COMPLETED
    │
    └─> PAID (terminal)

Valid Transitions Only:
✓ QUOTE_SENT → ACCEPTED, LOST
✓ ACCEPTED → SCHEDULED, CANCELLED
✓ SCHEDULED → IN_PROGRESS, CANCELLED
✓ IN_PROGRESS → COMPLETED, CANCELLED
✓ COMPLETED → PAID

Invalid Transitions Blocked:
✗ PAID → anything (final state)
✗ Going backwards (e.g., COMPLETED → ACCEPTED)
```

---

## Lead Status State Machine

```
NEW (initial)
  │
  └─> CONTACTED
      │
      ├─> QUALIFIED
      │     │
      │     └─> CONVERTED (terminal)
      │
      └─> UNQUALIFIED (terminal)

Business Rules:
- NEW: Just created, no contact yet
- CONTACTED: At least one follow-up attempt
- QUALIFIED: Interested and fits criteria
- UNQUALIFIED: Not a good fit
- CONVERTED: Successfully became a sale
```

---

## Dashboard Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Tekup Sales Tracking      [🔔 3] [⚙️] [👤 Admin]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Revenue  │ │ Sales    │ │ Leads    │ │ Conv.Rate│      │
│  │ 125k DKK │ │ 45 Total │ │ 23 New   │ │ 68%      │      │
│  │ ↑ 12%    │ │ ↑ 5      │ │ ↓ 3      │ │ ↑ 5%     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Sales Pipeline                                             │
│  LEAD(12) → QUOTE(8) → ACCEPTED(15) → COMPLETED(10)        │
│  15k        12k         45k             38k DKK             │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌─────────────────────────────┐   │
│  │ Recent Activity    │  │ Revenue Trend (30 Days)     │   │
│  │ • New sale created │  │        ╱╲                   │   │
│  │ • Lead converted   │  │       ╱  ╲      ╱╲          │   │
│  │ • Payment received │  │      ╱    ╲    ╱  ╲         │   │
│  └────────────────────┘  └─────────────────────────────┘   │
│                                                             │
│  [+ New Sale]  [+ Add Lead]  [📊 Reports]  [⚙️ Settings]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Google Calendar Integration

```
Sale Status: ACCEPTED → SCHEDULED
Set scheduled_date: "2025-10-25 14:00"
        │
        ▼
CalendarService.createEvent()
├─> Load sale details (customer, service, staff, duration)
├─> Prepare event data (summary, start, end, attendees)
├─> POST to Google Calendar API
├─> Google returns eventId
└─> Update sale: calendar_event_id = eventId

Ongoing Sync:
├─> Date changes → Update event
├─> Sale cancelled → Delete event
└─> Staff changes → Update attendees
```

---

## System Architecture Overview

```
┌─────────────────────────────────┐
│  Users (Desktop/Mobile/Tablet)  │
└────────────┬────────────────────┘
             │ HTTPS
┌────────────┼────────────────────┐
│    Next.js Frontend (Render)    │
│ Dashboard | Sales | Customers   │
└────────────┬────────────────────┘
             │ REST API
┌────────────┼────────────────────┐
│    NestJS Backend (Render)      │
│ Auth | Sales | Integrations     │
└────────────┬────────────────────┘
             │ Prisma ORM
┌────────────┼────────────────────┐
│ PostgreSQL Database (Supabase)  │
│ Organizations | Sales | Leads   │
└─────────────────────────────────┘

External Integrations:
├─> Billy.dk (Invoicing)
├─> Google Calendar (Scheduling)
└─> Gmail (Email processing)
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-18  
**For**: Tekup Development Team
