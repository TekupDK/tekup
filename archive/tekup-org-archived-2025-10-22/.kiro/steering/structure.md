# Project Structure & Organization

## Monorepo Layout

### Applications (`/apps`)
Applications follow naming conventions based on their purpose:
- **API Applications**: `*-api` suffix (e.g., `tekup-crm-api`, `flow-api`)
- **Web Applications**: `*-web` suffix (e.g., `tekup-crm-web`, `flow-web`)
- **Standalone Apps**: Descriptive names (e.g., `inbox-ai`, `website`)

#### Backend API Structure (NestJS)
```
apps/{app-name}-api/
├── src/
│   ├── modules/          # Feature modules
│   ├── common/           # Shared utilities
│   ├── config/           # Configuration
│   └── main.ts           # Application entry
├── prisma/               # Database schema & migrations
├── test/                 # E2E tests
├── .env.example          # Environment template
└── nest-cli.json         # NestJS configuration
```

#### Frontend Web Structure (Next.js)
```
apps/{app-name}-web/
├── app/                  # App Router (Next.js 13+)
├── components/           # React components
├── lib/                  # Utility functions
├── .env.example          # Environment template
├── next.config.mjs       # Next.js configuration
└── tailwind.config.mjs   # Tailwind configuration
```

### Shared Packages (`/packages`)
All packages use `@tekup/` namespace and follow consistent structure:

- **`@tekup/shared`**: Common utilities and types
- **`@tekup/api-client`**: Shared API client library
- **`@tekup/ui`**: Reusable UI components
- **`@tekup/auth`**: Authentication utilities
- **`@tekup/config`**: Configuration management
- **`@tekup/eslint-config`**: Shared ESLint configuration

#### Package Structure
```
packages/{package-name}/
├── src/
│   ├── index.ts          # Main export
│   └── ...               # Implementation
├── package.json          # Package configuration
└── tsconfig.json         # TypeScript config
```

### Configuration Files (Root)
- **`package.json`**: Root package with workspace scripts
- **`pnpm-workspace.yaml`**: Workspace configuration
- **`nx.json`**: Nx build system configuration
- **`tsconfig.base.json`**: Base TypeScript configuration
- **`eslint.config.js`**: ESLint configuration
- **`jest.config.js`**: Jest test configuration

### Documentation (`/docs`)
- **API Documentation**: Auto-generated OpenAPI specs
- **Architecture**: System design and patterns
- **Implementation Guides**: Step-by-step instructions
- **Business Strategy**: Product and market documentation

### Infrastructure
- **`/k8s`**: Kubernetes deployment manifests
- **`/monitoring`**: Grafana and Prometheus configuration
- **`docker-compose.yml`**: Local development environment

### Scripts (`/scripts`)
Automation and utility scripts:
- **`env-auto.mjs`**: Environment variable management
- **`create-app.mjs`**: Application scaffolding
- **`audit-ecosystem.mjs`**: Dependency and security auditing

## Naming Conventions

### Applications
- Use kebab-case for directory names
- API apps: `{domain}-api` (e.g., `tekup-crm-api`)
- Web apps: `{domain}-web` (e.g., `tekup-crm-web`)
- Standalone: descriptive names (e.g., `inbox-ai`)

### Packages
- Directory: kebab-case (e.g., `api-client`)
- Package name: `@tekup/{name}` (e.g., `@tekup/api-client`)
- Exports: Use barrel exports from `src/index.ts`

### Files & Directories
- **TypeScript**: PascalCase for components, camelCase for utilities
- **Directories**: kebab-case for folders, PascalCase for component folders
- **Configuration**: Use standard names (`.env.example`, `tsconfig.json`)

## Path Aliases
Configured in `tsconfig.base.json`:
```typescript
"@tekup/shared": ["packages/shared/src/index.ts"]
"@tekup/api-client": ["packages/api-client/src/index.ts"]
"@tekup/ui": ["packages/ui/src/index.tsx"]
"@tekup/auth": ["packages/auth/src/index.ts"]
```

## Development Workflow
1. **New Applications**: Use `scripts/create-app.mjs` for scaffolding
2. **Shared Code**: Extract common functionality to packages
3. **Environment**: Use `pnpm run env:auto` for environment setup
4. **Dependencies**: Add via `pnpm --filter {app-name} add {package}`
5. **Testing**: Follow Jest configuration with coverage requirements

## File Organization Principles
- **Colocation**: Keep related files together
- **Separation of Concerns**: Clear boundaries between layers
- **Shared First**: Extract reusable code to packages
- **Convention over Configuration**: Follow established patterns
- **Documentation**: Include README.md in each app/package