ALTER TABLE "friday_ai"."email_pipeline_state"
  ADD COLUMN IF NOT EXISTS "userId" integer;

UPDATE "friday_ai"."email_pipeline_state"
SET "userId" = COALESCE("userId", 1);

ALTER TABLE "friday_ai"."email_pipeline_state"
  ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "friday_ai"."email_pipeline_transitions"
  ADD COLUMN IF NOT EXISTS "userId" integer;

UPDATE "friday_ai"."email_pipeline_transitions"
SET "userId" = COALESCE("userId", 1);

ALTER TABLE "friday_ai"."email_pipeline_transitions"
  ALTER COLUMN "userId" SET NOT NULL;

-- Replace unique/index definitions to include user scope
DROP INDEX IF EXISTS "friday_ai"."email_pipeline_state_threadId_key";
DROP INDEX IF EXISTS "friday_ai"."idx_pipeline_state_stage";

CREATE UNIQUE INDEX IF NOT EXISTS "email_pipeline_state_threadId_userId_key"
  ON "friday_ai"."email_pipeline_state" ("threadId", "userId");

CREATE INDEX IF NOT EXISTS "idx_pipeline_state_stage_user"
  ON "friday_ai"."email_pipeline_state" ("stage", "userId");

DROP INDEX IF EXISTS "friday_ai"."idx_pipeline_transitions_thread";

CREATE INDEX IF NOT EXISTS "idx_pipeline_transitions_thread_user"
  ON "friday_ai"."email_pipeline_transitions" ("threadId", "userId");
