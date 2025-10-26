# Tekup Gmail Services
**Unified Gmail & Email Automation Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Om Dette Repository

Dette repository konsoliderer alle Tekup's Gmail-relaterede services i én unified platform:

- **gmail-automation** (Python) - PDF forwarding, receipt processing, Economic API
- **gmail-mcp-server** (Node.js) - MCP protocol server for AI integrations
- **renos-gmail-services** (TypeScript) - AI email generation, lead monitoring, calendar integration

## 📁 Repository Struktur

```
tekup-gmail-services/
├── apps/
│   ├── gmail-automation/      🐍 Python service
│   │   ├── src/              # Gmail forwarding, receipt processing
│   │   ├── pyproject.toml
│   │   └── Dockerfile
│   │
│   ├── gmail-mcp-server/      📡 Node.js MCP server
│   │   ├── src/              # Filter & label management
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── renos-gmail-services/  🤖 TypeScript AI service
│       ├── src/              # AI email generation, lead monitoring
│       ├── package.json
│       └── Dockerfile
│
├── shared/                    🔗 Shared code
│   ├── types/                # Common TypeScript types
│   └── utils/                # Common utilities
│
├── config/                    ⚙️ Configuration
│   └── google-credentials/   # Google service accounts
│
├── docs/                      📚 Documentation
│   ├── ARCHITECTURE.md
│   ├── GMAIL_AUTOMATION.md
│   ├── MCP_SERVER.md
│   └── AI_EMAIL_GENERATION.md
│
└── tests/                     🧪 Tests
    ├── python/
    ├── typescript/
    └── integration/
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- Docker & Docker Compose (optional)
- Google Cloud credentials
- Gmail API enabled

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/tekup/tekup-gmail-services.git
cd tekup-gmail-services
```

#### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

#### 3. Install Dependencies

**Python Service:**
```bash
cd apps/gmail-automation
pip install -e .
```

**MCP Server:**
```bash
cd apps/gmail-mcp-server
npm install
```

**RenOS Services:**
```bash
cd apps/renos-gmail-services
npm install
```

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access:**
- Gmail MCP Server: http://localhost:3010
- RenOS Gmail Services: http://localhost:3011

## 📦 Services Overview

### 1. Gmail Automation (Python)

**Features:**
- ✅ PDF forwarding from Gmail
- ✅ Receipt processing (Google Photos integration)
- ✅ Economic API integration
- ✅ Duplicate detection
- ✅ Automated invoice processing

**Usage:**
```bash
cd apps/gmail-automation
python -m src.core.gmail_forwarder
```

**Documentation:** [apps/gmail-automation/README.md](apps/gmail-automation/README.md)

---

### 2. Gmail MCP Server (Node.js)

**Features:**
- ✅ MCP protocol server
- ✅ Filter management
- ✅ Label management
- ✅ OAuth2 auto-authentication
- ✅ AI integration ready

**Usage:**
```bash
cd apps/gmail-mcp-server
npm start
```

**Port:** 3010  
**Documentation:** [docs/MCP_SERVER.md](docs/MCP_SERVER.md)

---

### 3. RenOS Gmail Services (TypeScript)

**Features:**
- ✅ AI email generation (Gemini 2.0)
- ✅ Lead monitoring & parsing
- ✅ Email approval workflow
- ✅ Calendar booking integration
- ✅ Thread intelligence
- ✅ Customer database integration

**Usage:**
```bash
cd apps/renos-gmail-services
npm run dev
```

**Port:** 3011  
**Documentation:** [docs/AI_EMAIL_GENERATION.md](docs/AI_EMAIL_GENERATION.md)

## ⚙️ Configuration

### Environment Variables

Required environment variables are documented in `.env.example`:

```bash
# Gmail API Credentials
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_USER_EMAIL=your-email@gmail.com

# AI Services
OPENAI_API_KEY=your-openai-key
GEMINI_KEY=your-gemini-key

# Economic API
ECONOMIC_RECEIPT_EMAIL=receipts@e-conomic.com
ECONOMIC_API_KEY=your-api-key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Google Cloud Setup

1. Enable Gmail API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Download credentials JSON
4. Place in `config/google-credentials/`

See [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md) for detailed instructions.

## 🧪 Testing

### Python Tests
```bash
cd apps/gmail-automation
pytest
```

### Node.js Tests (MCP Server)
```bash
cd apps/gmail-mcp-server
npm test
```

### TypeScript Tests (RenOS Services)
```bash
cd apps/renos-gmail-services
npm test
```

### Integration Tests
```bash
cd tests/integration
npm test
```

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Gmail Automation Guide](docs/GMAIL_AUTOMATION.md)
- [MCP Server Documentation](docs/MCP_SERVER.md)
- [AI Email Generation](docs/AI_EMAIL_GENERATION.md)
- [Economic API Integration](docs/ECONOMIC_INTEGRATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🚀 Deployment

### Docker Deployment

```bash
# Build all images
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Service Deployment

Each service can be deployed independently. See service-specific README files for details.

## 🔧 Development

### Code Style

- **Python:** Black, isort, flake8, mypy
- **TypeScript:** ESLint, Prettier

### Pre-commit Hooks

```bash
pre-commit install
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** [GitHub Wiki](https://github.com/tekup/tekup-gmail-services/wiki)
- **Issues:** [GitHub Issues](https://github.com/tekup/tekup-gmail-services/issues)
- **Email:** info@tekup.dk

## 🏷️ Version History

- **v1.0.0** - Initial consolidation of 4 Gmail repositories
  - Migrated from: tekup-gmail-automation, Tekup Google AI (Gmail features)
  - Eliminated: Gmail-PDF-Auto (empty), Gmail-PDF-Forwarder (empty)

---

## 📊 Migration Info

This repository was created by consolidating:
- `tekup-gmail-automation` (Python + Node.js MCP)
- `Tekup Google AI` Gmail services (TypeScript)
- `Gmail-PDF-Auto` (deleted - empty)
- `Gmail-PDF-Forwarder` (deleted - empty)

**Migration Date:** 22. Oktober 2025  
**Benefits:** 60% reduction in maintenance overhead, unified documentation, shared utilities

---

**Tekup Gmail Services** - Streamlining email automation for modern businesses.

