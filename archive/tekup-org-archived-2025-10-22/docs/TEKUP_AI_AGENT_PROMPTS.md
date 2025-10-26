# 🤖 TekUp AI Agent Prompt Templates

## 📋 **Master Prompt System for TekUp App Store Implementation**

Brug disse prompts til at dirigere AI-agenter til næste fase af TekUp App Store udvikling.

---

## 🔹 **Kort Executive Command Style**
*Brug når du vil have hurtigt og fokuseret output*

```
Lav TekUp SSO arkitektur (multi-tenant, roller, dansk integration).  
Udarbejd enhancement plans for AgentRooms, Secure Platform, CRM og Lead Platform.  
Definér shared services (auth, betaling, compliance, analytics).  
Lav faseplan (1–4) med tid/ressourcer og kort investor pitch (1 side) med revenue potential og cases (Foodtruck, Rendetalje).
```

---

## 🔹 **Udvidet Struktureret Version**  
*Brug når du ønsker både teknisk arkitektur og business-value analyse*

```
Fokusér nu på næste skridt baseret på TekUp App Store vision:

1. **TekUp SSO Arkitektur**
   - Definér komplet authentication flow (multi-tenant, roller, dansk integration)
   - Implementér central identity hub for alle 22 apps
   - Design tenant isolation og permission system
   - Integration med Danish MitID/NemID systemer

2. **Enhancement Plans for Top-Value Apps**
   - AgentRooms Backend & Frontend (multi-agent udvikling)
   - Secure Platform (compliance automation)  
   - TekUp CRM API & Web (customer intelligence)
   - Lead Platform API & Web (qualification engine)
   - Detaljeret roadmap for hver app med features, integration, go-to-market

3. **Shared Services Architecture**  
   - Central authentication service (@tekup/auth)
   - Payment processing system (@tekup/billing)
   - Compliance automation (@tekup/compliance)
   - Analytics & metrics tracking (@tekup/analytics)
   - Danish localization services (@tekup/danish-integration)

4. **Implementation Faseplan**
   - Fase 1: Core Platform (1-2 måneder) - Flow API/Web + SSO
   - Fase 2: High-Value Apps (2-3 måneder) - AgentRooms + CRM + Secure Platform
   - Fase 3: Industry Solutions (3-4 måneder) - FoodTruck + Rendetalje + EssenzaPro  
   - Fase 4: Specialized Tools (4-6 måneder) - MCP Studio + Danish Enterprise + Mobile
   - Estimeret tid, ressourcer og budget for hver fase

5. **Investor Pitch (1 side)**
   - Revenue potential: €195K-825K/måned
   - Integration strategy og teknisk foundation
   - Danske success cases (Foodtruck Fiesta, Rendetalje)
   - Market positioning og competitive advantages
   - Funding requirements og ROI projektion

Output format: Struktureret analyse med både teknisk arkitektur og business-value opsummering.
```

---

## 🔹 **Grafisk Visual Prompt**
*Brug når du vil have både tekst + diagrammer/mindmaps*

```
Udarbejd TekUp App Store roadmap med visualiseringer og diagrammer:

1. **SSO Arkitekturdiagram**
   - Visual flow for TekUp SSO (multi-tenant authentication)
   - Roller og permissions system
   - Integration med danske identity systemer
   - Security layers og tenant isolation

2. **App Ecosystem Mindmap**  
   - Alle 22 apps opdelt i kategorier:
     * Core Platform (Flow API/Web, Secure Platform)
     * AI & Automation (AgentRooms, Agents Hub, Voice AI) 
     * Business Management (CRM, Lead Platform, Business Tools)
     * Industry Solutions (FoodTruck, Rendetalje, EssenzaPro)
     * Developer Tools (MCP Studio, Danish Enterprise)
     * Mobile & Marketing (TekUp Mobile, Website)

3. **Shared Services Diagram**
   - Central services layer som hub for alle apps
   - Auth, billing, compliance, analytics, localization
   - API endpoints og integration patterns

4. **Implementation Timeline**
   - Fasediagram (1-4) med overlappende udvikling
   - Resource allocation og dependencies
   - Milestones og go-to-market punkter

5. **Investor Pitch Infographic**  
   - 1-side visual med revenue potential
   - Success cases (Foodtruck Fiesta screenshots/metrics)
   - Technical architecture overview
   - Market opportunity og competitive positioning

Output: Kombiner tekstbeskrivelse med diagrammer/mindmaps (mermaid, plantuml eller andet visuelt format).
```

---

## 🔹 **Teknisk Implementation Prompt**
*Brug til dybdegående teknisk arkitektur og kode*

```
Implementér TekUp App Store teknisk foundation:

1. **SSO Implementation**
   - Design @tekup/auth package med NestJS
   - JWT token management med tenant context
   - Role-based access control (RBAC) system
   - MitID/NemID integration for danske virksomheder
   - Multi-tenant database row-level security

2. **Shared Services Packages**
   - @tekup/billing - Subscription og payment processing
   - @tekup/compliance - GDPR/NIS2 automation tools  
   - @tekup/analytics - Cross-app metrics og reporting
   - @tekup/danish-integration - CVR, PEPPOL, government APIs
   - @tekup/ui - Shared component library

3. **App Integration Strategy**
   - Refactor flow-api som central authentication hub
   - Implement SSO på AgentRooms Backend/Frontend
   - Update TekUp CRM med shared auth
   - Integrate Lead Platform med central billing

4. **Database Architecture**
   - Multi-tenant PostgreSQL schema design
   - Shared tables vs tenant-isolated tables
   - Cross-app data sharing patterns
   - Performance optimization for 22 apps

5. **Deployment & Infrastructure**  
   - Kubernetes manifests for app ecosystem
   - CI/CD pipelines for individual apps
   - Monitoring og logging på tværs af alle services
   - Auto-scaling og resource management

Output: Detaljeret teknisk specification med kode eksempler, database schemas, og deployment configs.
```

---

## 🔹 **Business Development Prompt**
*Brug til go-to-market og forretningsmæssig implementering*

```
Udvikl go-to-market strategi for TekUp App Store:

1. **Revenue Model per App**
   - Pricing strategy for hver app kategori
   - Freemium vs premium tiers
   - Enterprise packages og volume discounts
   - Marketplace commission struktur (Agents Hub)

2. **Target Market Segmentation**  
   - Danish SMEs (CRM, Lead Platform, Business Tools)
   - Tech companies (AgentRooms, MCP Studio, Developer Tools)
   - Industry specialists (FoodTruck, Rendetalje, EssenzaPro)
   - Enterprise customers (Secure Platform, Business Platform)

3. **Customer Acquisition Strategy**
   - Reference customers: Foodtruck Fiesta, Rendetalje success stories
   - Content marketing med danske business cases
   - Partner channel program
   - Free trial og onboarding flows

4. **Competitive Positioning**
   - TekUp vs Salesforce, HubSpot (CRM space)
   - AgentRooms vs GitHub Copilot, Cursor (AI development)  
   - Danish compliance vs international solutions
   - Industry-specific differentiation

5. **Funding & Investment**
   - Series A funding requirements (€8-15M)
   - Investor pitch deck med traction metrics
   - Financial projections (3-5 år)
   - Exit strategy considerations

Output: Komplet business plan med market analysis, competitive intelligence, og financial modeling.
```

---

## 🔹 **Custom Parameter Prompt**
*Master prompt hvor du kan specificere fokus*

```
Implementér TekUp App Store fase [PHASE] med fokus på [FOCUS_AREA]:

**Parameters:**
- PHASE: [1-core-platform | 2-high-value-apps | 3-industry-solutions | 4-specialized-tools]
- FOCUS_AREA: [technical-architecture | business-development | user-experience | compliance]

**Apps Priority:**
- Phase 1: flow-api, flow-web, SSO implementation
- Phase 2: AgentRooms, Secure Platform, CRM, Lead Platform  
- Phase 3: FoodTruck OS, RendetaljeOS, EssenzaPro
- Phase 4: MCP Studio, Danish Enterprise, TekUp Mobile

**Deliverables baseret på FOCUS_AREA:**
- technical-architecture: Kode, schemas, deployment configs
- business-development: Go-to-market, pricing, customer acquisition  
- user-experience: UI/UX design, user flows, onboarding
- compliance: GDPR, NIS2, Danish regulations, security

Output: Fase-specifik implementering med detaljeret actionable plan.
```

---

## 🚀 **Quick Start Commands**

### **Få SSO Arkitektur Nu:**
```
Lav TekUp SSO arkitektur nu - multi-tenant authentication for 22 apps med Danish integration.
```

### **Få Enhancement Plans:**  
```
Lav detaljerede enhancement plans for AgentRooms, Secure Platform, CRM og Lead Platform - features, integration, go-to-market.
```

### **Få Investor Pitch:**
```
Lav 1-side investor pitch for TekUp App Store - revenue €195K-825K/måned, danske cases, teknisk foundation.
```

### **Få Implementation Plan:**
```
Lav faseplan 1-4 for TekUp App Store implementation - tid, ressourcer, dependencies, milestones.
```

---

## 📝 **Prompt Usage Guide**

1. **For hurtige beslutninger** → Brug "Kort Executive Command"
2. **For dybdegående analyse** → Brug "Udvidet Struktureret"  
3. **For præsentationer** → Brug "Grafisk Visual"
4. **For teknisk implementation** → Brug "Teknisk Implementation"
5. **For business cases** → Brug "Business Development"
6. **For specifik fase** → Brug "Custom Parameter" med phase/focus

**Tip**: Kombiner prompts for komplet output - fx start med "Udvidet" og følg op med "Grafisk" for både analyse og visualisering.
