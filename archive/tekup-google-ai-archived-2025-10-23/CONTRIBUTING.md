# 🤝 Contributing til RenOS\n\n\n\nTak fordi du vil bidrage til RenOS! Dette dokument beskriver vores development workflow og best practices.

---
\n\n## 📋 Table of Contents\n\n\n\n- [Development Workflow](#development-workflow)\n\n- [Branching Strategy](#branching-strategy)\n\n- [Commit Message Conventions](#commit-message-conventions)\n\n- [Pull Request Process](#pull-request-process)\n\n- [Code Standards](#code-standards)\n\n- [Testing Requirements](#testing-requirements)\n\n- [Security Guidelines](#security-guidelines)\n\n
---
\n\n## 🔄 Development Workflow\n\n\n\n### 1. Setup Local Environment\n\n\n\nSe [DEVELOPMENT.md](./DEVELOPMENT.md) for detaljeret setup guide.
\n\n```bash\n\n# Clone repository\n\ngit clone https://github.com/JonasAbde/tekup-renos.git\n\ncd tekup-renos
\n\n# Install dependencies\n\nnpm install\n\ncd client && npm install && cd ..
\n\n# Setup environment\n\ncp .env.example .env\n\n# Edit .env med dine credentials\n\n\n\n# Start development servers\n\nnpm run dev          # Backend (http://localhost:3000)\n\ncd client && npm run dev  # Frontend (http://localhost:5173)\n\n```\n\n\n\n### 2. Create Feature Branch\n\n\n\n```bash\n\n# Update main/develop\n\ngit checkout main\n\ngit pull origin main
\n\n# Create feature branch\n\ngit checkout -b feature/your-feature-name\n\n```\n\n\n\n### 3. Make Changes\n\n\n\n- Skriv kode der følger vores [Code Standards](#code-standards)\n\n- Tilføj tests for ny funktionalitet\n\n- Opdater dokumentation hvis nødvendigt\n\n- Commit ofte med beskrivende messages\n\n\n\n### 4. Test Locally\n\n\n\n```bash\n\n# TypeScript check\n\nnpx tsc --noEmit\n\ncd client && npx tsc --noEmit
\n\n# Lint\n\nnpm run lint\n\ncd client && npm run lint
\n\n# Run tests\n\nnpm test\n\ncd client && npm test
\n\n# Build check\n\nnpm run build\n\ncd client && npm run build
\n\n# Security audit\n\nnpm audit --audit-level=moderate\n\n```\n\n\n\n### 5. Push and Create PR\n\n\n\n```bash\n\ngit push origin feature/your-feature-name
\n\n# Gå til GitHub og create Pull Request\n\n# Udfyld PR template komplet\n\n```\n\n
---
\n\n## 🌳 Branching Strategy\n\n\n\nVi bruger **Git Flow** med følgende branches:\n\n\n\n### Main Branches\n\n\n\n#### `main`\n\n\n\n- **Production branch** - kun releases\n\n- Altid deployable til production\n\n- Protected branch (kræver PR + CI checks)\n\n- Deployes automatisk til Render production\n\n- Tags: `v1.0.0`, `v1.0.1`, etc.\n\n\n\n#### `develop`\n\n\n\n- **Integration branch** for features\n\n- Continuous integration branch\n\n- Deployes til staging environment\n\n- Merges til `main` for releases\n\n\n\n### Supporting Branches\n\n\n\n#### `feature/*`\n\n\n\n**Purpose**: Udvikling af nye features
\n\n```bash\n\n# Create from develop\n\ngit checkout -b feature/add-email-integration develop\n\n\n\n# Merge back to develop via PR\n\ngit checkout develop\n\ngit merge --no-ff feature/add-email-integration
git branch -d feature/add-email-integration\n\n```

**Naming:**
\n\n- `feature/add-calendar-sync`\n\n- `feature/improve-dashboard-ux`\n\n- `feature/friday-ai-enhancements`\n\n
**Lifetime**: Slettes efter merge til `develop`
\n\n#### `bugfix/*`\n\n\n\n**Purpose**: Bug fixes under udvikling
\n\n```bash
git checkout -b bugfix/fix-chat-loading-state develop\n\n```

**Naming:**
\n\n- `bugfix/fix-auth-redirect`\n\n- `bugfix/repair-email-sending`\n\n\n\n#### `hotfix/*`\n\n\n\n**Purpose**: Kritiske production fixes
\n\n```bash\n\n# Create from main\n\ngit checkout -b hotfix/fix-security-vulnerability main\n\n\n\n# Merge til BÅDE main og develop\n\ngit checkout main\n\ngit merge --no-ff hotfix/fix-security-vulnerability
git tag -a v1.0.1

git checkout develop
git merge --no-ff hotfix/fix-security-vulnerability\n\n```

**Naming:**
\n\n- `hotfix/fix-authentication-bypass`\n\n- `hotfix/patch-xss-vulnerability`\n\n
**Lifetime**: Slettes efter merge til både `main` og `develop`
\n\n#### `release/*`\n\n\n\n**Purpose**: Release forberedelse
\n\n```bash
git checkout -b release/1.1.0 develop
\n\n# Bump version, update CHANGELOG.md, final tests\n\nnpm version 1.1.0\n\n\n\n# Merge to main\n\ngit checkout main\n\ngit merge --no-ff release/1.1.0
git tag -a v1.1.0
\n\n# Merge to develop\n\ngit checkout develop\n\ngit merge --no-ff release/1.1.0
\n\n# Delete branch\n\ngit branch -d release/1.1.0\n\n```\n\n\n\n### Branch Protection Rules\n\n\n\n#### `main` branch\n\n\n\n- ✅ Require pull request before merging\n\n- ✅ Require approvals: **minimum 1**\n\n- ✅ Require status checks to pass:\n\n  - CI: Lint\n\n  - CI: TypeCheck\n\n  - CI: Build\n\n  - CI: Security Audit (continue-on-error for moderate)\n\n- ✅ Require linear history (no merge commits)\n\n- ✅ Include administrators\n\n- ✅ Do not allow force pushes\n\n- ✅ Do not allow deletions\n\n\n\n#### `develop` branch\n\n\n\n- ✅ Require pull request before merging\n\n- ✅ Require status checks to pass (samme som main)\n\n- ✅ Allow force pushes (med restrictions)\n\n
---
\n\n## 📝 Commit Message Conventions\n\n\n\nVi følger **Conventional Commits** specifikationen:\n\n\n\n### Format\n\n\n\n```\n\n<type>(<scope>): <subject>

<body>

<footer>\n\n```
\n\n### Types\n\n\n\n| Type | Emoji | Beskrivelse | Eksempel |
|------|-------|-------------|----------|
| `feat` | ✨ | Ny feature | `feat(chat): add voice input support` |
| `fix` | 🐛 | Bug fix | `fix(auth): resolve token expiry issue` |
| `docs` | 📚 | Dokumentation | `docs(readme): update setup instructions` |
| `style` | 🎨 | Code style (formatting) | `style: fix indentation in server.ts` |
| `refactor` | ♻️ | Code refactoring | `refactor(api): simplify error handling` |
| `perf` | ⚡ | Performance improvement | `perf(db): add index to customers table` |
| `test` | 🧪 | Tilføj/opdater tests | `test(auth): add rate limiting tests` |
| `build` | 🔧 | Build system changes | `build: upgrade to Node 20` |
| `ci` | 👷 | CI/CD changes | `ci: add security scan to workflow` |
| `chore` | 🔨 | Maintenance tasks | `chore: update dependencies` |
| `revert` | ⏪ | Revert previous commit | `revert: revert commit abc123` |
| `security` | 🔒 | Security fixes | `security: patch XSS vulnerability` |
\n\n### Scope (optional)\n\n\n\n- `auth` - Authentication/authorization\n\n- `chat` - Chat interface\n\n- `dashboard` - Dashboard\n\n- `friday` - Friday AI\n\n- `email` - Email functionality\n\n- `calendar` - Calendar integration\n\n- `api` - Backend API\n\n- `ui` - UI components\n\n- `db` - Database changes\n\n\n\n### Subject\n\n\n\n- Brug imperativ present tense ("add" ikke "added")\n\n- Ingen punktum til sidst\n\n- Max 72 karakterer\n\n- Start med lowercase (med mindre proper noun)\n\n\n\n### Body (optional)\n\n\n\n- Forklar **hvad** og **hvorfor**, ikke **hvordan**\n\n- Wrap at 72 characters\n\n- Blank line mellem subject og body\n\n\n\n### Footer (optional)\n\n\n\n- Reference issues: `Fixes #123`, `Closes #456`\n\n- Breaking changes: `BREAKING CHANGE: description`\n\n\n\n### Eksempler\n\n\n\n```bash\n\n# Simple feature\n\ngit commit -m "feat(chat): add message reactions"\n\n\n\n# Bug fix med body\n\ngit commit -m "fix(auth): resolve session timeout issue\n\n
Users were experiencing unexpected logouts after 5 minutes.
Changed session timeout from 5min to 1 hour as per requirements.

Fixes #234"
\n\n# Breaking change\n\ngit commit -m "feat(api): update authentication to use JWT\n\n
BREAKING CHANGE: API now requires JWT tokens instead of API keys.
Update client code to use new auth flow.

Migration guide: docs/AUTH_MIGRATION.md"
\n\n# Security fix\n\ngit commit -m "security(api): patch SQL injection vulnerability\n\n
Fixes #567"\n\n```

---
\n\n## 🔍 Pull Request Process\n\n\n\n### 1. Before Creating PR\n\n\n\n- [ ] All tests pass locally\n\n- [ ] TypeScript compiles without errors\n\n- [ ] Lint checks pass\n\n- [ ] Code follows our style guide\n\n- [ ] Documentation updated\n\n- [ ] CHANGELOG.md updated (hvis relevant)\n\n\n\n### 2. Create PR\n\n\n\n1. Push your branch til GitHub\n\n2. Create Pull Request fra din branch til `develop` (eller `main` for hotfixes)\n\n3. **Udfyld PR template komplet** - ingen placeholder text\n\n4. Link relaterede issues (`Fixes #123`)\n\n5. Add labels (bug, feature, documentation, etc.)\n\n6. Request reviewers
\n\n### 3. PR Review Process\n\n\n\n**Reviewer skal tjekke:**
\n\n- ✅ Koden følger coding standards\n\n- ✅ Tests er tilstrækkelige\n\n- ✅ Ingen security issues\n\n- ✅ Dokumentation er opdateret\n\n- ✅ No breaking changes uden godkendelse\n\n- ✅ Performance impact vurderet\n\n
**Author skal:**
\n\n- Respond til review comments\n\n- Make requested changes\n\n- Re-request review efter changes\n\n- Resolve conversations\n\n\n\n### 4. Merge Requirements\n\n\n\n- ✅ Minimum 1 approval\n\n- ✅ All CI checks pass\n\n- ✅ Conflicts resolved\n\n- ✅ Branch up-to-date med target\n\n- ✅ No security vulnerabilities introduced\n\n\n\n### 5. After Merge\n\n\n\n- [ ] Delete feature branch\n\n- [ ] Verify deployment (develop/staging)\n\n- [ ] Monitor for errors\n\n- [ ] Update related issues\n\n
---
\n\n## 💻 Code Standards\n\n\n\n### TypeScript\n\n\n\n```typescript\n\n// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

export async function getUser(id: string): Promise<User> {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  return user;
}

// ❌ Bad
function getUser(id) {
  return db.user.findUnique({ where: { id } });
}\n\n```
\n\n### React/TSX\n\n\n\n```tsx\n\n// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}

// ❌ Bad
export function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}\n\n```
\n\n### Error Handling\n\n\n\n```typescript\n\n// ✅ Good
try {
  const result = await riskyOperation();
  logger.info({ result }, 'Operation completed');
  return result;
} catch (error) {
  logger.error({ error, context: 'riskyOperation' }, 'Operation failed');
  throw new APIError('Failed to complete operation', { cause: error });
}

// ❌ Bad
try {
  return await riskyOperation();
} catch (e) {
  console.log('Error:', e);
}\n\n```
\n\n### Naming Conventions\n\n\n\n| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user-service.ts` |
| Classes | PascalCase | `UserService` |
| Interfaces | PascalCase | `UserData` |
| Functions | camelCase | `getUserById()` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Components | PascalCase | `UserProfile.tsx` |

---
\n\n## 🧪 Testing Requirements\n\n\n\n### Unit Tests\n\n\n\n```typescript\n\n// tests/services/user-service.test.ts
import { describe, it, expect } from 'vitest';
import { UserService } from '../services/user-service';

describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when found', async () => {
      const service = new UserService();
      const user = await service.getUser('123');
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
    });

    it('should throw error when user not found', async () => {
      const service = new UserService();
      await expect(service.getUser('invalid')).rejects.toThrow();
    });
  });
});\n\n```
\n\n### Coverage Requirements\n\n\n\n- **Minimum**: 70% coverage\n\n- **Target**: 80% coverage\n\n- **Critical paths**: 100% coverage (auth, payment, etc.)\n\n\n\n### Test Commands\n\n\n\n```bash\n\n# Run all tests\n\nnpm test\n\n\n\n# Watch mode\n\nnpm test -- --watch\n\n\n\n# Coverage report\n\nnpm test -- --coverage\n\n```\n\n
---
\n\n## 🔒 Security Guidelines\n\n\n\n### Input Validation\n\n\n\n```typescript\n\n// ✅ Good - Always validate input\n\nimport { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

function createUser(data: unknown) {
  const validated = UserSchema.parse(data);
  return db.user.create({ data: validated });
}

// ❌ Bad - No validation\n\nfunction createUser(data: any) {
  return db.user.create({ data });
}\n\n```
\n\n### Sanitization\n\n\n\n```typescript\n\n// ✅ Good - Sanitize user input\n\nimport { sanitize } from './middleware/sanitizer';

function handleUserMessage(message: string) {
  const clean = sanitize.strict(message);
  return saveMessage(clean);
}

// ❌ Bad - Raw user input\n\nfunction handleUserMessage(message: string) {
  return saveMessage(message);
}\n\n```
\n\n### Secrets Management\n\n\n\n- ❌ **NEVER** commit secrets to Git\n\n- ✅ Use `.env` files (gitignored)\n\n- ✅ Use environment variables in production\n\n- ✅ Rotate secrets regularly\n\n\n\n### Security Checklist\n\n\n\nSe [SECURITY.md](./SECURITY.md) for komplet security guidelines.

---
\n\n## 📚 Additional Resources\n\n\n\n- [Development Setup](./DEVELOPMENT.md)\n\n- [Security Policy](./SECURITY.md)\n\n- [API Documentation](./docs/API.md)\n\n- [Deployment Guide](./docs/DEPLOYMENT.md)\n\n
---
\n\n## 🆘 Need Help?\n\n\n\n- 💬 Slack: `#renos-dev`\n\n- 📧 Email: <dev@rendetalje.dk>\n\n- 📖 Docs: [docs.rendetalje.dk](https://docs.rendetalje.dk)\n\n
---

**Tak for dit bidrag! 🙏**
