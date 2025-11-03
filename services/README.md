# Tekup Services

This folder contains all backend services and APIs.

## Structure

```
services/
├── tekup-ai-v2/           - Friday AI V2 (Git Submodule → tekup-friday) ⭐ PRIMARY
├── tekup-ai/              - AI infrastructure monorepo (Legacy)
├── tekup-gmail-services/  - Email automation
└── tekup-cloud/           - RenOS tools + calendar MCP
```

## 🚀 Working with Friday AI V2 (tekup-ai-v2)

**tekup-ai-v2 is a Git submodule** that points to the [tekup-friday](https://github.com/TekupDK/tekup-friday) repository.

### Quick Setup

```bash
# Initialize and update the submodule
git submodule update --init --remote services/tekup-ai-v2

# Install dependencies
cd services/tekup-ai-v2
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
pnpm db:push

# Start development server
pnpm dev
```

### 📚 Detailed Guides

- **🇩🇰 Danish Guide:** [TEKUP_AI_V2_UDVIKLINGS_GUIDE.md](../TEKUP_AI_V2_UDVIKLINGS_GUIDE.md)
- **🇬🇧 English Guide:** [TEKUP_AI_V2_SETUP_GUIDE.md](../TEKUP_AI_V2_SETUP_GUIDE.md)
- **Migration Details:** [FRIDAY_AI_V2_MIGRATION_COMPLETE.md](../FRIDAY_AI_V2_MIGRATION_COMPLETE.md)

## Clone Other Services

```bash
cd services

# Legacy AI Services (if needed)
gh repo clone TekupDK/tekup-ai

# Cloud Services
gh repo clone TekupDK/tekup-gmail-services
```

## See Also

- [Complete setup guide](../README_PC2_QUICK_START.md)
- [Service documentation](../docs/)
- [GitHub Organization Overview](../GITHUB_TEKUPDK_ORGANIZATION.md)
