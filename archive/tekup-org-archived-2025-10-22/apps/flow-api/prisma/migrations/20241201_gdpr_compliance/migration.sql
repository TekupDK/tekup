-- GDPR Compliance Migration
-- Date: 2024-12-01
-- Purpose: Add GDPR compliance tables and RLS policies

-- Enable required extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- GDPR Compliance Tables
CREATE TABLE "CustomerConsent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL,
  "consentType" TEXT NOT NULL, -- 'marketing', 'data_processing', 'third_party'
  "consentGiven" BOOLEAN NOT NULL,
  "consentDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "consentWithdrawn" TIMESTAMP WITH TIME ZONE,
  "consentVersion" TEXT NOT NULL,
  "legalBasis" TEXT NOT NULL, -- 'consent', 'legitimate_interest', 'contract'
  "dataUsage" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "DataRetentionPolicy" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "dataType" TEXT NOT NULL, -- 'leads', 'customer_data', 'financial_records'
  "retentionPeriod" INTERVAL NOT NULL,
  "retentionReason" TEXT NOT NULL,
  "autoDelete" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "DataSubjectRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL,
  "requestType" TEXT NOT NULL, -- 'access', 'erasure', 'portability', 'rectification'
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  "requestedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "responseData" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all GDPR tables
ALTER TABLE "CustomerConsent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataRetentionPolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataSubjectRequest" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for GDPR tables
CREATE POLICY "tenant_isolation_customerconsent" ON "CustomerConsent"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_dataretentionpolicy" ON "DataRetentionPolicy"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_datasubjectrequest" ON "DataSubjectRequest"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

-- Indexes for performance
CREATE INDEX "idx_customerconsent_tenantid" ON "CustomerConsent"("tenantId");
CREATE INDEX "idx_customerconsent_customerid" ON "CustomerConsent"("customerId");
CREATE INDEX "idx_customerconsent_consenttype" ON "CustomerConsent"("consentType");
CREATE INDEX "idx_customerconsent_consentgiven" ON "CustomerConsent"("consentGiven");

CREATE INDEX "idx_dataretentionpolicy_tenantid" ON "DataRetentionPolicy"("tenantId");
CREATE INDEX "idx_dataretentionpolicy_datatype" ON "DataRetentionPolicy"("dataType");

CREATE INDEX "idx_datasubjectrequest_tenantid" ON "DataSubjectRequest"("tenantId");
CREATE INDEX "idx_datasubjectrequest_status" ON "DataSubjectRequest"("status");
CREATE INDEX "idx_datasubjectrequest_requesttype" ON "DataSubjectRequest"("requestType");
CREATE INDEX "idx_datasubjectrequest_customerid" ON "DataSubjectRequest"("customerId");

-- Seed default data retention policies for each tenant
INSERT INTO "DataRetentionPolicy" ("tenantId", "dataType", "retentionPeriod", "retentionReason", "autoDelete")
SELECT 
  t.id,
  'leads',
  INTERVAL '7 years',
  'Business records retention requirement',
  false
FROM "Tenant" t
WHERE t.slug IN ('rendetalje', 'foodtruck', 'tekup');

INSERT INTO "DataRetentionPolicy" ("tenantId", "dataType", "retentionPeriod", "retentionReason", "autoDelete")
SELECT 
  t.id,
  'customer_data',
  INTERVAL '3 years',
  'GDPR compliance - customer data retention',
  true
FROM "Tenant" t
WHERE t.slug IN ('rendetalje', 'foodtruck', 'tekup');

INSERT INTO "DataRetentionPolicy" ("tenantId", "dataType", "retentionPeriod", "retentionReason", "autoDelete")
SELECT 
  t.id,
  'financial_records',
  INTERVAL '10 years',
  'Tax and accounting compliance requirements',
  false
FROM "Tenant" t
WHERE t.slug IN ('rendetalje', 'foodtruck', 'tekup');

-- Add comments for documentation
COMMENT ON TABLE "CustomerConsent" IS 'Stores customer consent records for GDPR compliance';
COMMENT ON TABLE "DataRetentionPolicy" IS 'Defines data retention policies for different data types';
COMMENT ON TABLE "DataSubjectRequest" IS 'Tracks GDPR data subject requests (access, erasure, etc.)';

COMMENT ON COLUMN "CustomerConsent"."consentType" IS 'Type of consent: marketing, data_processing, third_party';
COMMENT ON COLUMN "CustomerConsent"."legalBasis" IS 'Legal basis for data processing: consent, legitimate_interest, contract';
COMMENT ON COLUMN "CustomerConsent"."dataUsage" IS 'JSON object describing how the data will be used';

COMMENT ON COLUMN "DataRetentionPolicy"."retentionPeriod" IS 'How long to retain this type of data';
COMMENT ON COLUMN "DataRetentionPolicy"."retentionReason" IS 'Legal or business reason for retention period';
COMMENT ON COLUMN "DataRetentionPolicy"."autoDelete" IS 'Whether to automatically delete data after retention period';

COMMENT ON COLUMN "DataSubjectRequest"."requestType" IS 'Type of GDPR request: access, erasure, portability, rectification';
COMMENT ON COLUMN "DataSubjectRequest"."status" IS 'Current status of the request: pending, processing, completed, rejected';
COMMENT ON COLUMN "DataSubjectRequest"."responseData" IS 'Data collected in response to access/portability requests';