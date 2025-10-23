# 🚀 Tekup Workspace (MONOREPO)

**Complete development monorepo** with ALL Tekup projects in one repository.

**Type:** Monorepo (single repository, all projects included)  
**Repository:** https://github.com/TekupDK/tekup  
**Workspace File:** `Tekup-Portfolio.code-workspace`

---

## 📁 Workspace Structure

```
Tekup/ (MONOREPO - everything in one repo!)
├── apps/
│   ├── production/        → Live production services
│   │   ├── tekup-database/
│   │   ├── tekup-vault/
│   │   └── tekup-billy/
│   └── web/               → Web applications
│       ├── rendetalje/
│       └── tekup-cloud-dashboard/
├── services/              → Backend services & APIs
│   ├── tekup-ai/
│   └── tekup-gmail-services/
├── tekup-secrets/         → Encrypted secrets (git-crypt)
├── archive/               → Legacy projects (read-only)
├── docs/                  → Documentation hub
├── scripts/               → Build & deployment automation
└── Tekup-Portfolio.code-workspace ← Open this in VS Code!
```

---

## 🎯 Active Projects

### **Production Services** (`apps/production/`)
- **tekup-database** (v1.4.0) - Central PostgreSQL database
- **tekup-vault** (v0.1.0) - Knowledge layer with semantic search
- **tekup-billy** (v1.4.3) - Billy.dk MCP server

### **Web Applications** (`apps/web/`)
- **rendetalje-os** - Cleaning management platform (monorepo)
- **tekup-cloud-dashboard** - Unified service dashboard
- **tekup-chat** (v1.1.0) - ChatGPT-style interface

### **Backend Services** (`services/`)
- **tekup-ai** - AI infrastructure monorepo
- **tekup-gmail-services** (v1.0.0) - Email automation
- **tekup-cloud** - RenOS tools + calendar MCP

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Docker (optional)

### **Setup Workspace**
```bash
# Clone workspace (or navigate to it)
cd c:\Users\empir\Tekup

# Install dependencies (if monorepo)
pnpm install

# Start development database
cd apps/production/tekup-database
docker-compose up -d
```

### **Run a Project**
```bash
# Example: Start TekupVault
cd apps/production/tekup-vault
pnpm install
pnpm dev

# Example: Start RendetaljeOS
cd apps/web/rendetalje-os
pnpm install
pnpm dev
```

---

## 📚 Documentation

- [**Getting Started**](docs/guides/getting-started.md) - Setup guide
- [**Architecture**](docs/architecture/) - System design
- [**API Reference**](docs/api/) - API documentation
- [**Deployment**](docs/deployment/) - Deploy guides

---

## 🛠️ Development

### **Code Standards**
- TypeScript strict mode
- ESLint + Prettier (configs in `/configs`)
- 80%+ test coverage target
- Conventional commits

### **Testing**
```bash
# Run workspace tests
pnpm test

# Run specific project tests
cd apps/production/tekup-vault
pnpm test
```

### **Linting**
```bash
# Lint all projects
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

---

## 📦 Packages

Shared libraries used across projects:

- `packages/shared-types` - TypeScript type definitions
- `packages/shared-ui` - Reusable UI components
- `packages/ai-llm` - LLM abstraction layer
- `packages/ai-mcp` - MCP utilities

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

**Code Ownership:** See [CODEOWNERS](CODEOWNERS) for responsibility assignments.

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for workspace-level changes.

---

## 📄 License

See individual project LICENSE files. Workspace-level coordination: MIT License.

---

## 🔗 Links

- **TekupVault:** https://tekupvault.onrender.com
- **Tekup-Billy:** https://tekup-billy.onrender.com
- **GitHub:** https://github.com/JonasAbde

---

**Built with ❤️ by Tekup Team**  
**Last Updated:** 23. Oktober 2025
