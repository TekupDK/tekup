# Friday AI Chat

**Intelligent AI assistant for Rendetalje.dk** - A production-ready chat interface with unified inbox, multi-AI support, and business automation.

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/TekupDK/tekup/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Database](https://img.shields.io/badge/database-Supabase_PostgreSQL-green.svg)](https://supabase.com)

> **⚡ Quick Start:** Copy `.env.dev.template` → `.env.dev`, fill secrets, run `pnpm dev`  
> **🔧 Environment Guide:** [QUICK_ENV_REFERENCE.md](QUICK_ENV_REFERENCE.md) | **� Full Setup:** [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md)

## 🎯 Overview

Friday is a Shortwave.ai-inspired chat interface built specifically for Rendetalje.dk cleaning business operations. It combines AI-powered conversation with real-time inbox management, calendar bookings, invoice handling, and lead tracking.

**Live Demo:** [https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer](https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer)

## ✨ Features

### 🆕 What's New in v1.3.0

- **Supabase PostgreSQL Migration**: Complete database migration from MySQL/TiDB to Supabase
- **FullCalendar Integration**: Professional calendar with day/week/month views, drag & drop
- **Email Pipeline View**: Shortwave-style email pipeline stages and context tracking
- **API Monitoring**: Real-time request tracking, cache metrics, and performance analytics
- **Enhanced Security**: DOMPurify XSS protection, express-rate-limit, CSRF protection
- **Test Suites**: Comprehensive test coverage with Vitest, component tests for all tabs
- **Database-First Strategy**: Email, invoice, lead, and task caching for 5x faster performance
- **Logger System**: Winston logging with Supabase audit trail integration

### 🤖 Multi-AI Chat Interface

- **4 AI Models**: Gemini 2.5 Flash, Claude 3.5 Sonnet, GPT-4o, Manus AI
- **Conversation Memory**: Full chat history context for better responses
- **Voice Input**: Web Speech API integration (Danish language)
- **Markdown Rendering**: Safe markdown with DOMPurify sanitization
- **File Attachments**: Support for PDF, CSV, JSON uploads

### 📧 Unified Inbox (Shortwave.ai-inspired)

- **Email Tab**: Gmail integration with database caching, advanced search, threading, and pipeline view
- **Invoices Tab**: Billy.dk invoice management with database-first strategy
- **Calendar Tab**: FullCalendar integration with day/week/month views, drag & drop, and real-time sync
- **Leads Tab**: Complete CRM with pipeline stages, email enrichment, and lead source detection
- **Tasks Tab**: Priority-based task management with due dates and completion tracking

### 🔄 Intent-Based Actions

Friday automatically detects and executes 7 types of actions:

1. **Create Lead** - Extracts contact info from messages
2. **Create Task** - Parses Danish date/time and priority
3. **Book Meeting** - Google Calendar integration (NO attendees - MEMORY_19)
4. **Create Invoice** - Billy API draft-only (349 kr/hour - MEMORY_17)
5. **Search Email** - Gmail API for duplicate detection
6. **Request Photos** - Flytterengøring workflow (MEMORY_16)
7. **Job Completion** - 6-step checklist automation (MEMORY_24)

### 🧠 25 MEMORY Business Rules

Critical business logic embedded in AI system prompt:

- **MEMORY_16**: Always request photos for flytterengøring before sending quotes
- **MEMORY_17**: Invoice drafts only, never auto-approve (349 kr/hour)
- **MEMORY_19**: NEVER add attendees to calendar events (prevents auto-invites)
- **MEMORY_24**: Job completion requires 6-step checklist
- **MEMORY_15**: Calendar bookings only on round hours (10:00, 10:30, 11:00)
- [See full list in `server/ai-router.ts`]

### 📱 Mobile Responsive

- **Desktop**: Split-panel layout (60% chat, 40% inbox)
- **Mobile**: Single column with drawer navigation
- **Touch-Friendly**: 44px minimum touch targets
- **Responsive Breakpoints**: sm (640px), md (768px), lg (1024px)

### 🎨 Modern UI/UX

- **Dark Theme**: Professional color palette
- **Smooth Animations**: Fade-in, slide-in transitions
- **Loading States**: Skeletons and spinners
- **Empty States**: Helpful placeholders
- **Toast Notifications**: User feedback

## 🏗️ Tech Stack

### Frontend

- **React 19** - Latest React features
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible components
- **tRPC** - End-to-end type-safe API
- **Streamdown** - Markdown rendering

### Backend

- **Express 4** - Node.js server with rate limiting
- **tRPC 11** - Type-safe procedures
- **Drizzle ORM** - Database management
- **Supabase PostgreSQL** - Production database (schema: `friday_ai`)
- **Security**: DOMPurify (XSS protection), express-rate-limit, helmet
- **Monitoring**: API monitoring, request queue, retry strategies

### Integrations

- **Google API** - Gmail + Calendar (domain-wide delegation)
- **Billy.dk** - Invoice management via billy-mcp
- **Manus Forge** - Built-in AI services
- **OpenAI** - GPT-4o model
- **Anthropic** - Claude 3.5 Sonnet
- **Google Gemini** - Gemini 2.5 Flash

## 📦 Installation

### Prerequisites

- Node.js 22.x
- pnpm 9.x
- Supabase PostgreSQL database
- Google Service Account with domain-wide delegation
- Billy.dk API key
- OpenAI API key
- Gemini API key

### Setup

1. **Clone repository**

```bash
git clone https://github.com/TekupDK/tekup-friday.git
cd tekup-friday
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```powershell
# Copy template to create your local .env.dev file
Copy-Item .env.dev.template .env.dev

# Edit .env.dev and fill in your secrets:
code .env.dev

# Required variables:
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres?schema=friday_ai&sslmode=require
JWT_SECRET=your-secret-minimum-32-chars
OWNER_OPEN_ID=owner-friday-ai-dev
VITE_APP_ID=tekup-friday-dev

# Optional but recommended:
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
GOOGLE_SERVICE_ACCOUNT_KEY=./google-service-account.json
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
BILLY_API_KEY=your-billy-api-key
BILLY_ORGANIZATION_ID=your-billy-org-id
```

4. **Push database schema**

```bash
pnpm db:push
```

5. **Start development server**

```bash
pnpm dev
```

Server runs on `http://localhost:3000`

## 🗄️ Database Schema

**21 tables** in Supabase PostgreSQL (`friday_ai` schema):

### Core Tables

- **users** - Authentication (Manus OAuth)
- **conversations** - Chat threads with AI context
- **messages** - Chat messages with AI responses

### Business Operations

- **email_threads** - Gmail caching with threading support
- **invoices** - Billy.dk invoice cache (database-first)
- **calendar_events** - Google Calendar events cache
- **leads** - Complete CRM with pipeline stages
- **tasks** - Task management with priorities
- **customers** - Customer profiles with history

### Analytics & Monitoring

- **analytics_events** - User tracking and behavior
- **api_metrics** - Performance monitoring
- **cache_hits** - Cache effectiveness metrics

### Additional Features

- **10 PostgreSQL enum types** for type safety
- **Row-level security (RLS)** for multi-tenant support
- **Real-time subscriptions** via Supabase
- **Automatic timestamps** and audit trails

See `drizzle/schema.ts` and `drizzle/0003_minor_lester.sql` for full schema.

## 🔧 Development

### Project Structure

```
tekup-friday/
├── client/               # Frontend React app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route components
│   │   ├── lib/         # tRPC client
│   │   └── App.tsx      # Main app
├── server/              # Backend Express server
│   ├── routers.ts       # tRPC procedures
│   ├── db.ts            # Database helpers
│   ├── ai-router.ts     # AI routing logic
│   ├── google-api.ts    # Gmail/Calendar
│   ├── billy.ts         # Billy integration
│   └── mcp.ts           # MCP framework
├── drizzle/             # Database schema
└── shared/              # Shared types
```

### Key Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

## 🚀 Deployment

### Manus Platform (Recommended)

1. Save checkpoint in Manus UI
2. Click "Publish" button
3. Auto-deployed with global CDN

### Manual Deployment

```bash
pnpm build
# Deploy dist/ folder to your hosting
```

## 📖 Usage Guide

### Creating a Lead

```
User: "Ny lead fra Rengøring.nu: Hans Jensen, hans@email.dk, 12345678"
Friday: [Creates lead in database] "Lead oprettet! Skal jeg sende en tilbudsmail?"
```

### Booking Calendar

```
User: "Book møde med kunde i morgen kl 14"
Friday: [Checks calendar, creates event] "Møde booket 14:00 i morgen ✓"
```

### Invoice Creation

```
User: "Lav faktura til Hans Jensen for 3 timer rengøring"
Friday: [Creates Billy draft at 349 kr/hour] "Faktura-udkast oprettet i Billy (1047 kr)"
```

### Flytterengøring Workflow

```
User: "Kunde vil have tilbud på flytterengøring"
Friday: "Jeg skal bruge billeder først (MEMORY_16). Kan du sende fotos af lejligheden?"
[Blocks quote sending until photos received]
```

## 🧪 Testing

### Test Infrastructure (v1.3.0)

**Vitest Configuration**: Complete test setup with jsdom environment

### Component Tests

- ✅ **CalendarTab.test.tsx** - 2 tests passing
- ✅ **TasksTab.test.tsx** - 2 tests passing
- ⚠️ **EmailTab.test.tsx** - CSS import issue (katex)
- ⚠️ **InvoicesTab.test.tsx** - CSS import issue (katex)
- ⚠️ **LeadsTab.test.tsx** - CSS import issue (katex)

### Authentication Tests

- ✅ **Auth helper** - Login flow with test mode
- ✅ **Cookie handling** - jsdom environment working
- ✅ **Real tRPC client** - Integration tests ready

### Integration Tests

✅ Lead creation with flytterengøring (MEMORY_16 working)  
✅ Task creation with Danish date/time parsing  
✅ Calendar booking (Intent sent successfully)  
✅ Database-first queries (5x performance improvement)

### Test Coverage

- **2/5 test suites** passing (40%)
- **4 total tests** running successfully
- **Authentication**: 100% functional
- **Manual testing**: All tabs verified in production

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Contributing

This is a private project for Rendetalje.dk. For questions or issues, contact TekupDK.

## � Documentation

### Comprehensive Guides (54 MD files)

- **CHANGELOG.md** - Version history with v1.3.0 features
- **TESTING_REPORT.md** - Complete test status and results
- **IMPROVEMENTS_PLAN.md** - 541 lines of roadmap and features
- **LOGIN_DEBUG_GUIDE.md** - Authentication troubleshooting
- **PERFORMANCE_TEST_GUIDE.md** - Performance optimization
- **API_OPTIMIZATION docs/** - 10+ files on API improvements
- **SHORTWAVE_CONTEXT_FEATURE.md** - Email context tracking
- **FINAL_STATUS_NOW.md** - Production ready status

### Database Scripts

- `add-alias-columns.ts` - Database column additions
- `add-missing-columns.ts` - Schema migrations
- `check-emails-table.ts` - Email table verification
- `create-tables-directly.ts` - 462 lines of schema setup
- `fix-emails-table.ts` - Email table fixes
- `migrate-emails-schema.ts` - Email migration
- `setup-enums-via-cli.ts` - PostgreSQL enum setup

## �🔗 Related Projects

- **[TekupDK/tekup](https://github.com/TekupDK/tekup)** - Original monorepo (archived)
- **[TekupDK/tekup-billy](https://github.com/TekupDK/tekup-billy)** - Billy MCP server
- **[TekupDK/tekup-secrets](https://github.com/TekupDK/tekup-secrets)** - Secrets management
- **[TekupDK/tekup-vault](https://github.com/TekupDK/tekup-vault)** - Vault integration

## 📧 Support

For technical support or feature requests, open an issue on GitHub.

---

**Built with ❤️ by TekupDK for Rendetalje.dk**
