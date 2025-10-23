-- =====================================================
-- Tekup Database - Initial Setup
-- =====================================================
-- This script runs on Docker container initialization
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS billy;
CREATE SCHEMA IF NOT EXISTS renos;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS flow;
CREATE SCHEMA IF NOT EXISTS shared;

-- Grant permissions
GRANT USAGE ON SCHEMA vault TO tekup;
GRANT USAGE ON SCHEMA billy TO tekup;
GRANT USAGE ON SCHEMA renos TO tekup;
GRANT USAGE ON SCHEMA crm TO tekup;
GRANT USAGE ON SCHEMA flow TO tekup;
GRANT USAGE ON SCHEMA shared TO tekup;

GRANT CREATE ON SCHEMA vault TO tekup;
GRANT CREATE ON SCHEMA billy TO tekup;
GRANT CREATE ON SCHEMA renos TO tekup;
GRANT CREATE ON SCHEMA crm TO tekup;
GRANT CREATE ON SCHEMA flow TO tekup;
GRANT CREATE ON SCHEMA shared TO tekup;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA vault GRANT ALL ON TABLES TO tekup;
ALTER DEFAULT PRIVILEGES IN SCHEMA billy GRANT ALL ON TABLES TO tekup;
ALTER DEFAULT PRIVILEGES IN SCHEMA renos GRANT ALL ON TABLES TO tekup;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL ON TABLES TO tekup;
ALTER DEFAULT PRIVILEGES IN SCHEMA flow GRANT ALL ON TABLES TO tekup;
ALTER DEFAULT PRIVILEGES IN SCHEMA shared GRANT ALL ON TABLES TO tekup;

-- Add comments
COMMENT ON SCHEMA vault IS 'TekupVault - Document storage and vector embeddings';
COMMENT ON SCHEMA billy IS 'Tekup-Billy - Billy.dk MCP integration';
COMMENT ON SCHEMA renos IS 'RenOS - Cleaning service management';
COMMENT ON SCHEMA crm IS 'Tekup CRM - Multi-tenant CRM platform';
COMMENT ON SCHEMA flow IS 'Flow API - Lead generation and compliance';
COMMENT ON SCHEMA shared IS 'Shared resources across applications';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tekup Database initialized successfully!';
  RAISE NOTICE '📁 Created 6 schemas: vault, billy, renos, crm, flow, shared';
  RAISE NOTICE '🔌 Extensions enabled: uuid-ossp, vector (pgvector)';
  RAISE NOTICE '🔐 Permissions granted to user: tekup';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for Prisma migrations!';
  RAISE NOTICE '   Run: pnpm db:migrate';
END $$;
