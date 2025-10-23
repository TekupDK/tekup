# Contributing Guide

Vejledning til at bidrage til Tekup Database projektet.

---

## 🎯 Development Workflow

### 1. Setup Development Environment

```bash
# Clone repository
git clone https://github.com/TekupDK/tekup.git
cd tekup/apps/production/tekup-database

# Install dependencies
pnpm install

# Start Docker containers
docker-compose up -d

# Generate Prisma Client
pnpm db:generate

# Push schema to database
pnpm db:push

# Verify setup
pnpm db:health
pnpm test
```

### 2. Create Feature Branch

```bash
git checkout -b feature/din-feature-navn
```

### 3. Make Changes

- Write code
- Add tests
- Update documentation
- Run tests: `pnpm test`
- Check health: `pnpm db:health`

### 4. Commit Changes

```bash
git add .
git commit -m "feat: beskrivelse af ændring"
```

**Commit Message Format:**
- `feat:` - Ny funktionalitet
- `fix:` - Bug fix
- `docs:` - Dokumentation
- `test:` - Tests
- `chore:` - Maintenance
- `refactor:` - Code refactoring

### 5. Push and Create PR

```bash
git push origin feature/din-feature-navn
```

---

## 📝 Code Standards

### TypeScript

```typescript
// ✅ Good
export async function createDocument(data: DocumentInput): Promise<Document> {
  return prisma.vaultDocument.create({ data });
}

// ❌ Bad
export async function createDocument(data: any) {
  return prisma.vaultDocument.create({ data });
}
```

### Prisma Models

```prisma
// ✅ Good - Clear naming, proper indexes
model VaultDocument {
  id        String   @id @default(cuid())
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  @@index([createdAt])
  @@schema("vault")
}

// ❌ Bad - No indexes, unclear naming
model Doc {
  id   String
  data String
}
```

### Client Functions

```typescript
// ✅ Good - Clear, documented, typed
/**
 * Find documents by source and repository
 * @param filters - Search filters
 * @returns Array of documents
 */
export async function findDocuments(filters?: {
  source?: string;
  repository?: string;
  limit?: number;
}): Promise<VaultDocument[]> {
  // Implementation
}

// ❌ Bad - No docs, unclear
export async function find(f: any) {
  // Implementation
}
```

---

## 🧪 Testing

### Write Tests for All New Features

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renos } from '../src/client/renos';

describe('RenosLead', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should create lead with valid data', async () => {
    const lead = await renos.createLead({
      source: 'website',
      email: 'test@example.com',
    });

    expect(lead.id).toBeDefined();
    expect(lead.source).toBe('website');
  });
});
```

### Run Tests Before Committing

```bash
pnpm test
```

---

## 📚 Documentation

### Update Documentation for Changes

**Always update:**
- README.md (if adding major features)
- API_REFERENCE.md (for new client methods)
- SCHEMA_DESIGN.md (for schema changes)
- CHANGELOG.md (all changes)

### Code Comments

```typescript
// ✅ Good - Explains WHY
// Using cosine similarity for semantic search
// because it normalizes for document length
const similarity = calculateCosineSimilarity(a, b);

// ❌ Bad - Explains WHAT (obvious from code)
// Calculate cosine similarity
const similarity = calculateCosineSimilarity(a, b);
```

---

## 🗄️ Database Changes

### Adding New Schema

1. **Add to `prisma/schema.prisma`:**
```prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  
  @@schema("appropriate_schema")
}
```

2. **Generate migration:**
```bash
pnpm prisma migrate dev --name add_new_model
```

3. **Create client helper:**
```typescript
// src/client/schema-name.ts
export const schemaClient = {
  async findAll() {
    return prisma.newModel.findMany();
  },
};
```

4. **Add tests**
5. **Update documentation**

### Modifying Existing Schema

1. **Test on staging first**
2. **Backup database**
3. **Create migration**
4. **Test migration**
5. **Deploy to production**

---

## 🔍 Code Review Checklist

### Before Submitting PR

- [ ] All tests pass
- [ ] Code follows style guide
- [ ] No console.log (use logger)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No secrets in code
- [ ] Migrations tested
- [ ] Health check passes

### For Reviewers

- [ ] Code is clear and maintainable
- [ ] Tests are comprehensive
- [ ] Documentation is accurate
- [ ] No security issues
- [ ] Performance considerations
- [ ] Error handling is proper

---

## 🚀 Release Process

### Versioning (Semantic Versioning)

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.2.0`
4. Push tag: `git push origin v1.2.0`
5. Create GitHub release
6. Deploy to production

---

## 💡 Tips

### Performance

- Use indexes for frequently queried fields
- Batch operations when possible
- Use transactions for multi-step operations
- Monitor query performance

### Security

- Never commit secrets
- Use environment variables
- Validate all inputs
- Sanitize user data
- Use parameterized queries (Prisma does this)

### Maintainability

- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic
- Use TypeScript types
- Write tests

---

## 🤝 Getting Help

- **Questions:** Open GitHub Discussion
- **Bugs:** Open GitHub Issue
- **Documentation:** Check `/docs` folder
- **Examples:** Check `/examples` folder

---

## 📋 Issue Templates

### Bug Report

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce

**Expected behavior**
What should happen

**Environment**
- OS: [Windows/Mac/Linux]
- Node version:
- Database version:

**Additional context**
Any other relevant information
```

### Feature Request

```markdown
**Feature description**
Clear description of the feature

**Use case**
Why is this needed?

**Proposed solution**
How should it work?

**Alternatives considered**
Other approaches you've thought about
```

---

## 🎉 Recognition

Contributors will be added to:
- README.md contributors section
- GitHub contributors page
- Release notes

Thank you for contributing! 🙏

---

**Last Updated:** 2025-10-21  
**Maintained by:** Jonas Abde
