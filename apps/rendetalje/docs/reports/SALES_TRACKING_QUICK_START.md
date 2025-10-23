# Sales Tracking System - Developer Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Git** ([Download](https://git-scm.com/))
- **Docker** (optional, for containerized development)
- **PostgreSQL** client (optional, for database access)
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - Prisma
  - REST Client

## Quick Setup (15 Minutes)

### Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in details:
   - **Name**: `tekup-sales-tracking`
   - **Database Password**: Generate and save securely
   - **Region**: `Europe (Frankfurt)`
4. Wait for provisioning (2-3 minutes)
5. Copy your connection string from Settings > Database

### Step 2: Clone and Setup Backend (5 minutes)

```bash
# Create project directory
mkdir tekup-sales-tracking
cd tekup-sales-tracking

# Initialize git
git init
git remote add origin https://github.com/tekup/sales-tracking.git

# Create backend directory
mkdir backend
cd backend

# Initialize NestJS project
npx @nestjs/cli new . --skip-git

# Install dependencies
npm install @prisma/client @nestjs/config @nestjs/jwt @nestjs/passport
npm install passport-jwt bcrypt class-validator class-transformer
npm install @supabase/supabase-js redis
npm install -D prisma @types/bcrypt @types/passport-jwt

# Initialize Prisma
npx prisma init
```

### Step 3: Configure Environment (2 minutes)

Create `.env` file in `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"

# App
NODE_ENV="development"
PORT=3000

# Redis (optional for development)
REDIS_URL="redis://localhost:6379"

# Billy.dk Integration
BILLY_API_URL="https://billy-api.tekup.dk"
BILLY_API_KEY="your-billy-api-key"

# Google Calendar
GOOGLE_CALENDAR_API_KEY="your-google-calendar-key"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@tekup.dk"
SMTP_PASS="your-smtp-password"
```

### Step 4: Setup Database Schema (3 minutes)

Copy the Prisma schema from the implementation plan into `prisma/schema.prisma`, then run:

```bash
# Generate Prisma Client
npx prisma generate

# Create database migration
npx prisma migrate dev --name init

# Open Prisma Studio to verify
npx prisma studio
```

### Step 5: Create Seed Data

Create `prisma/seed.ts` (copy from implementation plan), then:

```bash
# Add to package.json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}

# Run seed
npx prisma db seed
```

## Backend Development Workflow

### Start Development Server

```bash
cd backend
npm run start:dev
```

Backend will be available at `http://localhost:3000`

### Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── sales/             # Sales management
│   ├── customers/         # Customer management
│   ├── services/          # Service catalog
│   ├── leads/             # Lead management (Phase 2)
│   ├── common/            # Shared utilities
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── utils/
│   ├── database/          # Prisma service
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── test/
└── package.json
```

### Creating a New Module

```bash
# Generate module, controller, and service
nest generate module sales
nest generate controller sales
nest generate service sales

# Or all at once
nest generate resource sales --no-spec
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Common Development Tasks

**Add a new Prisma model:**
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_new_model`
3. Run `npx prisma generate`

**Access database directly:**
```bash
npx prisma studio
```

**Reset database (CAUTION):**
```bash
npx prisma migrate reset
```

## Frontend Development Workflow

### Setup Frontend (5 minutes)

```bash
# From project root
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend

# Install dependencies
npx shadcn-ui@latest init
npm install @tanstack/react-query axios zustand
npm install react-hook-form zod @hookform/resolvers
npm install date-fns recharts lucide-react
```

### Add Shadcn Components

```bash
npx shadcn-ui@latest add button card input table dialog form select badge dropdown-menu tabs
```

### Configure Environment

Create `.env.local` in `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=Tekup Sales Tracking
```

### Start Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:3001`

### Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── leads/
│   │   └── reports/
│   └── layout.tsx
├── components/
│   ├── ui/               # Shadcn components
│   ├── sales/
│   ├── customers/
│   └── dashboard/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
├── hooks/
└── types/
```

### Creating a New Page

```bash
# Create directory
mkdir -p app/(dashboard)/reports

# Create page file
touch app/(dashboard)/reports/page.tsx
```

Example page:
```typescript
export default function ReportsPage() {
  return (
    <div>
      <h1>Reports</h1>
    </div>
  );
}
```

## Testing Your Implementation

### 1. Test Authentication

```bash
# Using curl
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rendetalje.dk","password":"temp123"}'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@rendetalje.dk",
    "name": "Rendetalje Admin"
  }
}
```

### 2. Test Create Sale

```bash
# Save token from login response
TOKEN="your-jwt-token"

curl -X POST http://localhost:3000/api/v1/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-uuid",
    "serviceId": "service-uuid",
    "status": "QUOTE_SENT",
    "saleDate": "2025-10-18T10:00:00Z",
    "quotedAmount": 1000,
    "finalAmount": 1000,
    "source": "EMAIL"
  }'
```

### 3. Test Frontend Login

1. Navigate to `http://localhost:3001/login`
2. Enter credentials: `admin@rendetalje.dk` / `temp123`
3. Should redirect to dashboard
4. Verify JWT token stored in localStorage

## Development Best Practices

### Code Style

**Backend (NestJS):**
- Use dependency injection
- Keep controllers thin (business logic in services)
- Use DTOs for validation
- Write unit tests for services

**Frontend (Next.js):**
- Use server components by default
- Add 'use client' only when needed
- Keep components small and focused
- Use custom hooks for data fetching

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/sales-module

# Make changes and commit
git add .
git commit -m "feat: implement sales CRUD operations"

# Push to remote
git push origin feature/sales-module

# Create pull request on GitHub
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Add tests
- `chore:` Maintenance

### Debugging

**Backend:**
```typescript
// Add console.log or use debugger
console.log('Sale data:', sale);

// Or use NestJS Logger
import { Logger } from '@nestjs/common';
private readonly logger = new Logger(SalesService.name);
this.logger.debug('Processing sale', sale);
```

**Frontend:**
```typescript
// React DevTools
console.log('State:', state);

// React Query DevTools (already included)
// Check bottom-right corner for query inspector
```

**VS Code Debugging:**
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

## Common Issues & Solutions

### Issue: Prisma Client Not Found

```bash
# Solution
npx prisma generate
```

### Issue: Database Connection Failed

Check:
1. DATABASE_URL is correct
2. Supabase project is running
3. Network allows connection to Supabase

```bash
# Test connection
npx prisma db pull
```

### Issue: CORS Error in Frontend

Update `main.ts` in backend:
```typescript
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
});
```

### Issue: JWT Token Invalid

Check:
1. JWT_SECRET matches between login and validation
2. Token hasn't expired
3. Token is sent in correct header format: `Bearer {token}`

### Issue: npm Install Fails

```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Docker Development (Optional)

### Backend Dockerfile

Create `backend/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
```

### Docker Compose

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

**Start with Docker:**
```bash
docker-compose up
```

## API Testing with REST Client (VS Code)

Create `test.http` file:
```http
### Login
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@rendetalje.dk",
  "password": "temp123"
}

### Set token (replace with actual token from login)
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Get Sales
GET http://localhost:3000/api/v1/sales
Authorization: Bearer {{token}}

### Create Sale
POST http://localhost:3000/api/v1/sales
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "customerId": "uuid",
  "serviceId": "uuid",
  "status": "QUOTE_SENT",
  "saleDate": "2025-10-18T10:00:00Z",
  "quotedAmount": 1000,
  "finalAmount": 1000,
  "source": "EMAIL"
}
```

## Performance Monitoring

### Backend

Install monitoring packages:
```bash
npm install @sentry/node @sentry/profiling-node
```

Configure in `main.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Frontend

```bash
npm install @sentry/nextjs
```

Run setup:
```bash
npx @sentry/wizard@latest -i nextjs
```

## Database Management

### Backup Database

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Or via pg_dump
pg_dump $DATABASE_URL > backup.sql
```

### View Logs

**Supabase Dashboard:**
1. Go to Logs section
2. Select "Database" logs
3. Filter by error level

**Backend Logs:**
```bash
# Follow logs
npm run start:dev | tee logs.txt
```

## Next Steps

1. ✅ Complete Phase 1 tasks from implementation plan
2. ✅ Write unit tests for each module
3. ✅ Test API endpoints with Postman/REST Client
4. ✅ Build frontend components
5. ✅ Integrate frontend with backend API
6. ✅ Conduct end-to-end testing
7. ✅ Deploy to staging environment
8. ✅ User acceptance testing
9. ✅ Production deployment

## Useful Commands Cheat Sheet

### Backend
```bash
npm run start:dev          # Start development server
npm run start:debug        # Start with debugger
npm run build              # Build for production
npm run start:prod         # Run production build
npm run test               # Run tests
npm run test:watch         # Watch mode for tests
npm run lint               # Lint code
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create new migration
npx prisma db seed         # Seed database
```

### Frontend
```bash
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Lint code
npx shadcn-ui add button   # Add Shadcn component
```

### Docker
```bash
docker-compose up          # Start all services
docker-compose down        # Stop all services
docker-compose logs -f     # Follow logs
docker-compose ps          # List services
docker-compose exec backend sh  # Shell into backend
```

### Git
```bash
git status                 # Check status
git add .                  # Stage all changes
git commit -m "message"    # Commit changes
git push                   # Push to remote
git pull                   # Pull from remote
git checkout -b branch     # Create new branch
git merge branch           # Merge branch
```

## Learning Resources

### NestJS
- [Official Documentation](https://docs.nestjs.com/)
- [NestJS Fundamentals Course](https://courses.nestjs.com/)

### Next.js
- [Official Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)

### Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Support

For questions or issues:
- 📧 Email: dev@tekup.dk
- 💬 Slack: #sales-tracking-dev
- 📖 Documentation: See implementation plan
- 🐛 Bug Reports: Create GitHub issue

---

**Last Updated**: 2025-10-18  
**Version**: 1.0  
**Maintained by**: Tekup Development Team
