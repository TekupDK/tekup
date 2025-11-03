# Gmail Rate Limit Alternatives - Self-Hosted Email Parsing

**Dato:** 2. november 2025
**Issue:** Gmail API Rate Limits (429 errors) ved for mange API-kald
**Status:** Analysis Complete - Ready for Implementation
**Priority:** HIGH - Critical for Production Stability

---

## 🎯 Problem Statement

### Current Issue:
- **Gmail API Rate Limits:** 429 (RESOURCE_EXHAUSTED) fejl ved for mange API-kald
- **Impact:**
  - Rapporter kan ikke køre uden rate limits
  - Email enrichment rammer kvote-grænser
  - Background sync jobs fejler
  - UI opdateringer bliver blokeret

### Root Cause:
- Gmail API har lave per-user burst-tolerancer (~1 kald/sek)
- Manglende global throttling i current implementation
- Ingen alternativ til Gmail API for email modtagelse

### Solution Goal:
- **Self-hosted SMTP email server** der modtager emails direkte
- **Zero Gmail API dependency** for email ingestion
- **Local email parsing** til Supabase integration
- **Webhook-based pipeline** for enrichment

---

## 🔍 Open-Source Alternatives Analysis

### 1. inbound-email (Node.js SMTP → Webhook)

**Repo:** [github.com/sendbetter/inbound-email](https://github.com/sendbetter/inbound-email)
**License:** MIT
**Language:** Node.js/TypeScript

#### Features:
- ✅ Local SMTP server (modtager emails på port 25/587)
- ✅ MIME parsing via mailparser
- ✅ Webhook integration (sender parsed JSON til HTTP endpoint)
- ✅ Attachment handling (S3/local storage)
- ✅ Queue system for robustness
- ✅ Docker support

#### Pros:
- **Perfect for Node/TS stack** - Matcher vores codebase
- **Webhook-based** - Kan integreres direkte med vores `/api/inbound/email` endpoint
- **Robust** - Queue system håndterer spikes
- **Self-hosted** - Ingen cloud dependency
- **Attachments** - Fuldt support for vedhæftninger

#### Cons:
- **Requires SMTP setup** - DNS MX records eller forwarding fra Google Workspace
- **Attachment storage** - Kræver S3 eller local filesystem
- **Single purpose** - Kun SMTP modtagelse, ingen sending

#### Integration Compatibility:
- ⭐⭐⭐⭐⭐ **Perfect match** for vores stack
- TypeScript native
- Kan bruge eksisterende Supabase integration
- Kompatibel med vores rate limiter patterns

---

### 2. mailparser (Node.js MIME/Stream Parser)

**Repo:** [github.com/nodemailer/mailparser](https://github.com/nodemailer/mailparser)
**License:** MIT
**Language:** Node.js/TypeScript

#### Features:
- ✅ Full RFC compliance
- ✅ Header parsing (from, to, subject, date)
- ✅ Body parsing (text/html/attachments)
- ✅ Stream-based parsing
- ✅ Offline .eml file parsing

#### Pros:
- **Industry standard** - Brugt i inbound-email og andre projekter
- **Lightweight** - Kun parsing, ingen server
- **Flexible** - Kan parses fra streams, files, eller strings
- **Well maintained** - Part of nodemailer ecosystem

#### Cons:
- **Parsing only** - Ingen SMTP server, skal kombineres med inbound-email
- **No webhook** - Skal integreres manuelt

#### Integration Compatibility:
- ⭐⭐⭐⭐⭐ **Best used together** med inbound-email
- Kan erstatte parsing logic i vores eksisterende setup
- Perfect for Supabase mapping

---

### 3. mail-laser (Lightweight Email→JSON Server)

**Repo:** [github.com/Govcraft/mail-laser](https://github.com/Govcraft/mail-laser)
**License:** MIT/Apache
**Language:** Node.js

#### Features:
- ✅ Minimal footprint
- ✅ Email → JSON conversion
- ✅ Webhook forwarding
- ✅ Health endpoint
- ✅ Docker support

#### Pros:
- **Very lightweight** - Minimal overhead
- **Simple** - Easy to understand and modify
- **Fast** - Optimized for speed

#### Cons:
- **No attachments** - Kun email essentials (from/to/subject/body)
- **Limited parsing** - Ingen avanceret MIME parsing
- **Less maintained** - Mindre aktivt community

#### Integration Compatibility:
- ⭐⭐⭐ **Good for simple use cases**
- Mangler attachment support (vigtigt for os)
- Kan bruges hvis attachments ikke er kritisk

---

### 4. postal-mime (TypeScript RFC Parser)

**Repo:** [github.com/postalsys/postal-mime](https://github.com/postalsys/postal-mime)
**License:** MIT
**Language:** TypeScript

#### Features:
- ✅ Full RFC822 compliance
- ✅ Browser + Node.js support
- ✅ Attachment extraction
- ✅ Header parsing
- ✅ TypeScript native

#### Pros:
- **TypeScript first** - Perfekt for vores stack
- **RFC compliant** - Håndterer edge cases
- **Universal** - Virker i browser og Node.js
- **Modern** - Aktive udvikling

#### Cons:
- **Parsing only** - Ingen SMTP server
- **Less mature** - Yngre end mailparser
- **Smaller community** - Mindre dokumentation

#### Integration Compatibility:
- ⭐⭐⭐⭐ **Great TypeScript alternative** til mailparser
- Kan erstatte mailparser i vores pipeline
- Perfect for vores TypeScript codebase

---

### 5. mail-parser (Python Forensic Parser)

**Repo:** [github.com/SpamScope/mail-parser](https://github.com/SpamScope/mail-parser)
**License:** Apache 2.0
**Language:** Python

#### Features:
- ✅ Advanced email forensics
- ✅ .msg file support (Outlook)
- ✅ Security analysis
- ✅ Defect detection

#### Pros:
- **Advanced features** - Forensic-level parsing
- **Security focused** - Detekterer threats
- **Outlook support** - Håndterer .msg files

#### Cons:
- **Python stack** - Kræver Python runtime (vi er Node.js)
- **Overkill** - For avanceret til vores behov
- **Not ideal** - Mismatch med vores stack

#### Integration Compatibility:
- ⭐⭐ **Not recommended** - Python/Node.js mismatch
- Kun relevant hvis vi skal have security analysis

---

## 🏆 Recommended Solution: inbound-email + mailparser

### Why This Combination:

1. **inbound-email** = SMTP server + webhook integration
2. **mailparser** = Robust MIME parsing (bruges allerede af inbound-email)
3. **Perfect match** for vores Node.js/TypeScript stack
4. **Self-hosted** - Ingen cloud dependencies
5. **Webhook-based** - Integreres direkte med vores API

### Architecture:

```
┌─────────────────┐
│  Google Workspace│
│  info@rendetalje │
└────────┬────────┘
         │ (Auto-forward eller Dual Delivery)
         ↓
┌─────────────────┐
│  inbound-email  │ ← SMTP Server (Port 25/587)
│  (Self-hosted)  │
└────────┬────────┘
         │ (Parse MIME)
         ↓
┌─────────────────┐
│   mailparser    │ ← Extract: from, to, subject, body, attachments
└────────┬────────┘
         │ (JSON Webhook)
         ↓
┌─────────────────┐
│  /api/inbound/  │ ← Friday AI v2 Backend
│     email       │
└────────┬────────┘
         │ (Supabase Insert)
         ↓
┌─────────────────┐
│   Supabase DB   │ ← emails, email_threads, attachments tables
└─────────────────┘
```

---

## 📋 Implementation Plan

### Phase 1: Setup SMTP Infrastructure (2-4 timer)

#### 1.1 Google Workspace Forwarding
- Opsæt auto-forward fra `info@rendetalje.dk` → `parse@tekup.dk`
- Eller Dual Delivery (kopi til vores SMTP server)

#### 1.2 DNS Configuration
- MX records for `parse.tekup.dk` → Vores SMTP server IP
- SPF/DKIM records for email deliverability

#### 1.3 inbound-email Setup
```bash
# Clone repo
git clone https://github.com/sendbetter/inbound-email.git
cd inbound-email

# Configure
cp .env.example .env
# Set: WEBHOOK_URL=https://friday-ai.tekup.dk/api/inbound/email
# Set: PORT=25 (eller 587 for submission)
# Set: STORAGE_TYPE=s3 eller local

# Docker build
docker build -t inbound-email .
docker run -d -p 25:25 inbound-email
```

---

### Phase 2: Backend Webhook Integration (3-4 timer)

#### 2.1 Create `/api/inbound/email` Endpoint

```typescript
// server/routers.ts eller server/api/inbound-email.ts

import { z } from "zod";
import { db } from "./db";
import { mailparser } from "mailparser"; // Already in inbound-email
import { verifyWebhookSignature } from "./webhook-security";

const InboundEmailSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number(),
    data: z.string(), // Base64 encoded
  })).optional(),
  messageId: z.string(),
  threadId: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

export async function handleInboundEmail(req: Request) {
  // 1. Verify webhook signature (hvis inbound-email understøtter det)
  // 2. Parse request body
  const body = await req.json();
  const email = InboundEmailSchema.parse(body);

  // 3. Insert into Supabase
  const emailRecord = await db.insert(emails).values({
    provider_id: `inbound-${email.messageId}`,
    from_email: email.from,
    to_email: email.to,
    subject: email.subject,
    text: email.text || "",
    html: email.html || "",
    received_at: new Date(),
    thread_key: email.threadId || generateThreadKey(email),
  });

  // 4. Handle attachments
  if (email.attachments) {
    for (const attachment of email.attachments) {
      // Upload to Supabase Storage
      const storageKey = await uploadAttachment(attachment);

      await db.insert(attachments).values({
        email_id: emailRecord.id,
        filename: attachment.filename,
        mime_type: attachment.contentType,
        size: attachment.size,
        storage_key: storageKey,
      });
    }
  }

  // 5. Run enrichment pipeline (NO Gmail API!)
  await enrichEmailFromSources(emailRecord.id);

  return { success: true, emailId: emailRecord.id };
}
```

#### 2.2 Enrichment Pipeline (NO Gmail API)

```typescript
// server/email-enrichment.ts

export async function enrichEmailFromSources(emailId: string) {
  const email = await db.select().from(emails).where(eq(emails.id, emailId)).one();

  // 1. Billy contactPersons lookup (already implemented)
  const customer = await findCustomerByEmail(email.from_email);
  if (customer) {
    await db.update(emails)
      .set({ customer_id: customer.id })
      .where(eq(emails.id, emailId));
  }

  // 2. Auto-detect lead source (fra SHORTWAVE_WORKFLOW_ANALYSIS.md)
  const leadSource = detectLeadSource(email);
  if (leadSource) {
    await applyLabel(email.thread_key, leadSource);
  }

  // 3. Auto-label "Needs Action" for nye leads
  if (isNewLead(email)) {
    await applyLabel(email.thread_key, "Needs Action");
  }

  // 4. Cache email metadata (for reports)
  await cacheEmailMetadata(email);
}
```

---

### Phase 3: Migration Strategy (4-6 timer)

#### 3.1 Dual Mode Operation
- **Keep Gmail API** for labels, sending, modifications
- **Use SMTP** for email ingestion (reading)
- Gradual migration fra Gmail API → SMTP

#### 3.2 Data Consistency
```typescript
// server/email-sync-strategy.ts

export async function syncEmailSources() {
  // 1. Primary: Inbound SMTP (no rate limits)
  const inboundEmails = await getInboundEmails();

  // 2. Secondary: Gmail API (kun hvis nødvendigt, med rate limiting)
  const gmailEmails = await getGmailEmailsWithRateLimit();

  // 3. Merge and dedupe
  const merged = mergeEmailSources(inboundEmails, gmailEmails);

  // 4. Store in Supabase
  await storeEmails(merged);
}
```

#### 3.3 Rate Limiter Integration
```typescript
// server/gmail-rate-limiter.ts (already exists)

// Only use Gmail API for:
// - Label management
// - Email sending
// - Thread modifications

// NEVER use for:
// - Email reading/ingestion (use SMTP instead)
// - Reports (use Supabase cache)
```

---

## 🔒 Security Considerations

### 1. Webhook Security
- ✅ **HMAC signature verification** - Verify webhook authenticity
- ✅ **Rate limiting** - Prevent abuse
- ✅ **IP whitelisting** - Only accept fra inbound-email server
- ✅ **Max body size** - Limit email size (fx 25MB)

### 2. SMTP Security
- ✅ **TLS/SSL encryption** - Require TLS for SMTP
- ✅ **SPF/DKIM verification** - Verify sender authenticity
- ✅ **Spam filtering** - Basic spam detection
- ✅ **Virus scanning** - Scan attachments (optional)

### 3. Data Privacy
- ✅ **Secure storage** - Encrypt sensitive data
- ✅ **Access control** - Role-based access
- ✅ **Audit logging** - Log all email operations

---

## 📊 Benefits Over Gmail API

### Before (Gmail API):
- ❌ Rate limits (429 errors)
- ❌ Complex authentication
- ❌ Slow response times
- ❌ Dependency on Google infrastructure
- ❌ Limited control

### After (SMTP + Self-Hosted):
- ✅ **Zero rate limits** - Unlimited email ingestion
- ✅ **Real-time delivery** - Instant webhook on receipt
- ✅ **Full control** - Custom parsing logic
- ✅ **Self-hosted** - No cloud dependency
- ✅ **Cost effective** - No API quota costs
- ✅ **Flexible** - Easy to extend and customize

---

## 🚀 Next Steps

### Immediate Actions:
1. ✅ **Clone inbound-email** - Start with local testing
2. ✅ **Setup test environment** - Local SMTP server
3. ✅ **Create webhook endpoint** - `/api/inbound/email`
4. ✅ **Test email parsing** - Verify Supabase integration

### Short-term (1-2 uger):
5. ✅ **Production deployment** - Deploy inbound-email server
6. ✅ **DNS configuration** - MX records for parse.tekup.dk
7. ✅ **Google Workspace forwarding** - Auto-forward setup
8. ✅ **Migration** - Gradually migrate fra Gmail API

### Long-term (1 måned):
9. ✅ **Full migration** - Stop using Gmail API for reading
10. ✅ **Gmail API only for sending** - Labels, modifications
11. ✅ **Monitoring** - Metrics and alerts
12. ✅ **Optimization** - Performance tuning

---

## 📝 Code Examples

### Minimal Webhook Handler:

```typescript
// server/api/inbound-email.ts

import { z } from "zod";
import { db } from "../db";
import { emails, attachments } from "../drizzle/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Insert email
    const [emailRecord] = await db.insert(emails).values({
      provider_id: `inbound-${body.messageId}`,
      from_email: body.from,
      to_email: body.to,
      subject: body.subject,
      text: body.text || "",
      html: body.html || "",
      received_at: new Date(),
    }).returning();

    // Handle attachments
    if (body.attachments) {
      for (const att of body.attachments) {
        await db.insert(attachments).values({
          email_id: emailRecord.id,
          filename: att.filename,
          mime_type: att.contentType,
          size: att.size,
          storage_key: await uploadToSupabase(att.data),
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Inbound email error:", error);
    return Response.json({ error: "Failed to process email" }, { status: 500 });
  }
}
```

---

## 📚 Resources

- **inbound-email GitHub:** https://github.com/sendbetter/inbound-email
- **mailparser Docs:** https://nodemailer.com/extras/mailparser/
- **SMTP Setup Guide:** (TODO: Link til vores setup guide)
- **Supabase Email Schema:** (TODO: Link til schema)

---

**Status:** ✅ Analysis Complete
**Next:** Start implementation af Phase 1 (SMTP Infrastructure)

