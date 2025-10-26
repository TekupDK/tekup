# Tekup 2.0 - Wireframes og UI/UX Specifikation

Dette dokument indeholder detaljerede wireframes og UI/UX specifikationer for alle Tekup 2.0 applikationer.

Relaterede dokumenter:
- `docs/TEKUP_2_0_PRODUCT_SPEC.md`
- `docs/TEKUP_ARCHITECTURE_OVERVIEW.md`

---

## 1) Unified Console - Wireframes

### 1.1 Dashboard (Hovedside)
```
┌─────────────────────────────────────────────────────────┐
│ TekUp Console                    [User] [Settings] [Help]│
├─────────────────────────────────────────────────────────┤
│ [Console] [Jarvis] [Workflow] [Lead] [CRM] [Metrics]... │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Tenant Overview                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐│
│  │ Active Users    │ │ Monthly Revenue │ │ API Calls   ││
│  │ 1,247           │ │ €45,230         │ │ 2.3M        ││
│  └─────────────────┘ └─────────────────┘ └─────────────┘│
│                                                         │
│  🤖 Agent Status                                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Lead Agent: ✅ Online    CRM Agent: ✅ Online      ││
│  │ Voice Agent: ⚠️ Warning  Compliance: ✅ Online     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📈 Recent Activity                                     │
│  • New lead from website (2 min ago)                   │
│  • Deal closed: €15,000 (5 min ago)                    │
│  • Compliance check completed (12 min ago)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Tenant Management
```
┌─────────────────────────────────────────────────────────┐
│ Tenants > Demo Corp                    [Edit] [Settings]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏢 Tenant Information                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name: Demo Corp                                     ││
│  │ Domain: demo.tekup.dk                               ││
│  │ Plan: Enterprise (€2,500/month)                     ││
│  │ Status: ✅ Active                                   ││
│  │ Created: 2024-01-15                                 ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  👥 Users (247)                    [+ Add User]         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name              Role        Last Login   Actions  ││
│  │ John Doe          Admin       2 min ago    [Edit]   ││
│  │ Jane Smith        Manager     1 hour ago   [Edit]   ││
│  │ Mike Johnson      Operator    3 hours ago  [Edit]   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🔧 Configuration                                       │
│  • SSO: SAML (Active Directory)                        │
│  • Branding: Custom logo, colors                        │
│  • Webhooks: 3 configured                              │
│  • API Keys: 5 active                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Agent Management
```
┌─────────────────────────────────────────────────────────┐
│ Agents > Lead Agent                    [Edit] [Deploy]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🤖 Agent Configuration                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name: Lead Qualification Agent                      ││
│  │ Status: ✅ Running                                  ││
│  │ Model: GPT-4                                        ││
│  │ Memory: 2.3GB                                       ││
│  │ Last Updated: 2024-01-20 14:30                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🛠️ Tools & Skills                                      │
│  ✅ Lead Scoring    ✅ Email Analysis                   │
│  ✅ CRM Integration ✅ Phone Call Analysis              │
│  ✅ Web Research    ✅ Social Media Lookup              │
│                                                         │
│  📊 Performance (Last 24h)                             │
│  • Requests: 1,247                                     │
│  • Success Rate: 98.5%                                 │
│  • Avg Response Time: 1.2s                             │
│  • Cost: €23.45                                        │
│                                                         │
│  📝 Recent Activity                                    │
│  • 14:25 - Scored lead "Acme Corp" (Score: 87)        │
│  • 14:20 - Analyzed email from "john@example.com"     │
│  • 14:15 - Updated CRM contact "Jane Smith"           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2) Jarvis 2.0 - Wireframes

### 2.1 Conversation Hub
```
┌─────────────────────────────────────────────────────────┐
│ Jarvis 2.0 > Conversations           [New] [Settings]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💬 Active Conversations                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Lead Analysis - Acme Corp              [Continue]   ││
│  │ Started: 14:25 | Participants: Lead Agent, CRM     ││
│  │ Status: 🔄 In Progress                              ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │ Compliance Check - Contract Review    [View]        ││
│  │ Started: 13:45 | Participants: Compliance Agent    ││
│  │ Status: ✅ Completed                                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🎯 Quick Actions                                       │
│  [Analyze Lead] [Check Compliance] [Generate Report]   │
│                                                         │
│  📊 Agent Performance                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Agent              Requests  Success  Avg Time      ││
│  │ Lead Agent         1,247     98.5%    1.2s         ││
│  │ CRM Agent          892       99.1%    0.8s         ││
│  │ Compliance Agent   456       97.8%    2.1s         ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Agent Graph (Visualisering)
```
┌─────────────────────────────────────────────────────────┐
│ Agent Graph > Lead Qualification Workflow              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔄 Workflow Visualization                             │
│                                                         │
│      [Lead Input]                                       │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │  Lead Agent     │───▶│  CRM Agent      │            │
│  │  (Scoring)      │    │  (Enrichment)   │            │
│  └─────────────────┘    └─────────────────┘            │
│           │                       │                    │
│           ▼                       ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │  Voice Agent    │    │  Compliance     │            │
│  │  (Follow-up)    │    │  Agent (Check)  │            │
│  └─────────────────┘    └─────────────────┘            │
│           │                       │                    │
│           └───────────┬───────────┘                    │
│                       ▼                                │
│              [Final Decision]                          │
│                                                         │
│  🎛️ Controls                                          │
│  [Start] [Pause] [Reset] [Export] [Settings]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Live Steering Panel
```
┌─────────────────────────────────────────────────────────┐
│ Live Steering > Lead Analysis - Acme Corp              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🎮 Real-time Controls                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [⏸️ Pause] [▶️ Resume] [⏹️ Stop] [🔄 Reset]        ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  💬 Inject Instruction                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Text input: "Focus on budget and timeline"]        ││
│  │ [Send] [Save as Template]                           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📊 Current State                                       │
│  • Step: Lead Qualification                            │
│  • Agent: Lead Agent                                   │
│  • Progress: 65%                                       │
│  • Confidence: 87%                                     │
│                                                         │
│  📝 Agent Reasoning                                     │
│  "Based on company size and industry, this lead        │
│   shows high potential. Budget appears to be in        │
│   the €50k-100k range based on similar deals."        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3) Lead Platform - Wireframes

### 3.1 Lead List/Board
```
┌─────────────────────────────────────────────────────────┐
│ Leads > All Leads              [New] [Import] [Export]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔍 Filters & Search                                    │
│  [Status: All ▼] [Source: All ▼] [Date: Last 30 days ▼]│
│  [Search leads...]                                      │
│                                                         │
│  📋 Lead Board                                          │
│  ┌─────────────┬─────────────┬─────────────┬───────────┐│
│  │ New (23)    │ Contacted   │ Qualified   │ Converted ││
│  │             │ (15)        │ (8)         │ (12)      ││
│  ├─────────────┼─────────────┼─────────────┼───────────┤│
│  │ Acme Corp   │ TechStart   │ Global Inc  │ Success   ││
│  │ Score: 87   │ Score: 72   │ Score: 94   │ Co.       ││
│  │ 2 min ago   │ 1 hour ago  │ 3 hours ago │ 1 day ago ││
│  ├─────────────┼─────────────┼─────────────┼───────────┤│
│  │ NewCorp     │ Innovate    │ Future      │           ││
│  │ Score: 65   │ Score: 78   │ Score: 91   │           ││
│  │ 5 min ago   │ 2 hours ago │ 4 hours ago │           ││
│  └─────────────┴─────────────┴─────────────┴───────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Lead Detail
```
┌─────────────────────────────────────────────────────────┐
│ Lead > Acme Corp                    [Edit] [Convert]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 Contact Information                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name: John Smith                                    ││
│  │ Email: john@acme.com                                ││
│  │ Phone: +45 12 34 56 78                             ││
│  │ Company: Acme Corporation                           ││
│  │ Website: www.acme.com                               ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📊 Lead Intelligence                                   │
│  • Score: 87/100 (High)                                │
│  • Source: Website Form                                 │
│  │ Created: 2024-01-20 14:25                          │
│  • Last Activity: Email opened (2 min ago)             │
│  • Estimated Budget: €50k-100k                         │
│                                                         │
│  🤖 AI Analysis                                         │
│  "This lead shows strong buying signals. Company       │
│   size and industry match our ideal customer profile.  │
│   Budget appears to be in the €50k-100k range based    │
│   on similar deals. Recommend immediate follow-up."    │
│                                                         │
│  📝 Activity Timeline                                   │
│  • 14:25 - Lead created from website form              │
│  • 14:26 - AI scoring completed (87/100)              │
│  • 14:27 - Email sent to john@acme.com                │
│  • 14:30 - Email opened by recipient                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4) CRM - Wireframes

### 4.1 Pipeline View
```
┌─────────────────────────────────────────────────────────┐
│ CRM > Pipeline                    [New Deal] [Settings] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Pipeline Overview                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Total Value: €2.3M | Avg Deal: €45k | Win Rate: 23%│
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🎯 Deal Stages                                         │
│  ┌─────────────┬─────────────┬─────────────┬───────────┐│
│  │ Prospecting │ Qualification│ Proposal    │ Closed    ││
│  │ (€450k)     │ (€1.2M)     │ (€650k)     │ (€1.8M)   ││
│  │ 12 deals    │ 8 deals     │ 5 deals     │ 15 deals  ││
│  ├─────────────┼─────────────┼─────────────┼───────────┤│
│  │ Acme Corp   │ TechStart   │ Global Inc  │ Success   ││
│  │ €75k        │ €150k       │ €200k       │ Co.       ││
│  │ 30%         │ 60%         │ 80%         │ €300k     ││
│  ├─────────────┼─────────────┼─────────────┼───────────┤│
│  │ NewCorp     │ Innovate    │ Future      │           ││
│  │ €50k        │ €100k       │ €120k       │           ││
│  │ 20%         │ 70%         │ 90%         │           ││
│  └─────────────┴─────────────┴─────────────┴───────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Deal Detail
```
┌─────────────────────────────────────────────────────────┐
│ Deal > Acme Corp - €75k                [Edit] [Close]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💼 Deal Information                                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Deal Name: Acme Corp - Q1 Implementation           ││
│  │ Value: €75,000                                      ││
│  │ Stage: Prospecting (30%)                           ││
│  │ Close Date: 2024-03-15                             ││
│  │ Owner: John Doe                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🤖 AI Recommendations                                  │
│  • Next Step: Schedule discovery call                  │
│  • Risk: Low competition, high budget                  │
│  • Timeline: 45-60 days to close                       │
│  • Key Stakeholders: CTO, CFO identified               │
│                                                         │
│  📞 Contact Information                                 │
│  • Primary: John Smith (john@acme.com)                 │
│  • Decision Maker: Sarah Johnson (sarah@acme.com)      │
│  • Phone: +45 12 34 56 78                             │
│                                                         │
│  📝 Activity Timeline                                   │
│  • 2024-01-20 - Deal created                          │
│  • 2024-01-20 - Initial contact made                  │
│  • 2024-01-21 - Discovery call scheduled              │
│  • 2024-01-22 - Proposal sent                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5) Workflow Engine - Wireframes

### 5.1 Flow Designer
```
┌─────────────────────────────────────────────────────────┐
│ Workflow > Lead Qualification Flow    [Save] [Test]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🎨 Flow Designer Canvas                               │
│                                                         │
│      [Start]                                            │
│         │                                               │
│         ▼                                               │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │ Lead Input  │───▶│ AI Scoring  │                    │
│  │ (Trigger)   │    │ (Action)    │                    │
│  └─────────────┘    └─────────────┘                    │
│         │                       │                      │
│         ▼                       ▼                      │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │ Score > 80? │    │ Send Email  │                    │
│  │ (Condition) │    │ (Action)    │                    │
│  └─────────────┘    └─────────────┘                    │
│         │                       │                      │
│         ▼                       ▼                      │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │ Create Deal │    │ Add to CRM  │                    │
│  │ (Action)    │    │ (Action)    │                    │
│  └─────────────┘    └─────────────┘                    │
│         │                       │                      │
│         └───────────┬───────────┘                      │
│                     ▼                                  │
│              [End]                                     │
│                                                         │
│  🛠️ Toolbox                                            │
│  [Triggers] [Actions] [Conditions] [Loops] [Delays]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Flow Runs Monitor
```
┌─────────────────────────────────────────────────────────┐
│ Workflow Runs > Lead Qualification Flow                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Run Statistics                                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Total Runs: 1,247 | Success: 98.5% | Avg Time: 2.3s│
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🔄 Recent Runs                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Run ID    Status    Started        Duration  Actions││
│  │ #1247     ✅ Success 14:25:30      2.1s     [View]  ││
│  │ #1246     ✅ Success 14:20:15      1.8s     [View]  ││
│  │ #1245     ⚠️ Warning 14:15:45      3.2s     [View]  ││
│  │ #1244     ✅ Success 14:10:20      2.0s     [View]  ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🎛️ Controls                                           │
│  [Start New] [Pause All] [View Logs] [Export Data]     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6) Mobile App - Wireframes

### 6.1 Task List
```
┌─────────────────────────────────────────────────────────┐
│ TekUp Mobile                    [Profile] [Settings]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📋 Today's Tasks                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ✅ Check-in at Acme Corp (09:00)                   ││
│  │ ⏳ Follow-up call with TechStart (10:30)           ││
│  │ 📋 Site inspection at Global Inc (14:00)           ││
│  │ 📞 Customer meeting at Future Co (16:00)           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  🗺️ Navigation                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Next: Acme Corp - 2.3 km - 8 min                   ││
│  │ [Start Navigation] [Check-in] [Call Customer]       ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📊 Quick Stats                                         │
│  • Tasks Completed: 3/8                               │
│  • Distance Traveled: 45 km                           │
│  • Time Logged: 6.5 hours                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Task Detail
```
┌─────────────────────────────────────────────────────────┐
│ Task > Acme Corp - Site Inspection         [Complete]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📍 Location Information                                │
│  • Address: Storgade 123, 2100 København              │
│  • Contact: John Smith (+45 12 34 56 78)              │
│  • Notes: Main entrance, parking in basement          │
│                                                         │
│  📋 Task Details                                        │
│  • Type: Site Inspection                               │
│  • Duration: 2 hours                                   │
│  • Priority: High                                      │
│  • Due: Today 14:00                                    │
│                                                         │
│  📸 Required Photos                                     │
│  • [Take Photo] [Upload from Gallery]                  │
│  • Front entrance, office space, parking area          │
│                                                         │
│  📝 Notes & Comments                                    │
│  [Add note about inspection findings...]               │
│                                                         │
│  🎛️ Actions                                            │
│  [Check-in] [Call Customer] [Reschedule] [Complete]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7) Industry Suites - Wireframes

### 7.1 RendetaljeOS - Booking System
```
┌─────────────────────────────────────────────────────────┐
│ RendetaljeOS > Bookings              [New] [Calendar]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📅 Calendar View                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Mon 20/1    Tue 21/1    Wed 22/1    Thu 23/1       ││
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     ││
│  │ │Acme Corp│ │TechStart│ │Global   │ │Future   │     ││
│  │ │09:00-11 │ │10:00-12 │ │Inc      │ │Co       │     ││
│  │ │€450     │ │€320     │ │14:00-16 │ │09:00-11 │     ││
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📊 Today's Schedule                                    │
│  • 09:00-11:00 - Acme Corp (2 cleaners)               │
│  • 14:00-16:00 - Global Inc (3 cleaners)              │
│  • Total Revenue: €770                                │
│                                                         │
│  🤖 AI Optimizations                                   │
│  • Route optimized: 15 min saved                      │
│  • Staff allocation: Optimal for today's jobs          │
│  • Weather check: Clear, no delays expected           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 FoodTruckOS - Route Planning
```
┌─────────────────────────────────────────────────────────┐
│ FoodTruckOS > Routes                [New] [Optimize]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🗺️ Route Map                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                     ││
│  │  🚚 Start: Depot                                   ││
│  │      │                                             ││
│  │      ▼                                             ││
│  │  📍 Event 1: Tech Conference                       ││
│  │      │ (10:00-14:00, €2,500)                      ││
│  │      ▼                                             ││
│  │  📍 Event 2: Food Festival                         ││
│  │      │ (16:00-20:00, €1,800)                      ││
│  │      ▼                                             ││
│  │  🏠 End: Depot                                     ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📊 Route Statistics                                    │
│  • Total Distance: 45 km                               │
│  │ Total Time: 8 hours                                │
│  • Estimated Revenue: €4,300                          │
│  • Fuel Cost: €45                                     │
│  • Profit: €3,855                                     │
│                                                         │
│  🤖 AI Recommendations                                 │
│  • Add lunch stop at Central Park (15 min)            │
│  • Consider weather: 20% chance of rain at 18:00      │
│  • Inventory check: Need 50 more burgers              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8) UX/UI Design System

### 8.1 Color Palette
- **Primary**: #2563EB (Blue)
- **Secondary**: #7C3AED (Purple)
- **Success**: #059669 (Green)
- **Warning**: #D97706 (Orange)
- **Error**: #DC2626 (Red)
- **Neutral**: #6B7280 (Gray)

### 8.2 Typography
- **Headings**: Inter Bold (24px, 20px, 18px, 16px)
- **Body**: Inter Regular (14px, 16px)
- **Captions**: Inter Medium (12px)
- **Code**: JetBrains Mono (14px)

### 8.3 Components
- **Buttons**: Primary, Secondary, Ghost, Danger
- **Cards**: Default, Elevated, Outlined
- **Forms**: Input, Select, Checkbox, Radio, Toggle
- **Navigation**: Sidebar, Breadcrumbs, Tabs, Pagination
- **Data Display**: Tables, Lists, Charts, Progress Bars

### 8.4 Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large Desktop**: 1440px+

---

## 9) Accessibility Guidelines

### 9.1 WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for normal text
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Reader**: Proper ARIA labels and roles
- **Focus Management**: Clear focus indicators

### 9.2 Keyboard Shortcuts
- **Ctrl/Cmd + K**: Global search
- **Ctrl/Cmd + N**: New item (context-aware)
- **Ctrl/Cmd + S**: Save
- **Ctrl/Cmd + Z**: Undo
- **Escape**: Close modals/dropdowns

---

## 10) Performance Requirements

### 10.1 Loading Times
- **Initial Load**: < 3 seconds
- **Page Navigation**: < 1 second
- **API Responses**: < 500ms
- **Image Loading**: < 2 seconds

### 10.2 Mobile Performance
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1

---

Dette dokument fungerer som reference for design og implementering. Opdateres løbende baseret på feedback og ændringer.
