# Subcontractor Integration with Billy.dk and Calendar MCP

## Overview

This document outlines the integration points between the Subcontractor Management System, Billy.dk accounting, and Google Calendar (via Calendar MCP).

## 🔗 Integration Architecture

```
Subcontractor Task Assignment
    ↓
    ├─→ Billy.dk API (Invoice generation)
    │   - Create invoice for subcontractor work
    │   - Track expenses and payments
    │
    └─→ Calendar MCP (Schedule sync)
        - Create calendar event when task assigned
        - Update event when status changes
        - Send reminders to subcontractor
```

## 📊 Billy.dk Integration

### Purpose

Automatically generate invoices for completed subcontractor work and track payments.

### Implementation Points

**1. When Task Completed**

- Trigger: `task_assignments.status` changes to `'completed'`
- Action: Create invoice in Billy.dk

**2. Invoice Details**

```typescript
{
  organizationId: BILLY_ORGANIZATION_ID,
  contactId: <subcontractor Billy contact ID>,
  type: 'invoice',
  currency: 'DKK',
  state: 'draft',
  lines: [
    {
      productId: <service product ID>,
      description: `${jobTitle} - ${customerName}`,
      quantity: hoursWorked || 1,
      unitPrice: subcontractorHourlyRate,
      taxRate: 0.25 // 25% Danish VAT
    }
  ]
}
```

**3. Required Billy.dk API Calls**

Create invoice:

```
POST /api/billy/invoices
```

Create/Update contact:

```
POST /api/billy/contacts
```

Track payment:

```
POST /api/billy/invoices/{id}/pay
```

### Integration Code Location

Create new service: `backend-nestjs/src/subcontractors/billy-integration.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class BillyIntegrationService {
  constructor(private config: ConfigService) {}

  async createSubcontractorInvoice(
    assignmentId: string,
    amount: number,
    description: string
  ): Promise<string> {
    // Implementation using Billy MCP or direct API
    // Return invoice ID
  }

  async getOrCreateBillyContact(subcontractorId: string): Promise<string> {
    // Return Billy contact ID
  }
}
```

### Environment Variables (Already Added)

From `subcontractor-services.env`:

```env
BILLY_INTEGRATION_ENABLED=true
BILLY_API_URL=https://api.billysbilling.com/v2
BILLY_ORGANIZATION_ID=from_billy_account
BILLY_AUTO_INVOICE_SUBCONTRACTORS=true
BILLY_INVOICE_DUE_DAYS=14
```

## 📅 Google Calendar Integration

### Purpose

Automatically create and manage calendar events for subcontractor task assignments.

### Implementation Points

**1. When Task Assigned**

- Trigger: `task_assignments.status` changes to `'assigned'` or `'accepted'`
- Action: Create Google Calendar event

**2. Calendar Event Details**

```typescript
{
  summary: `[Underleverandør] ${subcontractorName} - ${jobTitle}`,
  description: `
    Kunde: ${customerName}
    Adresse: ${customerAddress}
    Kontakt: ${customerPhone}

    Underleverandør: ${subcontractorCompany}
    Kontakt: ${subcontractorPhone}
  `,
  start: {
    dateTime: scheduledStartTime,
    timeZone: 'Europe/Copenhagen'
  },
  end: {
    dateTime: scheduledEndTime,
    timeZone: 'Europe/Copenhagen'
  },
  attendees: [
    { email: subcontractorEmail }
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 }, // 1 day before
      { method: 'popup', minutes: 60 }       // 1 hour before
    ]
  }
}
```

**3. Using Calendar MCP**

Calendar MCP is already available at `apps/rendetalje/services/calendar-mcp`.

Integration service location: `backend-nestjs/src/subcontractors/calendar-integration.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class CalendarIntegrationService {
  private readonly calendarMcpUrl =
    process.env.CALENDAR_MCP_URL || "http://localhost:3001";

  constructor(private httpService: HttpService) {}

  async createAssignmentEvent(
    assignment: TaskAssignment,
    subcontractor: Subcontractor,
    job: Job
  ): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.calendarMcpUrl}/calendar/events`, {
        summary: `[Underleverandør] ${subcontractor.companyName} - ${job.title}`,
        description: this.formatEventDescription(
          assignment,
          subcontractor,
          job
        ),
        start: job.scheduledDate,
        duration: job.estimatedHours || 2,
        attendees: [subcontractor.email],
      })
    );

    return response.data.eventId;
  }

  async updateAssignmentEvent(eventId: string, status: string): Promise<void> {
    await firstValueFrom(
      this.httpService.patch(
        `${this.calendarMcpUrl}/calendar/events/${eventId}`,
        {
          description: `Status: ${status}`,
        }
      )
    );
  }

  async deleteAssignmentEvent(eventId: string): Promise<void> {
    await firstValueFrom(
      this.httpService.delete(
        `${this.calendarMcpUrl}/calendar/events/${eventId}`
      )
    );
  }

  private formatEventDescription(
    assignment: TaskAssignment,
    subcontractor: Subcontractor,
    job: Job
  ): string {
    return `
Underleverandør Opgave

Kunde: ${job.customer.name}
Adresse: ${job.customer.address || "Ikke angivet"}
Telefon: ${job.customer.phone || "Ikke angivet"}

Underleverandør: ${subcontractor.companyName}
Kontaktperson: ${subcontractor.contactName}
Telefon: ${subcontractor.phone}
Email: ${subcontractor.email}

Opgave: ${job.title}
Beskrivelse: ${job.description || "Ingen beskrivelse"}

Status: ${assignment.status}
Tildelt: ${assignment.assignedAt.toLocaleString("da-DK")}
    `.trim();
  }
}
```

### Environment Variables (Already Added)

From `subcontractor-services.env`:

```env
SUBCONTRACTOR_CALENDAR_SYNC=true
CALENDAR_MCP_URL=http://localhost:3001
CALENDAR_AUTO_CREATE_EVENTS=true
CALENDAR_SEND_REMINDERS=true
CALENDAR_REMINDER_HOURS_BEFORE=24,1
```

## 🔄 Event Flow

### Scenario 1: New Task Assignment

1. User assigns task to subcontractor (POST `/api/subcontractors/assign-task`)
2. `SubcontractorsService.assignTask()` creates `task_assignment` record
3. **Calendar Integration**:
   - `CalendarIntegrationService.createAssignmentEvent()` called
   - Calendar event created with subcontractor as attendee
   - Event ID stored in `task_assignments.calendar_event_id`
4. Notification sent to subcontractor (email + push if enabled)

### Scenario 2: Task Completed

1. Subcontractor marks task complete (PATCH `/api/subcontractors/assignments/{id}`)
2. `task_assignments.status` → `'completed'`
3. `task_assignments.completed_at` → current timestamp
4. **Billy Integration**:
   - `BillyIntegrationService.createSubcontractorInvoice()` called
   - Invoice created in Billy.dk
   - Invoice ID stored in `task_assignments.billy_invoice_id`
5. **Calendar Integration**:
   - Event description updated with "COMPLETED" status
   - Event color changed to green

### Scenario 3: Task Cancelled

1. Task cancelled (PATCH `/api/subcontractors/assignments/{id}`)
2. `task_assignments.status` → `'cancelled'`
3. **Calendar Integration**:
   - Calendar event deleted or marked as cancelled
4. Notification sent to subcontractor

## 📝 Database Schema Updates Needed

Add columns to `task_assignments` table:

```sql
ALTER TABLE task_assignments
ADD COLUMN calendar_event_id VARCHAR(255),
ADD COLUMN billy_invoice_id VARCHAR(255),
ADD COLUMN hours_worked DECIMAL(5,2),
ADD COLUMN hourly_rate DECIMAL(10,2);

CREATE INDEX idx_task_assignments_calendar_event
ON task_assignments(calendar_event_id);

CREATE INDEX idx_task_assignments_billy_invoice
ON task_assignments(billy_invoice_id);
```

## 🔌 Service Registration

Update `SubcontractorsModule` to include integration services:

```typescript
// backend-nestjs/src/subcontractors/subcontractors.module.ts

import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SubcontractorsController } from "./subcontractors.controller";
import { SubcontractorsService } from "./subcontractors.service";
import { BillyIntegrationService } from "./billy-integration.service";
import { CalendarIntegrationService } from "./calendar-integration.service";

@Module({
  imports: [HttpModule],
  controllers: [SubcontractorsController],
  providers: [
    SubcontractorsService,
    BillyIntegrationService,
    CalendarIntegrationService,
  ],
  exports: [SubcontractorsService],
})
export class SubcontractorsModule {}
```

## ✅ Implementation Checklist

### Billy.dk Integration

- [ ] Create `BillyIntegrationService`
- [ ] Implement `createSubcontractorInvoice()`
- [ ] Implement `getOrCreateBillyContact()`
- [ ] Hook into task completion event
- [ ] Add invoice ID to task_assignments table
- [ ] Test invoice creation with Billy MCP or API

### Calendar Integration

- [ ] Create `CalendarIntegrationService`
- [ ] Implement `createAssignmentEvent()`
- [ ] Implement `updateAssignmentEvent()`
- [ ] Implement `deleteAssignmentEvent()`
- [ ] Hook into task assignment events
- [ ] Add calendar_event_id to task_assignments table
- [ ] Test event creation with Calendar MCP

### Testing

- [ ] Unit tests for both services
- [ ] Integration test: Create assignment → Calendar event created
- [ ] Integration test: Complete task → Billy invoice created
- [ ] Integration test: Cancel task → Calendar event deleted
- [ ] E2E test: Full workflow from assignment to invoice

## 📚 References

- Billy.dk API: `apps/production/tekup-billy` (MCP server)
- Calendar MCP: `apps/rendetalje/services/calendar-mcp`
- Subcontractor Config: `tekup-secrets/SUBCONTRACTOR_CONFIG_GUIDE.md`
- Environment Variables: `tekup-secrets/config/subcontractor-services.env`
