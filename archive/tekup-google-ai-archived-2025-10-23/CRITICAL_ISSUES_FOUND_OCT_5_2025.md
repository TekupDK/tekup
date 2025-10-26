# 🚨 KRITISKE PROBLEMER FUNDET I RENOS KODEBASE

**Dato:** 5. oktober 2025  
**Anledning:** Auto-send emails blev sendt selvom systemet skulle være disabled

---

## ❌ PROBLEM #1: Auto-Send i leadMonitor.ts (FIXED ✅)

**Fil:** `src/services/leadMonitor.ts` linje 173-187

**Problem:**
```typescript
const autoResponseService = getAutoResponseService({
    enabled: true,  // ❌ HARDCODED!
    requireApproval: false,  // ❌ INGEN GODKENDELSE!
});
await autoResponseService.processLead(lead);  // ❌ SENDER AUTOMATISK!
```

**Konsekvens:**
- Sendte emails automatisk til ALLE nye leads
- Ignorerede alle config settings i emailAutoResponseService.ts
- Resulterede i dårlige emails (midnatstider, [Ukendt] m², uprofessionelle priser)

**Fix:**
- ✅ Kommenteret hele auto-response sektionen ud
- ✅ Tilføjet detaljeret dokumentation af problemerne
- ✅ Committed og pushed (ef4d706)

---

## ❌ PROBLEM #2: Follow-Up Service Sender STADIG Auto-Emails (ACTIVE!)

**Fil:** `src/services/followUpService.ts` linje 269

**Problem:**
```typescript
export async function sendFollowUp(lead: LeadNeedingFollowUp): Promise<FollowUpResult> {
    // ...
    await sendGenericEmail({  // ❌ SENDER DIREKTE UDEN CHECKS!
        to: lead.customerEmail,
        subject,
        body,
        threadId: lead.emailThreadId,
    });
}
```

**Konsekvens:**
- Sender automatiske follow-up emails efter 3-5 dage
- INGEN godkendelse påkrævet
- INGEN check af RUN_MODE eller enabled flag
- Kører når `findLeadsNeedingFollowUp()` kaldes

**Hvor kaldes den?**
- Potentielt fra CLI tools eller cron jobs
- Ingen guard rails mod accidental activation

**Fix nødvendig:** ❌ URGENT
- Tilføj `enabled` flag check
- Tilføj `requireApproval` funktionalitet
- Respekter RUN_MODE=dry-run

---

## ❌ PROBLEM #3: Dashboard API Sender Emails via POST (ACTIVE!)

**Fil:** `src/api/dashboardRoutes.ts`

### 3A: Thread Reply Endpoint (linje 731)
```typescript
router.post("/threads/:id/reply", (req: Request, res: Response) => {
    const { body, dryRun = true } = req.body;  // ✅ HAR dry-run, men default er true
    
    if (!dryRun) {  // ⚠️ Hvis client sender dryRun=false, SENDES DER!
        await sendGenericEmail({
            to: thread.customer.email,
            subject: `Re: ${thread.subject}`,
            body,
            threadId: thread.gmailThreadId,
        });
    }
});
```

**Problem:**
- API endpoint kan sende emails hvis `dryRun=false` sendes
- Ingen ekstra authentication eller approval flow
- Frontend kan potentielt sende emails ved uheld

### 3B: Email Approval Endpoint (linje 1189)
```typescript
// Lignende pattern - sender emails via API uden extra guards
```

**Fix nødvendig:** ⚠️ MEDIUM PRIORITY
- Tilføj authentication til email-sending endpoints
- Tilføj audit log når emails sendes via API
- Overvej at kræve admin rolle for at sende emails

---

## ❌ PROBLEM #4: Escalation Service (UKENDT STATUS)

**Fil:** `src/services/escalationService.ts` linje 176

```typescript
await sendGenericEmail({
    to: escalation.customerEmail,
    subject: "Vedrørende din henvendelse",
    body: escalationBody,
});
```

**Problem:**
- Sender emails automatisk ved escalation
- Ingen checks af enabled/approval flags
- Ukendt hvornår denne kaldes

**Fix nødvendig:** ⚠️ NEEDS INVESTIGATION

---

## 📋 SIKKERHEDSPROBLEMER IDENTIFICERET

### 1. **Manglende Centralized Email Gate**
- Hver service kalder `sendGenericEmail` direkte
- Ingen central kontrol over hvornår emails sendes
- Ingen audit trail

**Anbefaling:**
```typescript
// src/services/emailGateway.ts
export async function sendEmail(params: EmailParams, options: {
    requireApproval?: boolean;
    auditLog?: boolean;
    checkLimits?: boolean;
}) {
    // Central logging
    // Rate limiting
    // Approval flow
    // RUN_MODE checks
    // Then call sendGenericEmail
}
```

### 2. **Hardcoded Config Values**
- `enabled: true` og `requireApproval: false` hardcoded i leadMonitor
- Ingen environment variable overrides
- Svært at disable features i production

**Anbefaling:**
- Flyt til environment variables:
  - `AUTO_RESPONSE_ENABLED=false`
  - `FOLLOW_UP_ENABLED=false`
  - `ESCALATION_ENABLED=false`

### 3. **Manglende Email Quality Checks**
- Emails sendes uden validation af:
  - Tidspunkter (resulterede i midnatstider!)
  - Placeholder values ([Ukendt] m²)
  - Pris estimater (2000kr for 56m² - for dyrt!)
  
**Anbefaling:**
- Pre-send validation i `emailResponseGenerator.ts`
- Reject emails med [Ukendt] eller invalid tider
- Add confidence score threshold

### 4. **Ingen Production Safeguards**
- RUN_MODE=live på Render → ALT kører for real
- Ingen manual approval flow i production
- Ingen email sending limits per dag/time

**Anbefaling:**
- `PRODUCTION_SAFETY_MODE=true` → kræv manual approval
- `MAX_EMAILS_PER_HOUR=10`
- `ADMIN_APPROVAL_REQUIRED=true` for nye features

---

## 🔧 UMIDDELBARE ACTIONS REQUIRED

### CRITICAL (Fix NU)
1. ✅ **leadMonitor.ts auto-send** → FIXED
2. ❌ **followUpService.ts** → DISABLE NU
3. ⚠️ **escalationService.ts** → UNDERSØG OG DISABLE

### HIGH PRIORITY (Fix i dag)
4. Fix email templates:
   - Ledige tider (ingen midnatstider)
   - [Ukendt] placeholders
   - Pris beregninger
5. Tilføj email gateway med centraliseret kontrol
6. Tilføj environment variable guards

### MEDIUM PRIORITY (Fix denne uge)
7. Authentication på API email endpoints
8. Audit logging for alle sendte emails
9. Rate limiting per kunde
10. Production safety checklist

---

## 📊 EMAIL KVALITETSPROBLEMER

**Eksempel på dårlig auto-sent email:**
```
Hej Mikkel!

📏 **Bolig**: [Ukendt] m² med [Ukendt] værelser/rum  ❌
💰 **Pris**: 349kr/time/person = ca. 2.094 kr  ❌ (for dyrt for 56m²)

📅 **Ledige tider**:
* Søndag d. 5. oktober kl. 18:20  ❌ (midt om aftenen)
* Søndag d. 5. oktober kl. 21:20  ❌ (nat)
* Mandag d. 6. oktober kl. 00:20  ❌ (midnat!)
```

**Kunde response:**
> "2000,- for en 2 værelses 56kvm lejlighed.. i kan glemme det. Der er vi langt fra hinanden 🤣"

**Problemer:**
1. Ingen konkrete oplysninger (m², værelser)
2. Forkerte/urealistiske tidspunkter
3. For høj pris for opgaven
4. Virker uprofessionelt

---

## 🎯 DEPLOYMENT SAFETY CHECKLIST (TBD)

Se separat fil: `DEPLOYMENT_SAFETY_CHECKLIST.md` (skal oprettes)

---

**Oprettet af:** GitHub Copilot AI Agent  
**Review krævet af:** Jonas (Rendetalje.dk)  
**Status:** 🚨 URGENT - Multiple active issues found
