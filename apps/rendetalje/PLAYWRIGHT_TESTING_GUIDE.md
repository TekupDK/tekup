# 🤖 Playwright E2E Testing Guide - Rendetalje v1.2.0

## 📋 Overview

Rendetalje projektet har **Playwright** browser automation indbygget - ingen eksterne AI browsere nødvendigt!

**Test Coverage:**
- ✅ Authentication (login, session persistence)
- ✅ Dashboard (real-time stats, user info)
- ✅ Jobs v2 (filter, search, CRUD, toast notifications)
- ✅ Customers v2 (grid layout, search, full address)
- ✅ Job Management (legacy tests, updated credentials)
- ✅ Customer Management (legacy tests)

## 🚀 Quick Start

### 1. Install Dependencies (if not already installed)

```powershell
cd c:\Users\Jonas-dev\tekup\apps\rendetalje\services\frontend-nextjs
npm install
```

### 2. Start All Services

**Terminal 1 - Database:**
```powershell
cd C:\Users\Jonas-dev\tekup\apps\production\tekup-database
docker-compose up -d
```

**Terminal 2 - Backend:**
```powershell
cd C:\Users\Jonas-dev\tekup\apps\rendetalje\services\backend-nestjs
npm run start:dev
```

**Terminal 3 - Frontend:**
```powershell
cd C:\Users\Jonas-dev\tekup\apps\rendetalje\services\frontend-nextjs
npm run dev
```

### 3. Run Playwright Tests

**Run all tests (headless):**
```powershell
cd C:\Users\Jonas-dev\tekup\apps\rendetalje\services\frontend-nextjs
npm run test:e2e
```

**Run with UI (interactive):**
```powershell
npm run test:e2e:ui
```

**Run in headed mode (see browser):**
```powershell
npm run test:e2e:headed
```

**Debug mode (step through tests):**
```powershell
npm run test:e2e:debug
```

**Run specific test file:**
```powershell
npx playwright test e2e/dashboard.spec.ts
```

**Run specific test by name:**
```powershell
npx playwright test -g "should display dashboard with real-time stats"
```

## 📁 Test Files

```
e2e/
├── auth.spec.ts              # Login, logout, session tests
├── dashboard.spec.ts         # NEW - Dashboard real-time stats
├── jobs-v2.spec.ts           # NEW - Jobs page with filters
├── customers-v2.spec.ts      # NEW - Customers grid layout
├── job-management.spec.ts    # Legacy job tests (updated)
└── customer-management.spec.ts # Legacy customer tests
```

## 🧪 Test Scenarios

### Dashboard Tests (dashboard.spec.ts)
- Display real-time stats from backend
- Show user info in header
- Verify stat cards have real data
- Handle loading states
- Navigate to jobs/customers
- Error handling
- Mobile responsiveness

### Jobs v2 Tests (jobs-v2.spec.ts)
- Display filter dropdown
- Filter by status (pending, in_progress, completed)
- Search by title/description
- Create job with customer dropdown
- Validate required fields
- Display status badges
- Edit job title
- Delete job with confirmation
- Show loading state
- Handle empty list
- Mobile responsiveness

### Customers v2 Tests (customers-v2.spec.ts)
- Display grid layout (3 columns)
- Search by name/email
- Create customer with full address
- CVR validation (8 digits)
- Display email/phone as clickable links
- Edit customer details
- Delete with confirmation
- Show customer count
- Handle empty list
- Responsive grid (1 column on mobile)

### Authentication Tests (auth.spec.ts)
- Display login page
- Validate empty form
- Invalid email format
- Login with admin credentials
- Session persistence after reload
- Logout functionality
- Navigate to registration
- Register new user
- Password mismatch validation

## 📊 Running Tests in Different Browsers

**Chromium only:**
```powershell
npx playwright test --project=chromium
```

**Firefox only:**
```powershell
npx playwright test --project=firefox
```

**WebKit (Safari) only:**
```powershell
npx playwright test --project=webkit
```

**Mobile Chrome:**
```powershell
npx playwright test --project="Mobile Chrome"
```

**All browsers:**
```powershell
npm run test:e2e
```

## 📸 Reports and Screenshots

**View last test report:**
```powershell
npm run playwright:report
```

**Test artifacts saved to:**
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML report

## 🐛 Debugging Failed Tests

### Option 1: Debug Mode
```powershell
npm run test:e2e:debug
```
- Opens Playwright Inspector
- Step through tests line by line
- Inspect DOM, console, network

### Option 2: Headed Mode
```powershell
npm run test:e2e:headed
```
- See browser while tests run
- Good for visual debugging

### Option 3: Screenshot Analysis
```powershell
# Run test and capture screenshot on failure
npx playwright test --screenshot=on

# View screenshots in test-results/
```

### Option 4: Trace Viewer
```powershell
# Run with trace enabled
npx playwright test --trace=on

# View trace
npx playwright show-trace test-results/[test-name]/trace.zip
```

## ⚙️ Configuration

**Edit `playwright.config.ts` to change:**
- Base URL (default: `http://localhost:3000`)
- Timeout (default: 30 seconds)
- Retries (CI: 2, local: 0)
- Workers (CI: 1, local: auto)
- Browsers to test

**Environment Variables:**
```powershell
# Custom base URL
$env:PLAYWRIGHT_TEST_BASE_URL = "http://localhost:3001"
npm run test:e2e

# CI mode (enables retries)
$env:CI = "true"
npm run test:e2e
```

## 🔄 CI/CD Integration

**GitHub Actions example:**
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: docker-compose up -d
      - run: npm run start:dev &
      - run: npm run dev &
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📝 Writing New Tests

**Create new test file:**
```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@rendetalje.dk');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should do something', async ({ page }) => {
    await page.goto('http://localhost:3001/my-feature');
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

**Run your new test:**
```powershell
npx playwright test e2e/my-feature.spec.ts
```

## 🎯 Best Practices

1. **Use data-testid attributes:**
   ```tsx
   <div data-testid="job-card">...</div>
   ```
   ```typescript
   await page.locator('[data-testid="job-card"]').click();
   ```

2. **Wait for navigation:**
   ```typescript
   await page.waitForURL('**/dashboard');
   ```

3. **Handle timeouts:**
   ```typescript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

4. **Use meaningful test names:**
   ```typescript
   test('should create new job with valid customer data', ...);
   ```

5. **Clean up test data:**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Delete test job
   });
   ```

## 🚨 Common Issues

### Issue: "Target closed" or "Browser disconnected"
**Fix:** Increase timeout in `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60 seconds
```

### Issue: "Element not found"
**Fix:** Add explicit wait:
```typescript
await page.waitForSelector('[data-testid="element"]');
```

### Issue: "Test flakiness"
**Fix:** Add strategic waits:
```typescript
await page.waitForTimeout(1000); // Wait 1 second
await page.waitForLoadState('networkidle');
```

### Issue: "Port 3000 already in use"
**Fix:** Change base URL in config or kill process:
```powershell
Get-Process -Name node | Stop-Process
```

## 📚 Resources

- **Playwright Docs:** https://playwright.dev/
- **Selectors Guide:** https://playwright.dev/docs/selectors
- **Best Practices:** https://playwright.dev/docs/best-practices
- **VS Code Extension:** Playwright Test for VSCode

## 🎉 Ready to Test!

Nu kan I teste hele systemet automatisk uden eksterne AI browsere. Playwright kører i jeres eget miljø med fuld kontrol.

**Start testen:**
```powershell
cd c:\Users\Jonas-dev\tekup\apps\rendetalje\services\frontend-nextjs
npm run test:e2e:ui
```

Held og lykke! 🚀
