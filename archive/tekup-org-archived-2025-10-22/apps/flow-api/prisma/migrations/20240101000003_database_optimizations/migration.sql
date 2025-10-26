-- Create additional indexes for improved query performance

-- Composite index for tenantId and createdAt for sorting
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");

-- Composite index for tenantId and status for filtering
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");

-- Composite index for tenantId and source for filtering
CREATE INDEX "Lead_tenantId_source_idx" ON "Lead"("tenantId", "source");

-- Index on complianceType for compliance queries
CREATE INDEX "Lead_complianceType_idx" ON "Lead"("complianceType");

-- Index on duplicateOf for duplicate queries
CREATE INDEX "Lead_duplicateOf_idx" ON "Lead"("duplicateOf");

-- Composite index on tenantId and resolved for group queries
CREATE INDEX "DuplicateGroup_tenantId_resolved_idx" ON "DuplicateGroup"("tenantId", "resolved");

-- Index on leadId for member lookups
CREATE INDEX "DuplicateGroupMember_leadId_idx" ON "DuplicateGroupMember"("leadId");

-- Additional indexes for improved performance

-- Index on updatedAt for time-based queries
CREATE INDEX "Lead_tenantId_updatedAt_idx" ON "Lead"("tenantId", "updatedAt");

-- Index on status alone for global queries
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- Index on source alone for global queries
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- Composite index for tenantId, status, and createdAt for complex queries
CREATE INDEX "Lead_tenantId_status_createdAt_idx" ON "Lead"("tenantId", "status", "createdAt");

-- Composite index for tenantId, source, and createdAt for complex queries
CREATE INDEX "Lead_tenantId_source_createdAt_idx" ON "Lead"("tenantId", "source", "createdAt");

-- Index on tenantId for ApiKey table
CREATE INDEX "ApiKey_tenantId_idx" ON "ApiKey"("tenantId");

-- Index on leadId for LeadEvent table
CREATE INDEX "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");

-- Index on timestamp for ApiKeyUsageLog table
CREATE INDEX "ApiKeyUsageLog_timestamp_idx" ON "ApiKeyUsageLog"("timestamp");

-- Index on endpoint and method for ApiKeyUsageLog table
CREATE INDEX "ApiKeyUsageLog_endpoint_method_idx" ON "ApiKeyUsageLog"("endpoint", "method");

-- Index on tenantId and key for TenantSetting table
CREATE INDEX "TenantSetting_tenantId_key_idx" ON "TenantSetting"("tenantId", "key");

-- Index on tenantId and key for SettingsEvent table
CREATE INDEX "SettingsEvent_tenantId_key_idx" ON "SettingsEvent"("tenantId", "key");

-- BRIN index for createdAt on Lead table for large datasets (PostgreSQL 9.5+)
-- This is more space-efficient for large tables with time-series data
CREATE INDEX "Lead_createdAt_brin_idx" ON "Lead" USING brin("createdAt");

-- BRIN index for timestamp on LeadEvent table
CREATE INDEX "LeadEvent_createdAt_brin_idx" ON "LeadEvent" USING brin("createdAt");

-- Optimize existing indexes

-- Drop and recreate some indexes with better column order for common queries
-- This ensures the most selective column is first for better index usage

-- Recreate Lead search indexes with better configuration
-- Drop existing trigram indexes and recreate with better settings
DROP INDEX IF EXISTS "lead_name_trgm_idx";
DROP INDEX IF EXISTS "lead_email_trgm_idx";
DROP INDEX IF EXISTS "lead_company_trgm_idx";

-- Create more efficient trigram indexes
CREATE INDEX "Lead_name_trgm_idx" ON "Lead" USING gin("name" gin_trgm_ops);
CREATE INDEX "Lead_email_trgm_idx" ON "Lead" USING gin("email" gin_trgm_ops);
CREATE INDEX "Lead_company_trgm_idx" ON "Lead" USING gin("company" gin_trgm_ops);

-- Update the search vector trigger function to be more efficient
-- This function is called on every INSERT/UPDATE to maintain the search vector
CREATE OR REPLACE FUNCTION update_lead_search_vector()
RETURNS trigger AS $$
BEGIN
  -- Only update search vector if relevant fields have changed
  IF (TG_OP = 'INSERT') OR 
     (OLD.name IS DISTINCT FROM NEW.name) OR 
     (OLD.email IS DISTINCT FROM NEW.email) OR 
     (OLD.phone IS DISTINCT FROM NEW.phone) OR 
     (OLD.company IS DISTINCT FROM NEW.company) OR 
     (OLD.source IS DISTINCT FROM NEW.source) OR 
     (OLD.payload IS DISTINCT FROM NEW.payload) THEN
     
    NEW.search_vector := to_tsvector('english', 
      COALESCE(NEW.name, '') || ' ' ||
      COALESCE(NEW.email, '') || ' ' ||
      COALESCE(NEW.phone, '') || ' ' ||
      COALESCE(NEW.company, '') || ' ' ||
      COALESCE(NEW.source, '') || ' ' ||
      COALESCE(NEW.notes, '') || ' ' ||
      COALESCE(NEW.payload::text, '')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimize connection pool settings (these would be configured in the application)
-- Add comments to document the indexes
COMMENT ON INDEX "Lead_tenantId_createdAt_idx" IS 'Optimized for tenant-specific lead sorting by creation date';
COMMENT ON INDEX "Lead_tenantId_status_idx" IS 'Optimized for tenant-specific lead filtering by status';
COMMENT ON INDEX "Lead_tenantId_source_idx" IS 'Optimized for tenant-specific lead filtering by source';
COMMENT ON INDEX "Lead_complianceType_idx" IS 'Optimized for compliance-related queries';
COMMENT ON INDEX "Lead_duplicateOf_idx" IS 'Optimized for duplicate lead queries';
COMMENT ON INDEX "DuplicateGroup_tenantId_resolved_idx" IS 'Optimized for tenant-specific duplicate group queries';
COMMENT ON INDEX "DuplicateGroupMember_leadId_idx" IS 'Optimized for fast lookup of duplicate group members';