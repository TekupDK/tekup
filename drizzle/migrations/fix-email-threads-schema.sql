-- Migration: Fix email_threads table schema to match Drizzle ORM definition
-- This migration aligns the database schema with drizzle/schema.ts

-- Note: This migration assumes you're using the schema defined in drizzle.config.ts
-- Replace 'public' with your actual schema name if different

BEGIN;

-- Step 1: Rename threadId to gmailThreadId
ALTER TABLE email_threads
RENAME COLUMN "threadId" TO "gmailThreadId";

-- Step 2: Add new columns
ALTER TABLE email_threads
ADD COLUMN IF NOT EXISTS snippet TEXT,
ADD COLUMN IF NOT EXISTS labels JSONB,
ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT false NOT NULL;

-- Step 3: Convert participantEmails (TEXT) to participants (JSONB)
-- First, add the new participants column
ALTER TABLE email_threads
ADD COLUMN IF NOT EXISTS participants JSONB;

-- Migrate data: Convert comma-separated emails to JSONB array format
-- This handles the case where participantEmails contains comma-separated email addresses
UPDATE email_threads
SET participants = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', trim(email),
      'email', trim(email)
    )
  )
  FROM unnest(string_to_array("participantEmails", ',')) AS email
  WHERE trim(email) != ''
)
WHERE "participantEmails" IS NOT NULL;

-- Drop the old participantEmails column
ALTER TABLE email_threads
DROP COLUMN IF EXISTS "participantEmails";

-- Step 4: Remove obsolete columns
ALTER TABLE email_threads
DROP COLUMN IF EXISTS "messageCount",
DROP COLUMN IF EXISTS "pipelineStage";

-- Step 5: Verify the final structure matches Drizzle schema
-- Expected columns: id, userId, gmailThreadId, subject, participants, snippet, labels, lastMessageAt, isRead, createdAt, updatedAt

COMMIT;

-- To verify the migration, run:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'email_threads' ORDER BY ordinal_position;
