# Changelog

All notable changes to Tekup Database will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-10-22

### Added

- **Repository Database Migration** 🔄
  - Migrated TekupVault to use `vault` schema
  - Migrated Tekup-Billy to use `billy` schema  
  - Migrated tekup-ai to use `renos` schema
  - Created `REPOS_MIGRATION_COMPLETE.md` with full documentation
  - All 4 repositories now use central tekup-database

### Changed

- **Unified Database Access**
  - TekupVault: Supabase → tekup-database (vault schema)
  - Tekup-Billy: Supabase → tekup-database (billy schema)
  - tekup-ai: Supabase → tekup-database (renos schema)
  - Preserved Supabase credentials as backup (commented out)
  - Preserved Tekup-Billy encryption keys (critical)

## [1.3.1] - 2025-10-22

### Added

- **Migration Documentation Consolidated** 📚
  - Created `docs/migration/` folder
  - Moved 11 migration documents from `supabase-migration` repo
  - Added comprehensive `docs/migration/README.md`
  - Updated main README with migration documentation link

- **Historical Reports Archive** 📊
  - Created `docs/reports/` folder
  - Moved 12 historical reports from `reports-archive`
  - Added comprehensive `docs/reports/README.md`
  - Archived workspace audits, portfolio snapshots, and git cleanup reports
  
### Changed

- **Repository Cleanup**
  - Migration docs now part of main `tekup-database` repo
  - Historical reports consolidated into docs structure
  - Deleted `supabase-migration` and `reports-archive` folders
  - Improved documentation discoverability

## [1.3.0] - 2025-10-22

### Changed

- **MAJOR: Switched to Supabase for Production** 🚀
  - Production database now uses Supabase (Frankfurt - RenOS projekt)
  - Development continues using Docker (localhost)
  - Hybrid setup: Best of both worlds
  
### Added

- **Supabase Configuration**
  - New `SUPABASE_SETUP.md` guide
  - `.env.supabase.example` template
  - Supabase-specific environment variables
  - Migration guide from Docker to Supabase
  
### Updated

- **README.md**
  - Updated hosting from "Render.com" to "Supabase + Docker"
  - Version bump to 1.3.0
  - Added Quick Status section
  - Updated architecture documentation
  
### Migration

- **Target:** RenOS By Tekup Supabase project (oaevagdgrasfppbrxbey)
- **Region:** eu-central-1 (Frankfurt, Germany)
- **Tier:** nano (FREE → Pro $25/mdr when scaled)
- **Repos affected:** TekupVault, Tekup-Billy, RendetaljeOS

## [1.2.0] - 2025-10-21

### Added

- **CRM Schema & Client** (18 models) - Complete CRM system
  - Contacts, Companies, Deals, Pipeline management
  - Activities, Email tracking, Tasks
  - Analytics and metrics
- **Flow Schema & Client** (11 models) - Workflow automation
  - Workflows, Executions, Steps, Logging
  - Scheduling, Webhooks, Integrations
  - Variables and state management
  - Analytics
- **Comprehensive Documentation**
  - Schema Design Guide (database architecture)
  - Contributing Guide (development workflow)
  - Security Policy (best practices)
  - Performance Guide (optimization tips)
- **Configuration Files**
  - Windsurf allowlist for auto-execution
  - VS Code settings
  - Cascade configuration

## [1.1.0] - 2025-10-21

### Added

- RenOS Client Library with complete API
- API Reference Documentation
- Troubleshooting Guide  
- Deployment Guide
- Code Examples (vault, billy, renos)

## [1.0.0] - 2025-10-20

### Added

#### Core Infrastructure

- PostgreSQL 16 with pgvector extension
- Multi-schema architecture (6 schemas: vault, billy, renos, crm, flow, shared)
- Prisma 6 ORM with TypeScript
- Docker Compose setup for local development
- Connection pooling and health monitoring

#### Schemas

**Vault Schema (TekupVault)**

- `vault_documents` - Document storage with metadata
- `vault_embeddings` - Vector embeddings (pgvector 1536-dim)
- `vault_sync_status` - GitHub sync tracking
- Semantic search function using cosine similarity

**Billy Schema (Tekup-Billy)**

- `billy_organizations` - Multi-tenant organization management
- `billy_users` - User access control
- `billy_cached_invoices` - Invoice caching with TTL
- `billy_cached_customers` - Customer caching
- `billy_cached_products` - Product caching
- `billy_audit_logs` - Complete audit trail
- `billy_usage_metrics` - Usage analytics per tool
- `billy_rate_limits` - Distributed rate limiting

**RenOS Schema (Tekup Google AI)** - Ready for migration

- 22 models defined (leads, customers, bookings, invoices, etc.)
- Email system (threads, messages, responses)
- Cleaning plans and time tracking
- Analytics and task execution tracking

**CRM Schema** - Placeholder for Tekup-org CRM
**Flow Schema** - Placeholder for Flow API
**Shared Schema** - Cross-application resources

- `shared_users` - Shared user accounts
- `shared_audit_logs` - Cross-app audit logging

#### Client Libraries

**Vault Client** (`src/client/vault.ts`)

- Document CRUD operations
- Embedding management
- Sync status tracking
- Semantic search wrapper

**Billy Client** (`src/client/billy.ts`)

- Organization management
- Cache operations with TTL
- Audit logging
- Usage metrics tracking
- Rate limiting checks

#### Utilities

**Prisma Scripts**

- `backup.ts` - Database backup utility
- `restore.ts` - Database restore utility
- `health-check.ts` - Database health monitoring
- `seed.ts` - Test data seeding

**Development Tools**

- Docker Compose with PostgreSQL 16 + pgvector
- pgAdmin web interface
- Automated setup scripts
- CI/CD pipeline (GitHub Actions)

#### Documentation

- `README.md` - Complete project documentation
- `QUICK_START.md` - Quick setup guide
- `START_HER.md` - Entry point guide
- `MIGRATION_GUIDE.md` - Complete migration handbook
- `docs/SETUP.md` - Detailed setup instructions
- `PROGRESS.md` - Development progress tracking
- `AUTONOMOUS_LOG.md` - Autonomous work log

#### Testing

- Integration test suite (Vitest)
- 9 test cases covering all schemas
- Health check script
- Test coverage reporting

#### Deployment

- `render.yaml` - Render.com deployment config
- `.github/workflows/ci.yml` - CI pipeline
- Environment templates
- Connection string examples

### Development Process

- **Research Phase:** Analyzed 2025 database technologies
- **Tech Stack Selection:** PostgreSQL 16, Prisma 6, Render.com
- **Architecture Design:** Multi-schema for isolation
- **Implementation:** 50+ files, ~5000+ lines of code
- **Testing:** Integration tests and health checks
- **Documentation:** Comprehensive guides and docs

### Performance

- Connection pooling (2-10 connections)
- Indexed queries on all schemas
- pgvector IVFFlat index for fast similarity search
- Efficient cache TTL management
- Optimized for Render.com Frankfurt region

### Security

- Row Level Security (RLS) ready
- AES-256-GCM encryption support (Billy)
- Environment variable management
- API key authentication patterns
- Audit logging for compliance

### Compatibility

- Node.js 18+ LTS
- PostgreSQL 16
- Prisma 6.17+
- TypeScript 5.7+
- Docker & Docker Compose

### Migration Support

- TekupVault: Ready (Paris → Frankfurt)
- Tekup-Billy: Ready (schema reorganization)
- RenOS: Schema defined, data migration pending
- CRM: Schema placeholder, ready for definition
- Flow: Schema placeholder, ready for definition

---

## [Unreleased]

### Planned Features

- Complete RenOS data migration
- CRM schema full definition
- Flow schema full definition
- Real-time subscriptions (Supabase)
- Web UI for database management
- Automated backup scheduling
- Point-in-time recovery
- Read replicas for scaling
- Monitoring dashboard
- Performance analytics

---

**Repository:** <https://github.com/TekupDK/tekup/tree/master/apps/production/tekup-database>  
**Maintained by:** Jonas Abde | Tekup Portfolio  
**Last Updated:** 2025-10-20
