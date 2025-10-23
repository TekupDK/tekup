# Schema Design Documentation

Complete schema design and data modeling for Tekup Database.

---

## Architecture Overview

Tekup Database uses **multi-schema PostgreSQL architecture** with schema-level isolation for different services while maintaining data relationships where needed.

### Schema Strategy

**Why Multi-Schema?**
- ✅ Logical separation of concerns
- ✅ Clear ownership boundaries
- ✅ Easier access control (schema-level permissions)
- ✅ Simplified backup/restore per service
- ✅ Better than multi-database (allows cross-schema queries)
- ✅ Lower infrastructure costs

**Schemas:**
```
tekup_db/
├── vault      - TekupVault (semantic search, document management)
├── billy      - Tekup-Billy MCP (caching, audit, metrics)
├── renos      - RenOS AI Assistant (leads, bookings, invoices)
├── crm        - CRM System (contacts, deals, pipeline)
├── flow       - Flow API (workflow automation)
└── shared     - Shared resources (users, audit logs)
```

---

## Vault Schema

**Purpose:** Document management with semantic search capabilities

### Models

#### `VaultDocument`
Primary document storage with metadata.

```prisma
model VaultDocument {
  id           String   @id @default(cuid())
  source       String   // 'github', 'notion', 'gdrive'
  repository   String   // Full repository path
  path         String   // File path within repository
  content      String   @db.Text
  sha          String?  // Git SHA for versioning
  metadata     Json?    // Flexible metadata storage
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  embeddings   VaultEmbedding[]
  
  @@unique([source, repository, path])
  @@index([source, repository])
  @@schema("vault")
}
```

**Design Decisions:**
- `cuid()` for distributed ID generation
- Composite unique constraint prevents duplicates
- Indexes on commonly queried fields
- `@db.Text` for unlimited content size
- JSON for flexible metadata

#### `VaultEmbedding`
Vector embeddings for semantic search.

```prisma
model VaultEmbedding {
  id          Int                      @id @default(autoincrement())
  documentId  String
  embedding   Unsupported("vector(1536)")
  createdAt   DateTime                 @default(now())
  
  document    VaultDocument            @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([documentId])
  @@schema("vault")
}
```

**Design Decisions:**
- pgvector for native PostgreSQL vector operations
- 1536 dimensions (OpenAI text-embedding-ada-002 compatible)
- Cascade delete maintains referential integrity
- Integer ID for performance (frequent similarity queries)

#### `VaultSyncStatus`
Track synchronization state per repository.

```prisma
model VaultSyncStatus {
  id           String   @id @default(cuid())
  source       String
  repository   String
  lastSyncAt   DateTime @default(now())
  status       String   // 'pending', 'in_progress', 'success', 'error'
  errorMessage String?  @db.Text
  documentCount Int     @default(0)
  
  @@unique([source, repository])
  @@schema("vault")
}
```

---

## Billy Schema

**Purpose:** Billy.dk MCP server with caching, audit logging, and usage tracking

### Models

#### `BillyOrganization`
Billy.dk organization mapping.

```prisma
model BillyOrganization {
  id          String   @id @default(cuid())
  name        String
  billyApiKey String   // Encrypted API key
  billyOrgId  String   @unique
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       BillyUser[]
  cache       BillyCache[]
  auditLogs   BillyAuditLog[]
  usageMetrics BillyUsageMetrics[]
  rateLimits  BillyRateLimit[]
  
  @@index([billyOrgId])
  @@schema("billy")
}
```

**Design Decisions:**
- Stores encrypted API keys
- One-to-many relationships for all related data
- Settings as JSON for flexibility

#### `BillyCache`
TTL-based caching for Billy API responses.

```prisma
model BillyCache {
  id             String   @id @default(cuid())
  organizationId String
  cacheKey       String   // e.g., "invoice:12345"
  data           Json
  expiresAt      DateTime
  createdAt      DateTime @default(now())
  
  organization   BillyOrganization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, cacheKey])
  @@index([expiresAt])
  @@schema("billy")
}
```

**Design Decisions:**
- Composite unique key for fast lookups
- TTL via `expiresAt` for automatic expiration checking
- Index on expiration for efficient cleanup queries

#### `BillyAuditLog`
Complete audit trail of all API operations.

```prisma
model BillyAuditLog {
  id             String   @id @default(cuid())
  organizationId String
  userId         String?
  toolName       String   // MCP tool name
  action         String   // 'read', 'create', 'update', 'delete'
  resourceType   String?  // 'invoice', 'contact', etc.
  resourceId     String?
  requestData    Json?
  responseData   Json?
  success        Boolean
  errorMessage   String?  @db.Text
  durationMs     Int?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())
  
  organization   BillyOrganization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId, createdAt])
  @@index([toolName])
  @@schema("billy")
}
```

**Design Decisions:**
- Comprehensive logging for compliance
- Performance metrics (durationMs)
- Security context (IP, user agent)
- Indexes for common query patterns

---

## RenOS Schema

**Purpose:** AI-powered cleaning service management

### Core Models

#### `RenosLead`
Lead management with AI scoring.

```prisma
model RenosLead {
  id              String    @id @default(cuid())
  source          String    // 'website_form', 'email', 'phone', 'referral'
  status          String    @default("new") // 'new', 'contacted', 'qualified', 'converted', 'lost'
  priority        String    @default("medium") // 'low', 'medium', 'high', 'urgent'
  score           Float?
  scoreMetadata   Json?
  
  // Contact info
  name            String?
  email           String?
  phone           String?
  address         String?
  
  // Enrichment
  companyName     String?
  industry        String?
  estimatedSize   String?
  estimatedValue  Float?
  enrichmentData  Json?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastScored      DateTime?
  lastEnriched    DateTime?
  lastContactAt   DateTime?
  
  // Relations
  customerId      String?
  customer        RenosCustomer?  @relation(fields: [customerId], references: [id])
  quotes          RenosQuote[]
  bookings        RenosBooking[]
  emailResponses  RenosEmailResponse[]
  
  @@index([status, priority])
  @@index([customerId])
  @@index([createdAt])
  @@schema("renos")
}
```

**Design Decisions:**
- AI scoring with metadata for explainability
- Flexible enrichment via JSON
- Status tracking for funnel analytics
- Multiple contact methods

#### `RenosBooking`
Job bookings with time tracking.

```prisma
model RenosBooking {
  id                  String    @id @default(cuid())
  customerId          String?
  leadId              String?
  serviceType         String?
  address             String?
  
  // Scheduling
  scheduledAt         DateTime
  estimatedDuration   Int       // minutes
  
  // Time tracking
  actualStartTime     DateTime?
  actualEndTime       DateTime?
  actualDuration      Int?      // minutes
  timeVariance        Int?      // difference from estimate
  efficiencyScore     Float?    // estimated/actual ratio
  timerStatus         String?   @default("not_started")
  
  // Status
  status              String    @default("scheduled")
  notes               String?   @db.Text
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  customer            RenosCustomer?  @relation(fields: [customerId], references: [id])
  lead                RenosLead?      @relation(fields: [leadId], references: [id])
  breaks              RenosBreak[]
  invoices            RenosInvoice[]
  
  @@index([customerId])
  @@index([scheduledAt])
  @@schema("renos")
}
```

**Design Decisions:**
- Separate estimated vs actual times
- Efficiency scoring for analytics
- Break tracking for accurate billing
- Status workflow management

---

## Shared Schema

**Purpose:** Cross-application resources

### Models

#### `SharedUser`
Unified user model across all services.

```prisma
model SharedUser {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("user")
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
  @@schema("shared")
}
```

#### `SharedAuditLog`
Cross-service audit logging.

```prisma
model SharedAuditLog {
  id           String   @id @default(cuid())
  userId       String?
  service      String   // 'vault', 'billy', 'renos', etc.
  action       String
  resourceType String?
  resourceId   String?
  metadata     Json?
  success      Boolean
  createdAt    DateTime @default(now())
  
  @@index([service, createdAt])
  @@index([userId])
  @@schema("shared")
}
```

---

## Design Patterns

### 1. Soft Deletes (Not Used)
**Decision:** Use hard deletes with CASCADE  
**Rationale:** Simpler, clearer data model. Use audit logs for history.

### 2. Timestamps
**Pattern:** Every table has `createdAt` and `updatedAt`  
**Rationale:** Essential for debugging and analytics

### 3. JSON Fields
**When to use:**
- Flexible metadata
- API responses (cache)
- Configuration settings
- Enrichment data

**When NOT to use:**
- Frequently queried fields
- Data requiring indexes
- Relationships

### 4. Indexes
**Strategy:**
- Primary keys (automatic)
- Foreign keys (automatic with Prisma)
- Frequently filtered fields
- Sort fields
- Composite indexes for common queries

### 5. IDs
**Strategy:**
- `cuid()` for distributed generation
- `autoincrement()` only for high-volume tables (embeddings)

---

## Performance Considerations

### Connection Pooling
```typescript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

### Query Optimization
- Use `select` to limit fields
- Eager load with `include` when needed
- Use transactions for multi-step operations
- Batch operations where possible

### Indexes
Review query patterns quarterly and add indexes as needed.

---

## Migration Strategy

### Adding New Models
1. Add to appropriate schema
2. Run `prisma migrate dev --name descriptive_name`
3. Update client libraries
4. Add tests
5. Update documentation

### Modifying Existing Models
1. Test on staging first
2. Backup production
3. Create migration
4. Deploy during low-traffic window
5. Monitor closely

---

## Future Enhancements

### Planned Features
- [ ] Full-text search (tsvector)
- [ ] Partitioning for large tables
- [ ] Read replicas for scaling
- [ ] GraphQL API layer
- [ ] Real-time subscriptions

---

**Last Updated:** 2025-10-21  
**Version:** 1.1.0
