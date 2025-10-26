# Tekup Unified Platform

A consolidated platform that unifies all Tekup services under a single `tekup.dk` domain, providing seamless integration between Flow automation, CRM, Lead qualification, Voice communications, and Security features.

## 🚀 Overview

This unified platform consolidates the following existing Tekup services:
- **Flow API** - Workflow automation and process management
- **CRM API** - Customer relationship management
- **Lead Platform** - Lead qualification and scoring
- **Voice Services** - Voice communication and transcription
- **Security** - Authentication, authorization, and audit logging

## 🏗️ Architecture

### Core Modules

- **CoreModule** - Database, authentication, tenancy, and shared services
- **FlowModule** - Workflow automation (migrated from flow-api)
- **CrmModule** - Customer management (migrated from tekup-crm-api)
- **LeadsModule** - Lead qualification (migrated from tekup-lead-platform)
- **VoiceModule** - Voice communication features
- **SecurityModule** - Authentication and authorization

### Technology Stack

- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **Multi-tenancy**: Domain-based tenant resolution
- **API**: RESTful with WebSocket support

## 📁 Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Main application module
└── modules/
    ├── core/               # Core services (database, auth, tenancy)
    │   ├── core.module.ts
    │   ├── core.controller.ts
    │   └── services/
    ├── flow/               # Workflow automation
    ├── crm/                # Customer relationship management
    ├── leads/              # Lead qualification
    ├── voice/              # Voice communication
    └── security/           # Security and audit
```

## 🗄️ Database Schema

The unified schema includes:

### Core Tables
- `tenants` - Multi-tenant organizations
- `users` - User accounts with roles
- `audit_logs` - Security audit trail

### Flow Tables
- `flows` - Workflow definitions
- `flow_runs` - Workflow executions

### CRM Tables
- `customers` - Customer records
- `deals` - Sales opportunities
- `activities` - Customer interactions

### Leads Tables
- `leads` - Lead records
- `lead_qualifications` - Qualification criteria and scores

### Voice Tables
- `calls` - Voice call records
- `recordings` - Call recordings

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database and JWT configurations
   ```

3. **Initialize database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run start:dev
   ```

### Available Scripts

- `npm run build` - Build for production
- `npm run start:dev` - Start development server with hot reload
- `npm run start:prod` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

## 🔗 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/info` - Platform information

### Security Endpoints
- `POST /api/security/login` - User authentication
- `POST /api/security/refresh` - Token refresh
- `GET /api/security/permissions` - User permissions

### Flow Endpoints
- `GET /api/flow` - List flows
- `POST /api/flow` - Create flow
- `GET /api/flow/:id` - Get flow details
- `POST /api/flow/:id/execute` - Execute flow

### CRM Endpoints
- `GET /api/crm/customers` - List customers
- `POST /api/crm/customers` - Create customer
- `GET /api/crm/customers/:id` - Get customer details
- `GET /api/crm/deals` - List deals

### Leads Endpoints
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads/:id/qualify` - Qualify lead

### Voice Endpoints
- `GET /api/voice/calls` - List calls
- `POST /api/voice/calls` - Initiate call
- `GET /api/voice/recordings/:id` - Get recording
- `POST /api/voice/transcribe` - Transcribe audio

## 🔒 Security Features

- **Multi-tenancy**: Domain-based tenant isolation
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Audit Logging**: Complete audit trail of all actions
- **Data Validation**: Request validation with class-validator
- **CORS**: Configurable cross-origin resource sharing

## 📊 Multi-Tenancy

The platform supports multiple tenants identified by:
- Domain name (e.g., `client1.tekup.dk`, `client2.tekup.dk`)
- All data is automatically scoped to the current tenant
- Shared infrastructure with isolated data

## 🔄 Migration Strategy

This platform is designed to gradually replace existing services:

1. **Phase 1**: Set up unified platform infrastructure ✅
2. **Phase 2**: Migrate flow-api functionality
3. **Phase 3**: Migrate tekup-crm-api functionality  
4. **Phase 4**: Migrate tekup-lead-platform functionality
5. **Phase 5**: Implement voice communication features
6. **Phase 6**: Data migration from legacy systems
7. **Phase 7**: Switch DNS to point to unified platform

## 🚧 Development Status

- ✅ Core infrastructure and database schema
- ⏳ Flow API migration (in progress)
- ⏳ CRM API migration (planned)
- ⏳ Lead platform migration (planned)
- ⏳ Voice features implementation (planned)
- ⏳ Data migration scripts (planned)

## 🤝 Contributing

1. Follow the existing code patterns and module structure
2. Update tests for any new functionality
3. Maintain the multi-tenant architecture
4. Document any new API endpoints
5. Use proper TypeScript types

## 📝 License

MIT License - see LICENSE file for details.

---

**Tekup Unified Platform** - Consolidating all Tekup services under one roof 🏠
