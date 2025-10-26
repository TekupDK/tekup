# TekUp CRM API - Danish Cleaning Industry

Backend API for the Danish cleaning industry job scheduling system. This is a multi-tenant SaaS platform built with Node.js, Express, and PostgreSQL.

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **Validation**: Joi + Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Multi-Tenant Design
- Tenant isolation at database level
- Shared schema with `tenant_id` foreign keys
- Row-level security for data access
- Tenant-specific configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp env.example .env

# Configure database URL in .env
DATABASE_URL="postgresql://username:password@localhost:5432/tekup_crm_cleaning"

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed database with Danish cleaning industry data
pnpm db:seed

# Start development server
pnpm dev
```

## 📊 Database Schema

### Core Entities

#### Tenants
Multi-tenant SaaS platform tenants for Danish cleaning companies
- CVR number validation
- Danish address fields
- Subscription tiers (basic, professional, enterprise)

#### Customers
Customers with Danish business requirements
- Commercial, residential, public, hospitality segments
- Danish postal code validation
- Contract management
- Cleaning preferences

#### Cleaning Jobs
Core job scheduling for Danish cleaning industry
- 10 job types (kontorrenhold, privatrenhold, etc.)
- Danish time zones and holidays
- Cost calculation in DKK
- Quality control integration

#### Team Members
Cleaning team with Danish certifications
- Role-based access (team leader, cleaner, specialist, trainee)
- Danish cleaning skills and certifications
- Availability management
- Hourly rates in DKK

#### Routes
Route optimization for Danish addresses
- Postal code-based routing
- Travel time calculations
- Fuel cost optimization
- Danish business hours

### Danish Business Logic

#### Postal Code Validation
```typescript
// Validates Danish 4-digit postal codes
DanishBusinessUtils.isValidPostalCode("2100") // true
DanishBusinessUtils.getCityFromPostalCode("2100") // "København"
```

#### Holiday Management
```typescript
// Checks Danish holidays
DanishBusinessUtils.isDanishHoliday(new Date("2025-12-25")) // true
```

#### Phone Number Formatting
```typescript
// Formats Danish phone numbers
DanishBusinessUtils.formatDanishPhone("12345678") // "+45 12 34 56 78"
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Tenants
- `GET /api/tenants` - List tenants (admin only)
- `POST /api/tenants` - Create tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/locations` - Get customer locations

### Cleaning Jobs
- `GET /api/jobs` - List cleaning jobs
- `POST /api/jobs` - Create cleaning job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/assign` - Assign team members
- `POST /api/jobs/:id/complete` - Mark job as completed

### Team Management
- `GET /api/team` - List team members
- `POST /api/team` - Add team member
- `GET /api/team/:id` - Get team member details
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Remove team member
- `GET /api/team/:id/availability` - Get availability

### Route Optimization
- `GET /api/routes` - List routes
- `POST /api/routes` - Create route
- `GET /api/routes/:id` - Get route details
- `PUT /api/routes/:id` - Update route
- `POST /api/routes/optimize` - Optimize routes

### Analytics
- `GET /api/analytics/metrics` - Get scheduling metrics
- `GET /api/analytics/revenue` - Get revenue analytics
- `GET /api/analytics/performance` - Get performance metrics

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 📝 Database Management

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Create new migration
pnpm db:migrate

# Deploy migrations to production
pnpm db:migrate:deploy

# Reset database (development only)
pnpm db:reset

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed
```

## 🔒 Security

### Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token refresh mechanism

### Multi-Tenant Security
- Tenant isolation at database level
- Row-level security policies
- Tenant-specific data access
- Audit logging for all operations

### Input Validation
- Joi schema validation
- SQL injection prevention
- XSS protection
- Rate limiting

## 📈 Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance metrics

### Metrics
- Job completion rates
- Customer satisfaction scores
- Team utilization
- Route efficiency

## 🌍 Danish Localization

### Business Rules
- Danish postal code validation
- CVR number validation
- Danish phone number formatting
- Holiday calendar integration
- Business hours (Danish time zone)

### Cleaning Industry Standards
- Standard job durations
- Hourly rates in DKK
- Required certifications
- Safety regulations
- Environmental requirements

## 🚀 Deployment

### Docker
```bash
# Build Docker image
docker build -t tekup-crm-api .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables
See `env.example` for all required environment variables.

### Production Checklist
- [ ] Database migrations deployed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

## 📚 API Documentation

API documentation is available at `/api-docs` when `SWAGGER_ENABLED=true`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@tekup.org
- Documentation: https://docs.tekup.org
- Issues: GitHub Issues

---

**TekUp.org** - Unified Platform for Danish Cleaning Industry