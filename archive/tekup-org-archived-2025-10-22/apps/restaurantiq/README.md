# RestaurantIQ 🍽️

**AI-Powered Restaurant Intelligence SaaS for Danish Market**

RestaurantIQ is an innovative, standalone AI-driven SaaS platform designed to revolutionize Danish restaurant operations through intelligent inventory forecasting, staff scheduling optimization, and menu profitability analysis.

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **Docker & Docker Compose**
- **PostgreSQL 16** (via Docker)
- **Redis** (via Docker)

### Development Setup

1. **Clone and navigate to the project**:
   ```bash
   cd C:\Users\empir\Tekup-org\apps\restaurantiq
   ```

2. **Environment Configuration**:
   ```bash
   # Environment file is already created
   # Review and update .env if needed
   ```

3. **Start the development environment**:
   ```bash
   # Start all services (PostgreSQL, Redis, pgAdmin)
   docker-compose up -d
   ```

4. **Verify services are running**:
   ```bash
   docker-compose ps
   ```

### Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| PostgreSQL | 5432 | localhost:5432 | Primary database |
| Redis | 6379 | localhost:6379 | Caching & sessions |
| pgAdmin | 5050 | http://localhost:5050 | Database management |

### Database Access

**pgAdmin Credentials**:
- Email: `admin@restaurantiq.dev`
- Password: `admin123`

**PostgreSQL Connection**:
- Host: `localhost` (or `postgres` from containers)
- Port: `5432`
- Database: `restaurantiq_dev`
- Username: `restaurantiq_user`
- Password: `restaurantiq_password`

## 🏗️ Architecture

### Project Structure

```
restaurantiq/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── models/            # Data models
│   │   ├── middleware/        # Custom middleware
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript types
│   ├── tests/                 # Backend tests
│   ├── migrations/            # Database migrations
│   └── seeders/              # Test data
├── frontend/                  # Next.js 14+ Frontend
│   ├── src/
│   │   ├── app/              # App Router (Next.js 14+)
│   │   ├── components/       # React components
│   │   ├── lib/              # Utility libraries
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # Frontend types
│   └── public/               # Static assets
├── shared/                   # Shared code
│   ├── types/                # Common TypeScript types
│   └── utils/                # Shared utilities
├── docker/                   # Docker configurations
│   ├── backend/              # Backend Dockerfile
│   ├── frontend/             # Frontend Dockerfile
│   └── postgres/             # PostgreSQL configs
└── docs/                     # Documentation
    └── api/                  # API documentation
```

### Technology Stack

**Backend**:
- **Node.js 20** with TypeScript
- **Express.js** for API framework
- **PostgreSQL 16** for primary database
- **Redis 7** for caching and sessions
- **Prisma** or **Knex.js** for database ORM

**Frontend**:
- **Next.js 14+** with App Router
- **React 18** for UI components
- **Tailwind CSS 4.1** with futuristic design system
- **TypeScript** for type safety

**Infrastructure**:
- **Docker** for containerization
- **Docker Compose** for local development
- **Nginx** for reverse proxy (production)

## 🎯 Core Features (Planned)

### Phase 1: MVP (Months 1-4)
- ✅ **Development Environment Setup**
- ✅ **Docker Configuration**
- ✅ **Database Schema Design**
- ✅ **Authentication System**
- ✅ **Multi-tenant Architecture**
- 🔄 **Basic Inventory Management**
- 🔄 **Simple Staff Scheduling**
- 🔄 **Menu Management**
- 🔄 **Basic Analytics Dashboard**

### Phase 2: AI Integration (Months 5-8)
- 📅 **AI Demand Forecasting**
- 📅 **Weather API Integration**
- 📅 **Advanced Scheduling Algorithms**
- 📅 **Menu Profitability Analysis**
- 📅 **POS System Integrations**

### Phase 3: Market Features (Months 9-12)
- 📅 **Danish Labor Law Compliance**
- 📅 **MobilePay Integration**
- 📅 **e-conomic/Dinero Integration**
- 📅 **Advanced Analytics**
- 📅 **Multi-location Support**

## 🛠️ Development Workflow

### Setting up the Backend

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies** (when package.json exists):
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run database migrations** (when available):
   ```bash
   npm run migrate
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Setting up the Frontend

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies** (when package.json exists):
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Database Management

**Run migrations**:
```bash
# When migration system is setup
npm run db:migrate
```

**Seed test data**:
```bash
# When seeder system is setup
npm run db:seed
```

**Reset database**:
```bash
# When available
npm run db:reset
```

### Docker Commands

**Start all services**:
```bash
docker-compose up -d
```

**Stop all services**:
```bash
docker-compose down
```

**View logs**:
```bash
docker-compose logs -f [service_name]
```

**Rebuild containers**:
```bash
docker-compose build --no-cache
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test              # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage    # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### E2E Testing
```bash
npm run test:e2e         # End-to-end tests
```

## 🔐 Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# Application
NODE_ENV=development
PORT=4000
FRONTEND_PORT=3000

# Database
DATABASE_URL=postgresql://restaurantiq_user:restaurantiq_password@localhost:5432/restaurantiq_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret

# Danish Localization
DEFAULT_LOCALE=da-DK
DEFAULT_TIMEZONE=Europe/Copenhagen
DEFAULT_CURRENCY=DKK
```

## 🌍 Danish Market Focus

RestaurantIQ is specifically designed for the Danish market with:

- **Danish Language Support** (da-DK)
- **MobilePay Integration** (Primary payment method)
- **Arbejdsmiljølov Compliance** (Labor law compliance)
- **CVR Integration** (Danish business registry)
- **e-conomic/Dinero/Billy** (Popular Danish accounting systems)
- **Danish Timezone & Currency** (DKK, Europe/Copenhagen)

## 📊 Business Model

### Target Market
- **Small to Medium Danish Restaurants** (5-50 employees)
- **Restaurant Chains** (2-20 locations)
- **Food Trucks & Cafés**

### Value Proposition
- **25-40% food waste reduction** through AI forecasting
- **15-30% labor cost optimization** with smart scheduling
- **10-25% profit margin improvement** via menu analytics

### Pricing Strategy
- **Starter**: 399 DKK/month per location
- **Professional**: 799 DKK/month per location  
- **Enterprise**: 1,499 DKK/month per location

## 🤝 Integration Strategy

### Tekup Ecosystem Integration
RestaurantIQ is designed as a **standalone-first** platform with future Tekup ecosystem integration:

- **Phase 1**: Independent operation and market validation
- **Phase 2**: SSO integration with Tekup platform
- **Phase 3**: Unified billing and cross-platform features
- **Phase 4**: Full ecosystem benefits and shared user base

## 📈 Development Roadmap

### Current Status: ✅ Foundation Phase
- [x] Project structure and Docker environment
- [x] Database design and configuration  
- [x] Environment setup and documentation
- [x] Full feature product plan completed

### Next Steps:
1. **Backend API Development** (Month 1-2)
2. **Frontend Dashboard** (Month 2-3)
3. **Core Feature Implementation** (Month 3-4)
4. **AI Integration** (Month 5-6)

## 📞 Support & Contribution

### Getting Help
- Review this README and documentation
- Check the issues in the repository
- Review the full product plan in `docs/RESTAURANTIQ_FULL_FEATURE_PRODUCT_PLAN.md`

### Development Guidelines
- Use TypeScript for all new code
- Follow Danish localization practices
- Maintain comprehensive test coverage
- Document API changes
- Follow security best practices for GDPR compliance

## 📄 License

This project is part of the Tekup ecosystem and follows internal licensing guidelines.

---

**RestaurantIQ - Transforming Danish Restaurant Operations with AI** 🍽️🤖

*For detailed feature specifications, architecture details, and business strategy, see `docs/RESTAURANTIQ_FULL_FEATURE_PRODUCT_PLAN.md`*
