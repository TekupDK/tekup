# 🏗️ TEKUP MCP SERVERS REPOSITORY STRATEGI

**Dato:** 26. oktober 2025  
**Formål:** Design optimal repository struktur for Tekup MCP servers som dedikeret submodule

---

## 🎯 HVORFOR EGET REPOSITORY SOM SUBMODULE?

### ✅ Fordele ved Dedicated Repo + Submodule

1. **🔒 Separation of Concerns**
   - MCP servers er distincte produkter/tools
   - Uafhængig versioning (semantic versioning)
   - Kan udvikles uden at påvirke main monorepo

2. **♻️ Reusability**
   - Kan bruges på tværs af projekter
   - Andre teams kan clone/fork
   - Potentiale for open source senere

3. **🚀 Independent Deployment**
   - Hver MCP server kan deployes separat
   - Render/Railway services per server
   - CI/CD pipeline dedikeret til MCP servers

4. **📦 Package Management**
   - Kan udgives som npm packages
   - `@tekup/knowledge-mcp`, `@tekup/client-mcp`, etc.
   - Versioned releases (1.0.0, 1.1.0, etc.)

5. **👥 Team Collaboration**
   - Dedicated issue tracking
   - Separate pull requests
   - Clear ownership og maintenance

6. **🔐 Security**
   - Sensitive MCP logic adskilt
   - Kun nødvendige folk har adgang
   - Separate secrets management (lige som tekup-secrets)

---

## 🏗️ REPOSITORY STRUKTUR

### GitHub Repository
**Navn:** `tekup-mcp-servers`  
**Organization:** TekupDK  
**URL:** `https://github.com/TekupDK/tekup-mcp-servers`  
**Visibility:** Private (kan open source senere)

### Repository Structure
```
tekup-mcp-servers/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Test alle servers
│   │   ├── publish.yml            # Publish til npm
│   │   └── deploy.yml             # Deploy til Render
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── packages/
│   ├── base/                      # Shared base class
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── knowledge-mcp/             # Phase 1
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tools/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── client-mcp/                # Phase 2
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── code-intel-mcp/            # Phase 3
│   ├── deploy-mcp/                # Phase 4
│   ├── comms-mcp/                 # Phase 5
│   ├── finance-mcp/               # Phase 6 (enhanced billy)
│   └── learn-mcp/                 # Phase 7
│
├── shared/
│   ├── supabase-client/
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── openai-client/
│   └── utils/
│
├── docs/
│   ├── getting-started.md
│   ├── architecture.md
│   ├── contributing.md
│   └── deployment.md
│
├── scripts/
│   ├── setup.sh
│   ├── build-all.sh
│   ├── test-all.sh
│   └── deploy.sh
│
├── .gitignore
├── .env.example
├── package.json                   # Workspace root
├── pnpm-workspace.yaml            # PNPM workspace config
├── turbo.json                     # Turborepo config (optional)
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 📦 MONOREPO SETUP MED PNPM WORKSPACES

### Root package.json
```json
{
  "name": "@tekup/mcp-servers",
  "version": "1.0.0",
  "private": true,
  "description": "Custom MCP servers for Tekup organization",
  "repository": {
    "type": "git",
    "url": "https://github.com/TekupDK/tekup-mcp-servers.git"
  },
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "dev": "pnpm -r --parallel dev",
    "clean": "pnpm -r clean",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "turbo": "^1.11.2",
    "@types/node": "^20.10.6",
    "vitest": "^1.1.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
  - 'shared/*'
```

### turbo.json (Optional - for parallel builds)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "dev": {
      "cache": false
    },
    "lint": {
      "outputs": []
    }
  }
}
```

---

## 🔗 INTEGRATION MED TEKUP MONOREPO

### Add as Git Submodule

```bash
cd C:\Users\empir\Tekup

# Add submodule
git submodule add https://github.com/TekupDK/tekup-mcp-servers.git mcp-servers

# Initialize submodule
git submodule update --init --recursive

# Commit submodule addition
git add .gitmodules mcp-servers
git commit -m "feat: add tekup-mcp-servers as submodule"
```

### Tekup Monorepo Structure (After)
```
Tekup/
├── apps/
│   ├── production/
│   │   ├── tekup-billy/
│   │   └── tekup-vault/
│   └── web/
│
├── services/
│   └── tekup-gmail-services/
│
├── mcp-servers/                   # 🆕 SUBMODULE
│   ├── packages/
│   │   ├── base/
│   │   ├── knowledge-mcp/
│   │   ├── client-mcp/
│   │   └── ...
│   └── shared/
│
├── tekup-secrets/                 # Existing submodule
│   ├── config/
│   │   ├── mcp.env
│   │   └── ...
│   └── load-secrets.ps1
│
└── package.json
```

### Update Tekup Root package.json
```json
{
  "workspaces": [
    "apps/*",
    "services/*",
    "mcp-servers/packages/*",      // 🆕 Include MCP servers
    "mcp-servers/shared/*"          // 🆕 Include shared libs
  ]
}
```

---

## 🔧 MCP CONFIG INTEGRATION

### Update IDE Configs to Use Submodule

#### VS Code (C:\Users\empir\AppData\Roaming\Code\User\mcp.json)
```json
{
  "servers": {
    "tekup-knowledge": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\Users\\empir\\Tekup\\mcp-servers\\packages\\knowledge-mcp\\dist\\index.js"],
      "env": {
        "PINECONE_API_KEY": "${PINECONE_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    },
    "tekup-client": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\Users\\empir\\Tekup\\mcp-servers\\packages\\client-mcp\\dist\\index.js"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      }
    }
  }
}
```

#### Kilo Code (Tekup/.kilocode/mcp.json)
```json
{
  "mcpServers": {
    "tekup-knowledge": {
      "command": "node",
      "args": [
        "C:/Users/empir/Tekup/mcp-servers/packages/knowledge-mcp/dist/index.js"
      ],
      "env": {
        "PINECONE_API_KEY": "${PINECONE_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    }
  }
}
```

---

## 🚀 CI/CD PIPELINE

### GitHub Actions - Build & Test

`.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Lint
        run: pnpm lint
        
      - name: Type check
        run: pnpm typecheck
        
      - name: Build
        run: pnpm build
        
      - name: Test
        run: pnpm test
```

### GitHub Actions - Publish to NPM

`.github/workflows/publish.yml`
```yaml
name: Publish

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Publish to NPM
        run: pnpm -r publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### GitHub Actions - Deploy to Render

`.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_KNOWLEDGE }}
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_CLIENT }}
```

---

## 📝 PACKAGE PUBLISHING STRATEGI

### NPM Organization
**Organization:** `@tekup`  
**Packages:**
- `@tekup/mcp-base`
- `@tekup/knowledge-mcp`
- `@tekup/client-mcp`
- `@tekup/code-intel-mcp`
- etc.

### Package.json Example (knowledge-mcp)
```json
{
  "name": "@tekup/knowledge-mcp",
  "version": "1.0.0",
  "description": "AI-powered knowledge base MCP server for Tekup",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "tekup-knowledge-mcp": "dist/index.js"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@tekup/mcp-base": "workspace:*",
    "openai": "^4.24.0",
    "pinecone-client": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "vitest": "^1.1.0"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "ai",
    "knowledge-base",
    "tekup"
  ],
  "author": "Tekup DK",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/TekupDK/tekup-mcp-servers.git",
    "directory": "packages/knowledge-mcp"
  }
}
```

### Installation for External Use
```bash
# Install globally
npm install -g @tekup/knowledge-mcp

# Or use npx
npx @tekup/knowledge-mcp

# In MCP config
{
  "tekup-knowledge": {
    "command": "npx",
    "args": ["-y", "@tekup/knowledge-mcp"]
  }
}
```

---

## 🔐 SECRETS MANAGEMENT

### Add to tekup-secrets/config/mcp.env
```bash
# MCP Server Infrastructure
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=tekup-knowledge

# OpenAI
OPENAI_API_KEY=your-openai-key
OPENAI_ORG_ID=your-org-id

# Supabase (for client-mcp)
SUPABASE_SERVICE_KEY=your-service-key

# GitHub (for code-intel-mcp)
GITHUB_PERSONAL_ACCESS_TOKEN=your-github-pat

# Render (for deploy-mcp)
RENDER_API_TOKEN=your-render-token
```

### .env.example in mcp-servers repo
```bash
# Copy this to .env and fill in your values

# Vector Database
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=

# AI Services
OPENAI_API_KEY=
OPENAI_ORG_ID=

# Database
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Integrations
GITHUB_PERSONAL_ACCESS_TOKEN=
RENDER_API_TOKEN=
```

---

## 🎬 IMPLEMENTATION STEPS

### Step 1: Create GitHub Repository (5 min)

1. Go to https://github.com/organizations/TekupDK/repositories/new
2. Repository name: `tekup-mcp-servers`
3. Description: "Custom MCP servers for AI-powered development workflows"
4. Visibility: Private
5. Initialize with:
   - ✅ README
   - ✅ .gitignore (Node)
   - ✅ License (MIT)

### Step 2: Setup Local Repository (10 min)

```bash
# Clone repository
cd C:\Users\empir
git clone https://github.com/TekupDK/tekup-mcp-servers.git

# Navigate to repository
cd tekup-mcp-servers

# Create basic structure
mkdir -p packages/base/src
mkdir -p packages/knowledge-mcp/src
mkdir -p shared/supabase-client/src
mkdir -p docs
mkdir -p scripts
mkdir -p .github/workflows

# Initialize PNPM workspace
pnpm init

# Create workspace config
echo "packages:\n  - 'packages/*'\n  - 'shared/*'" > pnpm-workspace.yaml

# Install base dependencies
pnpm add -D typescript @types/node turbo vitest
```

### Step 3: Create Base Package (15 min)

```bash
cd packages/base
pnpm init
pnpm add @modelcontextprotocol/sdk
pnpm add -D typescript @types/node

# Create base server class (copy from innovation plan)
# ... (se tidligere template kode)
```

### Step 4: Add as Submodule to Tekup (5 min)

```bash
cd C:\Users\empir\Tekup

# Add submodule
git submodule add https://github.com/TekupDK/tekup-mcp-servers.git mcp-servers

# Initialize
git submodule update --init --recursive

# Commit
git add .gitmodules mcp-servers
git commit -m "feat: add tekup-mcp-servers submodule for custom MCP server development"
git push
```

### Step 5: Setup CI/CD (10 min)

```bash
cd C:\Users\empir\tekup-mcp-servers

# Create GitHub Actions workflows
# (copy templates from above)

git add .github/workflows
git commit -m "ci: add GitHub Actions workflows for build, test, and deploy"
git push
```

### Step 6: Implement Phase 1 (Following weeks)

Continue with knowledge-mcp implementation as planned...

---

## 🔄 SUBMODULE WORKFLOW

### Daily Development

```bash
# Work on MCP servers
cd C:\Users\empir\tekup-mcp-servers
git checkout -b feature/knowledge-search
# ... make changes ...
git add .
git commit -m "feat(knowledge): add semantic search"
git push origin feature/knowledge-search

# Create PR on GitHub
# Merge PR

# Update submodule in main Tekup repo
cd C:\Users\empir\Tekup
git submodule update --remote mcp-servers
git add mcp-servers
git commit -m "chore: update mcp-servers submodule"
git push
```

### Pulling Latest Changes

```bash
cd C:\Users\empir\Tekup

# Pull main repo changes
git pull

# Update all submodules
git submodule update --init --recursive

# Or update specific submodule
git submodule update --remote mcp-servers
```

### Cloning Tekup Repo with Submodules

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/TekupDK/Tekup.git

# Or after clone
cd Tekup
git submodule update --init --recursive
```

---

## 📊 COMPARISON: SUBMODULE vs MONOREPO

| Aspect | Submodule ✅ | Monorepo ❌ |
|--------|-------------|------------|
| **Independence** | ✅ Separate versioning | ❌ Coupled versioning |
| **Reusability** | ✅ Can use in other projects | ❌ Tied to monorepo |
| **CI/CD** | ✅ Independent pipelines | ⚠️ Shared pipeline |
| **Team Access** | ✅ Granular permissions | ❌ Same for all |
| **NPM Publishing** | ✅ Easy to publish | ⚠️ Requires setup |
| **Development** | ⚠️ Extra git commands | ✅ Simpler workflow |
| **Deployment** | ✅ Independent deploys | ⚠️ Coordinated deploys |

**Conclusion:** Submodule er bedre for dette use case! ✅

---

## 🎯 BENEFITS RECAP

### Technical Benefits
1. **Modularity** - Clear separation
2. **Versioning** - Independent releases
3. **Testing** - Isolated test suite
4. **Deployment** - Per-server deployment
5. **Documentation** - Dedicated docs

### Business Benefits
1. **Reusability** - Use across projects
2. **Scalability** - Easy to add servers
3. **Maintainability** - Clear ownership
4. **Innovation** - Can experiment freely
5. **Open Source Potential** - Easy to share

### Team Benefits
1. **Focus** - Dedicated repository
2. **Collaboration** - Clear contribution process
3. **Learning** - Good practice for team
4. **Flexibility** - Different workflows possible

---

## 📋 NEXT ACTIONS CHECKLIST

- [ ] **Create GitHub repository** `TekupDK/tekup-mcp-servers`
- [ ] **Clone locally** to `C:\Users\empir\tekup-mcp-servers`
- [ ] **Setup PNPM workspace** with base structure
- [ ] **Create base package** with TekupMCPServer class
- [ ] **Add as submodule** to Tekup monorepo
- [ ] **Setup CI/CD** GitHub Actions workflows
- [ ] **Add secrets** to tekup-secrets/config/mcp.env
- [ ] **Document** README with getting started guide
- [ ] **Test** submodule workflow
- [ ] **Start Phase 1** knowledge-mcp implementation

---

## 📚 RELATED DOCUMENTATION

This repository strategy is part of the **Tekup MCP Servers Project**. See related documents:

- **[TEKUP_MCP_PROJECT_README.md](./TEKUP_MCP_PROJECT_README.md)** - Master project overview & navigation
- **[MCP_KOMPLET_ANALYSE_2025-10-26.md](./MCP_KOMPLET_ANALYSE_2025-10-26.md)** - Existing MCP ecosystem analysis
- **[TEKUP_CUSTOM_MCP_INNOVATION_PLAN.md](./TEKUP_CUSTOM_MCP_INNOVATION_PLAN.md)** - 7 proposed custom servers
- **[TEKUP_MCP_SECURITY.md](./TEKUP_MCP_SECURITY.md)** - 🔴 CRITICAL: Security issues & remediation
- **[TEKUP_MCP_IMPLEMENTATION_GUIDE.md](./TEKUP_MCP_IMPLEMENTATION_GUIDE.md)** - Step-by-step setup guide
- **[TEKUP_MCP_PROJECT_STATUS.md](./TEKUP_MCP_PROJECT_STATUS.md)** - Live project status dashboard

---

## 📝 CHANGELOG

### Version 1.0.0 (26. oktober 2025)

#### Designed
- **Git Submodule Architecture** (following tekup-secrets pattern)
- **PNPM Workspace Monorepo** structure
- **Repository Structure** with packages/, shared/, docs/, scripts/
- **Base MCP Server** abstract class template
- **CI/CD Pipeline** workflows (ci.yml, publish.yml, deploy.yml)

#### Defined
- **Repository:** TekupDK/tekup-mcp-servers
- **Integration Location:** Tekup/mcp-servers/
- **NPM Organization:** @tekup
- **Publishing Strategy:** Individual packages (@tekup/knowledge-mcp, etc.)

#### Provided
- **Complete PNPM workspace config** (pnpm-workspace.yaml, root package.json)
- **Turbo.json** for parallel builds
- **Submodule integration steps** for Tekup monorepo
- **CI/CD workflow templates** for GitHub Actions
- **Team onboarding guide** for submodule workflow

#### Benefits
- Independent versioning from main monorepo
- Reusable across projects
- Separate CI/CD pipelines
- NPM publishing capability
- Open source potential
- Clear ownership structure

---

## 🤔 BESLUTNINGER

**Skal jeg:**
1. ✅ **Oprette GitHub repository** nu?
2. ✅ **Setup base structure** med PNPM workspace?
3. ✅ **Create base MCP server class** som template?
4. ✅ **Add som submodule** til Tekup?
5. ✅ **Setup CI/CD workflows**?

**Eller skal vi først:**
- 🤔 Diskutere repository naming?
- 🤔 Review struktur decisions?
- 🤔 Beslutte NPM organization navn?

**Lad mig vide hvordan vi går videre! 🚀**

---

**Document Version:** 1.0.0  
**Dato:** 26. oktober 2025  
**Last Updated:** 26. oktober 2025  
**Status:** Strategy Complete - Ready for Implementation  
**Next Step:** Create GitHub repository (see IMPLEMENTATION_GUIDE.md)
