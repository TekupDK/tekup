# 🎯 RenOS CLI Command Reference - User Guide for Jonas\n\n\n\n**Version**: 1.0  
**Date**: 2025-10-03  
**For**: Jonas @ Rendetalje.dk
\n\n## 📋 Table of Contents\n\n\n\n1. [Overview](#overview)\n\n2. [Quick Reference](#quick-reference)\n\n3. [Lead Management](#lead-management)\n\n4. [Email Management](#email-management)\n\n5. [Booking Management](#booking-management)\n\n6. [Label Management](#label-management)\n\n7. [Follow-up System](#follow-up-system)\n\n8. [Conflict Resolution](#conflict-resolution)\n\n9. [Customer Management](#customer-management)\n\n10. [Database Tools](#database-tools)\n\n11. [Troubleshooting](#troubleshooting)

---
\n\n## 📖 Overview\n\n\n\nRenOS is your AI-powered operating system for managing Rendetalje.dk operations. This guide covers all CLI (Command Line Interface) commands available to you.
\n\n### System Capabilities\n\n\n\n- ✅ Automatic email response generation with AI\n\n- ✅ Conflict detection and escalation\n\n- ✅ Duplicate quote prevention\n\n- ✅ Automatic Gmail label management\n\n- ✅ Follow-up email automation\n\n- ✅ Calendar booking management\n\n- ✅ Customer data tracking\n\n\n\n### Safety Features\n\n\n\n**Dry-Run Mode** (default): Commands log what they would do without actually doing it. Safe for testing.\n\n
**Live Mode**: Commands execute real actions (send emails, create bookings, etc.).

To switch modes, update `.env` file:
\n\n```env
RUN_MODE=dry-run   # Safe testing mode\n\nRUN_MODE=live      # Production mode\n\n```\n\n
---
\n\n## ⚡ Quick Reference\n\n\n\n### Most Common Commands\n\n\n\n```powershell\n\n# Check for new leads\n\nnpm run leads:check\n\n\n\n# View pending email responses\n\nnpm run email:pending\n\n\n\n# Approve an email response\n\nnpm run email:approve <responseId>\n\n\n\n# Check today's bookings\n\nnpm run booking:list\n\n\n\n# View follow-ups needed\n\nnpm run follow:check\n\n\n\n# Check for conflicts\n\nnpm run conflict:scan\n\n\n\n# View label status\n\nnpm run label:list\n\n```\n\n
---
\n\n## 🎯 Lead Management\n\n\n\n### Check for New Leads\n\n\n\nManually check Leadmail.no for new leads:
\n\n```powershell
npm run leads:check\n\n```

**What it does**:
\n\n- Searches Gmail for Leadmail.no emails\n\n- Parses lead information (name, email, phone, address)\n\n- Creates Lead record in database\n\n- Applies "new_lead" label\n\n
**Output example**:
\n\n```
🔍 Checking for new leads...
✅ Found 3 new leads
  1. Anna Hansen - Almindelig rengøring - 85 m²\n\n  2. Peter Nielsen - Flyttehjælp - 120 m²\n\n  3. Maria Larsen - Dyb rengøring - 60 m²\n\n```
\n\n### Monitor Leads Automatically\n\n\n\nStart automatic lead monitoring (checks every 15 minutes):
\n\n```powershell
npm run leads:monitor\n\n```

**What it does**:
\n\n- Runs in background\n\n- Checks for new leads every 15 minutes\n\n- Auto-generates quote responses\n\n- Applies appropriate labels\n\n- Sends escalation emails for conflicts\n\n
**How to stop**: Press `Ctrl+C`
\n\n### Import Historical Leads\n\n\n\nImport old leads from previous system:
\n\n```powershell
npm run leads:import\n\n```

Useful for migrating existing customer data.

---
\n\n## 📧 Email Management\n\n\n\n### View Pending Email Responses\n\n\n\nSee all AI-generated email responses awaiting your approval:
\n\n```powershell
npm run email:pending\n\n```

**Output example**:
\n\n```
📋 Pending Email Responses (3)

[1] To: anna@example.com
    Subject: Tilbud på rengøring - Rendetalje.dk\n\n    Generated: 2025-10-03 10:30
    Preview: Hej Anna, Tak for din henvendelse...
    Status: PENDING_APPROVAL

[2] To: peter@example.com
    Subject: Re: Flyttehjælp forespørgsel
    Generated: 2025-10-03 09:15
    ⚠️ Warning: Customer has existing quote (5 days ago)
    Status: PENDING_APPROVAL\n\n```
\n\n### Approve Email Response\n\n\n\nApprove and send a generated email:
\n\n```powershell
npm run email:approve <responseId>\n\n```

**Example**:
\n\n```powershell
npm run email:approve response_abc123\n\n```

**What happens**:
\n\n1. Email sent to customer\n\n2. Status changed to "SENT"\n\n3. "quote_sent" label applied to Gmail thread\n\n4. Follow-up scheduled for 5 days later
\n\n### Reject Email Response\n\n\n\nReject a generated email (will not be sent):
\n\n```powershell
npm run email:reject <responseId>\n\n```

**When to reject**:
\n\n- Price quote looks wrong\n\n- Customer info seems incorrect\n\n- Email tone is inappropriate\n\n- You want to handle manually\n\n\n\n### Email Statistics\n\n\n\nView email generation stats:
\n\n```powershell
npm run email:stats\n\n```

**Output example**:
\n\n```
📊 Email Response Statistics

Total generated: 47
  ✅ Sent: 35
  ⏳ Pending: 8
  ❌ Rejected: 4

Average generation time: 1.8s
Approval rate: 87.5%
Auto-send rate: 42.1% (with follow-up)\n\n```
\n\n### Enable/Disable Auto-Send\n\n\n\nControl whether approved emails send automatically:
\n\n```powershell\n\n# Enable automatic sending\n\nnpm run email:enable\n\n\n\n# Disable (require manual approval)\n\nnpm run email:disable\n\n```\n\n\n\n### View Current Email Config\n\n\n\n```powershell\n\nnpm run email:config\n\n```

Shows:
\n\n- Auto-send status (enabled/disabled)\n\n- Default from email\n\n- Signature template\n\n- AI model in use\n\n
---
\n\n## 📅 Booking Management\n\n\n\n### List Today's Bookings\n\n\n\n```powershell\n\nnpm run booking:list\n\n```

**Output example**:
\n\n```
📅 Today's Bookings (2025-10-03)

09:00-11:00 | Anna Hansen
  Type: Almindelig rengøring
  Address: Vestergade 12, 2100 København Ø
  Phone: +45 12345678

13:00-16:00 | Peter Nielsen
  Type: Flyttehjælp
  Address: Nørregade 45, 2200 København N
  Phone: +45 87654321\n\n```
\n\n### Check Availability\n\n\n\nCheck if specific date/time is available:
\n\n```powershell
npm run booking:availability 2025-10-15\n\n```

**Output example**:
\n\n```
📅 Availability for 2025-10-15

✅ Available slots:
  - 09:00-11:00 (120 minutes)\n\n  - 13:00-16:00 (180 minutes)\n\n
⚠️ Busy periods:
  - 11:00-12:30 (Existing booking: Marie Olsen)\n\n```
\n\n### Find Next Available Slot\n\n\n\nFind next free slot of specific duration:
\n\n```powershell
npm run booking:next-slot 120\n\n```

Finds next 120-minute (2-hour) available slot.

**Output example**:
\n\n```
📅 Next available 120-minute slot:

Date: 2025-10-05
Time: 10:00-12:00
Duration: 120 minutes\n\n```
\n\n### Check Specific Time Slot\n\n\n\nCheck if specific slot is free:
\n\n```powershell
npm run booking:check-slot 2025-10-15 09:00 120\n\n```

Checks if 2025-10-15 at 09:00 for 120 minutes is available.
\n\n### Booking Statistics\n\n\n\n```powershell\n\nnpm run booking:stats\n\n```

**Output example**:
\n\n```
📊 Booking Statistics

This week: 12 bookings
Next week: 8 bookings
Average duration: 135 minutes
Most common: Almindelig rengøring (60%)
Busiest day: Friday\n\n```

---
\n\n## 🏷️ Label Management\n\n\n\nGmail labels organize leads by status. RenOS automatically applies labels based on lead progress.
\n\n### Label Types\n\n\n\n1. **new_lead** (🆕 Nyt Lead) - Just received\n\n2. **quote_sent** (📧 Tilbud Sendt) - Quote sent to customer\n\n3. **booked** (📅 Booket) - Booking confirmed\n\n4. **follow_up_needed** (⏰ Follow-up) - Needs reminder\n\n5. **conflict** (⚠️ Konflikt) - Issue detected\n\n6. **requires_review** (👀 Gennemgang) - Manual review needed\n\n7. **completed** (✅ Færdig) - Job finished\n\n\n\n### List All Labels\n\n\n\n```powershell\n\nnpm run label:list\n\n```

**Output example**:
\n\n```
🏷️ RenOS Gmail Labels
\n\n1. 🆕 new_lead (Gmail ID: Label_123)
   - Threads: 5\n\n   - Last used: 2025-10-03 10:30\n\n\n\n2. 📧 quote_sent (Gmail ID: Label_456)
   - Threads: 23\n\n   - Last used: 2025-10-03 09:15\n\n\n\n3. 📅 booked (Gmail ID: Label_789)
   - Threads: 12\n\n   - Last used: 2025-10-02 14:20\n\n```
\n\n### Check Thread Label Status\n\n\n\nView labels on specific Gmail thread:
\n\n```powershell
npm run label:status <threadId>\n\n```

**How to get thread ID**:
\n\n1. Open email in Gmail web\n\n2. Look at URL: `https://mail.google.com/mail/u/0/#inbox/18a2b3c4d5e6f7g8`\n\n3. Thread ID is: `18a2b3c4d5e6f7g8`

**Output example**:
\n\n```
🏷️ Thread 18a2b3c4d5e6f7g8

Current labels:
  - quote_sent (applied 2025-10-01)\n\n  - follow_up_needed (applied 2025-10-03)\n\n
Lead info:
  Customer: anna@example.com
  Status: quote_sent
  Follow-up attempts: 1\n\n```
\n\n### Find Threads by Label\n\n\n\n```powershell\n\nnpm run label:threads quote_sent\n\n```

Lists all threads with specific label.
\n\n### Initialize Labels\n\n\n\nCreate all RenOS labels in Gmail (run once on setup):
\n\n```powershell
npm run label:init\n\n```
\n\n### Sync Labels\n\n\n\nSync local label cache with Gmail:
\n\n```powershell
npm run label:sync\n\n```

Run this if labels seem out of sync.

---
\n\n## ⏰ Follow-up System\n\n\n\nAutomatically reminds customers who haven't responded to quotes.
\n\n### Check Pending Follow-ups\n\n\n\n```powershell\n\nnpm run follow:check\n\n```

**Output example**:
\n\n```
📊 Follow-up Check Results

⏰ Leads requiring follow-up:
\n\n1. Lead ID: lead_abc123
   Customer: anna@example.com
   Quote sent: 2025-09-28 (5 days ago)
   Follow-up attempts: 0
   Status: Needs first follow-up
\n\n2. Lead ID: lead_def456
   Customer: peter@example.com
   Quote sent: 2025-09-25 (8 days ago)
   Follow-up attempts: 1
   Last follow-up: 2025-09-30
   Status: Needs second follow-up

✅ Total pending: 2 leads\n\n```
\n\n### Send Follow-up Emails (Dry-run)\n\n\n\nTest follow-up system without actually sending:
\n\n```powershell
npm run follow:send\n\n```

**What it does**:
\n\n- Identifies leads needing follow-up\n\n- Generates friendly reminder emails\n\n- **Logs** what would be sent (doesn't actually send)\n\n- Shows preview of each email\n\n\n\n### Send Follow-up Emails (Live)\n\n\n\nActually send follow-up emails:
\n\n```powershell
npm run follow:send-live\n\n```

**⚠️ Warning**: This sends real emails. Use carefully!

**What happens**:
\n\n1. Follow-up emails sent to customers\n\n2. `followUpAttempts` incremented in database\n\n3. `lastFollowUpDate` updated\n\n4. "follow_up_needed" label applied
\n\n### Follow-up Statistics\n\n\n\n```powershell\n\nnpm run follow:stats\n\n```

**Output example**:
\n\n```
📊 Follow-up Statistics

Total leads with quotes: 45
Pending follow-ups: 2
Follow-ups sent this week: 8

Breakdown by attempts:
  - 0 attempts: 40 leads\n\n  - 1 attempt: 3 leads\n\n  - 2 attempts: 2 leads\n\n  - 3+ attempts: 0 leads\n\n
⚠️ Leads at max attempts (3): None

Conversion rate after follow-up: 35%
Average days to response: 3.2\n\n```
\n\n### Follow-up Rules\n\n\n\n- **First follow-up**: 5 days after quote sent\n\n- **Second follow-up**: 4 days after first\n\n- **Third follow-up**: 5 days after second\n\n- **Maximum attempts**: 3 (then stop)\n\n
---
\n\n## ⚠️ Conflict Resolution\n\n\n\nAutomatically detects problematic emails and escalates to you.
\n\n### Scan for Conflicts\n\n\n\nScan recent emails for potential conflicts:
\n\n```powershell
npm run conflict:scan\n\n```

**What it detects**:
\n\n- Angry/frustrated language\n\n- Legal threats (advokat, inkasso)\n\n- Complaints about quality\n\n- Unacceptable service issues\n\n
**Output example**:
\n\n```
⚠️ Conflict Scan Results

Found 2 potential conflicts:

[1] CRITICAL - Thread 18a2b3c4d5e6f7g8\n\n    From: kunde@example.com
    Date: 2025-10-03 08:30
    Score: 150
    Keywords: advokat, uacceptabelt
    Status: Auto-escalated to Jonas

[2] HIGH - Thread 19b3c4d5e6f7g8h9\n\n    From: another@example.com
    Date: 2025-10-03 07:15
    Score: 75
    Keywords: utilfreds, frustreret
    Status: Escalated\n\n```
\n\n### List All Escalations\n\n\n\nView all conflicts escalated to you:
\n\n```powershell
npm run conflict:list\n\n```

**Output example**:
\n\n```
📋 Escalated Conflicts (5)
\n\n1. kunde@example.com (CRITICAL)
   Escalated: 2025-10-03 08:30
   Score: 150
   Keywords: advokat, uacceptabelt
   Status: ⏳ Awaiting response
\n\n2. another@example.com (HIGH)
   Escalated: 2025-10-03 07:15
   Score: 75
   Keywords: utilfreds, frustreret
   Status: ✅ Resolved\n\n```
\n\n### Manually Escalate Thread\n\n\n\nEscalate specific thread to yourself:
\n\n```powershell
npm run conflict:escalate <threadId>\n\n```

Use when you spot something that needs attention.
\n\n### Test Conflict Detection\n\n\n\nTest conflict detection on sample texts:
\n\n```powershell
npm run conflict:test\n\n```

Runs through test cases to verify system works.
\n\n### Conflict Statistics\n\n\n\n```powershell\n\nnpm run conflict:stats\n\n```

**Output example**:
\n\n```
📊 Conflict Statistics

Total escalations: 12
  - Critical: 3\n\n  - High: 5\n\n  - Medium: 4\n\n
This week: 2 escalations
Average resolution time: 2.3 hours
Most common keywords: utilfreds, frustreret

Auto-escalation rate: 100% (critical/high)\n\n```
\n\n### Conflict Severity Levels\n\n\n\n| Level | Score | Auto-Escalate | Keywords Examples |
|-------|-------|---------------|-------------------|
| **Critical** | 100+ | ✅ Yes | advokat, inkasso, politi |\n\n| **High** | 50-99 | ✅ Yes | uacceptabelt, utilfreds, klage |\n\n| **Medium** | 20-49 | ❌ No | skuffet, frustreret |\n\n| **Low** | 1-19 | ❌ No | lidt dårligt |\n\n| **None** | 0 | ❌ No | - |\n\n
---
\n\n## 👥 Customer Management\n\n\n\n### Create Customer\n\n\n\nManually create customer record:
\n\n```powershell
npm run customer:create\n\n```

Prompts for: name, email, phone, address.
\n\n### List Customers\n\n\n\n```powershell\n\nnpm run customer:list\n\n```
\n\n### Get Customer Details\n\n\n\n```powershell\n\nnpm run customer:get <email>\n\n```

**Output example**:
\n\n```
👤 Customer Details

Name: Anna Hansen
Email: anna@example.com
Phone: +45 12345678
Address: Vestergade 12, 2100 København Ø

📊 Stats:
  - Total bookings: 3\n\n  - Total quotes: 5\n\n  - First contact: 2025-06-15\n\n  - Last booking: 2025-09-20\n\n  - Customer since: 4 months\n\n
💬 Recent activity:
  - 2025-10-01: Quote sent (Almindelig rengøring)\n\n  - 2025-09-20: Booking completed\n\n  - 2025-08-15: Quote sent (Dyb rengøring)\n\n```
\n\n### Customer Statistics\n\n\n\n```powershell\n\nnpm run customer:stats\n\n```
\n\n### View Customer Conversations\n\n\n\n```powershell\n\nnpm run customer:conversations <email>\n\n```

Shows full email thread history with customer.
\n\n### Link Lead to Customer\n\n\n\n```powershell\n\nnpm run customer:link-lead <leadId> <customerId>\n\n```

Associates existing lead with customer record.

---
\n\n## 🗄️ Database Tools\n\n\n\n### Open Database Studio\n\n\n\nVisual database explorer (opens in browser):
\n\n```powershell
npm run db:studio\n\n```

**What you can do**:
\n\n- View all tables (Lead, Customer, Booking, etc.)\n\n- Edit records directly\n\n- Run custom queries\n\n- Export data\n\n
**Access**: `http://localhost:5555`
\n\n### Database Statistics\n\n\n\nView database size and record counts:
\n\n```powershell
npm run db:stats\n\n```

(Note: This command might need to be created)
\n\n### Database Backup\n\n\n\n(Recommended: Set up automatic backups via Neon dashboard)

---
\n\n## 🛠️ Troubleshooting\n\n\n\n### Common Issues\n\n\n\n#### Issue: "No leads found"\n\n\n\n**Possible causes**:
\n\n1. No new emails in Gmail\n\n2. Gmail authentication expired\n\n3. Leadmail.no format changed

**Solutions**:
\n\n```powershell\n\n# Verify Gmail connection\n\nnpm run verify:google\n\n\n\n# Check Gmail for Leadmail emails manually\n\n# Re-authenticate if needed\n\n```\n\n\n\n#### Issue: "Label not found"\n\n\n\n**Solution**:
\n\n```powershell\n\n# Re-initialize labels\n\nnpm run label:init\n\n\n\n# Sync labels with Gmail\n\nnpm run label:sync\n\n```\n\n\n\n#### Issue: "Database connection failed"\n\n\n\n**Possible causes**:
\n\n1. Internet connection down\n\n2. Neon database offline\n\n3. DATABASE_URL incorrect

**Solutions**:
\n\n1. Check internet connection\n\n2. Verify DATABASE_URL in `.env`\n\n3. Check Neon dashboard for database status
\n\n#### Issue: "Email not sending"\n\n\n\n**Checklist**:
\n\n1. Check `RUN_MODE` in `.env` (should be `live`)\n\n2. Verify GOOGLE_PRIVATE_KEY is set correctly\n\n3. Check Gmail API quota (5000/day limit)\n\n4. Verify email is approved (`npm run email:pending`)

**Debug commands**:
\n\n```powershell\n\n# Verify Google setup\n\nnpm run verify:google\n\n\n\n# Check email configuration\n\nnpm run email:config\n\n\n\n# View email logs\n\n# (Logs are in terminal output)\n\n```\n\n\n\n#### Issue: "Conflict not detected"\n\n\n\n**Possible causes**:
\n\n1. Keywords not in conflict list\n\n2. Email text not analyzed\n\n3. Conflict threshold too high

**Solutions**:
\n\n```powershell\n\n# Test conflict detection\n\nnpm run conflict:test\n\n\n\n# Manually escalate\n\nnpm run conflict:escalate <threadId>\n\n```\n\n\n\n### Getting Help\n\n\n\n1. **Check logs**: Terminal output shows detailed info\n\n2. **Database**: Use `npm run db:studio` to inspect data\n\n3. **Test commands**: Many commands have `test` mode\n\n4. **Documentation**: Check `docs/` folder for technical details
\n\n### Emergency Contacts\n\n\n\n- **Technical Issues**: [Your support contact]\n\n- **Database Issues**: Check Neon dashboard\n\n- **Gmail API Issues**: Check Google Cloud Console\n\n
---
\n\n## 📝 Command Syntax Reference\n\n\n\n### General Format\n\n\n\n```powershell\n\nnpm run <command> [arguments]\n\n```
\n\n### Commands with Arguments\n\n\n\n```powershell\n\n# Single argument\n\nnpm run customer:get anna@example.com\n\n\n\n# Multiple arguments\n\nnpm run booking:check-slot 2025-10-15 09:00 120\n\n\n\n# Optional flags\n\nnpm run test:integration --verbose\n\n```\n\n\n\n### Common Flags\n\n\n\n- `--verbose` or `-v`: Show detailed output\n\n- `--dry-run`: Test without executing (if supported)\n\n- `--help` or `-h`: Show command help (if supported)\n\n
---
\n\n## 🎯 Workflows\n\n\n\n### Daily Workflow\n\n\n\n**Morning**:
\n\n```powershell\n\n# 1. Check for new leads\n\nnpm run leads:check\n\n\n\n# 2. Review pending emails\n\nnpm run email:pending\n\n\n\n# 3. Approve good ones\n\nnpm run email:approve <id>\n\n\n\n# 4. Check today's bookings\n\nnpm run booking:list\n\n```\n\n
**Afternoon**:
\n\n```powershell\n\n# 5. Check for conflicts\n\nnpm run conflict:scan\n\n\n\n# 6. Review escalations\n\nnpm run conflict:list\n\n\n\n# 7. Check follow-ups needed\n\nnpm run follow:check\n\n```\n\n\n\n### Weekly Workflow\n\n\n\n**Monday**:
\n\n```powershell\n\n# View week's bookings\n\nnpm run booking:stats\n\n\n\n# Plan capacity\n\nnpm run booking:availability <date>\n\n```\n\n
**Friday**:
\n\n```powershell\n\n# Send follow-ups\n\nnpm run follow:send-live\n\n\n\n# Review week's stats\n\nnpm run email:stats\n\nnpm run conflict:stats
npm run follow:stats\n\n```
\n\n### Emergency Workflow\n\n\n\n**When customer is angry**:
\n\n```powershell\n\n# 1. Check for auto-escalation\n\nnpm run conflict:list\n\n\n\n# 2. View full conversation\n\nnpm run customer:conversations <email>\n\n\n\n# 3. Manually escalate if needed\n\nnpm run conflict:escalate <threadId>\n\n\n\n# 4. Respond manually (don't use AI)\n\n```\n\n
---
\n\n## 📊 Best Practices\n\n\n\n### Do's ✅\n\n\n\n- **Review pending emails daily**\n\n- **Respond to conflicts within 2 hours**\n\n- **Send follow-ups consistently**\n\n- **Keep database studio open** for quick checks\n\n- **Monitor escalations** regularly\n\n- **Use dry-run mode** when testing\n\n\n\n### Don'ts ❌\n\n\n\n- **Don't ignore critical conflicts**\n\n- **Don't send more than 3 follow-ups**\n\n- **Don't edit database directly** (use commands)\n\n- **Don't switch to live mode** without testing\n\n- **Don't approve emails** without reading them\n\n- **Don't disable auto-send** without reason\n\n
---
\n\n## 🔐 Security Notes\n\n\n\n### API Keys\n\n\n\nNever share these:
\n\n- `GEMINI_KEY`\n\n- `GOOGLE_PRIVATE_KEY`\n\n- `DATABASE_URL`\n\n
Stored in `.env` file (not in Git).
\n\n### Database Access\n\n\n\n- Use `npm run db:studio` for safe editing\n\n- Don't run SQL directly unless necessary\n\n- Back up before major changes\n\n\n\n### Gmail Access\n\n\n\n- RenOS uses domain-wide delegation\n\n- Can access all `info@rendetalje.dk` emails\n\n- Logs all email interactions\n\n
---
\n\n## 📞 Support\n\n\n\n### Quick Links\n\n\n\n- **Documentation**: `docs/` folder\n\n- **Database**: [Neon Dashboard](https://neon.tech)\n\n- **Gmail**: [Gmail Settings](https://mail.google.com)\n\n- **Google Cloud**: [API Console](https://console.cloud.google.com)\n\n\n\n### Command Help\n\n\n\nMost commands show help with:
\n\n```powershell
npm run <command> --help\n\n```

Or just run without arguments.

---

**Last Updated**: 2025-10-03  
**Version**: 1.0  
**For Questions**: Check documentation or contact support
