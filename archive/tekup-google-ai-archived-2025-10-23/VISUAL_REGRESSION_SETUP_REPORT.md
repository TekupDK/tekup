# Visual Regression Testing - Setup Rapport

**Dato**: 6. oktober 2025  
**Status**: Playwright installeret, tests skrevet, mangler auth-løsning

## ✅ Fuldført

### 1. Playwright Installation
- ✅ `@playwright/test` installeret (87 packages)
- ✅ Chromium 141.0.7390.37 browser downloaded (148.9 MB)
- ✅ FFMPEG, Headless Shell, Winldd dependencies installeret

### 2. Test Framework Opsat
**Fil**: `client/playwright.config.ts` (150 linjer)
- ✅ Multi-viewport setup (Desktop, Tablet, Mobile)
- ✅ Auto-start dev server konfiguration
- ✅ Screenshot + video on failure
- ✅ HTML rapport generator
- ✅ Chromium, Mobile Chrome, Tablet projects aktive
- 📝 Firefox/Webkit kommenteret ud (kræver ekstra installation)

### 3. Visual Regression Tests
**Fil**: `client/tests/e2e/visual-regression.spec.ts` (151 linjer)
- ✅ `stabilizePage()` helper function (disabler animations)
- ✅ Dashboard layout tests (desktop/tablet/mobile)
- ✅ Legal pages tests (vilkår, privatlivspolitik)
- ✅ Navigation stability tests (alle kritiske routes)
- ✅ Pixel tolerance: 0.2% (maxDiffPixelRatio: 0.002)
- ✅ Dynamic content masking (dates, toasts)

### 4. CSS Spacing Tests
**Fil**: `client/tests/unit/css-spacing.test.tsx` (258 linjer)
- ✅ Testing Library + jest-dom installeret
- ✅ Design token compliance tests (16-20px spacing)
- ✅ Button padding tests (12px/16px)
- ✅ Form field spacing (8px)
- ✅ Typography line-height (1.5-1.8)
- ✅ Border-radius tests (8px)
- ✅ Grid gap tests (24px)
- ✅ Accessibility tests (focus outlines ≥2px, touch targets ≥44px)
- ✅ Motion sensitivity tests (prefers-reduced-motion)
- ⚠️ Kræver komponenter mounted for at køre

### 5. CI/CD Workflow
**Fil**: `.github/workflows/visual-regression.yml` (63 linjer)
- ✅ GitHub Actions workflow oprettet
- ✅ Pull request + push triggers
- ✅ Production smoke tests (main branch only)
- ✅ Artifact upload (screenshots, reports)
- ✅ 30 dage retention for rapporter
- 📝 Ikke testet endnu (kræver push til GitHub)

### 6. Dokumentation
**Fil**: `client/tests/README.md` (302 linjer)
- ✅ Komplet guide til visual regression testing
- ✅ Quick start instruktioner
- ✅ Troubleshooting sektion
- ✅ Best practices
- ✅ CI/CD integration guide
- ✅ Emergency recovery procedures

### 7. Package Scripts
**Fil**: `client/package.json` (opdateret)
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:visual": "playwright test",
"test:visual:ui": "playwright test --ui",
"test:visual:update": "playwright test --update-snapshots",
"test:visual:report": "playwright show-report"
```

### 8. Test Resultater (Foreløbige)
**Kommando**: `npx playwright test --project=chromium --update-snapshots`

✅ **1 test PASSED**: Privacy page layout (screenshot genereret)
❌ **6 tests FAILED**: Dashboard + Terms + Navigation (auth required)

**Root cause**: Clerk authentication blokkerer alle routes undtagen `/privatlivspolitik` (public route)

## 🚨 Blokkerende Problem: Clerk Authentication

### Symptomer
```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
waiting for locator('text=Oversigt') to be visible
```

**Forklaring**: Playwright bliver redirected til Clerk login page fordi:
1. Dashboard (`/`) kræver auth
2. Terms (`/vilkaar`) kræver auth (hvis ikke eksplicit public)
3. Customers/Leads/Bookings kræver auth

**Bevis**: Privacy page (`/privatlivspolitik`) er ENESTE test der passerede → sandsynligvis markeret som public route

### Løsninger (Prioriteret)

#### Løsning 1: Clerk Test Mode (ANBEFALET) ⭐
```typescript
// playwright.config.ts
use: {
  baseURL: 'http://localhost:5173',
  storageState: 'tests/.auth/user.json', // Pre-authenticated state
},
```

**Setup steps**:
1. Opret `tests/auth.setup.ts` med Clerk login flow
2. Generer `user.json` med valid session
3. Playwright bruger session til alle tests

**Fordele**:
- Tester den faktiske brugeroplevelse
- Validerer auth flow fungerer
- Realistiske screenshots (med user data)

**Ulemper**:
- Kræver test credentials i CI
- Session kan expire (kræver regenerering)

#### Løsning 2: Mock Auth State
```typescript
// tests/e2e/visual-regression.spec.ts
test.beforeEach(async ({ page }) => {
  // Inject mock Clerk session
  await page.addInitScript(() => {
    localStorage.setItem('clerk-session', JSON.stringify({
      userId: 'test-user',
      sessionId: 'mock-session',
      // ... mock session data
    }));
  });
});
```

**Fordele**:
- Ingen reel auth påkrævet
- Hurtigere tests
- Ingen credential management

**Ulemper**:
- Tester ikke reel auth flow
- Kan break hvis Clerk API ændres

#### Løsning 3: Disable Auth for Tests
```typescript
// client/src/App.tsx
if (import.meta.env.MODE === 'test') {
  return <RouterProvider router={router} />; // Skip ClerkProvider
}
```

```ini
# .env.test
VITE_PLAYWRIGHT_MODE=test
```

**Fordele**:
- Simplest setup
- Ingen auth kompleksitet

**Ulemper**:
- Kræver env detection logic
- Ikke samme app som production

#### Løsning 4: Mark Routes as Public
```typescript
// client/src/router/routes.tsx
export const routes = [
  {
    path: "/",
    element: <Dashboard />,
    loader: async () => {
      if (import.meta.env.VITE_PLAYWRIGHT === 'true') {
        return null; // Skip auth check
      }
      // ... normal auth logic
    }
  }
]
```

**Fordele**:
- Minimal kode ændringer
- Bevarer auth i production

**Ulemper**:
- Skal implementeres per route
- Kan glemmes ved nye routes

## 📝 Næste Steps (Prioriteret)

### KRITISK (Blokker)
1. **Implementer Clerk auth solution**
   - Decision: Vælg Løsning 1 (test mode) eller 3 (disable for tests)
   - File: Opret `tests/auth.setup.ts` ELLER opdater `client/src/App.tsx`
   - Test: `npx playwright test --project=chromium` skal passe 7/7 tests

### HIGH (Core Functionality)
2. **Generer baseline screenshots**
   ```powershell
   npx playwright test --update-snapshots
   git add tests/e2e/*.spec.ts-snapshots/
   git commit -m "test: add Playwright visual regression baselines"
   ```

3. **Run CSS spacing tests**
   ```powershell
   npm run test
   ```
   - Expected: 20+ tests passar (spacing, typography, accessibility)

4. **Verify CI/CD workflow**
   ```powershell
   git push origin main
   # Check GitHub Actions tab
   ```

### MEDIUM (Optimization)
5. **Add missing browsers**
   ```powershell
   npx playwright install firefox webkit
   ```
   - Uncomment Firefox/Webkit projects in `playwright.config.ts`

6. **Production smoke tests**
   - Update `visual-regression.spec.ts` with `@production` tags
   - Set `PLAYWRIGHT_BASE_URL=https://tekup-renos-1.onrender.com`
   - Verify SPA routing fixed before running

### LOW (Nice-to-have)
7. **Storybook integration**
   - Standalone component testing
   - Visual regression per component

8. **Lighthouse CI**
   - Performance regression testing
   - Accessibility scoring

## 📊 Metrics

**Filer oprettet**: 6
- `playwright.config.ts`
- `tests/e2e/visual-regression.spec.ts`
- `tests/unit/css-spacing.test.tsx`
- `tests/README.md`
- `.github/workflows/visual-regression.yml`
- `VISUAL_REGRESSION_SETUP_REPORT.md` (denne fil)

**Linjer kode**: 924 linjer
- Test code: 409 linjer (visual 151 + CSS 258)
- Config: 150 linjer
- Documentation: 302 linjer
- CI: 63 linjer

**Dependencies installeret**: 104 packages
- @playwright/test + 87 dependencies
- @testing-library/react + 17 dependencies

**Browser size**: 241.2 MB
- Chromium: 148.9 MB
- FFMPEG: 1.3 MB
- Headless Shell: 91 MB

**Test coverage target**: 100% critical pages
- Dashboard (desktop + tablet + mobile) = 3 tests
- Legal pages (vilkår + privatlivspolitik) = 2 tests
- Navigation (4 routes × layout stability) = 1 test
- Card spacing = 1 test
- **Total**: 7 visual regression tests

**CSS spacing tests**: 9 tests
- Design tokens: 7 tests
- Motion sensitivity: 1 test
- Accessibility: 1 test (focus + touch targets)

## 🔗 Related Files

**Modified**:
- `client/package.json` (scripts added)
- `client/tsconfig.json` (include tests/)
- `client/playwright.config.ts` (Firefox/Webkit commented out)

**Created**:
- `client/tests/e2e/visual-regression.spec.ts`
- `client/tests/unit/css-spacing.test.tsx`
- `client/tests/README.md`
- `.github/workflows/visual-regression.yml`

**Not Created (Pending auth solution)**:
- `client/tests/.auth/user.json`
- `client/tests/auth.setup.ts`

## 💡 Anbefalinger

1. **Auth Solution**: Brug Løsning 1 (Clerk test mode) for mest realistiske tests
2. **Baseline Generation**: Kør når auth fix er deployed
3. **CI/CD**: Enable efter første successful test run lokalt
4. **Documentation**: README i `tests/` er komplet, link til det fra root README
5. **Monitoring**: Setup UptimeRobot alerts hvis visual tests fejler i CI

## 📞 Support

Ved spørgsmål:
- Playwright Docs: <https://playwright.dev>
- Clerk Testing: <https://clerk.com/docs/testing>
- RenOS Tests README: `client/tests/README.md`

---

**Rapport genereret**: 6. oktober 2025  
**Next action**: Implementer auth solution (Decision required fra Jonas/empir)
