# 🚀 TEKUP MCP IMPLEMENTATION GUIDE

**Document Version:** 1.0.0  
**Dato:** 26. oktober 2025  
**Audience:** Developers, DevOps  
**Estimated Time:** 3-4 timer for komplet Phase 1 setup

---

## 📋 TABLE OF CONTENTS

1. [Pre-Implementation Checklist](#pre-implementation-checklist)
2. [Phase -1: Security Fixes (REQUIRED)](#phase--1-security-fixes-required)
3. [Phase 0: Repository Creation](#phase-0-repository-creation)
4. [Phase 1: Base Infrastructure Setup](#phase-1-base-infrastructure-setup)
5. [Phase 2: Submodule Integration](#phase-2-submodule-integration)
6. [Phase 3: CI/CD Setup](#phase-3-cicd-setup)
7. [Phase 4: First MCP Server (Knowledge MCP)](#phase-4-first-mcp-server-knowledge-mcp)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)

---

## ✅ PRE-IMPLEMENTATION CHECKLIST

### Prerequisites

#### Required Tools

- [ ] **Node.js** >= 20.0.0 installed
  ```bash
  node --version  # Should be v20.x or higher
  ```

- [ ] **PNPM** >= 8.0.0 installed
  ```bash
  pnpm --version  # Should be 8.x or higher
  # If not installed: npm install -g pnpm
  ```

- [ ] **Git** installed and configured
  ```bash
  git --version
  git config --get user.name
  git config --get user.email
  ```

- [ ] **GitHub CLI** (optional but recommended)
  ```bash
  gh --version
  # If not installed: winget install GitHub.cli
  ```

#### Access Requirements

- [ ] Access til **TekupDK GitHub organization**
- [ ] Write permissions til Tekup monorepo
- [ ] Access til **tekup-secrets** submodule

#### Knowledge Requirements

- [ ] Læst [TEKUP_MCP_SECURITY.md](./TEKUP_MCP_SECURITY.md) 🔴 KRITISK
- [ ] Forståelse af [MCP Spec](https://spec.modelcontextprotocol.io/)
- [ ] Basic TypeScript/Node.js kendskab
- [ ] Git submodules erfaring (eller læs: [Git Submodules Guide](https://git-scm.com/book/en/v2/Git-Tools-Submodules))

---

## 🔴 PHASE -1: SECURITY FIXES (REQUIRED)

> ⚠️ **KRITISK:** Denne phase SKAL gennemføres før andet arbejde!

**Estimated Time:** 30-45 minutter  
**Priority:** 🔴 CRITICAL  
**Ref:** [TEKUP_MCP_SECURITY.md](./TEKUP_MCP_SECURITY.md)

### Step -1.1: Rotate Exposed Credentials

#### GitHub Personal Access Token

```bash
# 1. Browser: https://github.com/settings/tokens
# 2. Find token starting with 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
# 3. Click "Delete" or "Regenerate"
# 4. Create new token:
#    - Name: "Tekup MCP Development"
#    - Scopes: repo, read:org, workflow
#    - Expiration: 90 days (med calendar reminder for renewal)
# 5. Copy new token til clipboard
```

#### Billy API Key

```bash
# 1. Browser: https://billy.dk
# 2. Login → Settings → API
# 3. Revoke key: 43e7439bccb58a8a96dd57dd06dae10add009111
# 4. Generate new API key
# 5. Copy new key til clipboard
```

### Step -1.2: Store Credentials in tekup-secrets

```bash
cd C:\Users\empir\Tekup\tekup-secrets

# Edit .env file (eller create hvis doesn't exist)
notepad .env

# Add/Update følgende:
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_NEW_TOKEN_HERE
BILLY_API_KEY=NEW_BILLY_KEY_HERE
BILLY_ORGANIZATION_ID=pmf9tU56RoyZdcX3k69z1g
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Commit changes (tekup-secrets has own git repo)
git add .env
git commit -m "Update API keys after security rotation"
git push
```

### Step -1.3: Set Environment Variables

```powershell
# Open PowerShell as Administrator

# Set user-level environment variables
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'ghp_NEW_TOKEN_HERE', 'User')
[System.Environment]::SetEnvironmentVariable('BILLY_API_KEY', 'NEW_BILLY_KEY_HERE', 'User')
[System.Environment]::SetEnvironmentVariable('BILLY_ORGANIZATION_ID', 'pmf9tU56RoyZdcX3k69z1g', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_URL', 'https://oaevagdgrasfppbrxbey.supabase.co', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_ANON_KEY', 'eyJhbGci...', 'User')

Write-Host "Environment variables set. Restart terminals to load." -ForegroundColor Green
```

### Step -1.4: Fix Cursor MCP Config

```bash
# Open Cursor config
notepad C:\Users\empir\.cursor\mcp.json
```

**Replace entire content med:**

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\empir\\.mcp-shared\\memory.json"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\empir"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "tekup-billy": {
      "command": "node",
      "args": [
        "C:\\Users\\empir\\Tekup\\apps\\production\\tekup-billy\\dist\\index.js"
      ],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
        "BILLY_API_KEY": "${BILLY_API_KEY}",
        "BILLY_ORGANIZATION_ID": "${BILLY_ORGANIZATION_ID}"
      }
    },
    "tekupvault": {
      "url": "https://tekupvault.onrender.com/mcp"
    }
  }
}
```

### Step -1.5: Test Cursor After Fix

```bash
# 1. Close Cursor completely
# 2. Restart Cursor
# 3. Open chat and test:
#    - "Check GitHub for recent repos" (tests GitHub MCP)
#    - "What's in my memory?" (tests memory MCP)
#    - "Search Billy for recent invoices" (tests tekup-billy MCP)
```

### Step -1.6: Verify Git History

```bash
cd C:\Users\empir\Tekup

# Check if cursor config ever committed
git log --all --full-history -- "**/.cursor/mcp.json"

# Search for exposed credentials
git log --all --full-history -S "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"
git log --all --full-history -S "43e7439bccb58a8a96dd57dd06dae10add009111"
```

**If credentials found in git history:**

- **STOP** and follow [TEKUP_MCP_SECURITY.md](./TEKUP_MCP_SECURITY.md) Section "Step 2.2: If Found in Git History"
- Requires BFG Repo-Cleaner or git-filter-repo
- Coordinate with team before force push!

### ✅ Phase -1 Completion Checklist

- [ ] New GitHub PAT generated
- [ ] New Billy API key generated
- [ ] Credentials stored in tekup-secrets
- [ ] Environment variables set (verify: `echo $env:GITHUB_PERSONAL_ACCESS_TOKEN`)
- [ ] Cursor config updated with `${VAR}` syntax
- [ ] Memory path fixed to shared location
- [ ] Cursor tested and working
- [ ] Git history checked (clean or remediated)

---

## 🏗️ PHASE 0: REPOSITORY CREATION

**Estimated Time:** 10-15 minutter  
**Priority:** 🟡 High

### Step 0.1: Create GitHub Repository

#### Option A: GitHub CLI (Recommended)

```bash
# Authenticate (if not already)
gh auth login

# Create repository
gh repo create TekupDK/tekup-mcp-servers \
  --private \
  --description "Custom MCP servers for Tekup organization" \
  --clone

# Output:
# ✓ Created repository TekupDK/tekup-mcp-servers on GitHub
# ✓ Cloned TekupDK/tekup-mcp-servers to tekup-mcp-servers

cd tekup-mcp-servers
```

#### Option B: GitHub Web UI

```bash
# 1. Browser: https://github.com/organizations/TekupDK/repositories/new
# 2. Settings:
#    - Repository name: tekup-mcp-servers
#    - Description: Custom MCP servers for Tekup organization
#    - Visibility: Private
#    - Initialize: Yes
#      ✓ Add a README file
#      ✓ Add .gitignore: Node
#      ✓ Choose a license: MIT
# 3. Click "Create repository"

# 4. Clone locally
git clone https://github.com/TekupDK/tekup-mcp-servers.git
cd tekup-mcp-servers
```

### Step 0.2: Initial Repository Setup

```bash
cd tekup-mcp-servers

# Create basic structure
mkdir packages shared docs scripts .github
mkdir .github/workflows

# Create placeholder files
New-Item -ItemType File -Path "packages\.gitkeep"
New-Item -ItemType File -Path "shared\.gitkeep"
New-Item -ItemType File -Path "docs\.gitkeep"

# Commit structure
git add .
git commit -m "Initial repository structure"
git push
```

### ✅ Phase 0 Completion Checklist

- [ ] Repository created at TekupDK/tekup-mcp-servers
- [ ] Cloned locally til `C:\Users\empir\tekup-mcp-servers`
- [ ] Basic directory structure created
- [ ] Initial commit pushed

---

## 📦 PHASE 1: BASE INFRASTRUCTURE SETUP

**Estimated Time:** 45-60 minutter  
**Priority:** 🟡 High

### Step 1.1: Setup PNPM Workspace

```bash
cd tekup-mcp-servers

# Create pnpm-workspace.yaml
@"
packages:
  - 'packages/*'
  - 'shared/*'
"@ | Out-File -FilePath pnpm-workspace.yaml -Encoding utf8

# Create root package.json
@"
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
    "dev": "pnpm -r --parallel dev",
    "test": "pnpm -r test",
    "clean": "pnpm -r clean",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "vitest": "^1.1.0",
    "turbo": "^1.11.2"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
"@ | Out-File -FilePath package.json -Encoding utf8

# Install dependencies
pnpm install
```

### Step 1.2: Create Base MCP Server Package

```bash
# Create base package directory
mkdir packages/base/src -Force

# Create package.json for base
cd packages/base
pnpm init

# Edit packages/base/package.json
@"
{
  "name": "@tekup/mcp-base",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6"
  }
}
"@ | Out-File -FilePath package.json -Encoding utf8

# Install dependencies for base
pnpm install

cd ../..
```

### Step 1.3: Create Base TypeScript Config

```bash
# Root tsconfig.json
@"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
"@ | Out-File -FilePath tsconfig.json -Encoding utf8

# Copy to packages/base
Copy-Item tsconfig.json packages/base/
```

### Step 1.4: Create Base MCP Server Class

Create `packages/base/src/index.ts`:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

export interface TekupMCPServerOptions {
  name: string;
  version: string;
  description?: string;
}

export abstract class TekupMCPServer {
  protected server: Server;
  protected options: TekupMCPServerOptions;

  constructor(options: TekupMCPServerOptions) {
    this.options = options;
    this.server = new Server(
      {
        name: options.name,
        version: options.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Override this method to define your MCP tools
   */
  protected abstract getTools(): Tool[];

  /**
   * Override this method to handle tool calls
   */
  protected abstract handleToolCall(
    name: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }>;

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.handleToolCall(request.params.name, request.params.arguments || {})
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error(`${this.options.name} v${this.options.version} running on stdio`);
  }
}

export { Tool } from "@modelcontextprotocol/sdk/types.js";
```

Create `packages/base/src/types.ts`:

```typescript
export interface TekupToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

export interface TekupToolError extends TekupToolResult {
  isError: true;
}

export function createToolResult(text: string): TekupToolResult {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

export function createToolError(error: string): TekupToolError {
  return {
    content: [
      {
        type: "text",
        text: `Error: ${error}`,
      },
    ],
    isError: true,
  };
}
```

### Step 1.5: Build Base Package

```bash
cd packages/base
pnpm build

# Verify dist/ folder created with:
# - index.js
# - index.d.ts
# - types.js
# - types.d.ts

cd ../..
```

### Step 1.6: Create .env.example

```bash
@"
# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_pat_here

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Billy
BILLY_API_KEY=your_billy_api_key
BILLY_ORGANIZATION_ID=your_billy_org_id

# OpenAI (for Knowledge MCP)
OPENAI_API_KEY=your_openai_api_key

# Pinecone (for Knowledge MCP)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=tekup-knowledge

# Google (for Calendar/Gmail MCPs)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
"@ | Out-File -FilePath .env.example -Encoding utf8
```

### Step 1.7: Update .gitignore

```bash
# Add to .gitignore
@"
# Dependencies
node_modules/
.pnpm-debug.log

# Build outputs
dist/
*.tsbuildinfo

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Logs
*.log
logs/
"@ | Out-File -FilePath .gitignore -Encoding utf8 -Append
```

### Step 1.8: Commit Base Infrastructure

```bash
git add .
git commit -m "Add base MCP server infrastructure with PNPM workspace"
git push
```

### ✅ Phase 1 Completion Checklist

- [ ] PNPM workspace configured
- [ ] Root package.json with scripts
- [ ] Base MCP server package created
- [ ] TypeScript configs in place
- [ ] Base server class implemented
- [ ] .env.example created
- [ ] .gitignore updated
- [ ] Everything committed and pushed

---

## 🔗 PHASE 2: SUBMODULE INTEGRATION

**Estimated Time:** 15-20 minutter  
**Priority:** 🟡 High

### Step 2.1: Add Submodule to Tekup Monorepo

```bash
cd C:\Users\empir\Tekup

# Add tekup-mcp-servers as submodule
git submodule add https://github.com/TekupDK/tekup-mcp-servers.git mcp-servers

# Initialize submodule
git submodule update --init --recursive

# Verify
ls mcp-servers  # Should show repository contents
```

### Step 2.2: Update Tekup Root package.json

```bash
cd C:\Users\empir\Tekup

# Edit package.json to include mcp-servers workspace
# Add to "workspaces" array:
#   "mcp-servers/packages/*",
#   "mcp-servers/shared/*"

# Example (add to existing workspaces):
{
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*",
    "mcp-servers/packages/*",
    "mcp-servers/shared/*"
  ]
}

# Reinstall to link workspaces
pnpm install
```

### Step 2.3: Commit Submodule Addition

```bash
cd C:\Users\empir\Tekup

git add .gitmodules mcp-servers package.json pnpm-lock.yaml
git commit -m "Add tekup-mcp-servers as submodule"
git push
```

### Step 2.4: Team Onboarding Instructions

Create `C:\Users\empir\Tekup\docs\MCP_SERVERS_SUBMODULE.md`:

```markdown
# MCP Servers Submodule

## For New Developers

When cloning Tekup monorepo:

\`\`\`bash
git clone --recurse-submodules https://github.com/TekupDK/Tekup.git
\`\`\`

Or if already cloned:

\`\`\`bash
git submodule update --init --recursive
\`\`\`

## Updating Submodule

To pull latest changes:

\`\`\`bash
cd mcp-servers
git pull origin main
cd ..
git add mcp-servers
git commit -m "Update mcp-servers submodule"
\`\`\`

## Working on MCP Servers

1. Navigate to submodule:
   \`\`\`bash
   cd mcp-servers
   \`\`\`

2. Create feature branch:
   \`\`\`bash
   git checkout -b feature/my-feature
   \`\`\`

3. Make changes, commit, push:
   \`\`\`bash
   git add .
   git commit -m "Add feature"
   git push origin feature/my-feature
   \`\`\`

4. Create PR in tekup-mcp-servers repository

5. After merge, update submodule reference in Tekup:
   \`\`\`bash
   cd ..
   git add mcp-servers
   git commit -m "Update mcp-servers to latest"
   \`\`\`
```

### ✅ Phase 2 Completion Checklist

- [ ] Submodule added at `Tekup/mcp-servers/`
- [ ] Tekup root package.json updated with workspaces
- [ ] Submodule committed to Tekup repo
- [ ] Team documentation created
- [ ] `pnpm install` runs successfully from Tekup root

---

## ⚙️ PHASE 3: CI/CD SETUP

**Estimated Time:** 30-40 minutter  
**Priority:** 🟢 Medium

### Step 3.1: Create CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Lint
        run: pnpm lint
      
      - name: Build
        run: pnpm build
      
      - name: Test
        run: pnpm test
```

### Step 3.2: Create Publish Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Publish to NPM
        run: pnpm -r publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

### Step 3.3: Add NPM Token to GitHub Secrets

```bash
# 1. Create NPM token:
#    - Go to npmjs.com → Settings → Access Tokens
#    - Generate new token (Automation)
#    - Copy token

# 2. Add to GitHub secrets:
#    - GitHub repo → Settings → Secrets and variables → Actions
#    - New repository secret
#    - Name: NPM_TOKEN
#    - Value: <your token>
```

### ✅ Phase 3 Completion Checklist

- [ ] CI workflow created and tested
- [ ] Publish workflow created
- [ ] NPM token added to GitHub secrets
- [ ] Workflows committed and pushed

---

## 🧠 PHASE 4: FIRST MCP SERVER (KNOWLEDGE MCP)

**Estimated Time:** 40-60 timer (over 1-2 måneder)  
**Priority:** 🔥🔥🔥🔥🔥

> Dette er minimum viable product (MVP) version. Fuld implementation covered in separate guide.

### Step 4.1: Create Knowledge MCP Package

```bash
cd tekup-mcp-servers

# Create package structure
mkdir -p packages/knowledge-mcp/src/tools
mkdir -p packages/knowledge-mcp/src/services
mkdir -p packages/knowledge-mcp/tests

cd packages/knowledge-mcp
pnpm init
```

### Step 4.2: Configure Package

Edit `packages/knowledge-mcp/package.json`:

```json
{
  "name": "@tekup/knowledge-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "tekup-knowledge-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@tekup/mcp-base": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "openai": "^4.20.0",
    "@pinecone-database/pinecone": "^1.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6"
  }
}
```

### Step 4.3: Implement Basic Knowledge MCP

Create `packages/knowledge-mcp/src/index.ts`:

```typescript
#!/usr/bin/env node
import { TekupMCPServer, Tool, createToolResult, createToolError } from "@tekup/mcp-base";

class KnowledgeMCPServer extends TekupMCPServer {
  protected getTools(): Tool[] {
    return [
      {
        name: "search_knowledge",
        description: "Search Tekup knowledge base for documentation, best practices, and project learnings",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            category: {
              type: "string",
              enum: ["documentation", "best-practices", "troubleshooting", "all"],
              description: "Filter by category",
            },
          },
          required: ["query"],
        },
      },
    ];
  }

  protected async handleToolCall(
    name: string,
    args: Record<string, unknown>
  ) {
    if (name === "search_knowledge") {
      return this.searchKnowledge(args);
    }
    
    return createToolError(`Unknown tool: ${name}`);
  }

  private async searchKnowledge(args: Record<string, unknown>) {
    const query = args.query as string;
    const category = (args.category as string) || "all";

    // TODO: Implement actual vector search
    // For now, placeholder response
    return createToolResult(
      `Search results for "${query}" in category "${category}":\n\n` +
      `[This is Phase 1 MVP - Vector DB integration coming next]\n\n` +
      `Found 3 results:\n` +
      `1. Setup Guide: How to configure Tekup development environment\n` +
      `2. Best Practice: TypeScript error handling patterns\n` +
      `3. Troubleshooting: Common Supabase connection issues`
    );
  }
}

// Start server
const server = new KnowledgeMCPServer({
  name: "tekup-knowledge-mcp",
  version: "0.1.0",
  description: "Tekup Knowledge Base MCP Server",
});

server.start().catch(console.error);
```

### Step 4.4: Build and Test

```bash
cd packages/knowledge-mcp
pnpm install
pnpm build

# Test manually
node dist/index.js
# Should output: "tekup-knowledge-mcp v0.1.0 running on stdio"
# Press Ctrl+C to exit
```

### Step 4.5: Add to IDE (Kilo Code)

Edit `C:\Users\empir\Tekup\.kilocode\mcp.json`:

```json
{
  "mcpServers": {
    "tekup-knowledge": {
      "command": "node",
      "args": [
        "C:\\Users\\empir\\Tekup\\mcp-servers\\packages\\knowledge-mcp\\dist\\index.js"
      ]
    }
  }
}
```

Restart Kilo Code and test:

- "Search Tekup knowledge for best practices"
- Should return placeholder MVP response

### ✅ Phase 4 MVP Completion Checklist

- [ ] Knowledge MCP package created
- [ ] Basic search tool implemented
- [ ] Package builds successfully
- [ ] Added to Kilo Code config
- [ ] Tested in IDE

**Next Steps for Knowledge MCP:**

1. Implement document scraping pipeline
2. Setup Pinecone vector DB
3. Implement OpenAI embeddings
4. Add semantic search
5. Add more tools (get_best_practice, find_similar_projects, etc.)

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### "pnpm not found"

```bash
npm install -g pnpm
```

#### "Cannot find module '@tekup/mcp-base'"

```bash
# Rebuild base package
cd packages/base
pnpm build

# Reinstall workspace dependencies
cd ../..
pnpm install
```

#### "MCP server not showing in IDE"

1. Check config file syntax (valid JSON)
2. Verify absolute paths to dist/index.js
3. Restart IDE completely
4. Check IDE MCP logs (if available)

#### "Environment variables not loaded"

```powershell
# Verify variables set
[System.Environment]::GetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'User')

# If empty, reset and restart terminal
```

---

## 🎯 NEXT STEPS

After completing this guide:

1. **Continue Knowledge MCP Development**
   - See separate detailed guide for full implementation
   - Estimated: 40-60 additional hours

2. **Start Phase 2 Servers**
   - Client Context MCP
   - Finance MCP (enhanced Billy)

3. **Monitor and Iterate**
   - Gather feedback from team
   - Measure time savings
   - Refine based on usage

4. **Documentation**
   - Update this guide with learnings
   - Create video tutorials
   - Share best practices

---

**Document Version:** 1.0.0  
**Last Updated:** 26. oktober 2025  
**Next Review:** After Phase 1 completion
