# 🚀 RenOS Repository Split - Setup Guide

Dette dokument beskriver hvordan de to nye repositories er sat op og hvordan du kommer i gang.

## 📦 Repositories Oversigt

### 1. [renos-backend](https://github.com/JonasAbde/renos-backend)
**Backend API** - TypeScript, Node.js, Express, Prisma, Google APIs

**Location:** `C:\Users\empir\renos-backend`

**Indeholder:**
- ✅ `src/` - Hele backend koden (agents, services, tools)
- ✅ `prisma/` - Database schema og migrations
- ✅ `tests/` - Backend tests
- ✅ `docs/` - Backend dokumentation
- ✅ `scripts/` - Utility scripts
- ✅ `.github/` - CI/CD workflows
- ✅ Config filer: `tsconfig.json`, `vitest.config.ts`, `.env`, osv.

**Status:** ✅ Klar til brug
- Dependencies installeret
- Prisma client genereret
- TypeScript bygget succesfuldt
- .env fil kopieret

### 2. [renos-frontend](https://github.com/JonasAbde/renos-frontend)
**Frontend Dashboard** - Vite, React, TypeScript, Tailwind CSS

**Location:** `C:\Users\empir\renos-frontend`

**Status:** 📋 Klar til setup (næste skridt)

---

## 🎯 Kom i Gang med Backend

### Trin 1: Verificer Setup

```powershell
cd C:\Users\empir\renos-backend

# Check at alt er installeret
npm run build        # TypeScript build
npm run db:generate  # Prisma client
```

### Trin 2: Database Setup

```powershell
# Push database schema (første gang)
npm run db:push

# Åbn Prisma Studio for at se data
npm run db:studio
```

### Trin 3: Start Development Server

```powershell
# Start backend med hot reload
npm run dev
```

Backend kører nu på `http://localhost:3000` (eller port specificeret i .env)

### Trin 4: Verificer Google Integration

```powershell
# Test Google API setup
npm run verify:google

# Test email funktionalitet
npm run email:pending

# Test calendar funktionalitet
npm run booking:availability
```

---

## 🎨 Setup Frontend (Næste Opgave)

### Trin 1: Opret Fresh Vite + React Projekt

```powershell
cd C:\Users\empir\renos-frontend

# Opret Vite projekt med React + TypeScript template
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install
```

### Trin 2: Install Moderne Stack

```powershell
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# TanStack Query (data fetching)
npm install @tanstack/react-query

# Zustand (state management)
npm install zustand

# Axios (API client)
npm install axios

# React Router (navigation)
npm install react-router-dom

# Shadcn/ui (optional - moderne components)
npm install -D @shadcn/ui
```

### Trin 3: Projekt Struktur

```
renos-frontend/
├── src/
│   ├── api/          # API client (axios + types)
│   ├── components/   # Reusable UI components
│   │   ├── ui/       # shadcn/ui components
│   │   └── layout/   # Layout components
│   ├── features/     # Feature-based modules
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── bookings/
│   │   └── emails/
│   ├── hooks/        # Custom React hooks
│   ├── stores/       # Zustand stores
│   ├── types/        # TypeScript types (sync med backend)
│   ├── utils/        # Helper functions
│   ├── App.tsx
│   └── main.tsx
├── public/
└── index.html
```

### Trin 4: Tilslut til Backend API

Opret `src/api/client.ts`:

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Trin 5: Environment Variables

Opret `.env` i frontend root:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=RenOS
```

---

## 🔄 Development Workflow

### Backend Development

```powershell
# Terminal 1: Backend
cd C:\Users\empir\renos-backend
npm run dev
```

### Frontend Development (når setup er færdigt)

```powershell
# Terminal 2: Frontend
cd C:\Users\empir\renos-frontend
npm run dev
```

### Commit Changes

```powershell
# Backend commits
cd C:\Users\empir\renos-backend
git add .
git commit -m "feat: add new feature"
git push origin main

# Frontend commits
cd C:\Users\empir\renos-frontend
git add .
git commit -m "feat: add new component"
git push origin main
```

---

## 📋 Næste Skridt - Action Items

### ✅ Completed
1. ✅ Oprettet `renos-backend` repository
2. ✅ Oprettet `renos-frontend` repository
3. ✅ Migreret backend kode til nyt repo
4. ✅ Renset package.json (fjernet frontend dependencies)
5. ✅ Kopieret .env fil
6. ✅ Fixet TypeScript build fejl (Clerk auth)
7. ✅ Verificeret backend bygger korrekt

### 🔲 To Do
1. 🔲 Setup fresh Vite + React projekt i `renos-frontend`
2. 🔲 Installer moderne frontend stack (Tailwind, TanStack Query, Zustand)
3. 🔲 Opret projekt struktur
4. 🔲 Implementer API client
5. 🔲 Implementer type-safe API contracts (shared types)
6. 🔲 Bygge første komponenter (Dashboard, Navigation)
7. 🔲 Test frontend + backend integration

---

## 🎓 Design System Overvejelser

### Option 1: Shadcn/ui (Anbefalet ⭐)
- Moderne, customizable components
- Built on Radix UI (accessibility)
- Tailwind CSS native
- Copy-paste komponenter (ingen npm dependency hell)

### Option 2: Material UI (MUI)
- Mature, veletableret
- Mange components out-of-the-box
- Tungere bundle size

### Option 3: Chakra UI
- God developer experience
- Built-in dark mode
- Mindre adoption end MUI

**Anbefaling:** Start med **Shadcn/ui + Tailwind CSS** for moderne, lightweight approach.

---

## 🛠️ Helpful Commands

### Backend

```powershell
# Development
npm run dev                     # Start dev server
npm run build                   # Build TypeScript
npm test                        # Run tests

# Database
npm run db:push                 # Push schema changes
npm run db:studio               # Open Prisma Studio
npm run db:migrate              # Run migrations

# Tools
npm run email:pending           # Check pending emails
npm run booking:availability    # Check booking slots
npm run customer:stats          # Customer statistics
```

### Frontend (efter setup)

```powershell
# Development
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run preview                 # Preview production build

# Linting & Formatting
npm run lint                    # Run ESLint
npm run format                  # Run Prettier
```

---

## 📚 Dokumentation

### Backend
- `README.md` - Main documentation
- `docs/CALENDAR_BOOKING.md` - Booking flows
- `docs/EMAIL_AUTO_RESPONSE.md` - Email automation
- `.github/copilot-instructions.md` - Architecture guide

### Frontend (vil blive oprettet)
- `README.md` - Getting started
- `ARCHITECTURE.md` - Frontend architecture
- `COMPONENTS.md` - Component library guide

---

## ❓ FAQ

### Hvorfor splitte repos?
- ✅ Klar adskillelse af concerns
- ✅ Uafhængige deployment cycles
- ✅ Lettere at onboarde nye udviklere
- ✅ Mulighed for total frontend redesign

### Hvordan synces types mellem backend og frontend?
**Option 1:** Shared npm package `@renos/shared`
**Option 2:** Copy types manuelt (simplere for små projekter)
**Option 3:** OpenAPI/Swagger spec generation

Vi starter med **Option 2** og kan senere upgrade til Option 1.

### Hvor deployes de to repos?
- **Backend:** Render.com (nuværende setup) eller dedicated server
- **Frontend:** Vercel, Netlify, eller CloudFlare Pages

---

## 🎉 Success Criteria

Backend er klar når:
- ✅ npm install kører uden fejl
- ✅ TypeScript bygger uden fejl
- ✅ Database connection virker
- ✅ Dev server starter
- ✅ Google APIs virker

Frontend er klar når:
- 🔲 Vite dev server kører
- 🔲 Kan kalde backend API
- 🔲 Tailwind CSS virker
- 🔲 Første component render
- 🔲 Routing virker

---

**Oprettet:** 9. oktober 2025
**Opdateret:** 9. oktober 2025
**Forfatter:** Jonas Abde (med Copilot assistance)
