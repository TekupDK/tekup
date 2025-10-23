# RendetaljeOS Database Setup

This directory contains the complete database schema and configuration for RendetaljeOS, including Supabase-specific features like Row Level Security (RLS), Storage buckets, and Real-time subscriptions.

## Files Overview

- `schema.sql` - Complete database schema with all tables, indexes, and triggers
- `rls-policies.sql` - Row Level Security policies for multi-tenant data isolation
- `supabase-config.sql` - Supabase-specific configuration (storage, real-time, functions)
- `setup.sql` - Complete setup script that runs all other scripts
- `.env.example` - Environment variables template

## Quick Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for the project to be ready
4. Copy your project URL and API keys

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Run Database Setup

Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run the setup
supabase db reset
```

Option B: Using SQL Editor in Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `setup.sql`
4. Run the script

Option C: Using psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres"

# Run the setup script
\i setup.sql
```

## Database Schema Overview

### Core Tables

- **organizations** - Multi-tenant organization data
- **users** - All user types (owner, admin, employee, customer)
- **customers** - Customer profiles and preferences
- **team_members** - Employee data and performance metrics
- **jobs** - Core job management with full lifecycle
- **job_assignments** - Many-to-many job-to-employee assignments
- **time_entries** - Time tracking for jobs
- **recurring_jobs** - Templates for recurring cleaning jobs

### Communication & AI

- **customer_messages** - Customer-team communication
- **chat_sessions** - AI Friday chat sessions
- **chat_messages** - AI Friday conversation history
- **notifications** - System notifications

### Quality Control

- **quality_checklists** - Service-specific quality checklists
- **job_quality_assessments** - Quality control documentation
- **customer_reviews** - Customer feedback and ratings

### Audit & Security

- **audit_logs** - Audit trail for important actions
- Row Level Security (RLS) policies for data isolation
- Multi-tenant architecture with organization-based access control

## Storage Buckets

The setup creates the following Supabase Storage buckets:

- `job-photos` (public) - Before/after job photos
- `customer-documents` (private) - Customer contracts and documents
- `avatars` (public) - User profile pictures
- `quality-photos` (private) - Quality control documentation photos
- `signatures` (private) - Customer signatures

## Real-time Features

Real-time subscriptions are enabled for:

- Job status updates
- New customer messages
- Team member locations
- Notifications
- Chat messages

## Security Features

### Row Level Security (RLS)

All tables have RLS policies that ensure:

- **Organization isolation** - Users can only access data from their organization
- **Role-based access** - Different permissions for owners, admins, employees, and customers
- **Data privacy** - Customers can only see their own data
- **Audit compliance** - All important actions are logged

### Authentication

- JWT-based authentication via Supabase Auth
- Role-based access control (RBAC)
- Secure password reset and email verification flows

## Development Data

The setup script includes sample data for development:

- Default organization (Rendetalje.dk)
- Owner user account
- Quality checklists for different service types
- Sample customer

## Maintenance

### Regular Tasks

1. **Monitor performance** - Check slow queries and add indexes as needed
2. **Backup data** - Supabase provides automatic backups, but consider additional backups for critical data
3. **Update statistics** - PostgreSQL automatically updates statistics, but manual updates may be needed for large tables
4. **Clean up old data** - Consider archiving old jobs and messages

### Useful Queries

```sql
-- Check organization data isolation
SELECT organization_id, COUNT(*) FROM jobs GROUP BY organization_id;

-- Monitor storage usage
SELECT bucket_id, COUNT(*), SUM(metadata->>'size')::bigint as total_size
FROM storage.objects
GROUP BY bucket_id;

-- Check real-time subscriptions
SELECT schemaname, tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**

   - Ensure user is authenticated
   - Check if user belongs to correct organization
   - Verify user role permissions

2. **Storage Upload Errors**

   - Check file size limits
   - Verify MIME type restrictions
   - Ensure proper bucket policies

3. **Real-time Not Working**
   - Verify table is added to publication
   - Check WebSocket connection
   - Ensure proper authentication

### Support

For issues with the database setup:

1. Check Supabase logs in the dashboard
2. Review RLS policies for access issues
3. Monitor performance in the Supabase dashboard
4. Check the audit logs for security issues

## Migration Notes

When updating the schema:

1. Always backup data before migrations
2. Test migrations on a staging environment
3. Use Supabase migrations for version control
4. Update RLS policies if table structure changes
5. Regenerate TypeScript types after schema changes
