# RendetaljeOS → tekup-database Migration Plan

## 🎯 Mission

Migrer RendetaljeOS backend fra Supabase til central tekup-database med renos schema.

## 📊 Current State Analysis

### RendetaljeOS Backend (Current)

- **Location**: `C:\Users\empir\RendetaljeOS\backend`
- **Database**: Supabase PostgreSQL (cloud)
- **Client**: `@supabase/supabase-js`
- **Schema**: Defined in `database/schema.sql` (19 models equivalent)
- **Connection**: Via SupabaseService

### tekup-database (Target)

- **Location**: `C:\Users\empir\tekup-database`
- **Database**: PostgreSQL 16 localhost:5432 (tekup_db)
- **Schema**: `renos` (23 tables)
- **Client**: Prisma with `@tekup/database` package
- **Connection**: Direct PostgreSQL connection

## 🔄 Migration Steps

### Phase 1: Preparation & Analysis

1. **Backup Current Setup**
   - Copy current `.env` to `.env.supabase.backup`
   - Document current Supabase queries and models
   - Create rollback plan

2. **Analyze tekup-database Structure**
   - Review `@tekup/database` package structure
   - Map RendetaljeOS models to renos schema tables
   - Identify schema differences and required adaptations

### Phase 2: Install & Configure

3. **Install Dependencies**
   ```bash
   cd backend
   npm install @tekup/database
   npm uninstall @supabase/supabase-js  # Optional cleanup
   ```

4. **Update Environment Configuration**
   ```bash
   # New DATABASE_URL
   DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos
   
   # Keep Supabase backup
   SUPABASE_URL_BACKUP=https://[project].supabase.co
   SUPABASE_SERVICE_ROLE_KEY_BACKUP=[key]
   ```

### Phase 3: Code Migration

5. **Replace SupabaseService with PrismaService**
   - Create new `PrismaService` in `src/database/`
   - Update dependency injection in modules
   - Replace Supabase client calls with Prisma queries

6. **Update All Database Imports**
   - Replace `./supabase/supabase.service` imports
   - Update to `@tekup/database` renos client
   - Adapt query syntax from Supabase to Prisma

### Phase 4: Testing & Validation

7. **Test Database Connection**
   - Verify tekup-database Docker container is running
   - Test connection to renos schema
   - Validate all tables are accessible

8. **Test API Endpoints**
   - Run all existing tests
   - Verify CRUD operations work
   - Check data integrity and relationships

### Phase 5: Deployment

9. **Update Docker Configuration**
   - Ensure tekup-database-postgres container is running
   - Update docker-compose files if needed
   - Test full application startup

10. **Commit Changes**
    - Git add all modified files
    - Commit with descriptive message
    - Tag release for rollback reference

## 📋 Detailed Implementation Tasks

### Task 1: Create PrismaService

```typescript
// src/database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { renos } from '@tekup/database';

@Injectable()
export class PrismaService implements OnModuleInit {
  constructor() {}

  async onModuleInit() {
    await renos.$connect();
  }

  async onModuleDestroy() {
    await renos.$disconnect();
  }

  get client() {
    return renos;
  }
}
```

### Task 2: Update Module Dependencies

```typescript
// src/app.module.ts
import { PrismaService } from './database/prisma.service';

@Module({
  providers: [
    PrismaService, // Replace SupabaseService
    // ... other providers
  ],
})
```

### Task 3: Update Service Imports

```typescript
// Before (Supabase)
import { SupabaseService } from '../supabase/supabase.service';

constructor(private supabase: SupabaseService) {}

const { data } = await this.supabase.client
  .from('customers')
  .select('*')
  .eq('id', id);

// After (Prisma)
import { PrismaService } from '../database/prisma.service';

constructor(private prisma: PrismaService) {}

const customer = await this.prisma.client.customer.findUnique({
  where: { id }
});
```

## 🗺️ Schema Mapping

### RendetaljeOS → renos Schema Mapping

| RendetaljeOS Model | renos Table | Notes |
|-------------------|-------------|-------|
| organizations | organizations | Direct mapping |
| users | users | May need role field mapping |
| customers | customers | Check field compatibility |
| jobs | jobs | Verify status enum values |
| team_members | team_members | Check skills field format |
| time_entries | time_entries | Validate time format |
| photos | job_photos | May need table rename |
| ... | ... | Complete mapping needed |

## ⚠️ Risk Mitigation

### Potential Issues

1. **Schema Differences**: renos may have different field names/types
2. **Data Migration**: Existing Supabase data needs migration
3. **Authentication**: May need to adapt auth flow
4. **Real-time Features**: Supabase subscriptions → Prisma alternatives

### Rollback Plan

1. Restore `.env.supabase.backup`
2. Reinstall `@supabase/supabase-js`
3. Revert code changes from Git
4. Restart application with Supabase

## 🎯 Success Criteria

### Technical Validation

- [ ] Backend starts without errors
- [ ] All API endpoints respond correctly
- [ ] Database queries return expected data
- [ ] No duplicate schema conflicts
- [ ] All tests pass

### Functional Validation

- [ ] User authentication works
- [ ] CRUD operations function correctly
- [ ] Real-time features work (if applicable)
- [ ] File uploads work (if using database storage)
- [ ] Performance is acceptable

## 📝 Next Steps

1. **Immediate**: Analyze tekup-database structure
2. **Phase 1**: Create backup and preparation
3. **Phase 2**: Install @tekup/database package
4. **Phase 3**: Implement PrismaService
5. **Phase 4**: Update all service imports
6. **Phase 5**: Test and validate
7. **Phase 6**: Deploy and monitor

---

**Status**: Ready to begin migration
**Estimated Time**: 4-6 hours
**Risk Level**: Medium (good rollback plan available)
