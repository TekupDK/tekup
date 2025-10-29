# Contributing to Tekup-Billy MCP Server

Tak for din interesse i at bidrage til Tekup-Billy MCP Server! Dette dokument giver retningslinjer for at bidrage til projektet.

## 📋 Indholdsfortegnelse

- [Development Setup](#development-setup)
- [Projektstruktur](#projektstruktur)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## 🛠️ Development Setup

### Forudsætninger

- Node.js 18+
- npm eller yarn
- TypeScript kendskab
- Git
- Billy.dk API adgang (til testing)
- Supabase account (til database testing)

### Installation

1. **Clone repository**

```bash
git clone https://github.com/TekupDK/Tekup-Billy.git
cd Tekup-Billy
```

2. **Installer dependencies**

```bash
npm install
```

3. **Konfigurer environment**

```bash
cp .env.example .env
```

Opdater `.env` med dine credentials:

- Billy.dk API key og organization ID
- Supabase URL og keys
- Encryption keys (generer med `crypto.randomBytes()`)

4. **Build projektet**

```bash
npm run build
```

5. **Kør tests**

```bash
npm run test:integration
```

## 📁 Projektstruktur

```
Tekup-Billy/
├── src/                      # Source code
│   ├── index.ts             # MCP server entry point
│   ├── http-server.ts       # HTTP REST API wrapper
│   ├── billy-client.ts      # Billy.dk API client
│   ├── supabase-client.ts   # Supabase operations
│   ├── cache-manager.ts     # Caching logic
│   ├── audit-logger.ts      # Audit logging
│   ├── tools/               # MCP tool implementations
│   └── utils/               # Utility functions
├── tests/                    # Test files
├── deployment/               # Deployment configuration
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

### Vigtige filer

- **src/index.ts**: MCP server setup og tool registration
- **src/http-server.ts**: HTTP REST API wrapper (815 lines)
- **src/billy-client.ts**: Billy.dk API wrapper med rate limiting
- **src/supabase-client.ts**: Supabase operations (605 lines)
- **src/cache-manager.ts**: Caching strategi (615 lines)
- **src/audit-logger.ts**: Audit logging (211 lines)

## 💻 Coding Standards

### TypeScript

- Brug strict TypeScript mode
- Alle typer skal være eksplicitte (ingen `any`)
- Brug interfaces fra `src/types.ts`
- Dokumenter komplekse funktioner med JSDoc

### Naming Conventions

- **Filer**: kebab-case (e.g., `billy-client.ts`)
- **Klasser**: PascalCase (e.g., `BillyClient`)
- **Funktioner**: camelCase (e.g., `listInvoices`)
- **Konstanter**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Interfaces**: PascalCase med `I` prefix (e.g., `IInvoice`)

### Code Style

```typescript
// ✅ GOD PRAKSIS
export async function listInvoices(
  params: IListInvoicesParams
): Promise<IListInvoicesResult> {
  try {
    // Validate input
    const validated = listInvoicesSchema.parse(params);
    
    // Check cache first
    const cached = await cacheManager.get('invoices', validated);
    if (cached) return cached;
    
    // Call API
    const result = await billyClient.get('/invoices', validated);
    
    // Cache result
    await cacheManager.set('invoices', validated, result);
    
    // Log action
    await auditLogger.log('list_invoices', 'success', { count: result.length });
    
    return result;
  } catch (error) {
    await auditLogger.log('list_invoices', 'error', { error: error.message });
    throw error;
  }
}

// ❌ DÅRLIG PRAKSIS
async function getInv(p: any): Promise<any> {
  const r = await fetch('...');
  return r.json();
}
```

### Error Handling

- Brug try-catch for alle async operations
- Log alle errors via `auditLogger`
- Return strukturerede error responses
- Inkluder nyttige error messages (uden sensitive data)

```typescript
try {
  // Operation
} catch (error) {
  await auditLogger.log('operation_name', 'error', {
    error: error.message,
    metadata: { /* relevant context */ }
  });
  
  throw new Error(`Operation failed: ${error.message}`);
}
```

## 🧪 Testing

### Test Structure

Vi bruger forskellige test-levels:

1. **Integration Tests** (`tests/test-integration.ts`)
   - Tester Supabase integration
   - Kryptering/dekryptering
   - Audit logging
   - Usage metrics

2. **Production Health Tests** (`tests/test-production.ts`)
   - Health endpoint
   - Billy.dk connection
   - Environment variables

3. **Operations Tests** (`tests/test-production-operations.ts`)
   - Alle Billy.dk operations
   - End-to-end workflows

4. **Billy API Tests** (`tests/test-billy-api.ts`)
   - Direct API calls
   - Validation af credentials

### Kør Tests

```bash
# Alle integration tests
npm run test:integration

# Production health check
npm run test:production

# Production operations
npm run test:operations

# Billy.dk API test
npm run test:billy

# Alle tests
npm run test:all
```

### Skriv Nye Tests

Når du tilføjer ny funktionalitet, tilføj også tests:

```typescript
// tests/test-new-feature.ts
import { describe, it, expect } from 'vitest';

describe('New Feature', () => {
  it('should work correctly', async () => {
    const result = await newFeature();
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
```

## 📝 Commit Guidelines

Vi følger [Conventional Commits](https://www.conventionalcommits.org/) standarden:

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: Ny feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Eksempler

```bash
# Feature
git commit -m "feat(invoices): add invoice filtering by date range"

# Bug fix
git commit -m "fix(cache): resolve cache invalidation issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(billy-client): improve error handling"
```

## 🔄 Pull Request Process

### 1. Fork & Branch

```bash
# Fork repository på GitHub
# Clone dit fork
git clone https://github.com/YOUR_USERNAME/Tekup-Billy.git

# Opret feature branch
git checkout -b feature/your-feature-name
```

### 2. Development

- Følg coding standards
- Skriv tests for ny funktionalitet
- Opdater dokumentation hvis relevant
- Test lokalt før commit

### 3. Commit Changes

```bash
git add .
git commit -m "feat(scope): your commit message"
```

### 4. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Opret Pull Request på GitHub med:

- **Beskrivende titel**: "feat(invoices): Add date range filtering"
- **Detaljeret beskrivelse**: Hvad ændres, hvorfor, hvordan
- **Screenshots**: Hvis relevant
- **Test results**: Output fra `npm run test:all`

### 5. Review Process

- Mindst 1 reviewer skal godkende
- Alle tests skal være grønne
- Ingen merge conflicts
- Code style skal følge guidelines

### PR Template

```markdown
## Description
Brief description af ændringerne

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Integration tests passing
- [ ] Production tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No console.log statements
- [ ] Environment variables documented
```

## 🐛 Bug Reports

Når du reporter en bug, inkluder:

1. **Beskrivelse**: Klar beskrivelse af problemet
2. **Steps to Reproduce**: Præcise steps
3. **Expected Behavior**: Hvad skulle ske
4. **Actual Behavior**: Hvad skete der
5. **Environment**: Node version, OS, etc.
6. **Logs**: Relevante error logs
7. **Screenshots**: Hvis relevant

### Bug Report Template

```markdown
## Bug Description
Kort beskrivelse af buggen

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
Klar beskrivelse af forventet adfærd

## Actual Behavior
Hvad skete der i stedet

## Environment
- Node version: 18.x
- OS: Windows/Mac/Linux
- Package version: 1.0.0

## Error Logs
```

Paste error logs here

```

## Screenshots
If applicable
```

## 💡 Feature Requests

Når du foreslår en ny feature:

1. **Use Case**: Beskriv hvorfor featuren er nødvendig
2. **Proposed Solution**: Hvordan skulle det implementeres
3. **Alternatives**: Andre løsninger du har overvejet
4. **Impact**: Hvem vil drage nytte af dette

## 📚 Resources

### Projektdokumentation

- [README.md](./README.md) - Projekt overview
- [docs/PROJECT_SPEC.md](./docs/PROJECT_SPEC.md) - Komplet specifikation
- [docs/BILLY_API_REFERENCE.md](./docs/BILLY_API_REFERENCE.md) - Billy.dk API patterns
- [docs/MCP_IMPLEMENTATION_GUIDE.md](./docs/MCP_IMPLEMENTATION_GUIDE.md) - MCP protokol

### Eksterne resources

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP dokumentation
- [Billy.dk API](https://www.billy.dk/api) - Billy.dk API docs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide
- [Supabase Docs](https://supabase.com/docs) - Supabase dokumentation

## 🤝 Code of Conduct

- Vær respektfuld og professionel
- Fokuser på konstruktiv feedback
- Hjælp nye contributors
- Følg best practices

## ❓ Questions?

Hvis du har spørgsmål:

1. Check [docs/](./docs/) for dokumentation
2. Search existing issues på GitHub
3. Opret et nyt issue med [Question] tag
4. Kontakt projekt maintainers

## 🎉 Thank You

Tak for dit bidrag til Tekup-Billy MCP Server! Hver forbedring, uanset hvor lille, hjælper projektet.

---

**Happy Coding!** 🚀
