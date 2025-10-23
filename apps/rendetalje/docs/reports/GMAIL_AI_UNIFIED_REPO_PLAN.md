# Gmail-AI Unified Repository - Konsolideringsplan
**Dato:** 22. Oktober 2025  
**Formål:** Samle Gmail automation + AI funktionalitet i ÉT production-ready repo  
**Baseret på:** GMAIL_REPOS_KONSOLIDERING_ANALYSE.md + AI_REPOS_KONSOLIDERING_ANALYSE.md

---

## 🎯 VISION: "tekup-gmail-ai"

**One repo to rule them all:**
- ✅ Gmail PDF forwarding (fra tekup-gmail-automation)
- ✅ Gmail MCP server (fra gmail-mcp-server subfolder)
- ✅ Gmail AI services (fra Tekup Google AI)
- ✅ Economic API integration
- ✅ Receipt processing (Google Photos)
- ✅ MCP protocol native
- ✅ Production-ready deployment

**Hvad IKKE inkluderes:**
- ❌ tekup-chat (beholder separat - end-user UI focus)
- ❌ tekup-ai-assistant (beholder separat - dokumentation hub)
- ❌ Tekup-org AI apps (enterprise monorepo, anden skala)

---

## 📁 FORESLÅET REPO STRUKTUR

```
tekup-gmail-ai/
├── README.md                           # Unified docs
├── docker-compose.yml                  # All services
├── .env.example                        # Unified env vars
├── turbo.json                          # Monorepo orchestration (valgfrit)
│
├── apps/
│   ├── gmail-automation/               # Python core (PDF forwarding)
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── gmail_forwarder.py
│   │   │   │   ├── scheduler.py
│   │   │   │   └── main.py
│   │   │   ├── integrations/
│   │   │   │   └── gmail_economic_api_forwarder.py
│   │   │   ├── processors/
│   │   │   │   └── google_photos_receipt_processor.py
│   │   │   └── utils/
│   │   ├── tests/
│   │   ├── pyproject.toml
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── gmail-mcp-server/               # Node.js MCP server
│   │   ├── src/
│   │   │   ├── index.ts                # Main MCP server
│   │   │   ├── tools/
│   │   │   │   ├── send-email.ts
│   │   │   │   ├── search-emails.ts
│   │   │   │   ├── filter-manager.ts
│   │   │   │   └── label-manager.ts
│   │   │   ├── resources/
│   │   │   │   ├── inbox.ts
│   │   │   │   └── labels.ts
│   │   │   └── auth/
│   │   │       └── oauth.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── gmail-ai-services/              # TypeScript AI services
│       ├── src/
│       │   ├── services/
│       │   │   ├── gmailService.ts             # Gmail API wrapper
│       │   │   ├── gmailLabelService.ts        # Label management
│       │   │   ├── emailAutoResponseService.ts # AI auto-response
│       │   │   ├── emailResponseGenerator.ts   # Gemini/OpenAI
│       │   │   ├── leadMonitor.ts              # Lead detection
│       │   │   └── leadParser.ts               # Email parsing
│       │   ├── llm/
│       │   │   ├── openAiProvider.ts           # OpenAI integration
│       │   │   └── geminiProvider.ts           # Gemini integration
│       │   ├── agents/
│       │   │   ├── intentClassifier.ts
│       │   │   ├── taskPlanner.ts
│       │   │   └── planExecutor.ts
│       │   └── workers/
│       │       └── emailIngestWorker.ts
│       ├── tests/
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── README.md
│
├── packages/                           # Shared packages
│   ├── gmail-shared/                   # Shared types & utils
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── gmail.ts
│   │   │   │   ├── mcp.ts
│   │   │   │   └── economic.ts
│   │   │   └── utils/
│   │   │       ├── validation.ts
│   │   │       └── logger.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── gmail-mcp-client/               # MCP client library
│       ├── src/
│       │   ├── client.ts
│       │   └── types.ts
│       ├── package.json
│       └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md                 # System architecture
│   ├── MCP_INTEGRATION.md              # MCP protocol guide
│   ├── DEPLOYMENT.md                   # Production deployment
│   ├── DEVELOPMENT.md                  # Dev workflow
│   └── API_REFERENCE.md                # API docs
│
├── scripts/
│   ├── setup.sh                        # Initial setup
│   ├── dev.sh                          # Start all services
│   ├── test-all.sh                     # Run all tests
│   └── deploy.sh                       # Deploy to production
│
└── .github/
    ├── workflows/
    │   ├── ci.yml                      # CI/CD pipeline
    │   └── deploy.yml                  # Auto-deploy
    └── copilot-instructions.md         # AI agent guide
```

---

## 🔄 MIGRATION PLAN

### Fase 1: Repository Setup (Dag 1-2)

**Opret nyt repo:**
```bash
cd ~/tekup-repos
mkdir tekup-gmail-ai
cd tekup-gmail-ai
git init
git remote add origin https://github.com/tekup/tekup-gmail-ai.git
```

**Folder struktur:**
```bash
mkdir -p apps/{gmail-automation,gmail-mcp-server,gmail-ai-services}
mkdir -p packages/{gmail-shared,gmail-mcp-client}
mkdir -p docs scripts .github/workflows
```

**Base files:**
```bash
# Root package.json (monorepo)
cat > package.json << 'EOF'
{
  "name": "tekup-gmail-ai",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm:dev:*\"",
    "dev:automation": "cd apps/gmail-automation && python -m src.core.main start --daemon",
    "dev:mcp": "cd apps/gmail-mcp-server && npm run dev",
    "dev:ai": "cd apps/gmail-ai-services && npm run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "turbo": "^1.11.0"
  }
}
EOF

# Docker compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  gmail-automation:
    build: ./apps/gmail-automation
    container_name: gmail-automation
    environment:
      - PYTHONPATH=/app
    volumes:
      - ./config:/app/config:ro
      - ./logs:/app/logs
    ports:
      - "8000:8000"
    networks:
      - gmail-ai-network

  gmail-mcp-server:
    build: ./apps/gmail-mcp-server
    container_name: gmail-mcp-server
    environment:
      - NODE_ENV=production
    ports:
      - "3001:3001"
    networks:
      - gmail-ai-network

  gmail-ai-services:
    build: ./apps/gmail-ai-services
    container_name: gmail-ai-services
    environment:
      - NODE_ENV=production
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis
    networks:
      - gmail-ai-network

  postgres:
    image: postgres:15-alpine
    container_name: gmail-postgres
    environment:
      POSTGRES_DB: gmail_ai
      POSTGRES_USER: tekup
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - gmail-ai-network

  redis:
    image: redis:7-alpine
    container_name: gmail-redis
    volumes:
      - redis_data:/data
    networks:
      - gmail-ai-network

volumes:
  postgres_data:
  redis_data:

networks:
  gmail-ai-network:
    driver: bridge
EOF
```

---

### Fase 2: Migrate gmail-automation (Dag 3-4)

**Copy fra tekup-gmail-automation:**
```bash
# Copy Python app
cp -r ~/tekup-gmail-automation/src apps/gmail-automation/src
cp -r ~/tekup-gmail-automation/tests apps/gmail-automation/tests
cp ~/tekup-gmail-automation/pyproject.toml apps/gmail-automation/
cp ~/tekup-gmail-automation/Dockerfile apps/gmail-automation/

# Update imports til monorepo context
# Ingen ændringer nødvendig - isoleret Python app
```

**Test:**
```bash
cd apps/gmail-automation
python -m pytest tests/
python -m src.core.main start  # Should work as-is
```

---

### Fase 3: Migrate gmail-mcp-server (Dag 5-6)

**Copy fra tekup-gmail-automation/gmail-mcp-server:**
```bash
cp -r ~/tekup-gmail-automation/gmail-mcp-server/src apps/gmail-mcp-server/src
cp ~/tekup-gmail-automation/gmail-mcp-server/package.json apps/gmail-mcp-server/
cp ~/tekup-gmail-automation/gmail-mcp-server/tsconfig.json apps/gmail-mcp-server/

# Setup as monorepo package
cd apps/gmail-mcp-server
npm install
npm run build
```

**Tilføj shared types dependency:**
```json
// apps/gmail-mcp-server/package.json
{
  "dependencies": {
    "@tekup-gmail-ai/shared": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    // ... existing deps
  }
}
```

---

### Fase 4: Migrate gmail-ai-services (Dag 7-9)

**Extract fra Tekup Google AI:**
```bash
# Copy Gmail-relateret kode
cp ~/Tekup\ Google\ AI/src/services/gmail*.ts apps/gmail-ai-services/src/services/
cp ~/Tekup\ Google\ AI/src/services/email*.ts apps/gmail-ai-services/src/services/
cp ~/Tekup\ Google\ AI/src/services/lead*.ts apps/gmail-ai-services/src/services/

# Copy LLM providers
cp -r ~/Tekup\ Google\ AI/src/llm apps/gmail-ai-services/src/

# Copy agents (Intent → Plan → Execute)
cp -r ~/Tekup\ Google\ AI/src/agents apps/gmail-ai-services/src/

# Setup package
cd apps/gmail-ai-services
npm init -y
npm install typescript @types/node
npm install openai @google/generative-ai
npm install @tekup-gmail-ai/shared@workspace:*
```

**Refactor imports:**
```typescript
// apps/gmail-ai-services/src/services/gmailService.ts
// BEFORE (Tekup Google AI):
import { appConfig } from '../../config';
import { prisma } from '../../lib/prisma';

// AFTER (gmail-ai-services):
import { config } from '@tekup-gmail-ai/shared';
// Prisma setup i egen app
```

---

### Fase 5: Create Shared Packages (Dag 10-11)

**gmail-shared package:**
```typescript
// packages/gmail-shared/src/types/gmail.ts
export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  attachments: GmailAttachment[];
  labels: string[];
  receivedAt: Date;
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  data?: Buffer;
}

// packages/gmail-shared/src/types/mcp.ts
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// packages/gmail-shared/src/utils/validation.ts
import { z } from 'zod';

export const GmailMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  subject: z.string(),
  from: z.string().email(),
  to: z.array(z.string().email()),
  body: z.string(),
  attachments: z.array(z.object({
    filename: z.string(),
    mimeType: z.string(),
    size: z.number()
  })),
  labels: z.array(z.string()),
  receivedAt: z.date()
});
```

**gmail-mcp-client package:**
```typescript
// packages/gmail-mcp-client/src/client.ts
import { MCPTool } from '@tekup-gmail-ai/shared';

export class GmailMCPClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      body: JSON.stringify({ method: 'tools/list' })
    });
    return response.json();
  }

  async callTool(name: string, args: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'tools/call',
        params: { name, arguments: args }
      })
    });
    return response.json();
  }
}
```

---

### Fase 6: Integration & Testing (Dag 12-14)

**Cross-app integration test:**
```typescript
// tests/integration/cross-app.test.ts
import { GmailMCPClient } from '@tekup-gmail-ai/mcp-client';
import { GmailMessage } from '@tekup-gmail-ai/shared';

describe('Cross-app Integration', () => {
  let mcpClient: GmailMCPClient;

  beforeAll(() => {
    mcpClient = new GmailMCPClient('http://localhost:3001');
  });

  it('MCP server kan sende email via AI service', async () => {
    // 1. MCP call to generate AI email
    const aiResponse = await fetch('http://localhost:3002/api/generate-email', {
      method: 'POST',
      body: JSON.stringify({
        to: 'test@example.com',
        context: 'Follow-up på tilbud',
        tone: 'professional'
      })
    });
    const { subject, body } = await aiResponse.json();

    // 2. MCP call to send email
    const result = await mcpClient.callTool('send_email', {
      to: 'test@example.com',
      subject,
      body
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('Automation kan forwarde til Economic via MCP', async () => {
    // Python automation detects PDF
    // Calls MCP server to forward
    const result = await mcpClient.callTool('forward_to_economic', {
      emailId: 'test-email-id',
      pdfAttachment: 'invoice.pdf'
    });

    expect(result.forwarded).toBe(true);
    expect(result.economicEmail).toBe('receipts@e-conomic.dk');
  });
});
```

**End-to-end test:**
```bash
#!/bin/bash
# scripts/test-all.sh

echo "🧪 Running all tests..."

# Python tests
cd apps/gmail-automation
python -m pytest tests/ --cov
cd ../..

# MCP server tests
cd apps/gmail-mcp-server
npm test
cd ../..

# AI services tests
cd apps/gmail-ai-services
npm test
cd ../..

# Integration tests
npm run test:integration

echo "✅ All tests passed!"
```

---

## 📊 FEATURE MAPPING

### Hvad kommer hvorfra:

| Feature | Source Repo | Destination App | Status |
|---------|-------------|-----------------|--------|
| PDF Forwarding | tekup-gmail-automation | gmail-automation | ✅ Direct copy |
| Receipt Processing | tekup-gmail-automation | gmail-automation | ✅ Direct copy |
| Economic API | tekup-gmail-automation | gmail-automation | ✅ Direct copy |
| MCP Server (filters, labels) | tekup-gmail-automation/gmail-mcp-server | gmail-mcp-server | ✅ Direct copy |
| OAuth2 Auto-auth | tekup-gmail-automation/gmail-mcp-server | gmail-mcp-server | ✅ Direct copy |
| Gmail API Wrapper | Tekup Google AI | gmail-ai-services | 🔧 Refactor imports |
| AI Email Generation | Tekup Google AI | gmail-ai-services | 🔧 Refactor imports |
| Lead Monitoring | Tekup Google AI | gmail-ai-services | 🔧 Refactor imports |
| Intent Classifier | Tekup Google AI | gmail-ai-services | 🔧 Refactor imports |
| Task Planner | Tekup Google AI | gmail-ai-services | 🔧 Refactor imports |
| OpenAI Provider | Tekup Google AI | gmail-ai-services | 🔧 Refactor imports |
| Gemini Provider | Tekup Google AI | gmail-ai-services | 🔧 Refactor imports |

---

## 🚀 DEPLOYMENT STRATEGY

### Development Environment:
```bash
# Start all services
npm run dev

# Or individually:
npm run dev:automation  # Port 8000 (Python)
npm run dev:mcp        # Port 3001 (Node.js MCP)
npm run dev:ai         # Port 3002 (Node.js AI)
```

### Production (Docker):
```bash
# Build all images
docker-compose build

# Start production stack
docker-compose up -d

# Health checks
curl http://localhost:8000/health  # Gmail automation
curl http://localhost:3001/health  # MCP server
curl http://localhost:3002/health  # AI services
```

### Render.com Deployment:
```yaml
# render.yaml
services:
  - type: web
    name: gmail-automation
    env: python
    buildCommand: pip install -r apps/gmail-automation/requirements.txt
    startCommand: cd apps/gmail-automation && python -m src.core.main start
    
  - type: web
    name: gmail-mcp-server
    env: node
    buildCommand: cd apps/gmail-mcp-server && npm install && npm run build
    startCommand: cd apps/gmail-mcp-server && npm start
    
  - type: web
    name: gmail-ai-services
    env: node
    buildCommand: cd apps/gmail-ai-services && npm install && npm run build
    startCommand: cd apps/gmail-ai-services && npm start

databases:
  - name: gmail-postgres
    plan: starter
```

---

## 🔧 CONFIGURATION

### Unified Environment Variables:
```bash
# .env.example

# ==================
# Gmail OAuth (Shared)
# ==================
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxx
GMAIL_USER_EMAIL=your-email@gmail.com

# OR Service Account (headless)
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_IMPERSONATED_USER=user@domain.com

# ==================
# App-Specific Config
# ==================

# Gmail Automation (Python)
ECONOMIC_RECEIPT_EMAIL=receipts@e-conomic.dk
PROCESSED_LABEL=Videresendt_econ
DAYS_BACK=180
MAX_EMAILS=100

# MCP Server (Node.js)
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info

# AI Services (Node.js)
AI_SERVICES_PORT=3002
OPENAI_API_KEY=sk-proj-xxxxx
GEMINI_API_KEY=xxxxx
DATABASE_URL=postgresql://user:pass@localhost:5432/gmail_ai
REDIS_URL=redis://localhost:6379

# ==================
# Shared Config
# ==================
NODE_ENV=development
LOG_LEVEL=info
```

---

## 📈 SUCCESS METRICS

### Må implementeres inden "success":

1. ✅ **All source apps' tests pass** i nyt repo
2. ✅ **Cross-app integration** fungerer (MCP → AI services)
3. ✅ **Docker compose** starter alle services uden errors
4. ✅ **Zero breaking changes** for eksisterende brugere
5. ✅ **CI/CD pipeline** grøn (all tests pass)
6. ✅ **Documentation** opdateret (README, ARCHITECTURE.md)

### Post-launch metrics:

- **Migration downtime:** <1 time (goal: 0)
- **Test coverage:** >80% (all apps)
- **Docker build time:** <5 min (total)
- **Startup time:** <30s (all services)
- **Memory footprint:** <2GB (all services combined)

---

## ⚠️ RISK MANAGEMENT

### Potentielle Problemer:

1. **Import conflicts** mellem Python og Node.js apps
   - **Mitigation:** Isoler via `apps/` folders, ingen cross-language imports
   
2. **Environment variable confusion** (3 apps, mange vars)
   - **Mitigation:** Prefixed env vars (`AUTOMATION_*`, `MCP_*`, `AI_*`)
   
3. **Port conflicts** i development
   - **Mitigation:** Fixed ports (8000, 3001, 3002) dokumenteret
   
4. **Gemini/OpenAI API key management**
   - **Mitigation:** Shared via `gmail-shared` package config loader
   
5. **Database migrations** (hvis AI services bruger Prisma)
   - **Mitigation:** Isoler database per app, eller shared Prisma schema

---

## 🎯 FINAL DECISION MATRIX

| Criteria | Unified Repo | Separat Repos | Winner |
|----------|--------------|---------------|--------|
| **Deployment complexity** | 1 repo, 1 pipeline | 3 repos, 3 pipelines | ✅ Unified |
| **Code reuse** | Shared packages | Dupliceret | ✅ Unified |
| **Development experience** | Monorepo overhead | Simpler per-repo | ⚖️ Tie |
| **Testing** | Cross-app tests mulig | Isoleret | ✅ Unified |
| **Documentation** | Single README | 3 READMEs | ✅ Unified |
| **Onboarding** | Steeper learning curve | Easier | ❌ Separat |
| **Future AI features** | Easy to add apps | New repos needed | ✅ Unified |

**WINNER: Unified Repo** (5-1-1)

---

## 📝 NEXT STEPS

### Denne Uge (Uge 1):

**Dag 1-2: Setup**
- [ ] Opret `tekup-gmail-ai` repo på GitHub
- [ ] Setup monorepo structure (folders, package.json)
- [ ] Opret docker-compose.yml
- [ ] Init git + push til GitHub

**Dag 3-4: Migrate Automation**
- [ ] Copy gmail-automation Python app
- [ ] Run tests, verify functionality
- [ ] Update README.md

**Dag 5: Migrate MCP Server**
- [ ] Copy gmail-mcp-server Node.js app
- [ ] Setup as monorepo package
- [ ] Test MCP endpoints

**Weekend: Testing**
- [ ] Manual testing af alle 3 apps
- [ ] Docker compose test
- [ ] Fix any integration issues

### Næste Uge (Uge 2):

**Dag 8-10: Migrate AI Services**
- [ ] Extract Gmail code fra Tekup Google AI
- [ ] Refactor imports til monorepo
- [ ] Setup dependencies

**Dag 11-12: Shared Packages**
- [ ] Create `gmail-shared` package
- [ ] Create `gmail-mcp-client` package
- [ ] Update apps to use shared packages

**Dag 13-14: Integration**
- [ ] Cross-app integration tests
- [ ] CI/CD pipeline setup
- [ ] Documentation finalize

---

## ✅ KONKLUSION

**Anbefaling:** Opret `tekup-gmail-ai` unified repo med 3 apps:
1. **gmail-automation** (Python) - PDF forwarding, receipts, Economic
2. **gmail-mcp-server** (Node.js) - MCP protocol server
3. **gmail-ai-services** (Node.js) - AI email generation, lead monitoring, agents

**Tidsplan:** 2 uger (10-14 arbejdsdage)  
**Risiko:** LAV (isolated apps, minimal refactoring)  
**ROI:** HØJ (unified deployment, shared packages, better testing)

**Start ASAP?** 🚀

---

**Prepared by:** AI Assistant  
**Date:** October 22, 2025  
**Document Version:** 1.0
