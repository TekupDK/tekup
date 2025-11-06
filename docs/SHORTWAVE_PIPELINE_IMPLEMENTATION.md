# Shortwave Pipeline Implementation - Quick Start Guide

**Dato:** 2. november 2025
**Priority:** HIGH - Core Workflow Feature
**Estimated Time:** 4-6 timer for MVP

---

## 🎯 MVP Scope (Minimum Viable Pipeline)

### Core Features:

1. **Pipeline Status View**
   - Column layout med 4 hovedstages
   - Drag-and-drop emails mellem stages
   - Visual feedback

2. **Smart Label Detection**
   - Auto-detect lead source (Rengøring.nu, Rengøring Århus, AdHelp)
   - Auto-apply source label
   - Auto-apply "Needs Action" for nye leads

3. **Pipeline Quick Actions**
   - "Send Tilbud" button
   - "Bekræft Booking" button
   - "Send Faktura" button
   - "Afslut" button

---

## 📋 Implementation Checklist

### Backend (2 timer):

- [ ] Create `email_pipeline_state` table
- [ ] Create `email_pipeline_transitions` table
- [ ] Create pipeline detection service (`detectLeadSource`)
- [ ] Create tRPC endpoints:
  - [ ] `inbox.email.getPipelineState`
  - [ ] `inbox.email.updatePipelineStage`
  - [ ] `inbox.email.detectLeadSource`
  - [ ] `inbox.email.transitionToQuoted`
  - [ ] `inbox.email.transitionToBooked`
  - [ ] `inbox.email.transitionToInvoiced`

### Frontend (3 timer):

- [ ] Create `EmailPipelineView.tsx` component
- [ ] Create `PipelineColumn.tsx` component
- [ ] Create `PipelineEmailCard.tsx` component
- [ ] Create `PipelineQuickActions.tsx` component
- [ ] Create `SmartLabelDetector.tsx` component
- [ ] Integrer i `EmailTab.tsx`

### Testing (1 time):

- [ ] Test med faktiske emails
- [ ] Test pipeline transitions
- [ ] Test smart label detection
- [ ] Test critical rules

---

## 🔧 Technical Details

### Pipeline Stages:

```typescript
type PipelineStage =
  | "needs_action" // Nye leads
  | "venter_pa_svar" // Tilbud sendt
  | "i_kalender" // Booking bekræftet
  | "finance" // Faktura sendt
  | "afsluttet"; // Opgave udført + betalt
```

### Lead Sources:

```typescript
type LeadSource =
  | "rengoring_nu" // Leadmail.no/Nettbureau
  | "rengoring_aarhus" // Leadpoint.dk
  | "adhelp" // AdHelp
  | "direct"; // Direkte henvendelse
```

### Task Types:

```typescript
type TaskType =
  | "fast_rengoring" // Recurring
  | "flytterengoring" // Move-out
  | "hovedrengoring" // Deep clean
  | "engangsopgaver"; // One-time
```

---

## 🚨 Prerequisite: Fix Gmail Rate Limits First

**KRITISK:** Pipeline implementation kræver stabil email ingestion.
**Løs:** Setup self-hosted SMTP server før pipeline features.

Se `GMAIL_RATE_LIMIT_ALTERNATIVES.md` for fuld implementation guide.

### Quick Setup:

1. Deploy `inbound-email` SMTP server
2. Setup Google Workspace forwarding
3. Create `/api/inbound/email` webhook endpoint
4. Test email ingestion

---

## 📝 Next Steps

**Skal vi starte med implementeringen?**
Jeg kan starte med:

1. **Priority 0:** Setup SMTP infrastructure (inbound-email)
2. **Priority 1:** Database schema for pipeline
3. **Priority 2:** Backend API endpoints
4. **Priority 3:** Frontend Pipeline View component

Eller vil du først se en mere detaljeret design spec?
