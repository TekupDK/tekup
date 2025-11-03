# Tekup Workspace

**Organization:** [TekupDK](https://github.com/TekupDK)  
**Status:** ✅ Active Development  
**Purpose:** Main monorepo workspace for Tekup services

---

## 📦 **Repository Structure**

```
tekup/
├── apps/              # Application projects
│   └── rendetalje/    # Rendetalje mobile + backend
├── services/          # Backend services
│   ├── tekup-ai-v2/   # Friday AI V2 (Git Submodule) ⭐
│   ├── tekup-ai/      # Legacy AI services
│   └── ...
├── packages/          # Shared packages
├── scripts/           # Build and utility scripts
└── docs/              # Documentation
```

---

## 🚀 **Quick Start - Friday AI V2**

Friday AI V2 (tekup-ai-v2) is the primary AI assistant. It's configured as a Git submodule:

### **⚡ Quick Setup (5 minutes)**

```bash
# Initialize the submodule
git submodule update --init --remote services/tekup-ai-v2

# Install and start
cd services/tekup-ai-v2
pnpm install
cp .env.example .env
# Edit .env with your API keys
pnpm db:push
pnpm dev
```

### **📚 Comprehensive Guides**

- **🇩🇰 Hurtig Start (Danish):** [HURTIG_START_TEKUP_AI_V2.md](HURTIG_START_TEKUP_AI_V2.md)
- **🇩🇰 Fuld Udviklings Guide (Danish):** [TEKUP_AI_V2_UDVIKLINGS_GUIDE.md](TEKUP_AI_V2_UDVIKLINGS_GUIDE.md)
- **🇬🇧 Setup Guide (English):** [TEKUP_AI_V2_SETUP_GUIDE.md](TEKUP_AI_V2_SETUP_GUIDE.md)

---

## 🏗️ **Key Components**

### **Friday AI V2** ⭐ (Primary AI Assistant)

- **Location:** `services/tekup-ai-v2/` (Git Submodule)
- **Repository:** [TekupDK/tekup-friday](https://github.com/TekupDK/tekup-friday)
- **Tech:** React 19, tRPC, Express, Drizzle ORM
- **Features:** Unified inbox, Multi-AI, Billy.dk integration
- **Live Demo (Dev Instance):** <https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer>

### **Rendetalje**

- **Location:** `apps/rendetalje/`
- **Purpose:** Mobile app and backend for cleaning service management
- **Tech:** React Native, NestJS

### **Supporting Services**

- **Billy MCP:** [TekupDK/tekup-billy](https://github.com/TekupDK/tekup-billy) - Billy.dk integration
- **Secrets:** `tekup-secrets/` - Configuration and API keys (private submodule)
- **MCP Servers:** `tekup-mcp-servers/` - Gmail, Calendar, System tools

---

## 📚 **Documentation**

### **Setup & Getting Started**

- [HURTIG_START_TEKUP_AI_V2.md](HURTIG_START_TEKUP_AI_V2.md) - Quick start in Danish
- [TEKUP_AI_V2_UDVIKLINGS_GUIDE.md](TEKUP_AI_V2_UDVIKLINGS_GUIDE.md) - Complete developer guide in Danish
- [TEKUP_AI_V2_SETUP_GUIDE.md](TEKUP_AI_V2_SETUP_GUIDE.md) - Setup guide in English
- [WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md) - Overall workspace structure

### **Project Information**

- [GITHUB_TEKUPDK_ORGANIZATION.md](GITHUB_TEKUPDK_ORGANIZATION.md) - GitHub organization overview
- [FRIDAY_AI_V2_MIGRATION_COMPLETE.md](FRIDAY_AI_V2_MIGRATION_COMPLETE.md) - Migration details
- [CHANGELOG.md](CHANGELOG.md) - Change history

### **Architecture & Design**

- [TEKUP_PLATFORM_ARCHITECTURE_OVERVIEW.md](TEKUP_PLATFORM_ARCHITECTURE_OVERVIEW.md)
- [TEKUP_COMPREHENSIVE_ANALYSIS_REPORT_2025-10-28.md](TEKUP_COMPREHENSIVE_ANALYSIS_REPORT_2025-10-28.md)

---

## 🔧 **Development**

### **Prerequisites**

- Node.js 18+
- pnpm (package manager)
- Git with submodule support
- MySQL/TiDB (for Friday AI V2)

### **Common Commands**

```bash
# Initialize all submodules
git submodule update --init --recursive

# Install dependencies (from root)
pnpm install

# Work with Friday AI V2
cd services/tekup-ai-v2
pnpm dev

# Work with Rendetalje
cd apps/rendetalje
pnpm dev
```

---

## 🤝 **Contributing**

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 📞 **Support**

- **GitHub Organization:** <https://github.com/TekupDK>
- **Issues:** Use the repository's issue tracker
- **Documentation:** See guides above

---

## 📄 **License**

See individual project licenses in their respective directories.
