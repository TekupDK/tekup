# Internal Sales Tracking System

> A unified sales management platform for Tekup's three business units: Rendetalje (cleaning services), Tekup (IT consulting), and Foodtruck Fiesta (catering services).

[![Status](https://img.shields.io/badge/status-ready%20for%20development-blue)]()
[![Timeline](https://img.shields.io/badge/timeline-16%20weeks-green)]()
[![Tech Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20NestJS-orange)]()

---

## 📖 Overview

This is an **internal operational tool** (NOT a SaaS product) designed to replace manual spreadsheet-based sales tracking with a modern, automated system. The platform centralizes sales data across all three Tekup business units while maintaining logical data separation.

### The Problem We're Solving

- ❌ Sales tracked manually in disconnected spreadsheets
- ❌ No unified view of business performance
- ❌ Leads falling through cracks due to poor follow-up
- ❌ Time-consuming manual invoice creation in Billy.dk
- ❌ Customer relationship history scattered across systems
- ❌ Reporting requires manual data gathering

### Our Solution

- ✅ Centralized sales database with multi-organization support
- ✅ Automated Billy.dk invoice generation
- ✅ Lead-to-sale conversion tracking
- ✅ Real-time sales pipeline visibility
- ✅ Complete customer relationship history
- ✅ Data-driven analytics and reporting
- ✅ 50%+ reduction in administrative time

---

## 🎯 Key Features

### Core Functionality

- **Sales Management**: Create, track, and manage sales from quote to payment
- **Customer Database**: Centralized customer information with full history
- **Lead Tracking**: Capture, qualify, and convert leads to sales
- **Service Catalog**: Manage service offerings per organization
- **Invoice Automation**: Auto-generate Billy.dk invoices on sale completion
- **Calendar Integration**: Auto-create Google Calendar events for scheduled services
- **Analytics Dashboard**: Real-time KPIs, trends, and performance metrics
- **Multi-Organization**: Support for all three business units with data isolation

### User Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **ADMIN** | Full system access, user management | System administrators |
| **SALES_MANAGER** | View all sales, manage team, access reports | Team leads |
| **SALES_REP** | Create/edit own sales, view assigned data | Frontline staff |
| **VIEWER** | Read-only access to data | Executives, analysts |

---

## 🏗️ Architecture

### Technology Stack

**Frontend**
- Next.js 15 (React 18, App Router)
- TypeScript 5
- Tailwind CSS + Shadcn/ui
- TanStack Query + Zustand

**Backend**
- NestJS 10 (Node.js 20)
- TypeScript 5
- Prisma ORM
- PostgreSQL 15 (Supabase)
- Redis 7 (caching)

**Infrastructure**
- Hosting: Render.com (Frankfurt, EU)
- Database: Supabase (managed PostgreSQL)
- CI/CD: GitHub Actions
- Monitoring: Sentry

### System Architecture

```
┌─────────────────────────────────────────────┐
│         Users (Desktop/Mobile/Tablet)       │
└────────────────┬────────────────────────────┘
                 │ HTTPS
┌────────────────┼────────────────────────────┐
│         Next.js Frontend (Render)           │
│  Dashboard | Sales | Customers | Reports    │
└────────────────┬────────────────────────────┘
                 │ REST API
┌────────────────┼────────────────────────────┐
│         NestJS Backend (Render)             │
│  Auth | Sales | Customers | Integrations    │
└────────────────┬────────────────────────────┘
                 │ Prisma ORM
┌────────────────┼────────────────────────────┐
│      PostgreSQL Database (Supabase)         │
│  Organizations | Sales | Customers | Leads  │
└─────────────────────────────────────────────┘
```

---

## 📚 Documentation

Comprehensive documentation is available in separate files:

### For Executives & Stakeholders
- **[Executive Summary](./SALES_TRACKING_EXECUTIVE_SUMMARY.md)** - Business case, ROI, and strategic benefits
  - Problem statement and solution overview
  - Investment analysis and timeline
  - Success metrics and risk assessment

### For Developers
- **[Implementation Plan](./SALES_TRACKING_IMPLEMENTATION_PLAN.md)** - Complete development checklist (2,233 lines)
  - 91 detailed coding tasks across 4 phases
  - Code examples and file structures
  - Testing and deployment procedures
  
- **[Quick Start Guide](./SALES_TRACKING_QUICK_START.md)** - Get up and running in 15 minutes
  - Environment setup
  - Development workflow
  - Common commands and troubleshooting

- **[API Specification](./SALES_TRACKING_API_SPECIFICATION.md)** - Complete REST API reference
  - All endpoints with examples
  - Authentication and authorization
  - Request/response formats

- **[Technical Architecture](./SALES_TRACKING_TECHNICAL_ARCHITECTURE.md)** - System design documentation
  - Component architecture diagrams
  - Data flow patterns
  - Security and scalability strategies

### Quick Links

| Document | Purpose | Audience |
|----------|---------|----------|
| [Executive Summary](./SALES_TRACKING_EXECUTIVE_SUMMARY.md) | Business overview, ROI | Leadership, Stakeholders |
| [Implementation Plan](./SALES_TRACKING_IMPLEMENTATION_PLAN.md) | Coding checklist | Developers |
| [Quick Start Guide](./SALES_TRACKING_QUICK_START.md) | Developer onboarding | New developers |
| [API Specification](./SALES_TRACKING_API_SPECIFICATION.md) | API reference | Frontend/Backend devs |
| [Technical Architecture](./SALES_TRACKING_TECHNICAL_ARCHITECTURE.md) | System design | Tech leads, Architects |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- PostgreSQL (via Supabase account)
- Docker (optional, for local development)

### Quick Setup (15 Minutes)

```bash
# 1. Create Supabase project at supabase.com
#    - Choose Frankfurt region
#    - Save database credentials

# 2. Clone repository
git clone https://github.com/tekup/sales-tracking.git
cd sales-tracking

# 3. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# 4. Setup frontend (in new terminal)
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev

# 5. Access application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
# Login: admin@rendetalje.dk / temp123
```

For detailed setup instructions, see [Quick Start Guide](./SALES_TRACKING_QUICK_START.md).

---

## 📅 Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
✅ Database schema and backend API  
✅ Frontend core functionality  
✅ Rendetalje pilot launch  

### Phase 2: Expansion (Weeks 5-8)
✅ Lead management features  
✅ Multi-organization support  
✅ Tekup & Foodtruck Fiesta onboarding  

### Phase 3: Automation (Weeks 9-12)
✅ Billy.dk invoice automation  
✅ Google Calendar integration  
✅ Email notifications  

### Phase 4: Analytics (Weeks 13-16)
✅ Executive dashboard  
✅ Advanced reports  
✅ Performance optimization  

**Total Timeline**: 16 weeks to production launch

---

## 🎨 User Interface Preview

### Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  Tekup Sales Tracking              [Notifications] 👤   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Revenue  │ │ Sales    │ │ Leads    │ │ Conv.Rate│   │
│  │ 125k DKK │ │ 45 Total │ │ 23 New   │ │ 68%      │   │
│  │ ↑ 12%    │ │ ↑ 5      │ │ ↓ 3      │ │ ↑ 5%     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│  Sales Pipeline                                         │
│  LEAD(12) → QUOTE(8) → ACCEPTED(15) → COMPLETED(10)    │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌─────────────────────────┐   │
│  │ Recent Activity    │  │ Revenue Trend           │   │
│  │ • New sale created │  │      ╱╲                 │   │
│  │ • Lead converted   │  │     ╱  ╲      ╱╲        │   │
│  │ • Payment received │  │    ╱    ╲    ╱  ╲       │   │
│  └────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security

- **Authentication**: JWT-based with 24-hour expiration
- **Authorization**: Role-based access control (RBAC)
- **Data Isolation**: Organization-based row-level security
- **Encryption**: TLS 1.3 for data in transit
- **Audit Logging**: All data changes tracked
- **Backups**: Automated daily backups
- **Compliance**: EU data residency (Frankfurt)

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report

# Frontend tests
cd frontend
npm run test              # Component tests
npm run test:watch        # Watch mode
```

### Test Coverage Target

- Backend: 80%+ coverage
- Frontend: 70%+ coverage
- Critical paths: 100% coverage

---

## 📊 Success Metrics

### Key Performance Indicators

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Sales logged in system | 0% | 95%+ | Week 4 |
| Time to create sale | 10-15 min | < 2 min | Week 4 |
| Invoice automation | 0% | 90%+ | Week 12 |
| Missed follow-ups | ~30% | < 5% | Week 12 |
| Lead conversion rate | Unknown | +10% | Month 6 |
| Admin time savings | 0% | 50%+ | Month 6 |

---

## 🛠️ Development

### Project Structure

```
tekup-sales-tracking/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # Authentication
│   │   ├── sales/       # Sales management
│   │   ├── customers/   # Customer management
│   │   ├── leads/       # Lead tracking
│   │   └── ...
│   ├── prisma/          # Database schema
│   └── test/            # Tests
│
├── frontend/            # Next.js frontend
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utilities
│   └── hooks/           # Custom hooks
│
├── docs/                # Documentation
│   ├── EXECUTIVE_SUMMARY.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── API_SPECIFICATION.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── QUICK_START.md
│
└── README.md            # This file
```

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/sales-module

# Make changes and test
npm run test

# Commit with conventional commits
git commit -m "feat: add sales CRUD operations"

# Push and create PR
git push origin feature/sales-module
```

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Add or update tests
- `chore:` Maintenance tasks

---

## 🚢 Deployment

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3000/3001 | Local development |
| Staging | staging.tekup-sales.dk | Pre-production testing |
| Production | sales.tekup.dk | Live system |

### Deployment Process

```bash
# Automated via GitHub Actions

# On push to main:
1. Run tests
2. Build Docker images
3. Deploy to Render.com
4. Run smoke tests
5. Notify team
```

---

## 💰 Cost Breakdown

### Infrastructure Costs (Annual)

| Service | Cost/Month | Cost/Year |
|---------|------------|-----------|
| Render.com (Backend + Frontend) | €75-125 | €900-1,500 |
| Supabase (Database) | €25-50 | €300-600 |
| Redis (Cache) | €10-25 | €120-300 |
| **Total** | **€110-200** | **€1,320-2,400** |

### Development Investment

- Timeline: 16 weeks
- Team: 1-2 full-stack developers
- Ongoing maintenance: 4-8 hours/month

**ROI**: Expected within 6-12 months based on time savings

---

## 🤝 Contributing

This is an internal project for Tekup. Development is coordinated through:

- **Planning**: Weekly sprint planning
- **Code Review**: Pull requests required
- **Testing**: Automated + manual QA
- **Documentation**: Keep docs updated with changes

---

## 📞 Support

### For Users
- **Training**: Video tutorials + user guide
- **Support**: support@tekup.dk
- **Slack**: #sales-tracking channel

### For Developers
- **Documentation**: See docs/ folder
- **Issues**: GitHub Issues
- **Questions**: dev@tekup.dk

---

## 📜 License

Internal use only - Tekup proprietary software.

---

## 🙏 Acknowledgments

- Built with technologies from the Tekup portfolio
- Integrates with existing Billy.dk and RenOS systems
- Designed with input from all three business units

---

## 📈 Roadmap

### Current: v1.0 (Weeks 1-16)
Core functionality for all three business units

### Future: v1.1 (Months 4-6)
- Mobile app
- Advanced reporting
- Document storage
- SMS notifications

### Vision: v2.0 (Year 2)
- AI-powered lead scoring
- Customer portal
- White-label SaaS offering
- International expansion

---

## ❓ FAQ

**Q: Is this a SaaS product to sell to customers?**  
A: No, this is an internal tool for Tekup's own use across three business units.

**Q: Can we customize it for specific needs?**  
A: Yes! As we own the code, customization is fully supported.

**Q: What happens to our current data?**  
A: Migration scripts will transfer existing data safely.

**Q: How long until we see ROI?**  
A: Expected 6-12 months based on 50%+ time savings in sales admin.

**Q: Is our customer data secure?**  
A: Yes, enterprise-grade security with encryption, backups, and EU hosting.

---

**Version**: 1.0  
**Last Updated**: 2025-10-18  
**Status**: Ready for Development  
**Contact**: dev@tekup.dk

---

**Built with ❤️ by the Tekup Development Team**
