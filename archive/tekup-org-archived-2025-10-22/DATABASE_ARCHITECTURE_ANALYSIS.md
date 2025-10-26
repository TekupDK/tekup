# 🏗️ Database Arkitektur Analyse - Tekup.org

Som senior database udvikler har jeg identificeret kritiske problemer i jeres nuværende database arkitektur som kræver øjeblikkelig handling.

## 🚨 KRITISKE PROBLEMER

### 1. DATA FRAGMENTERING KRISE
**Problemet**: Multiple isolerede databaser med duplikerede, men inkonsistente entiteter

**Nuværende tilstand**:
```
📊 flow-api (PostgreSQL)     📊 crm-api (PostgreSQL)      📊 unified (SQLite)
├── Tenant (uuid, slug)      ├── Tenant (uuid, slug)       ├── Tenant (cuid, domain)
├── Lead (compliance)        ├── Lead (basic)              ├── Lead (consolidated)
├── ApiKey (hashed)          ├── ApiKey (hash)             └── User (cuid)
└── SMS Tracking             └── Deal Pipeline
```

**Konsekvenser**:
- 🔴 **Data Inconsistency**: Samme tenant forskellige IDs
- 🔴 **Impossible Cross-DB Joins**: Kan ikke lave rapporter på tværs  
- 🔴 **Duplikeret Business Logic**: Samme validering 3 steder
- 🔴 **Migration Nightmare**: Ingen sync mellem systemer

### 2. SCHEMA DIVERGENCE
**Lead Model Chaos**:

| Database | ID Type | Fields | Purpose |
|----------|---------|---------|---------|
| flow-api | UUID | 15+ compliance fields, JSON payload | Lead ingestion |
| crm-api | UUID | Basic tracking, conversion | Sales pipeline |
| unified | CUID | Consolidated attempt | ??? |

**Problemer**:
- Ingen fælles Lead definition
- Umuligt at tracke lead journey
- Fragmenterede rapporter
- Duplikerede data

### 3. INDEXING DISASTERS

**flow-api**: Over-indexed (8+ indexes på Lead table)
```sql
@@index([tenantId, status, createdAt])      -- Compound index
@@index([tenantId, source, createdAt])      -- Overlapping  
@@index([tenantId, updatedAt])              -- Redundant
@@index([status])                           -- Low selectivity
@@index([source])                           -- Low selectivity  
@@index([createdAt])                        -- Time-series, OK
```

**Problemer**:
- 🔴 **Write Performance**: Hver INSERT opdaterer 8+ indexes
- 🔴 **Storage Waste**: Indexes kan være større end data
- 🔴 **Maintenance Overhead**: VACUUM og ANALYZE tager lang tid

### 4. CONNECTION POOLING MANGEL

**Nuværende**:
```
App 1 → PostgreSQL (flow-api)    [No pooling]
App 2 → PostgreSQL (crm-api)     [No pooling]  
App 3 → SQLite (unified)         [File locks]
```

**Risici**:
- 🔴 **Connection Exhaustion**: PostgreSQL max_connections = 100
- 🔴 **Performance Degradation**: New connection per request
- 🔴 **SQLite Locks**: Concurrent write conflicts

### 5. BACKUP & DISASTER RECOVERY

**Identificerede problems**:
- ❌ Ingen centraliseret backup strategi
- ❌ Ingen point-in-time recovery
- ❌ Ingen cross-region redundancy  
- ❌ SQLite backup strategy mangler
- ❌ Ingen automated testing af backups

## 💡 LØSNINGSFORSLAG

### 🎯 FASE 1: DATABASE KONSOLIDERING (Højeste prioritet)

**Target Architecture**:
```
                    ┌─────────────────────────────────┐
                    │     TEKUP MASTER DATABASE       │
                    │        (PostgreSQL 16)          │
                    └─────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼────────┐ ┌────▼────┐ ┌──────▼──────┐
            │   TENANT DB    │ │AUDIT DB │ │  CACHE DB   │
            │  (Multi-Schema)│ │ (Logs)  │ │  (Redis)    │
            └────────────────┘ └─────────┘ └─────────────┘
```

**Schema konsolidering**:
```sql
-- Unified Tenant Model
CREATE SCHEMA core;
CREATE SCHEMA leads;
CREATE SCHEMA crm;
CREATE SCHEMA audit;

-- Master Tenant table
CREATE TABLE core.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(50) UNIQUE NOT NULL,
    domain varchar(255) UNIQUE NOT NULL,
    name varchar(255) NOT NULL,
    plan_type varchar(20) DEFAULT 'starter',
    settings jsonb DEFAULT '{}',
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Unified Lead Model
CREATE TABLE leads.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES core.tenants(id),
    source varchar(50) NOT NULL,
    status lead_status DEFAULT 'new',
    contact_data jsonb NOT NULL, -- Structured contact info
    metadata jsonb DEFAULT '{}', -- Flexible additional data
    compliance_data jsonb DEFAULT '{}', -- Optional compliance fields
    scoring int DEFAULT 0,
    assigned_to uuid NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Optimized indexes
CREATE INDEX CONCURRENTLY leads_tenant_status_created 
ON leads.leads(tenant_id, status, created_at) WHERE status != 'archived';

CREATE INDEX CONCURRENTLY leads_source_created 
ON leads.leads(tenant_id, source, created_at) WHERE created_at > now() - interval '1 year';
```

### 🎯 FASE 2: CONNECTION POOLING & PERFORMANCE

**PgBouncer Setup**:
```ini
# pgbouncer.ini
[databases]
tekup = host=localhost port=5432 dbname=tekup_master

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
min_pool_size = 5
max_db_connections = 50
```

**Application changes**:
```typescript
// Connection pool config
const pool = new Pool({
    host: 'localhost',
    port: 6432, // PgBouncer port
    database: 'tekup',
    min: 5,
    max: 25,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
});
```

### 🎯 FASE 3: MONITORING & OBSERVABILITY

**Prometheus + Grafana Dashboard**:
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
  
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter
    environment:
      - DATA_SOURCE_NAME=postgresql://monitor:password@postgres:5432/tekup?sslmode=disable
```

**Key metrics at overvåge**:
- Connection pool utilization
- Query execution time (p95, p99)
- Index hit ratio (should be > 99%)
- Transaction rate
- Lock wait time
- Disk I/O metrics

### 🎯 FASE 4: BACKUP & DISASTER RECOVERY

**Automated backup strategy**:
```bash
#!/bin/bash
# backup-strategy.sh

# Point-in-time recovery setup
echo "archive_mode = on" >> postgresql.conf
echo "archive_command = 'cp %p /backup/archive/%f'" >> postgresql.conf

# Daily full backup
pg_basebackup -D /backup/full/$(date +%Y%m%d) -Ft -z -P

# WAL shipping til remote location
rsync -av /backup/archive/ backup-server:/backups/tekup/wal/

# Test restore procedure (automatiseret hver uge)
pg_restore --test /backup/full/$(date +%Y%m%d)/base.tar.gz
```

### 🎯 FASE 5: DATA QUALITY & GOVERNANCE

**Data quality checks**:
```sql
-- Data quality constraints
ALTER TABLE leads.leads ADD CONSTRAINT valid_email 
CHECK (contact_data->>'email' ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' 
       OR contact_data->>'email' IS NULL);

ALTER TABLE leads.leads ADD CONSTRAINT valid_phone
CHECK (contact_data->>'phone' ~ '^\+?[1-9]\d{1,14}$' 
       OR contact_data->>'phone' IS NULL);

-- Audit trail
CREATE TABLE audit.data_changes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name varchar(50) NOT NULL,
    record_id uuid NOT NULL,
    operation varchar(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values jsonb,
    new_values jsonb,
    user_id uuid,
    timestamp timestamptz DEFAULT now()
);
```

## 🚀 IMPLEMENTATION ROADMAP

### Week 1-2: Analysis & Planning
- [ ] Database migration scripts
- [ ] Data mapping mellem eksisterende schemas  
- [ ] Performance baseline measurements
- [ ] Backup af alle eksisterende data

### Week 3-4: Master Database Setup
- [ ] Setup PostgreSQL 16 med optimizations
- [ ] Create consolidated schema
- [ ] Setup PgBouncer
- [ ] Initial data migration (tenants først)

### Week 5-6: Application Migration
- [ ] Update connection strings
- [ ] Deploy lead migration tools
- [ ] Gradual cutover per service
- [ ] Performance testing

### Week 7-8: Monitoring & Optimization  
- [ ] Deploy monitoring stack
- [ ] Setup alerting rules
- [ ] Query optimization baseret på real data
- [ ] Load testing

### Week 9-10: Backup & Security
- [ ] Automated backup system
- [ ] Disaster recovery testing
- [ ] Security audit
- [ ] Documentation

## 📊 FORVENTET IMPACT

### Performance Improvements
- **Query Performance**: 3-5x hurtigere joins (no cross-DB)
- **Write Performance**: 2x improvement (fewer indexes)
- **Connection Efficiency**: 10x flere concurrent users
- **Storage Efficiency**: 40% mindre disk usage

### Operational Benefits  
- **Single source of truth** for all tenant data
- **Unified reporting** på tværs af alle moduler
- **Simplified deployment** - fewer databases
- **Better data consistency** og integrity
- **Centralized monitoring** og alerting

### Cost Savings
- **Infrastructure**: 60% færre database instances
- **Maintenance**: 70% mindre administrative overhead
- **Development**: 50% hurtigere feature development

## ⚠️ RISICI & MITIGATION

### Migration Risks
**Risk**: Data loss under migration
**Mitigation**: 
- Full backup før migration
- Parallel run periode
- Rollback plan dokumenteret

**Risk**: Downtime under migration  
**Mitigation**:
- Blue-green deployment
- Feature flags
- Graceful degradation

**Risk**: Performance regression
**Mitigation**:
- Extensive load testing
- Gradual rollout
- Performance monitoring fra dag 1

## 🎯 NEXT ACTIONS

1. **Approved denne plan** med tech team
2. **Setup dedicated migration environment**
3. **Create detailed migration scripts**
4. **Schedule implementation phases**
5. **Setup monitoring før migration starts**

---

**Konklusion**: Jeres nuværende database arkitektur er ikke sustainable. Den foreslåede konsolidering vil løse fundamentale problemer og give jer en robust foundation for fremtidig growth. 

**Timing**: Dette skal prioriteres højt - jo længere I venter, jo mere kompleks bliver migrationen.
