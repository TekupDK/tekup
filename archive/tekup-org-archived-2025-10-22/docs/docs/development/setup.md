# Development Setup

Complete guide for setting up the TekUp monorepo development environment.

## Prerequisites

### Required Software
```bash
# Node.js (via nvm recommended)
nvm install 18.18.0
nvm use 18.18.0

# pnpm package manager
npm install -g pnpm@9.9.0

# PostgreSQL database
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql@14
# Linux: sudo apt install postgresql-14

# Docker (optional, for containerized services)
# https://docs.docker.com/get-docker/
```

### Environment Verification
```bash
node --version    # v18.18.0+
pnpm --version    # 9.9.0+
psql --version    # 14+
docker --version  # 20.0+
```

## Project Setup

### 1. Clone Repository
```bash
git clone https://github.com/TekUp-org/tekup-org.git
cd tekup-org
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm -r list --depth=0
```

### 3. Database Setup
```bash
# Create development database
createdb tekup_development

# Create test database  
createdb tekup_test

# Set DATABASE_URL in .env.local (auto-generated)
# DATABASE_URL="postgresql://username:password@localhost:5432/tekup_development"
```

### 4. Environment Configuration
```bash
# Auto-generate environment files
pnpm env:auto

# This creates:
# - .env.local (development)
# - apps/*/env.local (app-specific)
```

### 5. Build Shared Packages
```bash
# Build all shared packages first
pnpm -r build

# Or build specific package
pnpm -C packages/shared build
```

## Development Workflow

### Starting Development Servers

```bash
# Start all services with hot reload
pnpm dev

# Or start individual services:
pnpm flow:dev      # Flow API (port 4000)
pnpm flow:web:dev  # Flow Web (port 3000) 
pnpm crm:dev       # CRM API (port 4001)
pnpm crm:web:dev   # CRM Web (port 3001)
```

### Database Migrations
```bash
# Generate Prisma client
pnpm -C apps/flow-api prisma generate

# Apply migrations
pnpm -C apps/flow-api prisma db push

# Seed demo data (development only)
PX_AUTO_SEED=true pnpm flow:dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific package tests
pnpm -C packages/shared test

# Run in watch mode
pnpm -C packages/shared test:watch
```

### Code Quality

```bash
# Lint all code
pnpm lint

# Format with Prettier
pnpm format

# Type checking
pnpm typecheck

# Run full quality check
pnpm lint && pnpm typecheck && pnpm test
```

## Development Tools

### 1. API Documentation
- **Flow API**: http://localhost:4000/api/docs (Swagger UI)
- **Metrics**: http://localhost:4000/metrics (Prometheus)
- **Health**: http://localhost:4000/health

### 2. Database Management
```bash
# Prisma Studio (GUI)
pnpm -C apps/flow-api prisma studio

# Direct psql access
psql tekup_development
```

### 3. Debugging

#### VS Code Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Flow API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/flow-api/dist/main.js",
      "env": {
        "NODE_ENV": "development"
      },
      "outFiles": ["${workspaceFolder}/apps/flow-api/dist/**/*.js"],
      "sourceMaps": true
    }
  ]
}
```

#### Chrome DevTools
```bash
# Start with inspector
node --inspect-brk apps/flow-api/dist/main.js
# Open chrome://inspect
```

## Common Tasks

### Adding New Package
```bash
# Create package structure
mkdir -p packages/my-package/src
cd packages/my-package

# Initialize package.json
cat > package.json << EOF
{
  "name": "@tekup/my-package",
  "version": "0.1.0",
  "private": false,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -w -p tsconfig.json"
  }
}
EOF

# Add to workspace
pnpm install
```

### Adding New App
```bash
# Use the create-app script
pnpm create-app my-app --template=nestjs
# or
pnpm create-app my-web --template=nextjs
```

### Database Schema Changes
```bash
# Edit schema.prisma
# Generate migration
pnpm -C apps/flow-api prisma migrate dev --name my-change

# Apply to other environments
pnpm -C apps/flow-api prisma migrate deploy
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Find processes using ports
lsof -i :4000  # Flow API
lsof -i :3000  # Flow Web

# Kill process
kill -9 PID
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Restart PostgreSQL
# macOS: brew services restart postgresql@14
# Linux: sudo systemctl restart postgresql
```

#### Build Failures
```bash
# Clean all build artifacts
pnpm clean

# Rebuild from scratch  
pnpm -r build

# Check for circular dependencies
pnpm -r list --depth=0 | grep ERR
```

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf apps/*/dist packages/*/dist

# Rebuild types
pnpm -r build
```

## IDE Configuration

### VS Code Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-playwright.playwright"
  ]
}
```

### Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": ["apps/*", "packages/*"],
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

## Performance Tips

### 1. Use Nx Affected Commands
```bash
# Only test affected packages
pnpm nx affected:test

# Only build affected packages  
pnpm nx affected:build
```

### 2. Enable Development Optimizations
```bash
# Skip type checking in dev (faster startup)
SKIP_TYPE_CHECK=true pnpm dev

# Use SWC instead of Babel (if available)
USE_SWC=true pnpm next dev
```

### 3. Docker Development
```bash
# Use Docker Compose for services
docker-compose up postgres redis

# Keep Node.js on host for faster iteration
pnpm dev
```

## Next Steps

- [Testing Guide](./testing.md) - Learn testing best practices
- [Deployment Guide](./deployment.md) - Deploy to staging/production
- [Contributing Guide](./contributing.md) - Contribution workflow
- [Architecture Overview](../architecture.md) - System design
