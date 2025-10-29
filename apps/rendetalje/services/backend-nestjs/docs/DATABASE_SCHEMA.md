# RendetaljeOS Database Schema

## Overview

RendetaljeOS uses **PostgreSQL 14+** via **Supabase** with **Prisma ORM** for type-safe database access.

## Database Configuration

- **Provider**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.x
- **Connection**: Connection pooling enabled
- **Security**: Row Level Security (RLS) enforced

## Multi-Schema Architecture

```
PostgreSQL Database
├── public (main application data)
├── vault (knowledge base)
├── billy (accounting integration)
├── renos (calendar integration)
└── shared (shared resources)
```

## Core Tables

### users

User accounts and authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | User ID |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| name | VARCHAR(100) | NOT NULL | Full name |
| role | ENUM | NOT NULL | owner/admin/employee/customer |
| phone | VARCHAR(20) | | Phone number |
| avatar_url | TEXT | | Profile picture URL |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

**Indexes**:

- `idx_users_email` on `email`
- `idx_users_organization_id` on `organization_id`
- `idx_users_role` on `role`

**RLS Policies**:
```sql
-- Users can view users in their organization
CREATE POLICY "org_users_select" ON users FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));
```

---

### organizations

Organizations/companies using the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Organization ID |
| name | VARCHAR(200) | NOT NULL | Company name |
| cvr | VARCHAR(20) | UNIQUE | Danish CVR number |
| address | JSONB | | Address object |
| settings | JSONB | | Organization settings |
| subscription_tier | VARCHAR(50) | | Subscription level |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

---

### customers

Customer information and profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Customer ID |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| user_id | UUID | FK → users(id), NULL | Linked user account |
| name | VARCHAR(100) | NOT NULL | Customer name |
| email | VARCHAR(255) | | Email address |
| phone | VARCHAR(20) | | Phone number |
| address | JSONB | NOT NULL | Address object |
| preferences | JSONB | | Customer preferences |
| total_jobs | INTEGER | DEFAULT 0 | Total jobs count |
| total_revenue | DECIMAL(10,2) | DEFAULT 0 | Total revenue |
| satisfaction_score | NUMERIC(3,2) | | Avg satisfaction (1-5) |
| notes | TEXT | | Internal notes |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

**Address JSONB Structure**:
```json
{
  "street": "Vestergade 10, 2. tv",
  "city": "København",
  "postal_code": "1456",
  "country": "Denmark"
}
```

**Preferences JSONB Structure**:
```json
{
  "preferred_time": "morning|afternoon|evening",
  "contact_method": "email|phone|sms",
  "special_instructions": "Ring ved ankomst",
  "key_location": "Under måtten"
}
```

**Indexes**:

- `idx_customers_organization_id` on `organization_id`
- `idx_customers_email` on `email`
- `idx_customers_city` on `(address->>'city')`

---

### jobs

Cleaning jobs/bookings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Job ID |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| customer_id | UUID | FK → customers(id), NOT NULL | Customer |
| job_number | VARCHAR(50) | UNIQUE, NOT NULL | Job number (auto) |
| service_type | ENUM | NOT NULL | Service type |
| status | ENUM | NOT NULL, DEFAULT 'scheduled' | Job status |
| scheduled_date | TIMESTAMP | NOT NULL | Scheduled datetime |
| estimated_duration | INTEGER | NOT NULL | Minutes |
| actual_duration | INTEGER | | Actual minutes |
| location | JSONB | NOT NULL | Job location |
| special_instructions | TEXT | | Special notes |
| checklist | JSONB | | Quality checklist |
| photos | JSONB | | Photo URLs array |
| customer_signature | TEXT | | Base64 signature |
| quality_score | INTEGER | | Score 1-5 |
| profitability | JSONB | | Profit calculation |
| recurring_job_id | UUID | FK → recurring_jobs(id) | If recurring |
| parent_job_id | UUID | FK → jobs(id) | Parent job |
| invoice_id | VARCHAR(100) | | Billy.dk invoice ID |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

**Service Type ENUM**:

- `standard` - Standard cleaning
- `deep` - Deep cleaning
- `window` - Window cleaning
- `moveout` - Move-out cleaning
- `office` - Office cleaning

**Status ENUM**:

- `scheduled` - Scheduled
- `confirmed` - Confirmed by customer
- `in_progress` - Currently in progress
- `completed` - Completed
- `cancelled` - Cancelled
- `rescheduled` - Rescheduled

**Checklist JSONB Structure**:
```json
[
  {
    "id": "uuid",
    "title": "Kitchen cleaned",
    "completed": true,
    "photo_required": true,
    "photo_url": "https://...",
    "notes": "Extra attention to oven"
  }
]
```

**Indexes**:

- `idx_jobs_organization_id` on `organization_id`
- `idx_jobs_customer_id` on `customer_id`
- `idx_jobs_status` on `status`
- `idx_jobs_scheduled_date` on `scheduled_date`

---

### team_members

Team member information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Team member ID |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| user_id | UUID | FK → users(id), NOT NULL | User account |
| employment_type | ENUM | NOT NULL | Employment type |
| department | VARCHAR(100) | | Department |
| hourly_rate | DECIMAL(10,2) | NOT NULL | Hourly rate (DKK) |
| specializations | JSONB | | Skills array |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

**Employment Type ENUM**:

- `full-time`
- `part-time`
- `contractor`

---

### job_assignments

Team member assignments to jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Assignment ID |
| job_id | UUID | FK → jobs(id), NOT NULL | Job |
| team_member_id | UUID | FK → team_members(id), NOT NULL | Team member |
| role | VARCHAR(50) | | lead/assistant/quality_inspector |
| assigned_at | TIMESTAMP | DEFAULT NOW() | Assigned timestamp |
| started_at | TIMESTAMP | | Started timestamp |
| completed_at | TIMESTAMP | | Completed timestamp |

**Indexes**:

- `idx_job_assignments_job_id` on `job_id`
- `idx_job_assignments_team_member_id` on `team_member_id`

---

### time_entries

Time tracking entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Entry ID |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| team_member_id | UUID | FK → team_members(id), NOT NULL | Team member |
| job_id | UUID | FK → jobs(id), NULL | Associated job |
| start_time | TIMESTAMP | NOT NULL | Start time |
| end_time | TIMESTAMP | | End time |
| duration_minutes | INTEGER | | Calculated duration |
| activity_type | VARCHAR(50) | NOT NULL | Activity type |
| description | TEXT | | Description |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

**Indexes**:

- `idx_time_entries_team_member_id` on `team_member_id`
- `idx_time_entries_job_id` on `job_id`
- `idx_time_entries_start_time` on `start_time`

---

### time_corrections

Time entry correction requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Correction ID |
| time_entry_id | UUID | FK → time_entries(id), NOT NULL | Time entry |
| requested_by | UUID | FK → users(id), NOT NULL | Requester |
| requested_minutes | INTEGER | NOT NULL | Requested duration |
| reason | TEXT | NOT NULL | Reason |
| status | ENUM | DEFAULT 'pending' | Status |
| reviewed_by | UUID | FK → users(id) | Reviewer |
| reviewed_at | TIMESTAMP | | Review timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |

**Status ENUM**:

- `pending`
- `approved`
- `rejected`

---

### quality_checklists

Quality control checklist templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Checklist ID |
| organization_id | UUID | FK → organizations(id) | Organization |
| name | VARCHAR(200) | NOT NULL | Checklist name |
| service_type | ENUM | NOT NULL | Service type |
| items | JSONB | NOT NULL | Checklist items |
| version | INTEGER | DEFAULT 1 | Version number |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

---

### quality_assessments

Quality assessments for completed jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Assessment ID |
| job_id | UUID | FK → jobs(id), NOT NULL | Job |
| overall_score | NUMERIC(3,2) | NOT NULL | Score 1-5 |
| items_completed | INTEGER | NOT NULL | Items completed |
| notes | TEXT | | Assessment notes |
| photos | JSONB | | Photo URLs |
| assessed_by | UUID | FK → users(id), NOT NULL | Assessor |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Updated timestamp |

---

### messages

Customer communication messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Message ID |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| customer_id | UUID | FK → customers(id), NOT NULL | Customer |
| job_id | UUID | FK → jobs(id) | Related job |
| sender_id | UUID | FK → users(id), NOT NULL | Sender |
| message | TEXT | NOT NULL | Message content |
| message_type | ENUM | DEFAULT 'text' | Message type |
| is_read | BOOLEAN | DEFAULT false | Read status |
| read_at | TIMESTAMP | | Read timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |

**Message Type ENUM**:

- `text`
- `system`

---

### reviews

Customer reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Review ID |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| customer_id | UUID | FK → customers(id), NOT NULL | Customer |
| rating | NUMERIC(3,2) | NOT NULL | Rating 1-5 |
| comment | TEXT | | Review comment |
| service_type | ENUM | NOT NULL | Service type |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |

---

### notifications

User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Notification ID |
| user_id | UUID | FK → users(id), NOT NULL | User |
| organization_id | UUID | FK → organizations(id), NOT NULL | Organization |
| title | VARCHAR(200) | NOT NULL | Title |
| message | TEXT | NOT NULL | Message |
| type | ENUM | NOT NULL | Notification type |
| is_read | BOOLEAN | DEFAULT false | Read status |
| read_at | TIMESTAMP | | Read timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Created timestamp |

**Type ENUM**:

- `info`
- `success`
- `warning`
- `error`

---

## Prisma Schema Location

```
apps/rendetalje/services/backend-nestjs/prisma/schema.prisma
```

## Database Migrations

### Run Migrations

```bash
npx prisma migrate dev --name migration_name
npx prisma migrate deploy  # Production
```

### Generate Prisma Client

```bash
npx prisma generate
```

### View Database

```bash
npx prisma studio
```

## Performance Considerations

### Indexes

All foreign keys have indexes for join performance.

### Connection Pooling

- Pool size: 10 connections (configurable)
- Idle timeout: 30 seconds

### Query Optimization

- Use `select` to limit fields
- Use `include` for related data
- Pagination enforced on all list queries

## Backup Strategy

- **Automated**: Supabase daily backups
- **Manual**: Weekly exports via `pg_dump`
- **Retention**: 30 days

## Security

### Row Level Security (RLS)

All tables have RLS policies enforcing organization-level data isolation.

### Encryption

- Data at rest: AES-256
- Data in transit: TLS 1.3

### Access Control

- Application access via service role key
- User access via JWT tokens
- Admin access via Supabase dashboard

---

For API documentation, see [API_REFERENCE.md](./API_REFERENCE.md).

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).
