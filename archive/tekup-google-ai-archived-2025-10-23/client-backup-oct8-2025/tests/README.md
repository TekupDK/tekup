# RenOS Visual Regression Testing

Automated UI stability testing med Playwright screenshot-diffs + CSS spacing assertions.

## 📋 Oversigt

**Test-typer:**
- **Visual Regression**: Pixel-perfect screenshot-sammenligning (tolerance: 0.2% = 1-2px per 1000px)
- **CSS Spacing**: Design token-validering (margins, padding, gaps, line-heights)
- **Accessibility**: WCAG 2.1 compliance (focus outlines, touch targets, motion sensitivity)

**Viewports:**
- Desktop: 1440×900 (standard)
- Tablet: 1024×768 (iPad Pro)
- Mobile: 390×844 (iPhone 13)

## 🚀 Quick Start

### 1. Installer dependencies (hvis ikke allerede gjort)
```powershell
cd client
npm install
```

### 2. Kør tests lokalt
```powershell
# Alle visual regression tests
npx playwright test

# Med UI mode (interaktiv)
npx playwright test --ui

# Kun én specific test
npx playwright test visual-regression.spec.ts

# Update screenshots (VIGTIGT: Kør når design ændres)
npx playwright test --update-snapshots

# CSS spacing tests (Vitest)
npm run test
```

### 3. Se testresultater
```powershell
# HTML rapport
npx playwright show-report

# Screenshot diffs
start test-results/
```

## 📸 Visual Regression Workflow

### Første gang (baseline generation)
```powershell
# 1. Sikr at lokalt dev kører
npm run dev

# 2. Generer baseline screenshots
npx playwright test --update-snapshots

# 3. Commit baselines til Git
git add tests/e2e/*.spec.ts-snapshots/
git commit -m "test: add Playwright visual regression baselines"
```

### Daglig brug
```powershell
# 1. Før du ændrer CSS/UI
npx playwright test  # ← Skal PASSE

# 2. Lav dine UI-ændringer
# ... edit App.css, components, etc.

# 3. Kør tests igen
npx playwright test  # ← Vil FEJLE hvis pixel-diff > 0.2%

# 4. Se diffs visuelt
npx playwright show-report

# 5a. Hvis diff er OK (intentionel ændring):
npx playwright test --update-snapshots
git add tests/e2e/*.spec.ts-snapshots/
git commit -m "test: update baselines after UI redesign"

# 5b. Hvis diff er BUG (utilsigtet ændring):
# ... fix CSS bug
npx playwright test  # ← Skal PASSE igen
```

## 🎯 Test Coverage

### Visual Regression Tests (`tests/e2e/visual-regression.spec.ts`)

**Dashboard:**
- ✅ Full page layout (desktop/tablet/mobile)
- ✅ Card grid spacing
- ✅ Responsive breakpoints
- ✅ Dynamic content masking (dates, toasts)

**Legal Pages:**
- ✅ `/vilkaar` - Full page screenshot
- ✅ `/privatlivspolitik` - Full page screenshot

**Navigation:**
- ✅ All critical routes (`/`, `/customers`, `/leads`, `/bookings`)
- ✅ No layout shift on load
- ✅ Consistent header/footer

### CSS Spacing Tests (`tests/unit/css-spacing.test.tsx`)

**Design Tokens:**
- ✅ Card title-to-content gap: 16-20px
- ✅ Button padding: 12px/16px (vertical/horizontal)
- ✅ Form field spacing: 8px
- ✅ Grid gaps: 24px
- ✅ Border radius: 8px
- ✅ Container max-width: 1440px

**Typography:**
- ✅ Line-height ratio: 1.5-1.8

**Accessibility:**
- ✅ Focus outline width: ≥2px (WCAG 2.1)
- ✅ Touch target size: ≥44×44px (WCAG 2.1)
- ✅ Motion sensitivity: `prefers-reduced-motion` support

## ⚙️ Configuration

### `playwright.config.ts`
```typescript
{
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    'chromium', 'firefox', 'webkit', // Desktop browsers
    'mobile-chrome', 'mobile-safari', // Mobile
    'tablet' // iPad
  ]
}
```

### Environment Variables
```ini
# .env (for local testing)
PLAYWRIGHT_BASE_URL=http://localhost:5173

# For production testing
PLAYWRIGHT_BASE_URL=https://tekup-renos-1.onrender.com
```

## 🔧 Troubleshooting

### Problem: "Expected image mismatch"
**Årsag**: CSS/UI ændring har ændret layout mere end 0.2%

**Løsning:**
```powershell
# 1. Se diffs visuelt
npx playwright show-report

# 2. Hvis ændring er OK:
npx playwright test --update-snapshots

# 3. Hvis ændring er bug:
# ... fix CSS, re-test
```

### Problem: Tests fejler på CI men passerer lokalt
**Årsag**: Font rendering eller OS-specifikke forskelle

**Løsning:**
```typescript
// playwright.config.ts
use: {
  // Disable font anti-aliasing variations
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  hasTouch: false,
}
```

### Problem: "Timed out waiting for selector"
**Årsag**: Langsom netværk eller server ikke klar

**Løsning:**
```powershell
# Øg timeout
npx playwright test --timeout=30000

# Eller i test:
await page.waitForSelector('text=Oversigt', { timeout: 15000 });
```

### Problem: Dynamic content forstyrrer screenshots
**Årsag**: Timestamps, API data, etc. ændrer sig mellem runs

**Løsning:**
```typescript
// Mask dynamic elements
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.locator('[data-time]'),
    page.locator('.toast'),
    page.locator('[data-testid="dynamic-date"]')
  ]
});
```

## 🎨 Best Practices

### DO ✅
- **Update baselines EFTER design review**: Kun commit intentionelle ændringer
- **Disable animations**: Brug `stabilizePage()` helper for konsistente screenshots
- **Mask dynamic content**: Timestamps, toasts, loading spinners
- **Test multiple viewports**: Desktop, tablet, mobile
- **Run before deploy**: Sikr ingen utilsigtede UI bugs

### DON'T ❌
- **Commit broken screenshots**: Altid verify diffs før commit
- **Skip baseline updates**: Giver false failures på næste run
- **Test med animations**: Giver flakende tests (animations never samme frame)
- **Hardcode baseURL**: Brug environment variables
- **Ignore warnings**: Font smoothing differences kan være symptom på større problem

## 📊 CI/CD Integration

### GitHub Actions (`.github/workflows/visual-regression.yml`)

**Local Tests (alle branches):**
```yaml
on: [push, pull_request]
jobs:
  test:
    - npm ci
    - npx playwright install --with-deps chromium
    - npx playwright test
    - Upload artifacts (reports, screenshots)
```

**Production Smoke Tests (main branch):**
```yaml
jobs:
  production-smoke-test:
    needs: test
    if: github.ref == 'refs/heads/main'
    env:
      PLAYWRIGHT_BASE_URL: https://tekup-renos-1.onrender.com
    - npx playwright test --grep @production
```

### Artifacts
- **HTML reports**: 30 dage retention
- **Failed screenshots**: 7 dage retention
- Download via GitHub Actions UI → Artifacts

## 📝 Adding New Tests

### 1. Add new visual regression test
```typescript
// tests/e2e/your-feature.spec.ts
import { test, expect } from '@playwright/test';

test('your feature layout is stable', async ({ page }) => {
  await page.goto('/your-feature');
  await page.waitForSelector('text=Your Feature Title');
  
  await expect(page).toHaveScreenshot('your-feature.png', {
    maxDiffPixelRatio: 0.002,
    animations: 'disabled',
  });
});
```

### 2. Generate baseline
```powershell
npx playwright test your-feature.spec.ts --update-snapshots
```

### 3. Commit
```powershell
git add tests/e2e/your-feature.spec.ts
git add tests/e2e/your-feature.spec.ts-snapshots/
git commit -m "test: add visual regression for your feature"
```

## 📚 Resources

- **Playwright Docs**: <https://playwright.dev>
- **WCAG 2.1**: <https://www.w3.org/WAI/WCAG21/quickref/>
- **Testing Library**: <https://testing-library.com/react>
- **RenOS Docs**: `../docs/`

## 🚨 Emergency: All tests failing

```powershell
# 1. Verify dev server is running
npm run dev

# 2. Clear Playwright cache
npx playwright install --force

# 3. Delete old screenshots
Remove-Item -Recurse tests/e2e/*.spec.ts-snapshots/

# 4. Regenerate baselines
npx playwright test --update-snapshots

# 5. Re-commit
git add tests/e2e/*.spec.ts-snapshots/
git commit -m "test: regenerate baselines after Playwright update"
```

---

**Kontakt**: Jonas (@JonasAbde) eller empir (AI agent setup)
**Sidst opdateret**: 6. oktober 2025
