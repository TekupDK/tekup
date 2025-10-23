# 🧹 Rendetalje - Consolidated Project

**Consolidated:** October 23, 2025  
**Purpose:** Complete Rendetalje.dk development ecosystem in one place

---

## 📁 Project Structure

```
rendetalje/
├── monorepo/              → Primary development monorepo (Turborepo)
│   ├── apps/
│   │   ├── backend/       (@rendetalje/backend - Express/Prisma)
│   │   └── frontend/      (@rendetalje/frontend - React 19 + Vite)
│   ├── packages/
│   │   └── shared-types/  (@rendetalje/shared-types)
│   └── -Mobile/           (React Native/Expo mobile app)
│
├── services/              → Production services & tools
│   ├── calendar-mcp/      (@renos/calendar-mcp - AI Calendar Intelligence)
│   ├── backend-nestjs/    (@rendetaljeos/backend - NestJS API)
│   ├── frontend-nextjs/   (@rendetaljeos/frontend - Next.js 15)
│   ├── mobile/            (@rendetaljeos/mobile - React Native)
│   ├── database/          (SQL schemas, migrations, RLS policies)
│   ├── shared/            (@rendetaljeos/shared - Utilities)
│   ├── scripts/           (PowerShell deployment scripts)
│   └── deployment/        (Deployment configs)
│
├── gmail-services/        → Gmail automation (placeholder for future)
│
└── docs/                  → All documentation
    ├── monorepo/          (RendetaljeOS documentation)
    ├── services/          (Tekup-Cloud/services documentation)
    ├── reports/           (Analysis reports, plans, guides)
    └── README.md
```

---

## 🎯 Package Scopes

| Scope | Location | Purpose |
|-------|----------|---------|
| `@rendetalje/*` | `monorepo/` | Primary development monorepo |
| `@rendetaljeos/*` | `services/` | Production services |
| `@renos/*` | `services/calendar-mcp/` | Calendar MCP server |

---

## 🚀 Quick Start

### Monorepo Development

```bash
cd monorepo
pnpm install
pnpm dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Services

#### Calendar MCP (Primary Service)
```bash
cd services/calendar-mcp
npm install
npm run docker:up
```

**Access:**
- MCP Server: http://localhost:3001
- Dashboard: http://localhost:3006
- Chatbot: http://localhost:3005

#### Backend NestJS
```bash
cd services/backend-nestjs
npm install
npm run start:dev
```

#### Frontend Next.js
```bash
cd services/frontend-nextjs
npm install
npm run dev
```

---

## 📊 Project Statistics

**Total Size:** ~2 GB  
**Projects Consolidated:** 2 major repos (RendetaljeOS + Tekup-Cloud)

### Monorepo
- Backend: 196 TypeScript files
- Frontend: 112 TypeScript/TSX files
- Shared types: 1 package

### Services
- Calendar MCP: 68,121 files (includes node_modules)
- Backend NestJS: 122 TypeScript files
- Frontend Next.js: 47 files
- Mobile: React Native/Expo app

---

## 🔗 Related Projects

External projects that integrate with Rendetalje:

- **tekup-gmail-services** (`@tekup/renos-gmail-services`) - Gmail automation
- **Tekup-Billy** - Billy.dk invoicing integration
- **TekupVault** - Knowledge management system

---

## 📚 Documentation

All documentation is organized in `docs/`:

- `docs/monorepo/` - RendetaljeOS development docs
- `docs/services/` - Services documentation
- `docs/reports/` - Analysis reports, migration plans, guides

**Key Documents:**
- Migration plans and analysis
- System architecture
- API documentation
- Deployment guides

---

## 🛠️ Tech Stack

### Monorepo
- **Backend:** Express + TypeScript + Prisma + PostgreSQL
- **Frontend:** React 19 + Vite + Radix UI + TailwindCSS
- **Mobile:** React Native + Expo
- **Monorepo:** Turborepo + pnpm workspaces

### Services
- **Calendar MCP:** Node.js + TypeScript + Docker
- **Backend:** NestJS + TypeScript
- **Frontend:** Next.js 15 + React 18
- **Database:** PostgreSQL + Supabase

---

## 🚀 Deployment

### Monorepo (Development)
- Deployed via Render.com or Vercel
- Requires Supabase database

### Services (Production)
- Calendar MCP: Docker containers
- Backend/Frontend: Render.com
- Database: Supabase PostgreSQL

---

## 📝 Contributing

1. Work in `monorepo/` for primary development
2. `services/` are production-ready services
3. Follow package naming conventions:
   - `@rendetalje/*` for monorepo
   - `@rendetaljeos/*` for services

---

## 📞 Contact

**Maintainer:** Jonas Abde  
**Organization:** Tekup Portfolio  
**Client:** Rendetalje.dk

---

**Last Updated:** October 23, 2025
