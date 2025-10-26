# Shared Packages

TekUp platform consists of several shared packages that provide common functionality across all applications.

## Package Overview


### @tekup/shared

**Category:** Core  
**Description:** Shared utilities and types  
**Version:** 0.1.0

No description available.

- [API Documentation](/api-docs/shared)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/shared)


### @tekup/api-client

**Category:** Core  
**Description:** API client library  
**Version:** 0.1.0

No description available.

- [API Documentation](/api-docs/api-client)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/api-client)


### @tekup/auth

**Category:** Authentication  
**Description:** Authentication utilities  
**Version:** 0.1.0

No description available.

- [API Documentation](/api-docs/auth)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/auth)


### @tekup/config

**Category:** Configuration  
**Description:** Configuration management  
**Version:** 0.1.0

No description available.

- [API Documentation](/api-docs/config)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/config)


### @tekup/testing

**Category:** Testing  
**Description:** Testing utilities  
**Version:** 0.1.0

No description available.

- [API Documentation](/api-docs/testing)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/testing)


### @tekup/sso

**Category:** Authentication  
**Description:** Single Sign-On utilities  
**Version:** 0.1.0

TekUp Single Sign-On Authentication Hub

- [API Documentation](/api-docs/sso)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/sso)


### @tekup/consciousness

**Category:** AI  
**Description:** AI consciousness framework  
**Version:** 0.1.0

Tekup Consciousness Engine - Self-evolving, distributed AI consciousness platform

- [API Documentation](/api-docs/consciousness)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/consciousness)


### @tekup/ai-consciousness

**Category:** AI  
**Description:** Advanced AI consciousness  
**Version:** 1.0.0

Distributed AI Consciousness with Agent Mesh Network

- [API Documentation](/api-docs/ai-consciousness)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/ai-consciousness)


### @workspace/evolution-engine

**Category:** AI  
**Description:** AI evolution engine  
**Version:** 1.0.0

Self-evolving architecture engine that continuously improves code performance

- [API Documentation](/api-docs/evolution-engine)
- [Source Code](https://github.com/TekUp-org/tekup-org/tree/main/packages/evolution-engine)



## Installation

All packages are available via pnpm and follow the `@tekup/` namespace:

```bash
# Install a specific package
pnpm add @tekup/shared

# Install multiple packages
pnpm add @tekup/shared @tekup/api-client @tekup/auth
```

## Usage Patterns

### Core Packages
The core packages (`@tekup/shared`, `@tekup/api-client`) provide fundamental functionality:

```typescript
import { ApiClient } from '@tekup/api-client';
import { Logger } from '@tekup/shared';

const client = new ApiClient();
const logger = new Logger();
```

### Authentication
Authentication packages provide secure authentication utilities:

```typescript
import { AuthService } from '@tekup/auth';
import { SSOProvider } from '@tekup/sso';

const auth = new AuthService();
const sso = new SSOProvider();
```

### UI Components
UI packages provide reusable React components:

```typescript
import { Button, Card } from '@tekup/ui';

function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
    </Card>
  );
}
```

## Development

### Building Packages
```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @tekup/shared build
```

### Testing Packages
```bash
# Test all packages
pnpm test

# Test specific package
pnpm --filter @tekup/shared test
```

### Linting
```bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm --filter @tekup/shared lint
```
