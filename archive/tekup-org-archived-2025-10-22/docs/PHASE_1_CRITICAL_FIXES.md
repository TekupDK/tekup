# Phase 1: Critical Fixes - Detailed Implementation

## 🚨 **Critical Issues to Fix**

### **1. Build Errors (1456+ TypeScript errors)**

#### **1.1 @tekup/shared Import Errors**
```typescript
// Problem: Cannot find module '@tekup/shared'
// Files affected: 50+ files

// Fix 1: Ensure @tekup/shared builds
cd packages/shared
pnpm build

// Fix 2: Update imports
// Replace: import { createLogger } from '@tekup/shared';
// With: import { createLogger } from '@tekup/shared';

// Fix 3: Add missing exports
// packages/shared/src/index.ts
export { createLogger } from './logging';
export { UUID, User } from './types';
// ... other exports
```

#### **1.2 Workspace Reference Errors**
```typescript
// Problem: @workspace/* references instead of @tekup/*
// Files affected: 20+ files

// Fix: Update all workspace references
find . -name "*.ts" -exec sed -i 's/@workspace/@tekup/g' {} \;
find . -name "*.json" -exec sed -i 's/@workspace/@tekup/g' {} \;

// Specific files to fix:
// packages/evolution-engine/package.json
// packages/testing/package.json
// Various import statements
```

#### **1.3 Missing Type Declarations**
```typescript
// Problem: Cannot find module declarations
// Files affected: 30+ files

// Fix 1: Add missing type declarations
// packages/shared/src/types.ts
export interface UUID extends String {}
export interface User {
  id: UUID;
  email: string;
  name: string;
  tenantId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fix 2: Update package.json files
// Add proper types field
{
  "types": "dist/index.d.ts",
  "main": "dist/index.js"
}
```

### **2. Dependency Conflicts**

#### **2.1 Version Conflicts**
```json
// Problem: Conflicting package versions
// Fix: Update to compatible versions

// packages/testing/package.json
{
  "dependencies": {
    "faker": "^6.6.6"  // Changed from ^8.4.1
  },
  "devDependencies": {
    "@types/faker": "^6.6.11"  // Changed from ^8.0.0
  }
}

// packages/evolution-engine/package.json
{
  "dependencies": {
    "@tekup/shared": "workspace:*"  // Changed from @workspace/shared
  }
}
```

#### **2.2 Missing Dependencies**
```json
// Problem: Missing peer dependencies
// Fix: Add missing dependencies

// packages/consciousness/package.json
{
  "dependencies": {
    "better-sqlite3": "^12.2.0"  // Add missing dependency
  }
}

// apps/flow-api/package.json
{
  "dependencies": {
    "@tekup/shared": "workspace:*"  // Add missing dependency
  }
}
```

### **3. Missing Implementations**

#### **3.1 Lead Service**
```typescript
// apps/flow-api/src/lead/lead.service.ts
// Problem: Missing implementation
// Fix: Complete implementation

export class LeadService {
  constructor(
    private prisma: PrismaService,
    private metrics: MetricsService
  ) {}

  async createLead(data: CreateLeadDto): Promise<Lead> {
    // Implementation
    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        tenantId: data.tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update metrics
    await this.metrics.incrementLeadCount(data.tenantId);

    return lead;
  }

  async getLeads(tenantId: string, filters?: LeadFilters): Promise<Lead[]> {
    // Implementation
    return await this.prisma.lead.findMany({
      where: {
        tenantId,
        ...filters
      }
    });
  }

  // ... other methods
}
```

#### **3.2 Metrics Service**
```typescript
// apps/flow-api/src/metrics/metrics.service.ts
// Problem: Missing implementation
// Fix: Complete implementation

export class MetricsService {
  private metrics: Map<string, number> = new Map();

  async incrementLeadCount(tenantId: string): Promise<void> {
    const key = `leads:${tenantId}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }

  async getLeadCount(tenantId: string): Promise<number> {
    const key = `leads:${tenantId}`;
    return this.metrics.get(key) || 0;
  }

  // ... other methods
}
```

#### **3.3 Prisma Service**
```typescript
// apps/flow-api/src/prisma/prisma.service.ts
// Problem: Missing implementation
// Fix: Complete implementation

export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### **4. Broken Module References**

#### **4.1 Auth Module**
```typescript
// apps/flow-api/src/auth/auth.module.ts
// Problem: Missing module
// Fix: Create module

@Module({
  providers: [ApiKeyService, TenantContextService],
  exports: [ApiKeyService, TenantContextService]
})
export class AuthModule {}
```

#### **4.2 WebSocket Module**
```typescript
// apps/flow-api/src/websocket/websocket.module.ts
// Problem: Missing module
// Fix: Create module

@Module({
  providers: [EventsGateway, WebSocketService],
  exports: [EventsGateway, WebSocketService]
})
export class WebSocketModule {}
```

---

## 🔧 **Step-by-Step Fix Process**

### **Day 1: Fix Dependencies**
```bash
# 1. Fix workspace references
find . -name "*.ts" -exec sed -i 's/@workspace/@tekup/g' {} \;
find . -name "*.json" -exec sed -i 's/@workspace/@tekup/g' {} \;

# 2. Fix version conflicts
cd packages/testing
npm install faker@^6.6.6 @types/faker@^6.6.11

# 3. Install missing dependencies
pnpm install

# 4. Test build
pnpm build
```

### **Day 2: Fix TypeScript Errors**
```bash
# 1. Fix @tekup/shared imports
cd packages/shared
pnpm build

# 2. Fix missing type declarations
# Add missing types to packages/shared/src/types.ts

# 3. Fix import statements
# Update all import statements to use correct paths

# 4. Test build
pnpm build
```

### **Day 3: Complete Missing Implementations**
```bash
# 1. Complete LeadService
# Implement all missing methods

# 2. Complete MetricsService
# Implement all missing methods

# 3. Complete PrismaService
# Implement all missing methods

# 4. Test build
pnpm build
```

### **Day 4: Fix Module References**
```bash
# 1. Create missing modules
# AuthModule, WebSocketModule, etc.

# 2. Fix import statements
# Update all module imports

# 3. Test build
pnpm build
```

### **Day 5: Final Testing**
```bash
# 1. Run all tests
pnpm test

# 2. Run integration tests
pnpm test:integration

# 3. Test all apps
cd apps/flow-api && npm run build
cd apps/tekup-crm-api && npm run build
cd apps/inbox-ai && npm run build
```

---

## 📊 **Progress Tracking**

### **Critical Fixes Checklist**
- [ ] Fix workspace references (@workspace -> @tekup)
- [ ] Fix version conflicts (faker, types, etc.)
- [ ] Fix @tekup/shared imports
- [ ] Add missing type declarations
- [ ] Complete LeadService implementation
- [ ] Complete MetricsService implementation
- [ ] Complete PrismaService implementation
- [ ] Create missing modules (Auth, WebSocket, etc.)
- [ ] Fix all TypeScript compilation errors
- [ ] Test all apps build successfully

### **Success Criteria**
- ✅ All apps build without errors (0 TypeScript errors)
- ✅ All dependencies resolved
- ✅ All tests passing
- ✅ Basic functionality working
- ✅ Inter-app communication working

---

## 🚨 **Risk Mitigation**

### **Backup Strategy**
```bash
# Before starting fixes
git checkout -b phase-1-critical-fixes
git add .
git commit -m "Backup before critical fixes"

# After each major fix
git add .
git commit -m "Fixed [specific issue]"
```

### **Rollback Plan**
```bash
# If fixes break something
git checkout main
git branch -D phase-1-critical-fixes
# Start over with more careful approach
```

### **Testing Strategy**
```bash
# After each fix
pnpm build
pnpm test

# If build fails
git checkout HEAD~1
# Try different approach
```

---

## 📝 **Notes**

### **Common Issues**
1. **Import paths**: Make sure all imports use correct paths
2. **Type declarations**: Add missing type declarations
3. **Module exports**: Ensure all modules export what they should
4. **Dependencies**: Make sure all dependencies are compatible

### **Best Practices**
1. **One fix at a time**: Don't try to fix everything at once
2. **Test frequently**: Test after each fix
3. **Commit often**: Commit after each successful fix
4. **Document changes**: Document what was fixed

---

**Dokument oprettet**: $(date)
**Sidst opdateret**: $(date)
**Status**: Ready for implementation