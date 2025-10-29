# Quick Start: Gmail & Calendar Data Fetching

\n\n
\n\n## 1. Prerequisites
\n\n
\n\nBefore you can fetch data, ensure you have:

\n\n- ✅ Google service account configured (see main README)
\n\n- ✅ Environment variables set in `.env`:
\n\n  - `GOOGLE_CLIENT_EMAIL`
\n\n  - `GOOGLE_PRIVATE_KEY`
\n\n  - `GOOGLE_IMPERSONATED_USER`
\n\n- ✅ Domain-wide delegation enabled with scopes:
\n\n  - `https://www.googleapis.com/auth/gmail.modify`
\n\n  - `https://www.googleapis.com/auth/calendar`
\n\n
\n\n## 2. Your First Data Fetch
\n\n
\n\n### Fetch Everything
\n\n
\n\n```bash
\n\nnpm run data:fetch
\n\n```

This will display:

\n\n- Last 10 Gmail messages
\n\n- Next 10 upcoming calendar events
\n\n
\n\n### Fetch Specific Data
\n\n
\n\n```bash
\n\n# Only Gmail
\n\nnpm run data:gmail
\n\n
\n\n# Only Calendar
\n\nnpm run data:calendar
\n\n```
\n\n
\n\n## 3. Example Output
\n\n
\n\n```text
\n\n🔍 RenOS Data Fetcher

Mode: DRY-RUN
Service: all
Max Results: 10

📧 Fetching Gmail messages...
Found 10 messages:

────────────────────────────────────────────────────────────────────────────────
ID: 18d4f5a2b3c1d6e8
Thread: 18d4f5a2b3c1d6e8
From: <kunde@example.com>
Subject: Tilbud på kontorrengøring
Date: 2025-09-29T10:30:00Z
Snippet: Hej, jeg vil gerne have et tilbud på kontorrengøring...
────────────────────────────────────────────────────────────────────────────────

📅 Fetching Calendar events...
Found 3 upcoming events:

────────────────────────────────────────────────────────────────────────────────
ID: abc123def456
Summary: Kundemøde - Kontorets Rengøring ApS
\n\nStart: 2025-09-30T14:00:00+02:00
End: 2025-09-30T15:00:00+02:00
Location: Kongens Nytorv 1, København
────────────────────────────────────────────────────────────────────────────────
\n\n```

\n\n## 4. Use in Your Code
\n\n
\n\n### Import Functions
\n\n
\n\n```typescript
\n\nimport { listRecentMessages } from "./services/gmailService";
import { listUpcomingEvents } from "./services/calendarService";
\n\n```

\n\n### Fetch Gmail Messages
\n\n
\n\n```typescript
\n\n// Get last 10 messages
const messages = await listRecentMessages({ maxResults: 10 });

// Get unread messages
const unread = await listRecentMessages({
    maxResults: 20,
    query: "is:unread",
    labelIds: ["INBOX"]
});

// Get messages from specific sender
const fromCustomer = await listRecentMessages({
    query: "from:kunde@example.com",
    maxResults: 5
});
\n\n```

\n\n### Fetch Calendar Events
\n\n
\n\n```typescript
\n\n// Get next 10 events
const events = await listUpcomingEvents({ maxResults: 10 });

// Get events for next 7 days
const now = new Date();
const nextWeek = new Date(now.getTime() + 7 _24_ 60 _60_ 1000);
\n\n
const weekEvents = await listUpcomingEvents({
    timeMin: now.toISOString(),
    timeMax: nextWeek.toISOString(),
    maxResults: 50
});

// Get events from specific calendar
const sharedCalendar = await listUpcomingEvents({
    calendarId: "<team@rendetalje.dk>",
    maxResults: 20
});
\n\n```

\n\n## 5. Common Use Cases
\n\n
\n\n### Check for Customer Context
\n\n
\n\n```typescript
\n\n// Before replying to a customer, check their email history
const customerEmail = "<kunde@example.com>";
const history = await listRecentMessages({
    query: `from:${customerEmail} OR to:${customerEmail}`,
    maxResults: 10
});

// Use this context when generating AI responses
const context = history.map(msg =>
    `${msg.from} → ${msg.subject}: ${msg.snippet}`
).join("\n");
\n\n```

\n\n### Check Calendar Availability
\n\n
\n\n```typescript
\n\n// Before scheduling a meeting, check what's already booked
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
\n\ntomorrow.setHours(0, 0, 0, 0);

const endOfTomorrow = new Date(tomorrow);
endOfTomorrow.setHours(23, 59, 59, 999);

const tomorrowSchedule = await listUpcomingEvents({
    timeMin: tomorrow.toISOString(),
    timeMax: endOfTomorrow.toISOString(),
    calendarId: "primary"
});

// Find available time slots
const availableSlots = findGaps(tomorrowSchedule);
\n\n```

\n\n### Monitor Unread Emails
\n\n
\n\n```typescript
\n\n// Periodically check for new customer emails
const checkForNewEmails = async () => {
    const unread = await listRecentMessages({
        query: "is:unread label:inbox",
        maxResults: 50
    });

    if (unread.length > 0) {
        console.log(`📧 ${unread.length} new emails to process`);
        // Trigger AI processing...
    }
};

// Run every 5 minutes
setInterval(checkForNewEmails, 5 _60_ 1000);
\n\n```

\n\n## 6. Troubleshooting
\n\n
\n\n### "No messages found"
\n\n
\n\n**Problem:** The CLI returns "No messages found"
\n\n
**Solutions:**

\n\n1. Verify `GOOGLE_IMPERSONATED_USER` matches the email account you want to access
\n\n2. Check that the service account has domain-wide delegation
\n\n3. Confirm the Gmail API is enabled in Google Cloud Console
\n\n4. Ensure the user has at least one email in their inbox

\n\n### Authentication Errors
\n\n
\n\n**Problem:** Getting 401 or 403 errors
\n\n
**Solutions:**

\n\n1. Verify your `.env` has correct values:

- `GOOGLE_CLIENT_EMAIL` (from service account JSON)
\n\n   - `GOOGLE_PRIVATE_KEY` (entire key including BEGIN/END lines)
\n\n   - `GOOGLE_IMPERSONATED_USER` (the email to impersonate)
\n\n2. Check that domain-wide delegation includes the Gmail/Calendar scopes
\n\n3. Ensure the private key is properly escaped (newlines as `\n`)

\n\n### No Events Found
\n\n
\n\n**Problem:** Calendar returns empty array
\n\n
**Solutions:**

\n\n1. Check that `SMOKETEST_CALENDAR_ID` is set (default: "primary")
\n\n2. Verify the calendar exists and has events
\n\n3. Ensure the time range includes events (default: next 30 days)
\n\n4. Confirm Calendar API is enabled in Google Cloud Console

\n\n## 7. Next Steps
\n\n
\n\n- **Read the full documentation:** [DATA_FETCHING.md](./DATA_FETCHING.md)
\n\n- **Integrate into AI workflows:** Use fetched data as context for LLM prompts
\n\n- **Add caching:** Store frequently accessed data to reduce API calls
\n\n- **Build dashboards:** Visualize email volumes and calendar utilization
\n\n- **Automate workflows:** Trigger actions based on new emails or events
\n\n
\n\n## 8. Safety Tips
\n\n
\n\n🔒 **Dry-Run Mode**: By default, RenOS operates in dry-run mode, which allows reading data but prevents modifications. Always test with `RUN_MODE=dry-run` first.

🔐 **API Limits**: Google APIs have rate limits. Use pagination (`maxResults`) and consider caching to avoid hitting limits.

⚠️ **Privacy**: Email and calendar data may contain sensitive information. Handle with care and comply with GDPR/privacy regulations.

📝 **Logging**: All operations are logged. Check your console output for detailed information about what data is being fetched.

\n\n## Need Help?
\n\n
\n\n- Check [DATA_FETCHING.md](./DATA_FETCHING.md) for detailed API documentation
\n\n- Review [main README](../README.md) for Google setup instructions
\n\n- Look at `src/tools/dataFetcher.ts` for implementation examples
\n\n- Run tests with `npm test` to verify your setup
