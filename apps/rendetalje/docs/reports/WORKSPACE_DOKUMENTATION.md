# Workspace Dokumentation - Tekup Ecosystem

## 📁 Komplet Workspace Oversigt

### Hovedworkspace: Tekup-Workspace.code-workspace
Samler alle Tekup projekter i én workspace med 12 mapper:

```
Tekup-Workspace/
├── Tekup-Cloud (nuværende)
├── RendetaljeOS ⭐
├── Tekup-Billy
├── Tekup-AI-Assistant  
├── Tekup-Gmail-Automation
├── Agent-Orchestrator
├── Gmail-PDF-Auto
├── Gmail-PDF-Forwarder
├── Tekup-Google-AI
├── Tekup-org
├── TekupVault
└── tekup-cloud-dashboard
```

### Production Workspace: RendetaljeOS-Production.code-workspace
Fokuseret workspace til team production work:

```
RendetaljeOS-Production/
├── RendetaljeOS-Production (hovedsystem)
├── Tekup-Billy-Integration (fakturering)
├── TekupVault-Knowledge (knowledge base)
├── AI-Friday-Chat (assistant)
└── Calendar-MCP (booking intelligence)
```

## 🗂️ Alle Projekter i C:\Users\empir

### Git Repositories (14 stk)
| Projekt | Type | Status | Beskrivelse |
|---------|------|--------|-------------|
| **RendetaljeOS** | Full-stack | Production | Hovedsystem - operations management |
| **Tekup-Billy** | Integration | Active | Billy.dk fakturering integration |
| **TekupVault** | Knowledge | Active | Knowledge management system |
| **tekup-ai-assistant** | AI | Active | AI Friday chat assistant |
| **Tekup-org** | Monorepo | Development | 46 apps + 20 packages (1058 uncommitted!) |
| **Tekup-Cloud** | Workspace | Current | Nuværende workspace hub |
| **tekup-cloud-dashboard** | Frontend | Development | Cloud dashboard interface |
| **agent-orchestrator** | Automation | Development | Agent orchestration system |
| **renos-backend** | Backend | Legacy | Legacy RendetaljeOS backend |
| **renos-frontend** | Frontend | Legacy | Legacy RendetaljeOS frontend |
| **tekup-chat** | Chat | Development | Chat system |
| **tekup-database** | Tools | Development | Database management tools |
| **tekup-unified-docs** | Docs | Development | Unified documentation |
| **Tekup Google AI** | AI | Development | Google AI integration |

### Node.js Projekter (15+ stk)
- Alle Git repos + standalone projekter
- **rendetalje-ai-chat** - Standalone chat
- **Ny mappe** - Unnamed Node.js project

### Python Projekter (2 stk)
- **tekup-gmail-automation** - Gmail automation
- **Tekup-org** - Hybrid Node.js + Python

## 🎯 RendetaljeOS Production System

### Arkitektur (baseret på specs)
```
RendetaljeOS/
├── frontend/           # Next.js 15 - Alle portaler
│   ├── owner/         # Owner Portal - Business management
│   ├── employee/      # Employee Portal - Daily operations  
│   └── customer/      # Customer Portal - Self-service
├── backend/           # NestJS API
│   ├── auth/         # Authentication & authorization
│   ├── jobs/         # Job management & lifecycle
│   ├── customers/    # Customer relationship management
│   ├── team/         # Team member management
│   └── integrations/ # External service integrations
├── mobile/           # React Native - Employee field app
├── shared/           # Shared types & utilities
└── docs/            # Documentation
```

### Integrationer
1. **Tekup-Billy MCP** - Automatisk fakturering via Billy.dk
2. **TekupVault** - Knowledge management og semantic search  
3. **AI Friday** - Context-aware chat assistant
4. **renos-calendar-mcp** - Intelligent booking validation
5. **Google Calendar** - To-vejs synkronisering
6. **Supabase** - Database, auth og real-time features

### Portaler & Brugerroller
| Portal | Rolle | Adgang | Funktioner |
|--------|-------|--------|------------|
| **Owner Portal** | Owner/Admin | Fuld | Business intelligence, customer management, team oversight |
| **Employee Portal** | Employee | Begrænset | Daily jobs, time tracking, job updates |
| **Customer Portal** | Customer | Self-service | Booking, invoices, communication |

## 🚀 Production URLs (når deployed)
- **Owner Portal**: `https://rendetaljeos.onrender.com/owner`
- **Employee Portal**: `https://rendetaljeos.onrender.com/employee`  
- **Customer Portal**: `https://rendetaljeos.onrender.com/customer`
- **API**: `https://rendetaljeos-api.onrender.com`
- **API Docs**: `https://rendetaljeos-api.onrender.com/docs`

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- pnpm 9+
- Docker Desktop
- Supabase CLI
- Git

### Quick Start Commands
```bash
# Åbn production workspace
code RendetaljeOS-Production.code-workspace

# Install dependencies
pnpm install

# Start development
pnpm dev

# Build production
pnpm build

# Run tests  
pnpm test
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Integrations
TEKUP_BILLY_URL=https://tekup-billy.onrender.com
TEKUPVAULT_URL=https://tekupvault.onrender.com
AI_FRIDAY_URL=https://tekup-chat.onrender.com
RENOS_CALENDAR_URL=...

# Auth
JWT_SECRET=...
NEXTAUTH_SECRET=...
```

## 📊 Projekt Status (fra audit data)

### Aktive Production Services
- **TekupVault**: 5 uncommitted changes
- **Tekup-Billy**: 33 uncommitted, 1 unpushed commit  
- **tekup-ai-assistant**: Clean status ✅
- **tekup-cloud-dashboard**: 1 uncommitted change
- **RendetaljeOS**: 24 uncommitted, no commits yet

### Development Projects
- **Tekup-org**: 1058 uncommitted changes (massive WIP!)
- **Tekup-Cloud**: Current workspace

### Legacy/Archived
- **renos-backend**: Legacy backend
- **renos-frontend**: Legacy frontend
- **Tekup Google AI (renos)**: Ikke eksisterende

## 🔧 Workspace Konfiguration

### VS Code Extensions (anbefalet)
- TypeScript & JavaScript
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- PowerShell
- Azure Tools
- Auto Rename Tag
- Path Intellisense

### Tasks & Launch Configurations
- **Install Dependencies**: `pnpm install`
- **Start Development**: `pnpm dev`
- **Build Production**: `pnpm build`
- **Run Tests**: `pnpm test`
- **Debug Frontend**: Next.js debug config
- **Debug Backend**: NestJS debug config

## 📋 Næste Skridt

### Umiddelbart (næste session)
1. **Fix PowerShell execution policy**
2. **Verificer RendetaljeOS indhold**
3. **Test alle komponenter lokalt**
4. **Setup production deployment**

### Team Onboarding
1. **Åbn RendetaljeOS-Production workspace**
2. **Train på portaler og roller**
3. **Setup user accounts**
4. **Deploy til production**

### Cleanup (valgfrit)
1. **Tekup-org**: Commit eller stash 1058 files
2. **Legacy projekter**: Arkiver renos-backend/frontend
3. **Workspace optimering**: Fjern ubrugte projekter

---

**Dokumentation Status**: ✅ Komplet  
**Workspace Status**: 🟡 Klar til verification  
**Team Status**: 📋 Afventer onboarding