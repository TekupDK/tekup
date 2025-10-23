# Changelog - Security & DevOps Upgrade

## [Unreleased]

### 🚀 Major Enhancement: Tekup-Billy v2.0 Specification

#### Comprehensive Feature Specification Created

- **Added:** Complete v2.0 enhancement specification in `.kiro/specs/tekup-billy-v2-enhancement/`
- **Requirements:** 12 comprehensive requirements covering performance, analytics, security, and Danish compliance
- **Design:** Advanced architecture with Redis Cluster, circuit breakers, and ML analytics engine
- **Implementation Plan:** 40+ detailed tasks across 10 major enhancement areas
- **Focus Areas:**
  - Enhanced infrastructure with Redis Cluster for Render.com deployment
  - Advanced caching and performance optimization (multi-tier strategy)
  - Machine learning analytics engine with predictive capabilities
  - Enterprise-grade security with automatic key rotation
  - Danish regulatory compliance (MOMS, Bogføringsloven)
  - Enhanced MCP Protocol v2.0 support with batch operations
  - AI-powered preset system with workflow automation
  - Render.com deployment optimization and auto-scaling
  - Comprehensive testing and interactive documentation
  - Zero-downtime production deployment strategy

#### Specification Details

- **Requirements Document:** 12 user stories with EARS-compliant acceptance criteria
- **Design Document:** Complete architecture for Render.com infrastructure
- **Tasks Document:** 40+ implementation tasks (all required, no optional tasks)
- **Target Deployment:** Optimized for Render.com with Redis addon and auto-scaling
- **Backward Compatibility:** Full compatibility with existing v1.4.2 integrations
- **Performance Targets:** <200ms response times, 99.9% uptime, horizontal scaling 2-10 instances

### Changed

- Major repository restructure - organized 40+ docs into categorized subdirectories
- Consolidated 10 PowerShell scripts into `scripts/` directory
- Moved TekupVault integration docs to `docs/integrations/tekupvault/`
- Reduced root directory from 80+ files to 10 essential config files
- Deleted 8 temporary files (render-logs, out.log, render-cli)

### Added

- Created 9 new documentation subdirectories for better organization
- Added spell checker configuration (`.cspell.json`) with Danish words support
- Added repository restructure plan documentation
- **NEW:** Tekup-Billy v2.0 enhancement specification (ready for implementation)

## [1.4.3] - 2025-10-22

### ⬆️ Runtime Upgrade

#### Node.js 20 Migration

- **Upgraded:** Node.js runtime from v18.20.8 to v20.19.5 in Docker
  - **File:** `Dockerfile` - Both builder and production stages
  - **Reason:** Eliminate supabase-js deprecation warnings for Node 18
  - **Impact:** Future-proof runtime, improved performance, longer LTS support
  - **Deployment:** Production verified @ <https://tekup-billy.onrender.com>

### 🔧 Operational Tools Enhancement

#### New Ops Tools

- **Added:** `list_audit_logs` tool

  - Query billy_audit_logs table by date range
  - Returns execution count, timing stats, success rates
  - Enables self-service audit trail access for AI agents

- **Added:** `run_ops_check` tool
  - Automated system health validation
  - Checks Billy API auth, Supabase connectivity, today's audit preview
  - Returns structured diagnostics for monitoring

### 🐛 Production Fixes

#### Billy API Credentials Synchronization

- **Fixed:** Production used wrong organization ID (IQgm5fsl5rJ3Ub33EfAEow)
- **Corrected:** Updated Render Environment Group to Rendetalje (pmf9tU56RoyZdcX3k69z1g)
- **Impact:** Billy auth now returns `valid: true` in production
- **Verification:** All environments now use consistent credentials

#### Audit Log Schema Tolerance

- **Fixed:** `list_audit_logs` failed with "column does not exist" error
- **Solution:** Changed from explicit column selection to `select('*')`
- **Benefit:** Tolerates schema differences between local/production Supabase

### 🎨 Developer Experience

#### Claude Desktop Integration

- **Added:** `claude-desktop-config.json` template
  - MCP server configuration for local development
  - All 28 tools accessible directly in Claude Desktop
  - Supports stdio transport with full environment config

### 📊 Production Validation

- **Tested:** Billy API tools in production
  - `list_customers`: 61 customers retrieved (Anthropic, Cursor, Google, JetBrains, etc.)
  - `list_invoices`: 84 approved invoices, 81 paid (96% payment rate)
  - Response times: 185-363ms (excellent performance)

### 🔧 Technical Changes

- `Dockerfile` - Node 18 → 20 upgrade
- `src/tools/ops.ts` - New operational tools
- `src/http-server.ts` - Ops tools registration
- `claude-desktop-config.json` - Local MCP configuration template

### 📝 Additional Documentation

- **Added:** `VALGFRIE_OPGAVER_COMPLETE.md` - Summary of optional improvements
- **Updated:** Production deployment verified with Node v20.19.5

## [1.4.2] - 2025-10-20

### 🐛 Bug Fixes

#### Invoice State Correction (ChatGPT Discovery)

- **Fixed:** Corrected invoice state enum to match Billy.dk API actual behavior
  - **Before:** `draft | approved | sent | paid | cancelled`
  - **After:** `draft | approved | voided`
  - Billy API only returns these 3 states - `sent`/`paid`/`cancelled` don't exist
- **Fixed:** Revenue calculations now use `isPaid` boolean instead of non-existent `paid` state
- **Fixed:** Added missing fields to `BillyInvoice` type:
  - `isPaid?: boolean` - Payment tracking
  - `balance?: number` - Remaining balance
  - `dueDate?: string` - Payment due date
  - `sentState?: string` - Sent status tracking
- **Impact:** Prevents 404 errors when filtering invoices by invalid states
- **Testing:** Verified against live Billy API - confirmed only `draft`, `approved`, `voided` states exist
- **Credit:** Bug discovered by ChatGPT integration testing

#### List Invoices Response Enhancement

- **Added:** `isPaid` and `balance` fields now included in `list_invoices` tool response
- **Benefit:** Users can now see payment status without calling `get_invoice` for each item

### 📊 Integration Success

- **ChatGPT Integration:** Fully functional with 28 tools
- **Production Validation:** 81 invoices analyzed, 97.5% payment rate confirmed
- **Documentation:** Added invoice status reports and hotfix documentation

### 📝 Documentation

- **Added:** `HOTFIX_INVOICE_STATES.md` - Technical analysis of the bug fix
- **Added:** `INVOICE_STATUS_2025-10-20.md` - Production invoice analysis
- **Added:** `FAKTURA_RAPPORT_2025-10-20.md` - Business intelligence report
- **Added:** `REPO_HEALTH_CHECK_2025-10-20.md` - Repository health analysis

### 🔧 Files Changed

- `src/tools/invoices.ts` - Invoice state enum correction
- `src/types.ts` - BillyInvoice interface enhancement
- `src/billy-client.ts` - Revenue calculation logic fix

## [1.4.1] - 2025-10-14

See `RELEASE_NOTES_v1.4.1.md` for full details.

## [1.1.0] - 2025-10-13

### ✨ Added

#### CI/CD & Automation

- **GitHub Actions CI/CD Pipeline** (`.github/workflows/ci.yml`)

  - Multi-version Node.js testing (18.x, 20.x)
  - TypeScript build validation
  - Integration, production & operations tests
  - Docker build verification
  - npm security audits
  - Build artifact upload

- **Dependabot Configuration** (`.github/dependabot.yml`)

  - Weekly npm dependency scanning
  - GitHub Actions version updates
  - Docker base image updates
  - Automatic PR creation with semantic commits
  - Grouped minor/patch updates

- **CodeQL Security Scanning** (`.github/workflows/codeql.yml`)
  - JavaScript/TypeScript static analysis
  - Weekly scheduled scans (Monday 02:00 UTC)
  - Integration with GitHub Security tab
  - Security-and-quality query suite

#### Monitoring & Observability

- **Sentry Error Tracking Integration** (`src/utils/sentry.ts`)

  - Real-time error monitoring
  - Performance profiling with 10% sampling
  - Automatic PII filtering (API keys, tokens)
  - Breadcrumb tracking for debugging
  - User context enrichment
  - Graceful degradation if not configured

- **Sentry Configuration** (`src/config.ts`)

  - Environment variable schema for Sentry
  - `getSentryConfig()` function
  - Support for development/staging/production environments

- **Error Handling Improvements** (`src/index.ts`)
  - Graceful shutdown handlers (SIGTERM, SIGINT)
  - Uncaught exception tracking
  - Unhandled rejection tracking
  - Sentry event flushing before exit

#### Documentation

- **GitHub Repository Setup Guide** (`docs/GITHUB_REPOSITORY_SETUP.md`)

  - Branch protection rules (detailed)
  - Required status checks configuration
  - Dependabot settings
  - CodeQL activation steps
  - Secret scanning setup
  - Environment configuration

- **Security & DevOps Audit Report** (`SECURITY_DEVOPS_AUDIT_IMPLEMENTATION.md`)

  - Complete audit findings and actions
  - Implementation details for all recommendations
  - Monitoring stack overview
  - Troubleshooting guide
  - Next steps and compliance notes

- **Quick Deployment Guide** (`QUICK_DEPLOYMENT_GUIDE.md`)

  - 5-minute quick start
  - Security feature activation
  - Sentry setup steps
  - Verification checklist

- **Implementation Summary** (`AUDIT_IMPLEMENTATION_SUMMARY.md`)
  - Executive summary
  - Build status
  - File changes overview
  - Next steps for repository owner

#### Status Badges

- CI/CD Pipeline status badge
- CodeQL Security scanning badge
- MIT License badge
- Node.js version badge (≥18.0.0)
- TypeScript version badge (5.3)

### 🔧 Changed

#### Dependencies

- Added `@sentry/node@^7.114.0` for error tracking
- Added `@sentry/profiling-node@^7.114.0` for performance profiling

#### Configuration

- Updated `.env.example` with Sentry configuration variables:

  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT`
  - `SENTRY_TRACES_SAMPLE_RATE`
  - `SENTRY_PROFILES_SAMPLE_RATE`

- Extended `src/config.ts` environment schema:
  - Sentry DSN (optional)
  - Sentry environment (default: production)
  - Sentry sample rates (default: 0.1/10%)

#### README

- Added status badges at top of file
- Updated version to 1.1.0

### 🐛 Fixed

- **TypeScript Compilation Error** in `src/tools/customers.ts`
  - Fixed `email` field in `createCustomerSchema` to be required (not optional)
  - Resolved type mismatch with `CreateCustomerInput` interface

### 🏗️ Infrastructure

#### GitHub Actions Workflows

- Parallel test execution across multiple Node versions
- Caching of npm dependencies for faster builds
- Matrix strategy for scalable testing
- Automatic artifact retention (7 days)

#### Security Scanning

- Automatic dependency vulnerability scanning
- Static code analysis on push/PR
- Scheduled security scans (weekly)
- Secret leak prevention (when enabled in repo settings)

#### Error Monitoring

- Production-ready error tracking
- Performance profiling support
- Automatic sensitive data filtering
- Context-aware error reporting

### 📊 Metrics & Analytics

Added comprehensive monitoring across multiple layers:

- **GitHub Actions**: Build status, test results, security scans
- **Sentry**: Error rates, performance metrics, user context
- **Supabase**: Audit logs, usage metrics, cache analytics

### 🔒 Security Improvements

- Branch protection rules documented
- Required status checks defined
- Dependabot security updates enabled
- CodeQL analysis active
- Secret scanning ready
- PII filtering in error reports

### 📖 Documentation Improvements

- Complete GitHub repository setup guide
- Detailed audit implementation report
- Quick deployment reference
- Implementation summary
- Enhanced troubleshooting documentation

---

## Upgrade Notes

### For Repository Owners

1. **Install new dependencies:**

   ```bash
   npm install
   ```

2. **Build project:**

   ```bash
   npm run build
   ```

3. **Push to GitHub:**

   ```bash
   git push origin main
   ```

4. **Activate GitHub features** (after first workflow run):

   - Branch protection rules
   - Dependabot alerts
   - Secret scanning

5. **Optional: Configure Sentry**
   - Create Sentry project
   - Add `SENTRY_DSN` to environment variables

### For Developers

- No breaking changes
- Sentry is optional (gracefully degrades if not configured)
- All existing functionality preserved
- New error handling improves stability

---

## Compatibility

- **Node.js**: ≥18.0.0 (tested on 18.x and 20.x)
- **TypeScript**: 5.3.0
- **MCP SDK**: 1.20.0
- **Deployment**: Render.com, AWS, Azure, Google Cloud

---

## Migration Guide

No migration required. This is a backward-compatible update that adds new features without breaking existing functionality.

To take advantage of new features:

1. Update dependencies: `npm install`
2. Build project: `npm run build`
3. Optionally configure Sentry in `.env`
4. Enable GitHub security features (see guide)

---

**Full Details**: See `SECURITY_DEVOPS_AUDIT_IMPLEMENTATION.md`
