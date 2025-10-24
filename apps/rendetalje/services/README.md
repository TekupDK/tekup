# RenOS Platform Services

**Complete cleaning business management platform** for Rendetalje, built with modern full-stack technologies and comprehensive test infrastructure.

## 📦 Services Overview

### Backend (NestJS)
Enterprise-grade REST API with authentication, authorization, and real-time capabilities.

**Stack:** NestJS 10, TypeScript 5, PostgreSQL, Prisma, JWT, Socket.io  
**Location:** `backend-nestjs/`  
**Port:** 3001

### Frontend (Next.js)
Multi-portal interface for owners, employees, and customers.

**Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, React Query  
**Location:** `frontend-nextjs/`  
**Port:** 3000

### Shared Library
Type-safe contracts and utilities shared across services.

**Stack:** TypeScript 5, Zod 3.22, date-fns  
**Location:** `shared/`  
**Package:** `@renos/shared`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS
- Docker Desktop (for test database)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/TekupDK/tekup.git
cd tekup/apps/rendetalje/services

# Install dependencies for all services
npm install
cd backend-nestjs && npm install
cd ../frontend-nextjs && npm install
cd ../shared && npm install
```

### Environment Setup

```bash
# Backend
cp backend-nestjs/.env.example backend-nestjs/.env
# Edit .env with your database credentials

# Frontend
cp frontend-nextjs/.env.example frontend-nextjs/.env
# Edit .env with your API endpoint
```

### Start Development Servers

```bash
# Terminal 1: Backend
cd backend-nestjs
npm run dev

# Terminal 2: Frontend
cd frontend-nextjs
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

---

## 🧪 Testing Infrastructure

### Test Coverage
- ✅ **Backend:** Unit tests + E2E tests with Supertest
- ✅ **Frontend:** Component tests + Page tests + API route tests with Jest + RTL
- ✅ **Shared:** Utilities + Schema validation tests (32/32 passing)
- ✅ **E2E:** Playwright tests for critical user workflows
- ✅ **CI/CD:** GitHub Actions with automated testing and quality gates

### Test Database Setup

```powershell
# Start PostgreSQL + Redis test containers
.\scripts\start-test-db.ps1

# Stop containers (preserve data)
.\scripts\stop-test-db.ps1

# Reset completely (remove volumes)
.\scripts\stop-test-db.ps1 -RemoveVolumes
```

**Test Database Details:**
- PostgreSQL: `postgresql://renos_test:renos_test_password@localhost:5433/renos_test`
- Redis: `redis://:renos_test_redis_password@localhost:6380`
- Seed data: Test users, customers, jobs, and invoices pre-loaded

### Run Tests

```bash
# Backend tests
cd backend-nestjs
npm run lint            # ESLint
npm run test            # Unit tests
npm run test:e2e        # E2E tests
npm run test:cov        # Coverage report

# Frontend tests
cd frontend-nextjs
npm run lint            # ESLint
npm run test            # Unit + component tests
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright E2E tests
npm run test:e2e:ui     # Playwright UI mode
npm run test:e2e:debug  # Playwright debug mode

# Shared library tests
cd shared
npm run lint            # ESLint
npm run test            # All tests
npm run test:coverage   # Coverage with 80% threshold
```

### Playwright E2E Tests

**Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari  
**Test Scenarios:**
- Authentication flow (login, registration, logout, session persistence)
- Job management (create, update, delete, status changes)
- Customer management (CRUD operations, filtering, export)

```bash
cd frontend-nextjs

# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View report
npm run playwright:report
```

### CI/CD Pipeline

GitHub Actions runs on every push/PR to `master` or `develop`:

**Jobs:**
1. **Backend Tests** → Lint → Unit tests → E2E tests → Upload coverage
2. **Frontend Tests** → Lint → Tests → Build → Upload coverage  
3. **Shared Tests** → Lint → Tests → Coverage threshold → Build → Upload coverage
4. **Frontend E2E Tests** → Install Playwright → E2E tests → Upload reports (runs after backend + frontend pass)
5. **Quality Check** → Final verification (depends on all previous jobs)

**View Results:**
- GitHub Actions tab: [https://github.com/TekupDK/tekup/actions](https://github.com/TekupDK/tekup/actions)
- Codecov Dashboard: Coverage tracking per service

---

## 📚 Documentation

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes

---

## 🏗️ Architecture

### Database Schema (PostgreSQL + Prisma)

```
users (owner, employee, customer roles)
  ├─ customers (private/business types)
  │   └─ jobs (window, facade, gutter, pressure_wash)
  │       ├─ job_logs (audit trail)
  │       └─ invoices (draft, sent, paid, overdue)
```

### Authentication Flow
1. User registers/logs in → JWT token issued (1h expiry)
2. Token stored in httpOnly cookie
3. Backend validates JWT on protected routes
4. Frontend uses token for API calls via React Query

### Real-time Features (Socket.io)
- Job status updates
- Employee location tracking
- Customer notifications
- Dashboard live updates

---

## 🔐 Security

- **Authentication:** JWT with refresh tokens
- **Authorization:** Role-based access control (RBAC)
- **Data Validation:** Zod schemas on backend + frontend
- **SQL Injection:** Parameterized queries via Prisma
- **XSS Protection:** React's built-in escaping + Content Security Policy
- **Rate Limiting:** Backend API endpoints protected
- **CORS:** Configured for production domains

---

## 📊 Technology Standards

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime |
| **Backend** | NestJS | 10.0.0 | Enterprise API framework |
| **Frontend** | Next.js | 15.0.0 | React framework with SSR |
| **Language** | TypeScript | 5.1.3 | Type-safe development |
| **Database** | PostgreSQL | 15+ | Primary data store |
| **ORM** | Prisma | 5.0+ | Type-safe database access |
| **Validation** | Zod | 3.22.0 | Runtime type validation |
| **Testing** | Jest | 29.5.0 | Unit + integration tests |
| **E2E Testing** | Playwright | 1.56+ | Browser automation |
| **UI** | Tailwind CSS | 3.3.0 | Utility-first styling |
| **State** | Zustand | 4.4.0 | Lightweight state management |
| **API Client** | React Query | 5.0.0 | Server state management |

---

## 🛠️ Development Workflow

### Branch Strategy
- `master` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### Commit Convention
```
feat(scope): description       # New feature
fix(scope): description        # Bug fix
docs(scope): description       # Documentation
test(scope): description       # Test changes
refactor(scope): description   # Code refactoring
chore(scope): description      # Maintenance
```

### Pre-commit Checklist
- [ ] Tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Documentation updated
- [ ] Environment variables documented

---

## 📦 Package Structure

```
services/
├── backend-nestjs/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management
│   │   ├── customers/     # Customer CRUD
│   │   ├── jobs/          # Job management
│   │   ├── invoices/      # Billing
│   │   └── common/        # Shared utilities
│   ├── test/              # E2E tests
│   └── prisma/            # Database schema
│
├── frontend-nextjs/
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   ├── e2e/               # Playwright tests
│   └── __tests__/         # Jest tests
│
├── shared/
│   ├── src/
│   │   ├── types/         # Shared TypeScript types
│   │   ├── schemas/       # Zod validation schemas
│   │   └── utils/         # Utility functions
│   └── __tests__/         # Unit tests
│
├── scripts/
│   ├── start-test-db.ps1  # Start test database
│   ├── stop-test-db.ps1   # Stop test database
│   └── init-test-db.sql   # Database seed data
│
├── docker-compose.test.yml  # Test database config
├── .env.test                # Test environment vars
└── TESTING.md               # Testing documentation
```

---

## 🚢 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CORS origins whitelisted
- [ ] Rate limiting configured
- [ ] Error tracking enabled (Sentry)
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Development Guidelines:**
- Follow TypeScript strict mode
- Write tests for new features
- Update documentation
- Maintain 80% code coverage
- Use conventional commit messages

---

## 📝 License

Proprietary - Tekup Portfolio © 2025

---

## 🆘 Support

**Issues:** [GitHub Issues](https://github.com/TekupDK/tekup/issues)  
**Documentation:** [docs/](./docs/)  
**Email:** support@tekup.dk

---

## 🎯 Project Status

**Phase:** ✅ Test Infrastructure Complete  
**Version:** 1.0.0  
**Last Updated:** January 2025

### Recent Updates
- ✅ Comprehensive test infrastructure (Jest + Playwright)
- ✅ GitHub Actions CI/CD pipeline
- ✅ Docker test database with seed data
- ✅ 32/32 shared library tests passing
- ✅ E2E tests for authentication, jobs, and customers
- ✅ Codecov integration for coverage tracking

### Next Steps
- 🔜 Component implementation (forms, dashboards, tables)
- 🔜 Real-time features with Socket.io
- 🔜 Mobile app testing infrastructure
- 🔜 Production deployment to cloud

---

**Built with ❤️ by Tekup Portfolio**
