# CodebuffAI Integration for Tekup Monorepo 🤖

Complete CodebuffAI agent configuration for the Tekup Unified Platform ecosystem, providing intelligent development assistance, code consistency, and automated workflows.

## 🎯 Overview

This integration configures three specialized AI agents to accelerate development across the Tekup monorepo:

- **Lead Platform Agent**: Implements Lead Management features following CRM patterns
- **Legacy Migration Agent**: Migrates legacy services to unified platform architecture  
- **Monorepo Consistency Agent**: Maintains consistency across 37+ applications

## 📁 Configuration Structure

```
.codebuff/
├── config.json                      # Master configuration
├── agent-config.json                # Agent definitions and capabilities
├── environment.env                  # Environment variables for agents
├── database-config.json             # SQLite & Prisma configuration
├── agentscope-integration.json      # AgentScope backend integration
├── jarvis-frontend-patterns.json    # Tailwind CSS 4.1 design system
├── git-hooks-config.json           # Git hooks configuration
└── hooks/
    ├── pre-commit.sh               # Pre-commit consistency checks
    ├── pre-push.sh                 # Pre-push integration tests
    └── commit-msg.sh               # Commit message validation
```

## 🚀 Quick Start

### 1. Verify CodebuffAI Installation

```bash
codebuff --version
# Expected: 1.0.480
```

### 2. Activate Agent Integration

```bash
# Load configuration
codebuff setup --config=.codebuff/config.json

# Test agents
codebuff test --config=.codebuff/agent-config.json

# Install Git hooks
husky install
chmod +x .codebuff/hooks/*.sh
```

### 3. Verify Environment

```bash
# Check database connection
test -f "apps/tekup-unified-platform/dev.db" && echo "✅ Database ready"

# Check AgentScope (optional)
curl -s http://localhost:8001/health && echo "✅ AgentScope running"

# Validate all configurations  
codebuff validate --all --config=.codebuff/config.json
```

## 🤖 Available Agents

### Lead Platform Agent
```bash
# Generate Lead module following CRM patterns
codebuff run lead-platform-agent --task="implement-lead-module"

# Add lead scoring functionality
codebuff run lead-platform-agent --task="add-lead-scoring"

# Generate lead analytics endpoints
codebuff run lead-platform-agent --task="create-analytics"
```

### Legacy Migration Agent
```bash
# Analyze legacy codebase
codebuff run legacy-migration-agent --task="analyze" --target="flow-api"

# Generate migration plan
codebuff run legacy-migration-agent --task="plan-migration" --from="tekup-crm-api"

# Execute migration
codebuff run legacy-migration-agent --task="migrate" --target="unified-platform"
```

### Monorepo Consistency Agent
```bash
# Audit entire monorepo
codebuff run monorepo-consistency-agent --task="audit"

# Fix naming conventions
codebuff run monorepo-consistency-agent --task="fix-naming"

# Align dependencies
codebuff run monorepo-consistency-agent --task="align-deps"

# Validate Tailwind usage
codebuff run monorepo-consistency-agent --task="validate-tailwind"
```

## 🎨 Design System Integration

The agents are configured to follow the **TekUp Futuristic Design System** with:

### Colors (P3 Wide Gamut)
- **Primary**: `hsl(195 100% 50%)` - Neon Blue
- **Accent**: `hsl(180 100% 50%)` - Neon Cyan  
- **Background**: `hsl(220 25% 6%)` - Ecosystem Dark
- **Glass**: `hsl(220 20% 25%)` - Glass Border

### Components
- `glass-card` - Glassmorphism containers
- `btn-futuristic` - Primary buttons with neon glow
- `nav-futuristic` - Navigation with backdrop blur
- `input-futuristic` - Form inputs with glass effects

### Animations
- `animate-float` - Floating motion
- `animate-pulse-neon` - Neon pulsing effect
- `animate-glow-pulse` - Glow pulsing
- `ecosystem-hover` - 3D hover transforms

## 🔧 Development Workflow

### Pre-commit Checks
Automatically runs on every commit:
1. **Lint-staged** - Code formatting and linting
2. **Consistency check** - Pattern validation
3. **Tailwind validation** - Design system compliance
4. **Database schema** - Prisma validation (if changed)

### Pre-push Tests
Comprehensive testing before push:
1. **Agent integration tests** - Verify all agents work
2. **Configuration validation** - Check all config files
3. **Database connectivity** - Test SQLite connection
4. **AgentScope integration** - Test backend (if running)
5. **Full build** - Ensure everything compiles
6. **Critical tests** - Run essential test suites

## 📊 Database Integration

### SQLite Development Setup
- **Database**: `apps/tekup-unified-platform/dev.db`
- **Schema**: `apps/tekup-unified-platform/prisma/schema.prisma`
- **ORM**: Prisma with multi-tenant support

### Agent Database Patterns
```typescript
// All models include tenant isolation
model Lead {
  id        String   @id @default(cuid())
  tenantId  String   // Required for all entities
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  // ... other fields
}
```

## 🧠 AgentScope Integration

### Jarvis Foundation Model
- **Model**: `jarvis-foundation-1.0`
- **Tokens**: 32,768 max
- **Temperature**: 0.7
- **Features**: Danish support, multi-agent optimization
- **Real-time**: Steering and WebSocket support

### API Endpoints
- **Base URL**: `http://localhost:8001`
- **Health Check**: `/health`
- **WebSocket**: `ws://localhost:8001/ws`

## 📋 Common Commands

```bash
# Agent operations
codebuff config list                              # List all agents
codebuff run <agent-name> --task="<task>"        # Run specific task
codebuff test --config=.codebuff/agent-config.json # Test all agents

# Consistency checks
codebuff run monorepo-consistency-agent --task="audit" # Full audit
codebuff validate --config=.codebuff/config.json      # Validate config

# Database operations
pnpm prisma generate    # Generate Prisma client
pnpm prisma db push     # Push schema to database
pnpm prisma studio      # Open database browser

# Development
pnpm dev               # Start all development servers
pnpm build             # Build all applications
pnpm test:ci           # Run all tests
```

## 🚨 Troubleshooting

### Agent Not Found
```bash
# Verify CodebuffAI installation
npm list -g @codebuff/cli
npm install -g @codebuff/cli@latest
```

### Configuration Errors
```bash
# Validate specific config
codebuff validate-config .codebuff/agent-config.json

# Check environment variables
cat .codebuff/environment.env
```

### Database Issues
```bash
# Reset development database
rm apps/tekup-unified-platform/dev.db
pnpm prisma db push
```

### Hook Permissions (Linux/macOS)
```bash
chmod +x .codebuff/hooks/*.sh
```

## 🔄 CI/CD Integration

The Git hooks are designed to work in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Setup CodebuffAI
  run: |
    npm install -g @codebuff/cli
    codebuff setup --config=.codebuff/config.json
    
- name: Run Agent Tests
  run: codebuff test --config=.codebuff/agent-config.json
```

## 📖 Documentation

- **Agent Reference**: `.codebuff/docs/agents.md`
- **Troubleshooting**: `.codebuff/docs/troubleshooting.md`
- **Design System**: `packages/design-system/README.md`

## 🤝 Contributing

1. Follow the established patterns enforced by the consistency agent
2. Use the futuristic design system components
3. Ensure all agents tests pass before committing
4. Update agent configurations when adding new patterns

## ⚡ Performance

The agents are optimized for:
- **Fast execution** - Minimal overhead on git operations
- **Parallel processing** - Multiple checks run concurrently  
- **Incremental validation** - Only check changed files
- **Graceful fallbacks** - Continue if optional services are down

---

**🎉 CodebuffAI is now fully integrated with your Tekup development workflow!**

Use `codebuff config list` to see your available agents and start accelerating your development.

<citations>
<document>
<document_type>RULE</document_type>
<document_id>vFilGCvj6xCCH7IYnjg0Dp</document_id>
</document>
<document>
<document_type>RULE</document_type>
<document_id>iKpyqU7Whgz6YHYmGizgM3</document_id>
</document>
<document>
<document_type>RULE</document_type>
<document_id>NV5C0mmxmcMXfZpx85UGg9</document_id>
</document>
</citations>
