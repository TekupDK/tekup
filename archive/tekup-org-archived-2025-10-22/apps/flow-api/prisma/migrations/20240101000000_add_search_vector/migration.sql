-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "search_vector" tsvector;

-- CreateIndex
CREATE INDEX "lead_search_vector_idx" ON "Lead" USING gin("search_vector");

-- CreateIndex  
CREATE INDEX "lead_name_trgm_idx" ON "Lead" USING gin("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "lead_email_trgm_idx" ON "Lead" USING gin("email" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "lead_company_trgm_idx" ON "Lead" USING gin("company" gin_trgm_ops);

-- CreateFunction
CREATE OR REPLACE FUNCTION update_lead_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.email, '') || ' ' ||
    COALESCE(NEW.phone, '') || ' ' ||
    COALESCE(NEW.company, '') || ' ' ||
    COALESCE(NEW.source, '') || ' ' ||
    COALESCE(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER lead_search_vector_update
  BEFORE INSERT OR UPDATE ON "Lead"
  FOR EACH ROW EXECUTE FUNCTION update_lead_search_vector();

-- Update existing search vectors
UPDATE "Lead" 
SET search_vector = to_tsvector('english', 
  COALESCE(name, '') || ' ' ||
  COALESCE(email, '') || ' ' ||
  COALESCE(phone, '') || ' ' ||
  COALESCE(company, '') || ' ' ||
  COALESCE(source, '') || ' ' ||
  COALESCE(notes, '')
);