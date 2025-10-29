# RendetaljeOS - Quick Start Execution Guide

**Start Coding Today - Practical Implementation Steps**

## 🎯 TODAY'S PRIORITIES (Day 1)

### Priority 1: Repository Stabilization (60 minutes)

#### Backend Cleanup

```powershell
# Navigate to backend
cd C:\Users\empir\RendetaljeOS\apps\backend

# Check status
git status

# Review uncommitted files
git diff

# Commit changes in logical groups
git add src/agents/
git commit -m "feat(agents): improve intent classification accuracy"

git add src/services/email.service.ts
git commit -m "fix(email): handle edge cases in email parsing"

git add src/services/billy.service.ts
git commit -m "feat(billy): add invoice sync improvements"

# Push all commits
git push origin main
```

#### Frontend Cleanup

```powershell
cd C:\Users\empir\RendetaljeOS\apps\frontend

# Check current branch
git branch

# If on feature/frontend-redesign
git status
git add .
git commit -m "feat(ui): complete dashboard redesign"

# Test before merging
pnpm dev
# Visit http://localhost:3000 and test

# If all works, merge to main
git checkout main
git merge feature/frontend-redesign
git push origin main
```

---

### Priority 2: Testing Setup (90 minutes)

#### Backend Testing Infrastructure

**Step 1: Install Dependencies**
```powershell
cd C:\Users\empir\RendetaljeOS\apps\backend

pnpm add -D vitest @vitest/ui @vitest/coverage-v8
pnpm add -D @playwright/test
pnpm add -D @types/supertest supertest
```

**Step 2: Create Vitest Config**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3: Create Test Directory Structure**
```powershell
mkdir tests
mkdir tests\unit
mkdir tests\integration
mkdir tests\e2e
```

**Step 4: Create Setup File**
```typescript
// tests/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});
```

**Step 5: Write First Test**
```typescript
// tests/unit/services/email.service.test.ts
import { describe, it, expect } from 'vitest';
import { EmailService } from '@/services/email.service';

describe('EmailService', () => {
  it('should extract customer email from Gmail message', () => {
    const message = {
      from: 'kunde@example.dk',
      subject: 'Forespørgsel om rengøring',
      body: 'Jeg vil gerne have et tilbud'
    };
    
    const service = new EmailService();
    const email = service.extractEmail(message.from);
    
    expect(email).toBe('kunde@example.dk');
  });
  
  it('should classify booking intent correctly', async () => {
    const message = {
      subject: 'Book cleaning for tomorrow',
      body: 'Can I book a cleaning for tomorrow at 2pm?'
    };
    
    const service = new EmailService();
    const intent = await service.classifyIntent(message);
    
    expect(intent).toBe('BOOKING_REQUEST');
  });
});
```

**Step 6: Add Test Scripts**
```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

**Step 7: Run Tests**
```powershell
pnpm test
```

---

### Priority 3: Sentry Activation (45 minutes)

#### Backend Sentry Setup

**Step 1: Check if Sentry is Installed**
```powershell
cd C:\Users\empir\RendetaljeOS\apps\backend
pnpm list @sentry/node
```

**Step 2: If Not Installed, Add It**
```powershell
pnpm add @sentry/node @sentry/profiling-node
```

**Step 3: Configure Sentry**
```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || '1.0.0',
    
    tracesSampleRate: 1.0, // 100% in dev, lower in prod
    profilesSampleRate: 1.0,
    
    integrations: [
      new ProfilingIntegration(),
    ],
    
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error?.message?.includes('ECONNREFUSED')) {
          // Don't send connection errors during development
          return null;
        }
      }
      return event;
    },
  });
}
```

**Step 4: Initialize in App**
```typescript
// src/index.ts or src/app.ts
import { initSentry } from './config/sentry';

// Initialize Sentry FIRST
initSentry();

// Then rest of app
import express from 'express';
const app = express();

// ... rest of setup

// Sentry error handler (must be AFTER all routes)
app.use(Sentry.Handlers.errorHandler());
```

**Step 5: Test Error Capture**
```typescript
// Add a test route temporarily
app.get('/test-error', (req, res) => {
  throw new Error('Sentry test error - please ignore');
});

// Or use Sentry.captureException
Sentry.captureException(new Error('Test error'));
```

**Step 6: Add to Environment Variables**
```env
# .env
SENTRY_DSN=https://your-dsn@o12345.ingest.sentry.io/67890
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

#### Frontend Sentry Setup

**Step 1: Install**
```powershell
cd C:\Users\empir\RendetaljeOS\apps\frontend
pnpm add @sentry/nextjs
```

**Step 2: Run Sentry Wizard**
```powershell
npx @sentry/wizard@latest -i nextjs
```

**Step 3: Configure Next.js Integration**
```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  tracesSampleRate: 1.0,
  
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

**Step 4: Test Frontend Error**
```typescript
// Add button to trigger test error
<button onClick={() => {
  throw new Error('Frontend Sentry test');
}}>
  Test Sentry
</button>
```

#### Mobile Sentry Setup

**Step 1: Install**
```powershell
cd C:\Users\empir\Tekup-Cloud\RendetaljeOS-Mobile
npm install sentry-expo
```

**Step 2: Configure in app.json**
```json
{
  "expo": {
    "plugins": [
      [
        "sentry-expo",
        {
          "organization": "your-org",
          "project": "rendetalje-mobile"
        }
      ]
    ]
  }
}
```

**Step 3: Initialize**
```typescript
// app/_layout.tsx
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: false,
});
```

**Step 4: Test**
```typescript
Sentry.Native.captureException(new Error('Mobile test error'));
```

---

### Priority 4: Health Check Endpoint (30 minutes)

**Create Health Check Route**
```typescript
// apps/backend/src/routes/health.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
  
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = { status: 'error', message: error.message };
  }
  
  try {
    // Gmail API check (if configured)
    if (process.env.GOOGLE_CLIENT_ID) {
      // Add actual Gmail API test here
      checks.gmail = { status: 'ok' };
    }
  } catch (error) {
    checks.gmail = { status: 'error', message: error.message };
  }
  
  try {
    // Calendar API check
    if (process.env.GOOGLE_CLIENT_ID) {
      // Add actual Calendar API test here
      checks.calendar = { status: 'ok' };
    }
  } catch (error) {
    checks.calendar = { status: 'error', message: error.message };
  }
  
  const allHealthy = Object.values(checks)
    .filter(v => typeof v === 'object' && 'status' in v)
    .every(v => v.status === 'ok');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks
  });
});

export default router;
```

**Register Route**
```typescript
// src/app.ts
import healthRouter from './routes/health';

app.use('/api', healthRouter);
```

**Test**
```powershell
# Start backend
pnpm dev

# Test in another terminal
curl http://localhost:3001/api/health
```

---

## 📋 WEEK 1 DAILY CHECKLIST

### Monday (Today)

- [x] Read implementation plan
- [ ] Complete repository cleanup (backend + frontend)
- [ ] Install testing dependencies
- [ ] Create first unit test
- [ ] Activate Sentry (backend)
- [ ] Create health check endpoint

### Tuesday

- [ ] Write 5 critical unit tests
- [ ] Set up Playwright for E2E testing
- [ ] Activate Sentry (frontend + mobile)
- [ ] Test error reporting end-to-end
- [ ] Set up uptime monitoring (UptimeRobot)

### Wednesday

- [ ] Write integration tests for AI agent workflow
- [ ] Test email lead → auto-response flow
- [ ] Test booking creation → calendar sync
- [ ] Document test coverage gaps
- [ ] Create CI/CD pipeline (GitHub Actions)

### Thursday

- [ ] Achieve 40% backend test coverage
- [ ] Write frontend component tests
- [ ] Test Billy.dk integration
- [ ] Review and fix any critical bugs found
- [ ] Update CHANGELOG.md

### Friday

- [ ] Code review and cleanup
- [ ] Update documentation
- [ ] Demo testing framework to team
- [ ] Plan Week 2 tasks
- [ ] Deploy to staging and test

---

## 🚀 QUICK COMMANDS REFERENCE

### Development

```powershell
# Start backend dev server
cd C:\Users\empir\RendetaljeOS\apps\backend
pnpm dev

# Start frontend dev server
cd C:\Users\empir\RendetaljeOS\apps\frontend
pnpm dev

# Start mobile app
cd C:\Users\empir\Tekup-Cloud\RendetaljeOS-Mobile
npm start
```

### Testing

```powershell
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

### Database

```powershell
cd C:\Users\empir\RendetaljeOS\apps\backend

# Generate Prisma types
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Open Prisma Studio
pnpm prisma studio
```

### Git

```powershell
# Create feature branch
git checkout -b feature/booking-widget

# Commit changes
git add .
git commit -m "feat(widget): add booking widget component"

# Push branch
git push -u origin feature/booking-widget

# Merge to main
git checkout main
git merge feature/booking-widget
git push
```

---

## 🎯 SUCCESS CRITERIA FOR WEEK 1

By end of week, you should have:

- ✅ Clean git history with all changes committed
- ✅ Testing framework operational
- ✅ 10+ unit tests passing
- ✅ 2+ E2E smoke tests passing
- ✅ Sentry capturing errors in all 3 apps
- ✅ Health check endpoint deployed
- ✅ Uptime monitoring active
- ✅ Test coverage > 30% (backend)

---

## 📞 NEED HELP?

### Common Issues

**Issue**: Prisma errors when running tests
**Solution**: Create separate test database
```env
DATABASE_URL_TEST=postgresql://user:pass@localhost:5432/rendetalje_test
```

**Issue**: Sentry not capturing errors
**Solution**: Check DSN is set and Sentry initialized before app code

**Issue**: Tests failing due to missing env vars
**Solution**: Create `.env.test` file with test credentials

**Issue**: Mobile app won't start
**Solution**:
```powershell
cd C:\Users\empir\Tekup-Cloud\RendetaljeOS-Mobile
npm install
npx expo start --clear
```

---

## 🎉 CELEBRATION POINTS

After each completed priority, take a moment to:

1. Commit your work
2. Document what you learned
3. Update the checklist
4. Take a 5-minute break

**Remember**: Progress over perfection. Get it working, then make it better.

---

**Ready to start? Begin with Priority 1: Repository Stabilization**

Good luck! 🚀
