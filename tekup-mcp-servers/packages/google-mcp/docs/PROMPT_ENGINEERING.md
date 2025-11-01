# Google MCP - Prompt Engineering Guide

## Overview

This guide shows how to effectively prompt AI assistants when using the Google MCP server for Rendetalje's operations, particularly for handling lead threads in Gmail and scheduling with Calendar.

## Tool Descriptions for AI

The Google MCP server provides these tool descriptions to AI assistants:

### Calendar Tools

1. **list_calendar_events** - "List upcoming calendar events with optional filters"
2. **get_calendar_event** - "Get details of a specific calendar event"
3. **create_calendar_event** - "Create a new calendar event"
4. **update_calendar_event** - "Update an existing calendar event"
5. **delete_calendar_event** - "Delete a calendar event"
6. **check_calendar_conflicts** - "Check for calendar conflicts in a time range"

### Gmail Tools

1. **list_emails** - "List recent emails with optional filters"
2. **get_email** - "Get details of a specific email"
3. **search_emails** - "Search emails using Gmail search syntax"
4. **send_email** - "Send an email"
5. **get_email_labels** - "Get all email labels"
6. **mark_email_as_read** - "Mark an email as read"

## Complex Scenarios for Rendetalje Lead Management

### Scenario 1: Processing New Lead Emails

**User Prompt:**
```
Tjek mine ulæste emails fra i dag og find nye leads. 
For hver lead, opret en opfølgningsaftale om 2 dage kl 10.
```

**AI Actions:**
1. Calls `search_emails` with query: "is:unread newer_than:1d"
2. Analyzes email content to identify leads
3. For each lead:
   - Calls `create_calendar_event` to schedule follow-up
   - Calls `send_email` to acknowledge receipt
   - Calls `mark_email_as_read`

**Expected Tool Calls:**
```json
// Step 1: Search for unread emails
{
  "tool": "search_emails",
  "arguments": {
    "query": "is:unread newer_than:1d",
    "maxResults": 20
  }
}

// Step 2: Create follow-up event (for each lead)
{
  "tool": "create_calendar_event",
  "arguments": {
    "summary": "Opfølgning: [Lead navn fra email]",
    "description": "Follow-up på lead fra [email]",
    "startTime": "2025-11-03T10:00:00+01:00",
    "endTime": "2025-11-03T10:30:00+01:00"
  }
}

// Step 3: Send acknowledgment
{
  "tool": "send_email",
  "arguments": {
    "to": "lead@example.com",
    "subject": "Re: Din henvendelse til Rendetalje",
    "body": "Tak for din henvendelse. Vi vender tilbage inden 48 timer."
  }
}

// Step 4: Mark as processed
{
  "tool": "mark_email_as_read",
  "arguments": {
    "messageId": "msg_id_here"
  }
}
```

### Scenario 2: Lead Thread Analysis

**User Prompt:**
```
Find alle emails fra jan@examplefirma.dk i de sidste 30 dage. 
Vis mig tråden og fortæl om vi har booket et møde med dem.
```

**AI Actions:**
1. Calls `search_emails` with: "from:jan@examplefirma.dk newer_than:30d"
2. Analyzes email thread for meeting references
3. Calls `list_calendar_events` to check for scheduled meetings
4. Summarizes the thread and meeting status

**Expected Tool Calls:**
```json
// Step 1: Search emails from lead
{
  "tool": "search_emails",
  "arguments": {
    "query": "from:jan@examplefirma.dk newer_than:30d",
    "maxResults": 50
  }
}

// Step 2: Check calendar for meetings
{
  "tool": "list_calendar_events",
  "arguments": {
    "query": "jan examplefirma",
    "maxResults": 10
  }
}
```

### Scenario 3: Automated Lead Qualification

**User Prompt:**
```
Søg efter emails med "tilbud" eller "pris" i emnet fra de sidste 7 dage.
For hver email: 
1. Hvis de ikke har fået svar, send et follow-up
2. Book et telefon-møde om 3 dage hvis det er en seriøs lead
3. Tjek om vi har ledig tid først
```

**AI Actions:**
1. Searches emails with subject keywords
2. Checks for existing replies in thread
3. Checks calendar availability
4. Creates calendar event if available
5. Sends follow-up email

**Expected Tool Calls:**
```json
// Step 1: Search for pricing inquiries
{
  "tool": "search_emails",
  "arguments": {
    "query": "subject:(tilbud OR pris) newer_than:7d",
    "maxResults": 20
  }
}

// Step 2: Check calendar availability
{
  "tool": "check_calendar_conflicts",
  "arguments": {
    "startTime": "2025-11-04T10:00:00+01:00",
    "endTime": "2025-11-04T11:00:00+01:00"
  }
}

// Step 3: Create meeting if no conflict
{
  "tool": "create_calendar_event",
  "arguments": {
    "summary": "Telefon: Opfølgning på tilbudsforespørgsel",
    "description": "Lead: [email fra/firma]",
    "startTime": "2025-11-04T10:00:00+01:00",
    "endTime": "2025-11-04T11:00:00+01:00"
  }
}

// Step 4: Send follow-up
{
  "tool": "send_email",
  "arguments": {
    "to": "lead@example.com",
    "subject": "Re: Tilbudsforespørgsel",
    "body": "Hej,\n\nVi vil gerne følge op på din forespørgsel. Jeg har sat tid af til et kort telefonopkald [dato og tid].\n\nVenlig hilsen,\nRendetalje"
  }
}
```

### Scenario 4: Daily Lead Digest

**User Prompt:**
```
Lav en daglig rapport af alle nye leads. 
Grupper dem efter prioritet (har de spurgt om pris = høj prioritet).
For hver lead, vis email-indhold og foreslå næste handling.
```

**AI Actions:**
1. Searches for new emails (last 24 hours)
2. Filters for lead-related keywords
3. Categorizes by priority
4. Suggests actions based on content
5. Creates summary report

**Expected Tool Calls:**
```json
// Search all recent emails
{
  "tool": "search_emails",
  "arguments": {
    "query": "newer_than:1d",
    "maxResults": 50
  }
}

// Search high-priority (pricing) emails
{
  "tool": "search_emails",
  "arguments": {
    "query": "newer_than:1d (pris OR tilbud OR køb)",
    "maxResults": 50
  }
}
```

### Scenario 5: Lead Nurturing Automation

**User Prompt:**
```
Find leads fra sidste måned som vi ikke har kontaktet i 2 uger.
Send en gentle reminder email og book et tentativt møde om en uge.
```

**AI Actions:**
1. Searches emails from last month
2. Filters for leads without recent replies
3. Sends reminder email
4. Creates tentative calendar event

**Expected Tool Calls:**
```json
// Find old leads
{
  "tool": "search_emails",
  "arguments": {
    "query": "newer_than:30d older_than:14d is:unread",
    "maxResults": 30
  }
}

// Send reminder
{
  "tool": "send_email",
  "arguments": {
    "to": "lead@example.com",
    "subject": "Følger op: Din henvendelse til Rendetalje",
    "body": "Hej [Navn],\n\nVi ville gerne høre om du stadig er interesseret i vores løsning?\n\nVenlig hilsen,\nRendetalje"
  }
}

// Create tentative meeting
{
  "tool": "create_calendar_event",
  "arguments": {
    "summary": "Tentativt: Opfølgning [Lead navn]",
    "startTime": "2025-11-08T14:00:00+01:00",
    "endTime": "2025-11-08T15:00:00+01:00",
    "attendees": ["lead@example.com"]
  }
}
```

## Gmail Search Syntax for Leads

The AI can use these Gmail search operators:

### Basic Operators
- `from:email@example.com` - Emails from specific sender
- `to:email@example.com` - Emails to specific recipient
- `subject:keyword` - Search in subject line
- `keyword` - Search in entire email

### Time-based
- `newer_than:7d` - Last 7 days
- `older_than:2d` - Older than 2 days
- `after:2025/11/01` - After specific date
- `before:2025/11/30` - Before specific date

### Status
- `is:unread` - Unread emails
- `is:read` - Read emails
- `is:starred` - Starred emails

### Combinations
- `from:customer@example.com is:unread newer_than:3d`
- `subject:(tilbud OR pris) is:unread`
- `(lead OR kunde OR forespørgsel) newer_than:1d`

## Best Practices for Prompt Engineering

### 1. Be Specific with Time Ranges
❌ Bad: "Tjek mine emails"
✅ Good: "Tjek mine ulæste emails fra de sidste 24 timer"

### 2. Specify Email Criteria
❌ Bad: "Find leads"
✅ Good: "Find emails med 'tilbud' eller 'pris' i emnet der er ulæste"

### 3. Include Action Steps
❌ Bad: "Hvad skal jeg gøre med denne lead?"
✅ Good: "For denne lead: 1) Send bekræftelse, 2) Book møde om 2 dage, 3) Tilføj til CRM"

### 4. Provide Context
❌ Bad: "Book møde"
✅ Good: "Book 30 min telefon-møde med [lead navn] om opfølgning på tilbud, find ledig tid mellem 10-12 i næste uge"

### 5. Use Danish Keywords
The AI understands Danish naturally:
- "tilbud", "pris", "køb", "interesseret"
- "møde", "opfølgning", "kontakt"
- "lead", "kunde", "forespørgsel"

## Tool Interaction Patterns

### Pattern 1: Search → Analyze → Act
```
User: "Find nye leads og send velkommen email"
AI: search_emails → analyze content → send_email
```

### Pattern 2: Check → Create
```
User: "Book møde hvis jeg har tid på tirsdag kl 14"
AI: check_calendar_conflicts → create_calendar_event
```

### Pattern 3: Search → Filter → Batch Process
```
User: "Send reminder til alle ulæste leads fra sidste uge"
AI: search_emails → filter by criteria → send_email (multiple)
```

### Pattern 4: Thread Analysis
```
User: "Hvad er status på tråden med Jan?"
AI: search_emails → get_email (for each) → summarize thread
```

## Testing All Tools

### Calendar Tools - Verification

1. **list_calendar_events**: ✅ Functional
   - Returns upcoming events with filters
   - Supports time range and search query

2. **get_calendar_event**: ✅ Functional
   - Retrieves specific event details
   - Includes attendees and location

3. **create_calendar_event**: ✅ Functional
   - Creates events with attendees
   - Supports Danish timezone (Europe/Copenhagen)

4. **update_calendar_event**: ✅ Functional
   - Updates event details
   - Preserves existing data not being changed

5. **delete_calendar_event**: ✅ Functional
   - Removes calendar events
   - Returns success confirmation

6. **check_calendar_conflicts**: ✅ Functional
   - Detects scheduling conflicts
   - Supports exclusion of specific events

### Gmail Tools - Verification

1. **list_emails**: ✅ Functional
   - Lists recent emails with pagination
   - Supports label filtering

2. **get_email**: ✅ Functional
   - Retrieves full email details
   - Includes headers (from, to, subject, date)

3. **search_emails**: ✅ Functional
   - Full Gmail search syntax support
   - Returns matching emails with metadata

4. **send_email**: ✅ Functional
   - Sends plain text and HTML emails
   - Supports CC, BCC, Reply-To

5. **get_email_labels**: ✅ Functional
   - Returns all Gmail labels
   - Includes system and custom labels

6. **mark_email_as_read**: ✅ Functional
   - Changes email status
   - Returns success confirmation

## Example AI Conversation

**User**: "Hej, kan du hjælpe mig med at organisere mine leads?"

**AI**: "Selvfølgelig! Hvad vil du gerne gøre? Jeg kan:
- Søge i dine emails efter nye leads
- Booke møder i din kalender
- Sende opfølgnings-emails
- Analysere lead-tråde"

**User**: "Find alle ulæste emails fra i dag med 'tilbud' i emnet"

**AI**: *Calls search_emails*
"Jeg fandt 3 emails:
1. Jan Hansen - 'Tilbud på renovering'
2. Marie Jensen - 'Forespørgsel på tilbud'
3. Peter Sørensen - 'Tilbud ønskes'

Skal jeg sende en standard bekræftelse til dem alle?"

**User**: "Ja, og book et 30 min opkald med Jan i morgen kl 10"

**AI**: *Calls send_email (3 times) and create_calendar_event*
"Færdig! Jeg har:
- Sendt bekræftelse til alle 3 leads
- Booket 30 min opkald med Jan Hansen i morgen kl 10:00-10:30

Mødet er i din kalender med emne: 'Opfølgning: Tilbud på renovering'"

## Advanced Scenarios

### Scenario 6: Multi-step Lead Qualification

```
User: "Analysér mine leads fra sidste uge og prioritér dem"

AI Process:
1. search_emails: "newer_than:7d"
2. For each email:
   - Check if contains urgent keywords (pris, tilbud, køb)
   - Check if customer has emailed before (search history)
   - Check response time
3. Create priority categories
4. Present ranked list with suggested actions
```

### Scenario 7: Calendar Optimization

```
User: "Konsolidér mine lead-møder til 2 dage næste uge"

AI Process:
1. list_calendar_events: Find all lead meetings
2. check_calendar_conflicts: Find optimal slots on 2 days
3. update_calendar_event: Move meetings to new slots
4. send_email: Notify attendees of changes
```

## Conclusion

All 12 tools are fully functional and ready for complex lead management scenarios. The AI can:

✅ Search and filter emails using Gmail syntax
✅ Create and manage calendar events
✅ Send automated responses
✅ Handle multi-step workflows
✅ Process lead threads intelligently
✅ Optimize scheduling

The prompt engineering is natural and intuitive - just describe what you want in Danish, and the AI will orchestrate the right tool calls.
