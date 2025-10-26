-- Complete RLS policies for remaining models
-- Enable RLS on remaining tables
ALTER TABLE "TenantSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SettingsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DuplicateGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DuplicateGroupMember" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (idempotent)
DO $$
BEGIN
  -- TenantSetting policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_tenantsetting') THEN
    DROP POLICY tenant_isolation_tenantsetting ON "TenantSetting";
  END IF;
  
  -- SettingsEvent policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_settingsevent') THEN
    DROP POLICY tenant_isolation_settingsevent ON "SettingsEvent";
  END IF;
  
  -- DuplicateGroup policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_duplicategroup') THEN
    DROP POLICY tenant_isolation_duplicategroup ON "DuplicateGroup";
  END IF;
  
  -- DuplicateGroupMember policies (via relationship to DuplicateGroup)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_duplicategroupmember') THEN
    DROP POLICY tenant_isolation_duplicategroupmember ON "DuplicateGroupMember";
  END IF;
END $$;

-- Create RLS policies for remaining models
-- TenantSetting: Direct tenant relationship
CREATE POLICY tenant_isolation_tenantsetting ON "TenantSetting"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

-- SettingsEvent: Direct tenant relationship
CREATE POLICY tenant_isolation_settingsevent ON "SettingsEvent"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

-- DuplicateGroup: Direct tenant relationship
CREATE POLICY tenant_isolation_duplicategroup ON "DuplicateGroup"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

-- DuplicateGroupMember: Indirect tenant relationship via DuplicateGroup
CREATE POLICY tenant_isolation_duplicategroupmember ON "DuplicateGroupMember"
  USING ("duplicateGroupId" IN (
    SELECT id FROM "DuplicateGroup" 
    WHERE "tenantId" = current_setting('app.tenant_id', true)::uuid
  ))
  WITH CHECK ("duplicateGroupId" IN (
    SELECT id FROM "DuplicateGroup" 
    WHERE "tenantId" = current_setting('app.tenant_id', true)::uuid
  ));

-- Add comments for documentation
COMMENT ON POLICY tenant_isolation_tenantsetting ON "TenantSetting" IS 'Ensures tenant settings are isolated per tenant';
COMMENT ON POLICY tenant_isolation_settingsevent ON "SettingsEvent" IS 'Ensures settings events are isolated per tenant';
COMMENT ON POLICY tenant_isolation_duplicategroup ON "DuplicateGroup" IS 'Ensures duplicate groups are isolated per tenant';
COMMENT ON POLICY tenant_isolation_duplicategroupmember ON "DuplicateGroupMember" IS 'Ensures duplicate group members are isolated per tenant via group relationship';
