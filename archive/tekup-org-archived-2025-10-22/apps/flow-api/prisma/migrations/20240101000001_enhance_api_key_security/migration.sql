-- Enhancement of ApiKey model for security features
-- Add new columns for enhanced API key management

-- Add new security columns to ApiKey table
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "hashedKey" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "keyPrefix" VARCHAR(8);
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "rotatedFrom" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "rotationCount" INTEGER DEFAULT 0;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "revokedBy" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "permissions" TEXT[] DEFAULT '{}';
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "ipWhitelist" TEXT[] DEFAULT '{}';
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "environment" TEXT DEFAULT 'production';
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Create index for performance on key lookups
CREATE INDEX IF NOT EXISTS "ApiKey_hashedKey_idx" ON "ApiKey"("hashedKey");
CREATE INDEX IF NOT EXISTS "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");
CREATE INDEX IF NOT EXISTS "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");
CREATE INDEX IF NOT EXISTS "ApiKey_lastUsedAt_idx" ON "ApiKey"("lastUsedAt");
CREATE INDEX IF NOT EXISTS "ApiKey_tenantId_active_idx" ON "ApiKey"("tenantId", "active");

-- Create ApiKeyRotationHistory table for audit trail
CREATE TABLE IF NOT EXISTS "ApiKeyRotationHistory" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "oldKeyPrefix" VARCHAR(8),
    "newKeyPrefix" VARCHAR(8),
    "rotatedBy" TEXT,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ApiKeyRotationHistory_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "ApiKeyRotationHistory" ADD CONSTRAINT "ApiKeyRotationHistory_apiKeyId_fkey" 
FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for rotation history lookups
CREATE INDEX IF NOT EXISTS "ApiKeyRotationHistory_apiKeyId_idx" ON "ApiKeyRotationHistory"("apiKeyId");
CREATE INDEX IF NOT EXISTS "ApiKeyRotationHistory_rotatedAt_idx" ON "ApiKeyRotationHistory"("rotatedAt");

-- Create ApiKeyUsageLog table for usage tracking
CREATE TABLE IF NOT EXISTS "ApiKeyUsageLog" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseTime" INTEGER,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ApiKeyUsageLog_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for usage log
ALTER TABLE "ApiKeyUsageLog" ADD CONSTRAINT "ApiKeyUsageLog_apiKeyId_fkey" 
FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for usage log queries
CREATE INDEX IF NOT EXISTS "ApiKeyUsageLog_apiKeyId_idx" ON "ApiKeyUsageLog"("apiKeyId");
CREATE INDEX IF NOT EXISTS "ApiKeyUsageLog_timestamp_idx" ON "ApiKeyUsageLog"("timestamp");
CREATE INDEX IF NOT EXISTS "ApiKeyUsageLog_endpoint_method_idx" ON "ApiKeyUsageLog"("endpoint", "method");

-- Update RLS policies for new tables
ALTER TABLE "ApiKeyRotationHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKeyUsageLog" ENABLE ROW LEVEL SECURITY;

-- RLS policies for ApiKeyRotationHistory
CREATE POLICY tenant_isolation_rotation_history ON "ApiKeyRotationHistory"
FOR ALL USING (
  "apiKeyId" IN (
    SELECT id FROM "ApiKey" 
    WHERE "tenantId" = current_setting('app.tenant_id', true)::uuid
  )
);

-- RLS policies for ApiKeyUsageLog  
CREATE POLICY tenant_isolation_usage_log ON "ApiKeyUsageLog"
FOR ALL USING (
  "apiKeyId" IN (
    SELECT id FROM "ApiKey" 
    WHERE "tenantId" = current_setting('app.tenant_id', true)::uuid
  )
);

-- Migration script to hash existing keys (if any)
DO $$
DECLARE
    api_key_record RECORD;
    hashed_key TEXT;
    key_prefix TEXT;
BEGIN
    -- Only process keys that don't have hashedKey yet
    FOR api_key_record IN 
        SELECT id, key FROM "ApiKey" WHERE "hashedKey" IS NULL
    LOOP
        -- Generate bcrypt hash (Note: This is a simplified approach, 
        -- in production you'd use proper bcrypt hashing from application layer)
        hashed_key := encode(sha256(api_key_record.key::bytea), 'hex');
        key_prefix := left(api_key_record.key, 8);
        
        UPDATE "ApiKey" 
        SET 
            "hashedKey" = hashed_key,
            "keyPrefix" = key_prefix,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = api_key_record.id;
    END LOOP;
    
    RAISE NOTICE 'Migrated % API keys to new security format', 
        (SELECT COUNT(*) FROM "ApiKey" WHERE "hashedKey" IS NOT NULL);
END $$;

-- Add check constraint to ensure either key or hashedKey exists (transition period)
-- ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_key_or_hash_check" 
-- CHECK (("key" IS NOT NULL) OR ("hashedKey" IS NOT NULL));

-- Create function to automatically update lastUsedAt
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called from application layer, not automatically
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE "ApiKey" 
    SET 
        "active" = false,
        "revokedAt" = CURRENT_TIMESTAMP,
        "revokedReason" = 'Expired automatically'
    WHERE 
        "active" = true 
        AND "expiresAt" IS NOT NULL 
        AND "expiresAt" < CURRENT_TIMESTAMP
        AND "revokedAt" IS NULL;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old usage logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_usage_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM "ApiKeyUsageLog" 
    WHERE "timestamp" < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;