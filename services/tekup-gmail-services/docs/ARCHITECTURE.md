# Tekup Gmail Services - Architecture

**Version:** 1.0.0  
**Last Updated:** 22. Oktober 2025

---

## 🏗️ System Overview

Tekup Gmail Services is a unified platform consolidating Gmail and email automation capabilities across three distinct services:

```
┌─────────────────────────────────────────────────────────────┐
│                  Tekup Gmail Services                        │
│                  Unified Platform                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Python     │    │   Node.js    │    │  TypeScript  │
│ Automation   │    │  MCP Server  │    │   RenOS      │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Gmail API     │
                    │  Google Cloud  │
                    └────────────────┘
```

---

## 📦 Service Architecture

### 1. Gmail Automation (Python)

**Purpose:** PDF forwarding, receipt processing, Economic integration

```
gmail-automation/
├── src/
│   ├── core/
│   │   ├── gmail_forwarder.py      # Main Gmail forwarding logic
│   │   ├── scheduler.py            # Cron job scheduler
│   │   └── tekup_gmail_forwarder.py
│   ├── integrations/
│   │   └── gmail_economic_forwarder.py  # Economic API integration
│   └── processors/
│       ├── google_photos_receipt_processor.py
│       └── automated_photos_processor.py
└── config/
```

**Key Features:**
- PDF attachment forwarding
- Google Photos receipt OCR
- Economic API invoice posting
- Duplicate detection
- Scheduled automation

**Tech Stack:**
- Python 3.8+
- Google API Client
- PIL/Tesseract (OCR)
- APSchedule

---

### 2. Gmail MCP Server (Node.js)

**Purpose:** MCP protocol server for AI integrations

```
gmail-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry
│   ├── filter-manager.ts     # Gmail filter management
│   ├── label-manager.ts      # Gmail label management
│   └── evals/
│       └── evals.ts          # Evaluation tools
└── mcp-config.json
```

**Key Features:**
- MCP protocol implementation
- Filter CRUD operations
- Label management
- OAuth2 auto-authentication
- AI integration endpoints

**Tech Stack:**
- Node.js 18+
- TypeScript
- MCP SDK
- Gmail API

**Ports:**
- Default: 3010
- Configurable via environment

---

### 3. RenOS Gmail Services (TypeScript)

**Purpose:** AI-powered email automation, lead monitoring

```
renos-gmail-services/
├── src/
│   ├── services/
│   │   ├── gmailService.ts              # Core Gmail API
│   │   ├── emailAutoResponseService.ts  # AI auto-response
│   │   ├── leadMonitor.ts               # Lead monitoring
│   │   └── googleAuth.ts                # Authentication
│   ├── handlers/
│   │   ├── emailComposeHandler.ts       # Email composition
│   │   ├── emailFollowUpHandler.ts      # Follow-ups
│   │   └── emailComplaintHandler.ts     # Complaints
│   └── llm/
│       ├── geminiProvider.ts            # Gemini AI
│       └── openAiProvider.ts            # OpenAI
└── config/
```

**Key Features:**
- AI email generation (Gemini 2.0)
- Lead monitoring & parsing
- Email approval workflow
- Thread intelligence
- Calendar booking integration
- Customer database sync

**Tech Stack:**
- Node.js 18+
- TypeScript
- Express
- Gemini AI / OpenAI
- Supabase
- Gmail API

**Ports:**
- Default: 3011
- Configurable via environment

---

## 🔗 Integration Architecture

### Gmail API Integration

All three services integrate with Gmail API but serve different purposes:

```
                    ┌─────────────────┐
                    │   Gmail API     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Python      │     │  MCP Server  │     │  TypeScript  │
│  Forwarding  │     │  Management  │     │  AI Email    │
└──────────────┘     └──────────────┘     └──────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Economic    │     │  AI Agents   │     │  Supabase    │
│  API         │     │  (via MCP)   │     │  Database    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Data Flow

#### 1. Email Forwarding Flow (Python)
```
Gmail → Fetch PDFs → Check duplicates → Forward to Economic → Mark processed
```

#### 2. MCP Server Flow (Node.js)
```
AI Agent → MCP Request → Filter/Label Operation → Gmail API → Response
```

#### 3. AI Email Flow (TypeScript)
```
Gmail → Lead detection → AI generation → Approval → Send → Database log
```

---

## 🔐 Authentication

### Service Accounts (Python & TypeScript)
- Domain-wide delegation
- Service account JSON credentials
- Impersonation of user accounts

### OAuth2 (MCP Server)
- Auto-authentication flow
- Token refresh
- Multi-account support

---

## 🐳 Docker Architecture

### Docker Compose Setup

```yaml
services:
  gmail-automation:     # Python service
    ports: none (background worker)
    
  gmail-mcp-server:     # MCP protocol server
    ports: 3010:3010
    
  renos-gmail-services: # TypeScript API
    ports: 3011:3011
```

### Shared Resources
- **Volumes:** 
  - config/google-credentials (shared)
  - logs/ (shared)
- **Networks:** 
  - tekup-gmail-network (bridge)

---

## 📊 Data Storage

### Python Service
- **Local:** 
  - Token files (token.json, token.pickle)
  - Log files
- **External:** 
  - Economic API (invoices)
  - Google Photos API (receipts)

### MCP Server
- **Local:** 
  - Filter/label cache
  - Session tokens
- **External:** 
  - Gmail API (real-time)

### TypeScript Service
- **Database:** Supabase PostgreSQL
  - Customers
  - Email logs
  - Lead tracking
  - Approval queue
- **Cache:** Redis (optional)
- **External:** 
  - Gmail API
  - OpenAI API
  - Gemini API

---

## 🔄 Workflow Patterns

### 1. Scheduled Automation (Python)
```
Cron → Gmail check → Process → Forward → Log → Sleep
```

### 2. Event-Driven (MCP)
```
AI request → MCP parse → Execute → Return result
```

### 3. Reactive (TypeScript)
```
Gmail webhook → Parse → AI process → Action → Database
```

---

## 🛡️ Security

### Authentication Layers
1. **Google OAuth2** - User authentication
2. **Service Accounts** - Server-to-server auth
3. **API Keys** - External service auth (Economic, AI)
4. **Environment Variables** - Secret management

### Data Protection
- Credentials in config/ (gitignored)
- Environment variables for secrets
- No hardcoded credentials
- Token rotation

---

## 📈 Scalability

### Current Limits
- **Python:** Single-threaded scheduler
- **MCP:** Stateless (easily scalable)
- **TypeScript:** Express server (horizontal scaling possible)

### Scaling Options
1. **Python:** Multi-process with Celery
2. **MCP:** Load balancer + multiple instances
3. **TypeScript:** PM2 cluster mode or Kubernetes

---

## 🔧 Configuration

### Environment-Based
All services use environment variables for configuration:

```
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
OPENAI_API_KEY
GEMINI_KEY
SUPABASE_URL
```

### Service-Specific
Each service has its own configuration needs documented in their respective README files.

---

## 🎯 Design Principles

1. **Separation of Concerns**
   - Each service has distinct responsibility
   - No tight coupling between services

2. **Shared Authentication**
   - Common Google credentials
   - Centralized credential storage

3. **Independent Deployment**
   - Each service can deploy separately
   - Docker containers for isolation

4. **Unified Documentation**
   - Central docs/ folder
   - Service-specific docs in each app/

5. **Extensibility**
   - Easy to add new services
   - Shared utilities in shared/

---

## 🚀 Deployment Architecture

### Development
```
Local → Docker Compose → All 3 services → Localhost testing
```

### Production
```
GitHub → CI/CD → Docker Registry → Cloud Platform → Services
```

**Recommended Platforms:**
- Render.com (current standard)
- Google Cloud Run
- AWS ECS
- Azure Container Instances

---

## 📚 Further Reading

- [Gmail Automation Guide](GMAIL_AUTOMATION.md)
- [MCP Server Documentation](MCP_SERVER.md)
- [AI Email Generation](AI_EMAIL_GENERATION.md)
- [Deployment Guide](DEPLOYMENT.md)

---

**Last Updated:** 22. Oktober 2025  
**Architecture Version:** 1.0.0




