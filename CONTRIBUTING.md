# 🤝 Contributing to Tekup Workspace

Thank you for contributing to Tekup! This document provides guidelines for development.

---

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Git Workflow](#git-workflow)
5. [Testing](#testing)
6. [Documentation](#documentation)
7. [Deployment](#deployment)

---

## 🚀 Development Setup

### **Prerequisites**

- Node.js 18+ and pnpm 8+
- PostgreSQL 14+
- Docker (for local services)
- Git

### **Initial Setup**

```bash
# Navigate to workspace
cd c:\Users\empir\Tekup

# Install dependencies (if monorepo)
pnpm install

# Setup local database
cd apps/production/tekup-database
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d

# Run migrations
pnpm prisma migrate dev
```

### **Project-Specific Setup**

Each project has its own README with setup instructions:

- `apps/production/tekup-vault/README.md`
- `apps/web/rendetalje-os/README.md`
- `services/tekup-ai/README.md`

---

## 📁 Project Structure

```
Tekup/
├── apps/          → Applications (runtime-based)
├── services/      → Backend services & APIs
├── packages/      → Shared libraries
├── tools/         → Development tools
├── scripts/       → Automation scripts
├── configs/       → Shared configurations
├── docs/          → Documentation
└── tests/         → Integration tests
```

**Principle:** Organize by runtime and purpose, not by technology.

---

## 🎨 Coding Standards

### **TypeScript**

- ✅ Use TypeScript strict mode
- ✅ Define interfaces for all data structures
- ✅ Use meaningful variable/function names
- ✅ Add JSDoc comments for public APIs

```typescript
/**
 * Fetch customer by ID from database
 * @param id - Customer ID
 * @returns Promise resolving to Customer object
 */
async function getCustomer(id: string): Promise<Customer> {
  // Implementation
}
```

### **Code Style**

- **Formatter:** Prettier (config in `/configs/prettier`)
- **Linter:** ESLint (config in `/configs/eslint`)
- **Line length:** 100 characters max
- **Indentation:** 2 spaces
- **Quotes:** Single quotes for JS/TS, double for JSON

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

### **Naming Conventions**

- **Files:** `kebab-case.ts`
- **Components:** `PascalCase.tsx`
- **Functions:** `camelCase()`
- **Constants:** `UPPER_SNAKE_CASE`
- **Types/Interfaces:** `PascalCase`

---

## 🔄 Git Workflow

### **Branch Naming**

```
feature/add-customer-api
bugfix/fix-login-redirect
hotfix/critical-security-patch
refactor/improve-database-query
docs/update-api-documentation
```

### **Commit Messages**

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add customer search endpoint
fix: resolve database connection timeout
docs: update API documentation
refactor: simplify authentication logic
test: add unit tests for customer service
chore: update dependencies
```

**Examples:**
```bash
git commit -m "feat(vault): add semantic search endpoint"
git commit -m "fix(billy): resolve invoice duplication bug"
git commit -m "docs(workspace): update README with new structure"
```

### **Pull Request Process**

1. **Create Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test Locally**
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push & Create PR**
   ```bash
   git push origin feature/my-feature
   # Create PR on GitHub
   ```

6. **PR Review**
   - Assign reviewers (see CODEOWNERS)
   - Address review comments
   - Merge when approved

---

## 🧪 Testing

### **Test Structure**

```
project/
├── src/
│   └── customer.service.ts
└── tests/
    ├── unit/
    │   └── customer.service.test.ts
    ├── integration/
    │   └── customer.api.test.ts
    └── e2e/
        └── customer.flow.test.ts
```

### **Running Tests**

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### **Test Coverage Requirements**

- **Unit tests:** 80%+ coverage
- **Integration tests:** Critical paths covered
- **E2E tests:** Main user flows covered

### **Writing Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { getCustomer } from './customer.service';

describe('CustomerService', () => {
  describe('getCustomer', () => {
    it('should return customer when ID exists', async () => {
      const customer = await getCustomer('123');
      expect(customer).toBeDefined();
      expect(customer.id).toBe('123');
    });

    it('should throw error when ID not found', async () => {
      await expect(getCustomer('invalid')).rejects.toThrow();
    });
  });
});
```

---

## 📚 Documentation

### **Code Documentation**

- Add JSDoc comments for public APIs
- Document complex logic with inline comments
- Update README when adding new features

### **API Documentation**

- Use OpenAPI/Swagger for REST APIs
- Document all endpoints, parameters, responses
- Include example requests/responses

### **Architecture Documentation**

- Update `/docs/architecture/` for major changes
- Create ADRs (Architecture Decision Records)
- Document integration points

---

## 🚀 Deployment

### **Local Development**

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start
```

### **Staging Deployment**

- Automatic deployment on push to `develop` branch
- Test thoroughly before merging to `main`

### **Production Deployment**

- Merge to `main` branch
- Automatic deployment via GitHub Actions
- Monitor services after deployment

### **Rollback Procedure**

```bash
# Revert to previous version
git revert <commit-hash>
git push origin main

# Or use platform-specific rollback (Render, etc.)
```

---

## ❓ Questions?

- **Technical questions:** Create GitHub issue
- **Urgent issues:** Create GitHub issue with 'urgent' label
- **Documentation:** Check `/docs/` folder

---

## 📝 Code Review Checklist

Before submitting PR, ensure:

- [ ] Code follows style guide
- [ ] Tests are added/updated
- [ ] Documentation is updated
- [ ] All tests pass
- [ ] No linting errors
- [ ] Commit messages follow convention
- [ ] PR description is clear

---

Thank you for contributing to Tekup! 🚀
