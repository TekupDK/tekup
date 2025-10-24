# RenOS Test Infrastructure

## Automated Testing

All RenOS services have comprehensive test coverage with automated CI/CD pipelines.

### Test Coverage

- ✅ **Backend (@renos/backend)**: NestJS + Jest + Supertest
  - Unit tests for services and controllers
  - E2E tests for API endpoints
  - Integration tests with database mocking
  
- ✅ **Frontend (@renos/frontend)**: Next.js + Jest + React Testing Library
  - Component tests with user interactions
  - Page rendering tests
  - API route tests
  
- ✅ **Shared (@renos/shared)**: Jest + ts-jest
  - Validation utility tests
  - Schema validation tests
  - Formatting utility tests
  - 80% minimum coverage threshold

### Running Tests Locally

**Backend:**
```bash
cd apps/rendetalje/services/backend-nestjs
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # E2E tests
```

**Frontend:**
```bash
cd apps/rendetalje/services/frontend-nextjs
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

**Shared Library:**
```bash
cd apps/rendetalje/services/shared
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### CI/CD Pipeline

GitHub Actions automatically runs all tests on:
- Push to `master` or `develop` branches
- Pull requests to `master` or `develop`
- Changes in `apps/rendetalje/**` paths

**Pipeline Jobs:**
1. **backend-tests**: Linting, unit tests, E2E tests
2. **frontend-tests**: Linting, tests, build verification
3. **shared-tests**: Linting, tests, coverage thresholds, build
4. **quality-check**: Final verification that all tests passed

### Coverage Reports

Coverage reports are automatically uploaded to Codecov:
- Backend: `backend-coverage`
- Frontend: `frontend-coverage`
- Shared: `shared-coverage`

View coverage at: https://codecov.io/gh/TekupDK/tekup

### Test Structure

**Backend Tests:**
```
backend-nestjs/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts
│   ├── customers/
│   │   └── customers.service.spec.ts
│   └── ...
└── test/
    ├── app.e2e-spec.ts
    ├── auth.e2e-spec.ts
    ├── jest-e2e.json
    └── setup.ts
```

**Frontend Tests:**
```
frontend-nextjs/
├── __tests__/
│   ├── api/
│   │   └── auth/
│   │       └── login.test.ts
│   └── page.test.tsx
├── src/
│   └── components/
│       └── __tests__/
│           └── LoginForm.test.tsx
├── jest.config.js
└── jest.setup.js
```

**Shared Tests:**
```
shared/
├── src/
│   └── utils/
│       └── __tests__/
│           ├── formatting.test.ts
│           ├── validation.test.ts
│           └── schemas.test.ts
└── jest.config.js
```

### Quality Standards

**All tests must:**
- ✅ Pass consistently without flakiness
- ✅ Test both success and error scenarios
- ✅ Mock external dependencies appropriately
- ✅ Maintain >80% code coverage (shared library)
- ✅ Follow testing best practices from official docs

**Test Patterns:**
- Unit tests: Test individual functions/methods
- Integration tests: Test component interactions
- E2E tests: Test complete user workflows
- Component tests: Test UI rendering and interactions

### Continuous Integration

**On every commit:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (cached)
4. Run linters
5. Run all tests with coverage
6. Build applications
7. Upload coverage reports
8. Verify quality gates

**Pull Request Requirements:**
- ✅ All tests must pass
- ✅ Linting must pass
- ✅ Build must succeed
- ✅ Coverage must meet thresholds
- ✅ Code review approval required

### Next Steps

- [ ] Add Playwright/Cypress for E2E testing
- [ ] Setup test database with Docker
- [ ] Add visual regression testing
- [ ] Implement performance testing
- [ ] Add security scanning in CI

---

**Last Updated:** October 24, 2025
**Test Infrastructure Version:** 1.0.0