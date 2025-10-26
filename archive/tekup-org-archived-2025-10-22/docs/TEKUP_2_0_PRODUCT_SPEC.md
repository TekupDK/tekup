# Tekup 2.0 – Product Specification and IA (AgentScope-enabled)

Denne specifikation beskriver hele produktfladen for Tekup 2.0: applikationer, moduler, sider, flows, tilladelser, dataobjekter, og hvordan AgentScope/Jarvis 2.0 orkestrerer multi-agent samarbejde på tværs.

Relaterede dokumenter:
- docs/TEKUP_ARCHITECTURE_OVERVIEW.md
- docs/TEKUP_APPSTORE_VISION.md
- docs/TEKUP_JARVIS_IMPLEMENTATION_PLAN.md
- docs/TEKUP_STRATEGIC_ASSESSMENT_2025.md

---

## 1) Platform Overview

- Multi-tenant SaaS. Én tenant = én virksomhed/organisation.
- AgentScope driver Jarvis 2.0: ReAct-agenter, MsgHub, Pipelines, real-time steering.
- Unified Console til drift: identitet, fakturering, roller, audit, agent management.
- API-first. Alle apps eksponerer REST/gRPC/WebSocket + events.

---

## 2) Produktportefølje (apps og hovedfunktioner)

1. Unified Console (core)
   - Tenants, brugere, roller (RBAC), SSO/SAML/OIDC
   - Fakturering, abonnementer, usage-metering
   - Audit, logning, hændelser, webhooks
   - Agent management (oprettelse, policy, governance)

2. Jarvis 2.0 (AI & Agents)
   - Multi-agent cooperation (MsgHub), ReAct, værktøjs-hooks
   - Real-time steering (human-in-the-loop), prompt policies
   - Knowledge & Memory (tenant-scoped), kontekststyring
   - Skills/Tools: CRM/Lead/Inbox/Compliance/Voice/Workflow

3. Workflow Engine
   - Træk-og-slip flows; versionering; approvallogik
   - Schedulers, triggers, events; retry/compensation
   - KPI for flows og step timing; test/sandbox run

4. Lead Platform
   - Ingestion (web, mail, voice, API), kvalificering, scoring
   - Kampagner, segmenter, multikanal outreach
   - SLA/response-tider, playbooks, dashboards

5. CRM
   - Kontakter, virksomheder, deals, pipeline, produkter
   - Forecast, aktivitetslog, tasks, e-mail sync
   - AI-forslag (næste skridt), templates, sekvenser

6. Business Metrics
   - KPI boards, OKR, predictive analytics
   - Multi-source datamodeller (Lead/CRM/Inbox/Secure)
   - Eksport, rapportplaner, deling

7. Secure Platform
   - GDPR/NIS2 kontroller, DPA, behandlingsaktiviteter
   - Risikovurdering, politikker, evidens, auditrapporter
   - Automatisk scanning (Inbox AI, log-feeds), alerts

8. Inbox AI
   - Indbakke- og dokumentforståelse, klassifikation
   - Compliance scanning (GDPR, kontrakter, ID)
   - Extract/route til workflows (Lead/CRM/Secure)

9. Voice Agent
   - Dansk/engelsk ASR/TTS, real-tids samtaler
   - Call flows, beskedaflægning, routing til agenter
   - Kvalitetsmålinger, transcripts, sammendrag

10. Industry Suites
    - RendetaljeOS: prisestimering, booking, planlægning, faktura
    - FoodTruckOS: ruter, events, lager/indkøb, POS
    - EssenzaPro: booking, kundekort, anbefalinger, lager

11. MCP Studio Enterprise (Dev/Infra)
    - MCP server management og plugin-økosystem
    - Observability, RBAC, environments, CI/CD hooks

12. TekUp Mobile
    - Feltopgaver, offline, GPS, scanning/upload

---

## 3) Informationsarkitektur – Navigations- og sidetræer

### 3.1 Unified Console (web)
- Dashboard
- Tenants
  - Oversigt, konfiguration, brand, domæner
  - Roller & tilladelser
  - Fakturering & forbrug
  - Webhooks & integratorer
- Brugere & Grupper
- Agents
  - Agent katalog (skabeloner)
  - Policies & sikkerhed
  - Kørselshistorik, performance, tracing
- Audit & Logs
- Settings (SSO, e-mail, notifikationer)

### 3.2 Jarvis 2.0 (web)
- Conversation Hub
- Agent Graph (visualisering af MsgHub/pipelines)
- Tools & Skills (tilkoblede funktioner pr. tenant)
- Memory & Knowledge (kilder, datasæt, retention)
- Live Steering (pause/fortsæt, injicer instrukser)
- Evaluations & Tests

### 3.3 Workflow Engine (web)
- Flow Library
- Designer (canvas)
- Runs (live/kø) + step-logs
- Triggers (cron, webhooks, events)
- Approvals
- Versions & Promotion (dev→prod)

### 3.4 Lead Platform (web)
- Leads (liste, board)
- Ingestion (kilder, formularer)
- Scoring & Qualification
- Campaigns & Sequences
- Analytics (SLA, responstid, konvertering)

### 3.5 CRM (web)
- Pipeline (kanban)
- Deals (detalje, tidslinje)
- Kontakter & Virksomheder
- Forecast & Rapportering
- Playbooks & Templates

### 3.6 Business Metrics (web)
- KPI Boards
- Predictive (prognoser)
- Datakilder & Modeler
- Rapporter & Eksport

### 3.7 Secure Platform (web)
- Oversigt (risiko, status)
- Registre (behandlingsaktiviteter, datakategorier)
- Kontroller & Policies
- Evidens & Audit Trails
- Rapporter (GDPR/NIS2)

### 3.8 Inbox AI (web)
- Indbakke (feed, labels)
- Dokumenter (preview, OCR, klassifikation)
- Compliance Checks (resultater, regler)
- Routings til workflows (Lead/CRM/Secure)

### 3.9 Voice Agent (web)
- Opkaldsflows (designer)
- Samtaler (live/afspilning, transcript)
- Kvalitetsmålinger
- Integrationer (PBX, SIP, web-widgets)

### 3.10 Industry Suites (web)
- RendetaljeOS: Priser, Booking, Plan, Faktura, Kunder, Rapporter
- FoodTruckOS: Ruter, Events, Lager, Indkøb, POS, Rapporter
- EssenzaPro: Booking, Kundekort, Anbefalinger, Lager, Rapporter

### 3.11 MCP Studio Enterprise (web)
- Servers & Plugins
- Environments (dev/stage/prod)
- Observability (metrics, logs, traces)
- Access & Policies

### 3.12 TekUp Mobile (app)
- Opgaver & Ruter
- Check-in/out, tidsregistrering
- Upload (foto/dokumenter), scanning
- Offline kø og sync

---

## 4) Centrale flows (ende-til-ende)

1) Lead→Deal→Faktura
- Kilde (web/voice/inbox) → Lead Platform (scoring) → CRM (deal) → Faktura (via integration)
- Jarvis: kvalificerer, foreslår næste skridt, følger op.

2) Dokument→Compliance
- Dokument → Inbox AI (OCR, klassifikation) → Secure (kontrol/rapport) → Alerts/Tasks
- Jarvis: driver analyse, forklarer fund, genererer evidens.

3) Incident→Response (Core)
- Hændelse (monitoring/webhook) → Workflow → Agents (koordination) → Løsning/eskalering
- Real-time steering fra operatørpanel.

4) Branchespecifik booking→planlægning
- Kunde booker → prissætning → planlægning (optimerede ruter/tider) → mobil udførsel → faktura
- Jarvis: optimerer plan/ressourcer, kommunikerer med kunden.

---

## 5) Roller og tilladelser (eksempler)

- Owner: global tenant-styring, fakturering, SSO
- Admin: brugere, roller, apps, agenter, flows
- Manager: team, dashboards, rapporter
- Operator: kørsel, steering, support
- Analyst: læseadgang til data/metrics
- Agent Developer: oprette/ændre agents & tools (scoped)
- Auditor: læse audit/evidens

---

## 6) Dataobjekter (uddrag)

- Lead, Contact, Company, Deal, Activity, Product
- Campaign, Sequence, Playbook
- Document, Classification, ComplianceCheck, Evidence
- Call, Transcript, QualityScore
- Workflow, Run, Trigger, Approval
- Agent, Tool, Policy, Memory, KnowledgeSource
- Tenant, User, Role, Subscription, UsageRecord, Invoice

Alle objekter er tenant-scopede og revisionssporbare.

---

## 7) AgentScope/Jarvis 2.0 integration (driftsmodel)

- MsgHub: én hub pr. tenant; segmenterede kanaler pr. domæne (Lead/CRM/Inbox/Secure/Voice).
- Pipelines: standardiserede orkestreringer (fx LeadQualification, ComplianceScan, DealFollowUp).
- Toolkits: typed bindings til Tekup-API’er og tredjepart.
- Real-time Steering: operatør kan injicere instrukser i samtaler/flows, pause/fortsætte, omrute.
- Evaluering/Test: scenarier per flow/agent; kvalitetsportaler; kvantitative mål (accuracy, latency, cost).

---

## 8) UX-principper

- Én informationsarkitektur på tværs (venstre navigation konsistent)
- Søgbarhed på tværs af objekter (global search)
- Inline forklaringer fra Jarvis ("why this?"), og forslag til næste handling
- Dark/light, tastaturgenveje, tilgængelighed WCAG AA

---

## 9) Udgivelsesplan (M0–M6)

- M0–M2: Unified Console, Jarvis 2.0, Lead/CRM v1, Workflow Engine v1
- M2–M4: Secure GA, Inbox AI v1, Voice Agent v2, Metrics v1
- M4–M6: Industry GA (RendetaljeOS, FoodTruckOS, EssenzaPro), MCP Studio GA, Mobile v1

---

## 10) Definition of Done (DoD) pr. app

- OpenAPI/SDK komplet + eksempelkald
- RBAC, audit, multi-tenant isolation
- Observability: metrics, logs, traces + dashboards
- E2E-tests for top-3 kerneflows
- Sikkerhed: inputvalidering, rate-limits, secrets-håndtering
- Docs: Getting Started, Admin Guide, API Guide, Troubleshooting

---

## 11) Appendix – Sidematrix pr. app (kortform)

- Lead Platform: List, Board, Lead Detail, Ingestion, Scoring, Campaigns, Sequences, Analytics, Settings
- CRM: Pipeline, Deals, Deal Detail, Contacts, Companies, Forecast, Reports, Templates, Settings
- Secure: Overview, Registers, Controls, Evidence, Reports, Alerts, Settings
- Inbox AI: Inbox, Document Detail, Compliance, Routing, Settings
- Voice: Flows, Calls, Transcripts, Quality, Integrations, Settings
- Metrics: Boards, Predictive, Sources, Reports, Settings
- Workflow: Library, Designer, Runs, Triggers, Approvals, Versions, Settings
- Jarvis: Conversations, Agent Graph, Tools, Memory, Steering, Evaluations, Settings
- Console: Tenants, Users, Roles, Billing, Webhooks, Agents, Audit, Settings
- Industry Suites: Domain-specifikke sider jf. afsnit 3.10

---

Dette dokument fungerer som reference under design og implementering. Opdateres løbende, og anvendes som kilde ved spørgsmål om scope, IA og leverancer.