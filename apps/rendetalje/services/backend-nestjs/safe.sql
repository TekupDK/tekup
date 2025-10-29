-- CreateTable
CREATE TABLE "billy"."organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "billy_api_key" TEXT NOT NULL,
    "billy_organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "api_key_rotated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "billy"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "billy"."cached_invoices" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "billy_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "cached_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cached_invoices_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "billy"."cached_customers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "billy_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "cached_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cached_customers_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "billy"."cached_products" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "billy_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "cached_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cached_products_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "billy"."audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "user_id" UUID,
    "tool_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "input_params" JSONB,
    "output_data" JSONB,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "billy"."usage_metrics" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "hour" SMALLINT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "call_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "avg_duration_ms" INTEGER,
    "cache_hit_rate" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "billy"."rate_limits" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."data_export_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "request_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "download_url" TEXT,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."data_deletion_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "request_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_deletion_date" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."consent_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."privacy_policies" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "privacy_policies_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."quality_checklists" (
    "id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "items" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quality_checklists_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."quality_assessments" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "assessed_by" TEXT NOT NULL,
    "completed_items" JSONB NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "percentage_score" DOUBLE PRECISION NOT NULL,
    "total_points_earned" INTEGER NOT NULL,
    "max_possible_points" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quality_assessments_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."photo_documentation" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "checklist_item_id" TEXT,
    "type" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "description" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "photo_documentation_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."security_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMPTZ,
    "resolved_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."team_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "skills" TEXT[],
    "hourly_rate" DOUBLE PRECISION,
    "availability" JSONB NOT NULL DEFAULT '{}',
    "performance_metrics" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hire_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."time_entries" (
    "id" TEXT NOT NULL,
    "team_member_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "booking_id" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ,
    "break_duration" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "location" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."time_corrections" (
    "id" TEXT NOT NULL,
    "original_entry_id" TEXT NOT NULL,
    "original_start_time" TIMESTAMPTZ NOT NULL,
    "original_end_time" TIMESTAMPTZ,
    "original_break_duration" INTEGER NOT NULL,
    "corrected_start_time" TIMESTAMPTZ NOT NULL,
    "corrected_end_time" TIMESTAMPTZ,
    "corrected_break_duration" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "time_corrections_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."leads" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "customer_id" TEXT,
    "source" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "square_meters" DOUBLE PRECISION,
    "rooms" INTEGER,
    "task_type" TEXT,
    "preferred_dates" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'new',
    "email_thread_id" TEXT,
    "follow_up_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_follow_up_date" TIMESTAMPTZ,
    "idempotency_key" TEXT,
    "company_name" TEXT,
    "industry" TEXT,
    "estimated_size" TEXT,
    "estimated_value" DOUBLE PRECISION,
    "enrichment_data" JSONB,
    "last_enriched" TIMESTAMPTZ,
    "score" INTEGER DEFAULT 0,
    "priority" TEXT DEFAULT 'medium',
    "last_scored" TIMESTAMPTZ,
    "score_metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."quotes" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "hourly_rate" DOUBLE PRECISION NOT NULL,
    "estimated_hours" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vat_rate" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "valid_until" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."bookings" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "lead_id" TEXT,
    "quote_id" TEXT,
    "service_type" TEXT,
    "address" TEXT,
    "scheduled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_duration" INTEGER NOT NULL DEFAULT 120,
    "start_time" TIMESTAMPTZ,
    "end_time" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "calendar_event_id" TEXT,
    "calendar_link" TEXT,
    "notes" TEXT,
    "actual_start_time" TIMESTAMPTZ,
    "actual_end_time" TIMESTAMPTZ,
    "actual_duration" INTEGER,
    "time_variance" INTEGER,
    "efficiency_score" DOUBLE PRECISION,
    "time_notes" TEXT,
    "timer_status" TEXT NOT NULL DEFAULT 'not_started',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "company_name" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tags" TEXT[],
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_contact_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."conversations" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "lead_id" TEXT,
    "subject" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'active',
    "gmail_thread_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "closed_at" TIMESTAMPTZ,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."email_ingest_runs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'running',
    "total_emails" INTEGER NOT NULL DEFAULT 0,
    "new_emails" INTEGER NOT NULL DEFAULT 0,
    "updated_emails" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "error_log" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_ingest_runs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."email_threads" (
    "id" TEXT NOT NULL,
    "gmail_thread_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "subject" TEXT NOT NULL,
    "snippet" TEXT,
    "last_message_at" TIMESTAMPTZ NOT NULL,
    "participants" TEXT[],
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "labels" TEXT[],
    "is_matched" BOOLEAN NOT NULL DEFAULT false,
    "matched_at" TIMESTAMPTZ,
    "matched_by" TEXT,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_threads_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."email_messages" (
    "id" TEXT NOT NULL,
    "gmail_message_id" TEXT,
    "gmail_thread_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT[],
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "body_preview" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'inbound',
    "status" TEXT NOT NULL DEFAULT 'delivered',
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_model" TEXT,
    "sent_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "conversation_id" TEXT,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."email_responses" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "gmail_thread_id" TEXT,
    "gmail_message_id" TEXT,
    "sent_at" TIMESTAMPTZ,
    "rejected_reason" TEXT,
    "ai_model" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "email_responses_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."escalations" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "thread_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "conflict_score" INTEGER NOT NULL,
    "matched_keywords" TEXT[],
    "email_snippet" TEXT NOT NULL,
    "escalated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalated_by" TEXT NOT NULL,
    "jonas_notified" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMPTZ,
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."cleaning_plans" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "service_type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'once',
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "estimated_duration" INTEGER NOT NULL DEFAULT 120,
    "estimated_price" DOUBLE PRECISION,
    "square_meters" DOUBLE PRECISION,
    "address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cleaning_plans_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."cleaning_tasks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "estimated_time" INTEGER NOT NULL DEFAULT 15,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "price_per_task" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cleaning_tasks_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."cleaning_plan_bookings" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "completed_tasks" TEXT[],
    "actual_duration" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cleaning_plan_bookings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."breaks" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ,
    "duration" INTEGER,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "breaks_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "booking_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_address" TEXT,
    "issue_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vat_rate" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    "vat_amount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "paid_amount" DOUBLE PRECISION,
    "payment_method" TEXT,
    "payment_ref" TEXT,
    "billy_invoice_id" TEXT,
    "billy_contact_id" TEXT,
    "billy_synced_at" TIMESTAMPTZ,
    "billy_pdf_url" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "sent_at" TIMESTAMPTZ,
    "reminder_sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."task_executions" (
    "id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "task_payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "duration" INTEGER,
    "trace_id" TEXT,
    "session_id" TEXT,
    "user_id" TEXT,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "correction_type" TEXT,
    "executed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_executions_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."competitor_pricing" (
    "id" TEXT NOT NULL,
    "competitor" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "pricing_data" JSONB NOT NULL,
    "scraped_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credits_used" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "competitor_pricing_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."labels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."customer_intelligence" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "access_notes" TEXT,
    "parking_instructions" TEXT,
    "special_instructions" TEXT,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "fixed_schedule" JSONB,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "completed_bookings" INTEGER NOT NULL DEFAULT 0,
    "canceled_bookings" INTEGER NOT NULL DEFAULT 0,
    "average_job_duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_booking_date" TIMESTAMPTZ,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_factors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_booking_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstanding_invoices" INTEGER NOT NULL DEFAULT 0,
    "payment_history" TEXT NOT NULL DEFAULT 'good',
    "satisfaction_score" DOUBLE PRECISION,
    "complaints" INTEGER NOT NULL DEFAULT 0,
    "praises" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_intelligence_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."booking_validations" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "validation_type" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "input" JSONB NOT NULL,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "errors" JSONB NOT NULL DEFAULT '[]',
    "action" TEXT NOT NULL,
    "reviewed_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_validations_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."overtime_logs" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "estimated_hours" DOUBLE PRECISION NOT NULL,
    "actual_hours" DOUBLE PRECISION,
    "overtime_hours" DOUBLE PRECISION,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT,
    "alert_sent_at" TIMESTAMPTZ,
    "alert_method" TEXT,
    "communication_log" JSONB NOT NULL DEFAULT '[]',
    "customer_notified" BOOLEAN NOT NULL DEFAULT false,
    "customer_response" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overtime_logs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."learned_patterns" (
    "id" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "pattern_data" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "last_observed" TIMESTAMPTZ NOT NULL,
    "last_validated" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learned_patterns_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."undo_actions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "undone_at" TIMESTAMPTZ,
    "undone_by" TEXT,

    CONSTRAINT "undo_actions_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmContact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "title" TEXT,
    "companyId" TEXT,
    "linkedIn" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'Denmark',
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "owner" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUp" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "revenue" DOUBLE PRECISION,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'Denmark',
    "vatNumber" TEXT,
    "registrationNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "owner" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmCompany_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmDeal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DKK',
    "stage" TEXT NOT NULL DEFAULT 'qualification',
    "pipeline" TEXT NOT NULL DEFAULT 'sales',
    "probability" INTEGER,
    "contactId" TEXT,
    "companyId" TEXT,
    "owner" TEXT NOT NULL,
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "lostReason" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmDeal_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmDealProduct" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmDealProduct_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    "contactId" TEXT,
    "companyId" TEXT,
    "dealId" TEXT,
    "owner" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "outcome" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmEmail" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT[],
    "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "contactId" TEXT,
    "externalId" TEXT,
    "threadId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmEmail_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT NOT NULL,
    "contactId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "crm"."CrmMetric" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmMetric_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "trigger" JSONB NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 3600,
    "retryAttempts" INTEGER NOT NULL DEFAULT 3,
    "owner" TEXT NOT NULL,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgDurationMs" INTEGER,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowWorkflow_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "currentStep" TEXT,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failedStep" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "triggeredBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "FlowExecution_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowExecutionStep" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowExecutionStep_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowExecutionLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "stepId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowExecutionLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowSchedule" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cronExpression" TEXT,
    "intervalMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Copenhagen',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxRuns" INTEGER,
    "currentRuns" INTEGER NOT NULL DEFAULT 0,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowSchedule_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowWebhook" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "secret" TEXT,
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastRequestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowWebhook_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowIntegration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastError" TEXT,
    "owner" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowIntegration_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowVariable" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowVariable_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "flow"."FlowMetric" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "workflowId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowMetric_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "shared"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "shared"."audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."subcontractor_agreements" (
    "id" TEXT NOT NULL,

    CONSTRAINT "subcontractor_agreements_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."subcontractor_availability" (
    "id" TEXT NOT NULL,

    CONSTRAINT "subcontractor_availability_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "renos"."push_subscriptions" (
    "id" TEXT NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "organizations_billy_organization_id_key" ON "billy"."organizations"("billy_organization_id");
-- CreateIndex
CREATE INDEX "organizations_is_active_idx" ON "billy"."organizations"("is_active");
-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "billy"."users"("organization_id");
-- CreateIndex
CREATE UNIQUE INDEX "users_email_organization_id_key" ON "billy"."users"("email", "organization_id");
-- CreateIndex
CREATE INDEX "cached_invoices_organization_id_idx" ON "billy"."cached_invoices"("organization_id");
-- CreateIndex
CREATE INDEX "cached_invoices_expires_at_idx" ON "billy"."cached_invoices"("expires_at");
-- CreateIndex
CREATE UNIQUE INDEX "cached_invoices_organization_id_billy_id_key" ON "billy"."cached_invoices"("organization_id", "billy_id");
-- CreateIndex
CREATE INDEX "cached_customers_organization_id_idx" ON "billy"."cached_customers"("organization_id");
-- CreateIndex
CREATE INDEX "cached_customers_expires_at_idx" ON "billy"."cached_customers"("expires_at");
-- CreateIndex
CREATE UNIQUE INDEX "cached_customers_organization_id_billy_id_key" ON "billy"."cached_customers"("organization_id", "billy_id");
-- CreateIndex
CREATE INDEX "cached_products_organization_id_idx" ON "billy"."cached_products"("organization_id");
-- CreateIndex
CREATE INDEX "cached_products_expires_at_idx" ON "billy"."cached_products"("expires_at");
-- CreateIndex
CREATE UNIQUE INDEX "cached_products_organization_id_billy_id_key" ON "billy"."cached_products"("organization_id", "billy_id");
-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "billy"."audit_logs"("organization_id");
-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "billy"."audit_logs"("user_id");
-- CreateIndex
CREATE INDEX "audit_logs_tool_name_idx" ON "billy"."audit_logs"("tool_name");
-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "billy"."audit_logs"("created_at");
-- CreateIndex
CREATE INDEX "usage_metrics_organization_id_idx" ON "billy"."usage_metrics"("organization_id");
-- CreateIndex
CREATE INDEX "usage_metrics_date_idx" ON "billy"."usage_metrics"("date");
-- CreateIndex
CREATE UNIQUE INDEX "usage_metrics_organization_id_date_hour_tool_name_key" ON "billy"."usage_metrics"("organization_id", "date", "hour", "tool_name");
-- CreateIndex
CREATE INDEX "rate_limits_organization_id_idx" ON "billy"."rate_limits"("organization_id");
-- CreateIndex
CREATE INDEX "rate_limits_window_start_idx" ON "billy"."rate_limits"("window_start");
-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_organization_id_endpoint_window_start_key" ON "billy"."rate_limits"("organization_id", "endpoint", "window_start");
-- CreateIndex
CREATE INDEX "chat_sessions_user_id_idx" ON "renos"."chat_sessions"("user_id");
-- CreateIndex
CREATE INDEX "chat_sessions_organization_id_idx" ON "renos"."chat_sessions"("organization_id");
-- CreateIndex
CREATE INDEX "chat_sessions_updated_at_idx" ON "renos"."chat_sessions"("updated_at");
-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "renos"."chat_messages"("session_id");
-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "renos"."chat_messages"("created_at");
-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "renos"."users"("email");
-- CreateIndex
CREATE INDEX "users_email_idx" ON "renos"."users"("email");
-- CreateIndex
CREATE INDEX "users_role_idx" ON "renos"."users"("role");
-- CreateIndex
CREATE INDEX "data_export_requests_user_id_idx" ON "renos"."data_export_requests"("user_id");
-- CreateIndex
CREATE INDEX "data_export_requests_status_idx" ON "renos"."data_export_requests"("status");
-- CreateIndex
CREATE INDEX "data_export_requests_created_at_idx" ON "renos"."data_export_requests"("created_at");
-- CreateIndex
CREATE INDEX "data_deletion_requests_user_id_idx" ON "renos"."data_deletion_requests"("user_id");
-- CreateIndex
CREATE INDEX "data_deletion_requests_status_idx" ON "renos"."data_deletion_requests"("status");
-- CreateIndex
CREATE INDEX "data_deletion_requests_scheduled_deletion_date_idx" ON "renos"."data_deletion_requests"("scheduled_deletion_date");
-- CreateIndex
CREATE INDEX "consent_records_user_id_idx" ON "renos"."consent_records"("user_id");
-- CreateIndex
CREATE INDEX "consent_records_consent_type_idx" ON "renos"."consent_records"("consent_type");
-- CreateIndex
CREATE INDEX "consent_records_granted_idx" ON "renos"."consent_records"("granted");
-- CreateIndex
CREATE UNIQUE INDEX "privacy_policies_version_key" ON "renos"."privacy_policies"("version");
-- CreateIndex
CREATE INDEX "privacy_policies_version_idx" ON "renos"."privacy_policies"("version");
-- CreateIndex
CREATE INDEX "privacy_policies_active_idx" ON "renos"."privacy_policies"("active");
-- CreateIndex
CREATE INDEX "quality_checklists_service_type_idx" ON "renos"."quality_checklists"("service_type");
-- CreateIndex
CREATE INDEX "quality_checklists_is_active_idx" ON "renos"."quality_checklists"("is_active");
-- CreateIndex
CREATE INDEX "quality_checklists_version_idx" ON "renos"."quality_checklists"("version");
-- CreateIndex
CREATE INDEX "quality_assessments_lead_id_idx" ON "renos"."quality_assessments"("lead_id");
-- CreateIndex
CREATE INDEX "quality_assessments_checklist_id_idx" ON "renos"."quality_assessments"("checklist_id");
-- CreateIndex
CREATE INDEX "quality_assessments_assessed_by_idx" ON "renos"."quality_assessments"("assessed_by");
-- CreateIndex
CREATE INDEX "quality_assessments_overall_score_idx" ON "renos"."quality_assessments"("overall_score");
-- CreateIndex
CREATE INDEX "quality_assessments_status_idx" ON "renos"."quality_assessments"("status");
-- CreateIndex
CREATE INDEX "photo_documentation_lead_id_idx" ON "renos"."photo_documentation"("lead_id");
-- CreateIndex
CREATE INDEX "photo_documentation_type_idx" ON "renos"."photo_documentation"("type");
-- CreateIndex
CREATE INDEX "photo_documentation_uploaded_by_idx" ON "renos"."photo_documentation"("uploaded_by");
-- CreateIndex
CREATE INDEX "photo_documentation_timestamp_idx" ON "renos"."photo_documentation"("timestamp");
-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "renos"."notifications"("user_id");
-- CreateIndex
CREATE INDEX "notifications_organization_id_idx" ON "renos"."notifications"("organization_id");
-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "renos"."notifications"("is_read");
-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "renos"."notifications"("type");
-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "renos"."notifications"("created_at");
-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "renos"."audit_logs"("organization_id");
-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "renos"."audit_logs"("user_id");
-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "renos"."audit_logs"("action");
-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "renos"."audit_logs"("entity_type");
-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "renos"."audit_logs"("created_at");
-- CreateIndex
CREATE INDEX "security_events_organization_id_idx" ON "renos"."security_events"("organization_id");
-- CreateIndex
CREATE INDEX "security_events_user_id_idx" ON "renos"."security_events"("user_id");
-- CreateIndex
CREATE INDEX "security_events_event_type_idx" ON "renos"."security_events"("event_type");
-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "renos"."security_events"("severity");
-- CreateIndex
CREATE INDEX "security_events_resolved_idx" ON "renos"."security_events"("resolved");
-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "renos"."security_events"("created_at");
-- CreateIndex
CREATE UNIQUE INDEX "team_members_user_id_key" ON "renos"."team_members"("user_id");
-- CreateIndex
CREATE UNIQUE INDEX "team_members_employee_id_key" ON "renos"."team_members"("employee_id");
-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "renos"."team_members"("user_id");
-- CreateIndex
CREATE INDEX "team_members_employee_id_idx" ON "renos"."team_members"("employee_id");
-- CreateIndex
CREATE INDEX "team_members_is_active_idx" ON "renos"."team_members"("is_active");
-- CreateIndex
CREATE INDEX "time_entries_team_member_id_idx" ON "renos"."time_entries"("team_member_id");
-- CreateIndex
CREATE INDEX "time_entries_lead_id_idx" ON "renos"."time_entries"("lead_id");
-- CreateIndex
CREATE INDEX "time_entries_booking_id_idx" ON "renos"."time_entries"("booking_id");
-- CreateIndex
CREATE INDEX "time_entries_start_time_idx" ON "renos"."time_entries"("start_time");
-- CreateIndex
CREATE INDEX "time_corrections_original_entry_id_idx" ON "renos"."time_corrections"("original_entry_id");
-- CreateIndex
CREATE INDEX "time_corrections_submitted_by_idx" ON "renos"."time_corrections"("submitted_by");
-- CreateIndex
CREATE INDEX "time_corrections_status_idx" ON "renos"."time_corrections"("status");
-- CreateIndex
CREATE INDEX "time_corrections_created_at_idx" ON "renos"."time_corrections"("created_at");
-- CreateIndex
CREATE UNIQUE INDEX "leads_idempotency_key_key" ON "renos"."leads"("idempotency_key");
-- CreateIndex
CREATE INDEX "leads_email_created_at_idx" ON "renos"."leads"("email", "created_at");
-- CreateIndex
CREATE INDEX "leads_estimated_value_idx" ON "renos"."leads"("estimated_value");
-- CreateIndex
CREATE INDEX "leads_score_priority_idx" ON "renos"."leads"("score", "priority");
-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "renos"."bookings"("customer_id");
-- CreateIndex
CREATE INDEX "bookings_lead_id_idx" ON "renos"."bookings"("lead_id");
-- CreateIndex
CREATE INDEX "bookings_scheduled_at_idx" ON "renos"."bookings"("scheduled_at");
-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "renos"."bookings"("status");
-- CreateIndex
CREATE INDEX "bookings_timer_status_idx" ON "renos"."bookings"("timer_status");
-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "renos"."customers"("email");
-- CreateIndex
CREATE INDEX "customers_email_idx" ON "renos"."customers"("email");
-- CreateIndex
CREATE INDEX "customers_status_idx" ON "renos"."customers"("status");
-- CreateIndex
CREATE UNIQUE INDEX "conversations_gmail_thread_id_key" ON "renos"."conversations"("gmail_thread_id");
-- CreateIndex
CREATE INDEX "conversations_customer_id_idx" ON "renos"."conversations"("customer_id");
-- CreateIndex
CREATE INDEX "conversations_lead_id_idx" ON "renos"."conversations"("lead_id");
-- CreateIndex
CREATE INDEX "conversations_gmail_thread_id_idx" ON "renos"."conversations"("gmail_thread_id");
-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "renos"."conversations"("status");
-- CreateIndex
CREATE UNIQUE INDEX "email_threads_gmail_thread_id_key" ON "renos"."email_threads"("gmail_thread_id");
-- CreateIndex
CREATE INDEX "email_threads_customer_id_idx" ON "renos"."email_threads"("customer_id");
-- CreateIndex
CREATE INDEX "email_threads_gmail_thread_id_idx" ON "renos"."email_threads"("gmail_thread_id");
-- CreateIndex
CREATE INDEX "email_threads_last_message_at_idx" ON "renos"."email_threads"("last_message_at");
-- CreateIndex
CREATE INDEX "email_threads_is_matched_idx" ON "renos"."email_threads"("is_matched");
-- CreateIndex
CREATE UNIQUE INDEX "email_messages_gmail_message_id_key" ON "renos"."email_messages"("gmail_message_id");
-- CreateIndex
CREATE INDEX "email_messages_thread_id_idx" ON "renos"."email_messages"("thread_id");
-- CreateIndex
CREATE INDEX "email_messages_conversation_id_idx" ON "renos"."email_messages"("conversation_id");
-- CreateIndex
CREATE INDEX "email_messages_gmail_message_id_idx" ON "renos"."email_messages"("gmail_message_id");
-- CreateIndex
CREATE INDEX "email_messages_sent_at_idx" ON "renos"."email_messages"("sent_at");
-- CreateIndex
CREATE INDEX "email_messages_direction_idx" ON "renos"."email_messages"("direction");
-- CreateIndex
CREATE INDEX "email_responses_lead_id_idx" ON "renos"."email_responses"("lead_id");
-- CreateIndex
CREATE INDEX "email_responses_status_idx" ON "renos"."email_responses"("status");
-- CreateIndex
CREATE INDEX "escalations_lead_id_idx" ON "renos"."escalations"("lead_id");
-- CreateIndex
CREATE INDEX "escalations_severity_idx" ON "renos"."escalations"("severity");
-- CreateIndex
CREATE INDEX "escalations_escalated_at_idx" ON "renos"."escalations"("escalated_at");
-- CreateIndex
CREATE INDEX "cleaning_plans_customer_id_idx" ON "renos"."cleaning_plans"("customer_id");
-- CreateIndex
CREATE INDEX "cleaning_plans_service_type_idx" ON "renos"."cleaning_plans"("service_type");
-- CreateIndex
CREATE INDEX "cleaning_plans_is_active_idx" ON "renos"."cleaning_plans"("is_active");
-- CreateIndex
CREATE INDEX "cleaning_plans_is_template_idx" ON "renos"."cleaning_plans"("is_template");
-- CreateIndex
CREATE INDEX "cleaning_tasks_plan_id_idx" ON "renos"."cleaning_tasks"("plan_id");
-- CreateIndex
CREATE INDEX "cleaning_tasks_category_idx" ON "renos"."cleaning_tasks"("category");
-- CreateIndex
CREATE UNIQUE INDEX "cleaning_plan_bookings_booking_id_key" ON "renos"."cleaning_plan_bookings"("booking_id");
-- CreateIndex
CREATE INDEX "cleaning_plan_bookings_plan_id_idx" ON "renos"."cleaning_plan_bookings"("plan_id");
-- CreateIndex
CREATE INDEX "cleaning_plan_bookings_booking_id_idx" ON "renos"."cleaning_plan_bookings"("booking_id");
-- CreateIndex
CREATE INDEX "breaks_booking_id_idx" ON "renos"."breaks"("booking_id");
-- CreateIndex
CREATE INDEX "breaks_start_time_idx" ON "renos"."breaks"("start_time");
-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "renos"."invoices"("invoice_number");
-- CreateIndex
CREATE UNIQUE INDEX "invoices_billy_invoice_id_key" ON "renos"."invoices"("billy_invoice_id");
-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "renos"."invoices"("customer_id");
-- CreateIndex
CREATE INDEX "invoices_booking_id_idx" ON "renos"."invoices"("booking_id");
-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "renos"."invoices"("status");
-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "renos"."invoices"("due_date");
-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "renos"."invoices"("invoice_number");
-- CreateIndex
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "renos"."invoice_line_items"("invoice_id");
-- CreateIndex
CREATE UNIQUE INDEX "analytics_date_metric_key" ON "renos"."analytics"("date", "metric");
-- CreateIndex
CREATE INDEX "task_executions_task_type_status_idx" ON "renos"."task_executions"("task_type", "status");
-- CreateIndex
CREATE INDEX "task_executions_executed_at_idx" ON "renos"."task_executions"("executed_at");
-- CreateIndex
CREATE INDEX "task_executions_trace_id_idx" ON "renos"."task_executions"("trace_id");
-- CreateIndex
CREATE INDEX "task_executions_session_id_idx" ON "renos"."task_executions"("session_id");
-- CreateIndex
CREATE INDEX "competitor_pricing_competitor_scraped_at_idx" ON "renos"."competitor_pricing"("competitor", "scraped_at");
-- CreateIndex
CREATE UNIQUE INDEX "labels_name_key" ON "renos"."labels"("name");
-- CreateIndex
CREATE UNIQUE INDEX "customer_intelligence_customer_id_key" ON "renos"."customer_intelligence"("customer_id");
-- CreateIndex
CREATE INDEX "customer_intelligence_customer_id_idx" ON "renos"."customer_intelligence"("customer_id");
-- CreateIndex
CREATE INDEX "customer_intelligence_risk_score_idx" ON "renos"."customer_intelligence"("risk_score");
-- CreateIndex
CREATE INDEX "booking_validations_booking_id_idx" ON "renos"."booking_validations"("booking_id");
-- CreateIndex
CREATE INDEX "booking_validations_validation_type_idx" ON "renos"."booking_validations"("validation_type");
-- CreateIndex
CREATE INDEX "booking_validations_passed_idx" ON "renos"."booking_validations"("passed");
-- CreateIndex
CREATE INDEX "booking_validations_created_at_idx" ON "renos"."booking_validations"("created_at");
-- CreateIndex
CREATE INDEX "overtime_logs_booking_id_idx" ON "renos"."overtime_logs"("booking_id");
-- CreateIndex
CREATE INDEX "overtime_logs_customer_id_idx" ON "renos"."overtime_logs"("customer_id");
-- CreateIndex
CREATE INDEX "overtime_logs_customer_notified_idx" ON "renos"."overtime_logs"("customer_notified");
-- CreateIndex
CREATE INDEX "learned_patterns_pattern_type_idx" ON "renos"."learned_patterns"("pattern_type");
-- CreateIndex
CREATE INDEX "learned_patterns_entity_id_idx" ON "renos"."learned_patterns"("entity_id");
-- CreateIndex
CREATE INDEX "learned_patterns_confidence_idx" ON "renos"."learned_patterns"("confidence");
-- CreateIndex
CREATE INDEX "undo_actions_entity_type_entity_id_idx" ON "renos"."undo_actions"("entity_type", "entity_id");
-- CreateIndex
CREATE INDEX "undo_actions_expires_at_idx" ON "renos"."undo_actions"("expires_at");
-- CreateIndex
CREATE INDEX "undo_actions_performed_at_idx" ON "renos"."undo_actions"("performed_at");
-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_email_key" ON "crm"."CrmContact"("email");
-- CreateIndex
CREATE INDEX "CrmContact_email_idx" ON "crm"."CrmContact"("email");
-- CreateIndex
CREATE INDEX "CrmContact_companyId_idx" ON "crm"."CrmContact"("companyId");
-- CreateIndex
CREATE INDEX "CrmContact_status_idx" ON "crm"."CrmContact"("status");
-- CreateIndex
CREATE INDEX "CrmContact_owner_idx" ON "crm"."CrmContact"("owner");
-- CreateIndex
CREATE INDEX "CrmCompany_name_idx" ON "crm"."CrmCompany"("name");
-- CreateIndex
CREATE INDEX "CrmCompany_status_idx" ON "crm"."CrmCompany"("status");
-- CreateIndex
CREATE INDEX "CrmCompany_owner_idx" ON "crm"."CrmCompany"("owner");
-- CreateIndex
CREATE INDEX "CrmDeal_stage_idx" ON "crm"."CrmDeal"("stage");
-- CreateIndex
CREATE INDEX "CrmDeal_status_idx" ON "crm"."CrmDeal"("status");
-- CreateIndex
CREATE INDEX "CrmDeal_owner_idx" ON "crm"."CrmDeal"("owner");
-- CreateIndex
CREATE INDEX "CrmDeal_contactId_idx" ON "crm"."CrmDeal"("contactId");
-- CreateIndex
CREATE INDEX "CrmDeal_companyId_idx" ON "crm"."CrmDeal"("companyId");
-- CreateIndex
CREATE INDEX "CrmDeal_expectedCloseDate_idx" ON "crm"."CrmDeal"("expectedCloseDate");
-- CreateIndex
CREATE INDEX "CrmDealProduct_dealId_idx" ON "crm"."CrmDealProduct"("dealId");
-- CreateIndex
CREATE INDEX "CrmActivity_contactId_idx" ON "crm"."CrmActivity"("contactId");
-- CreateIndex
CREATE INDEX "CrmActivity_companyId_idx" ON "crm"."CrmActivity"("companyId");
-- CreateIndex
CREATE INDEX "CrmActivity_dealId_idx" ON "crm"."CrmActivity"("dealId");
-- CreateIndex
CREATE INDEX "CrmActivity_occurredAt_idx" ON "crm"."CrmActivity"("occurredAt");
-- CreateIndex
CREATE INDEX "CrmActivity_owner_idx" ON "crm"."CrmActivity"("owner");
-- CreateIndex
CREATE INDEX "CrmEmail_contactId_idx" ON "crm"."CrmEmail"("contactId");
-- CreateIndex
CREATE INDEX "CrmEmail_direction_idx" ON "crm"."CrmEmail"("direction");
-- CreateIndex
CREATE INDEX "CrmEmail_status_idx" ON "crm"."CrmEmail"("status");
-- CreateIndex
CREATE INDEX "CrmTask_assignedTo_idx" ON "crm"."CrmTask"("assignedTo");
-- CreateIndex
CREATE INDEX "CrmTask_contactId_idx" ON "crm"."CrmTask"("contactId");
-- CreateIndex
CREATE INDEX "CrmTask_status_idx" ON "crm"."CrmTask"("status");
-- CreateIndex
CREATE INDEX "CrmTask_dueDate_idx" ON "crm"."CrmTask"("dueDate");
-- CreateIndex
CREATE INDEX "CrmMetric_date_idx" ON "crm"."CrmMetric"("date");
-- CreateIndex
CREATE INDEX "CrmMetric_metric_idx" ON "crm"."CrmMetric"("metric");
-- CreateIndex
CREATE UNIQUE INDEX "CrmMetric_date_metric_key" ON "crm"."CrmMetric"("date", "metric");
-- CreateIndex
CREATE INDEX "FlowWorkflow_status_idx" ON "flow"."FlowWorkflow"("status");
-- CreateIndex
CREATE INDEX "FlowWorkflow_owner_idx" ON "flow"."FlowWorkflow"("owner");
-- CreateIndex
CREATE INDEX "FlowWorkflow_isTemplate_idx" ON "flow"."FlowWorkflow"("isTemplate");
-- CreateIndex
CREATE INDEX "FlowExecution_workflowId_idx" ON "flow"."FlowExecution"("workflowId");
-- CreateIndex
CREATE INDEX "FlowExecution_status_idx" ON "flow"."FlowExecution"("status");
-- CreateIndex
CREATE INDEX "FlowExecution_startedAt_idx" ON "flow"."FlowExecution"("startedAt");
-- CreateIndex
CREATE INDEX "FlowExecutionStep_executionId_idx" ON "flow"."FlowExecutionStep"("executionId");
-- CreateIndex
CREATE INDEX "FlowExecutionStep_status_idx" ON "flow"."FlowExecutionStep"("status");
-- CreateIndex
CREATE INDEX "FlowExecutionLog_executionId_idx" ON "flow"."FlowExecutionLog"("executionId");
-- CreateIndex
CREATE INDEX "FlowExecutionLog_level_idx" ON "flow"."FlowExecutionLog"("level");
-- CreateIndex
CREATE INDEX "FlowExecutionLog_timestamp_idx" ON "flow"."FlowExecutionLog"("timestamp");
-- CreateIndex
CREATE INDEX "FlowSchedule_workflowId_idx" ON "flow"."FlowSchedule"("workflowId");
-- CreateIndex
CREATE INDEX "FlowSchedule_isActive_idx" ON "flow"."FlowSchedule"("isActive");
-- CreateIndex
CREATE INDEX "FlowSchedule_nextRun_idx" ON "flow"."FlowSchedule"("nextRun");
-- CreateIndex
CREATE UNIQUE INDEX "FlowWebhook_url_key" ON "flow"."FlowWebhook"("url");
-- CreateIndex
CREATE INDEX "FlowWebhook_workflowId_idx" ON "flow"."FlowWebhook"("workflowId");
-- CreateIndex
CREATE INDEX "FlowWebhook_isActive_idx" ON "flow"."FlowWebhook"("isActive");
-- CreateIndex
CREATE INDEX "FlowIntegration_owner_idx" ON "flow"."FlowIntegration"("owner");
-- CreateIndex
CREATE INDEX "FlowIntegration_type_idx" ON "flow"."FlowIntegration"("type");
-- CreateIndex
CREATE INDEX "FlowIntegration_status_idx" ON "flow"."FlowIntegration"("status");
-- CreateIndex
CREATE INDEX "FlowVariable_workflowId_idx" ON "flow"."FlowVariable"("workflowId");
-- CreateIndex
CREATE UNIQUE INDEX "FlowVariable_workflowId_key_key" ON "flow"."FlowVariable"("workflowId", "key");
-- CreateIndex
CREATE INDEX "FlowMetric_date_idx" ON "flow"."FlowMetric"("date");
-- CreateIndex
CREATE INDEX "FlowMetric_metric_idx" ON "flow"."FlowMetric"("metric");
-- CreateIndex
CREATE INDEX "FlowMetric_workflowId_idx" ON "flow"."FlowMetric"("workflowId");
-- CreateIndex
CREATE UNIQUE INDEX "FlowMetric_date_metric_workflowId_key" ON "flow"."FlowMetric"("date", "metric", "workflowId");
-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "shared"."users"("email");
-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "shared"."audit_logs"("user_id");
-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "shared"."audit_logs"("created_at");
-- AddForeignKey
ALTER TABLE "billy"."users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "billy"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "billy"."cached_invoices" ADD CONSTRAINT "cached_invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "billy"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "billy"."cached_customers" ADD CONSTRAINT "cached_customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "billy"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "billy"."cached_products" ADD CONSTRAINT "cached_products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "billy"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "billy"."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "billy"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "billy"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "billy"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "billy"."usage_metrics" ADD CONSTRAINT "usage_metrics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "billy"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "billy"."rate_limits" ADD CONSTRAINT "rate_limits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "billy"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "renos"."chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "renos"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "renos"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "renos"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."quality_assessments" ADD CONSTRAINT "quality_assessments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "renos"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."quality_assessments" ADD CONSTRAINT "quality_assessments_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "renos"."quality_checklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."quality_assessments" ADD CONSTRAINT "quality_assessments_assessed_by_fkey" FOREIGN KEY ("assessed_by") REFERENCES "renos"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."photo_documentation" ADD CONSTRAINT "photo_documentation_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "renos"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."photo_documentation" ADD CONSTRAINT "photo_documentation_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "renos"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "renos"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "renos"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."time_entries" ADD CONSTRAINT "time_entries_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "renos"."team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."time_corrections" ADD CONSTRAINT "time_corrections_original_entry_id_fkey" FOREIGN KEY ("original_entry_id") REFERENCES "renos"."time_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."time_corrections" ADD CONSTRAINT "time_corrections_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "renos"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."time_corrections" ADD CONSTRAINT "time_corrections_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "renos"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."time_corrections" ADD CONSTRAINT "time_corrections_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "renos"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."leads" ADD CONSTRAINT "leads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "renos"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."quotes" ADD CONSTRAINT "quotes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "renos"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "renos"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."bookings" ADD CONSTRAINT "bookings_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "renos"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "renos"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."conversations" ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "renos"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."email_threads" ADD CONSTRAINT "email_threads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "renos"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."email_messages" ADD CONSTRAINT "email_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "renos"."email_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."email_messages" ADD CONSTRAINT "email_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "renos"."conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."email_responses" ADD CONSTRAINT "email_responses_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "renos"."leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."escalations" ADD CONSTRAINT "escalations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "renos"."leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."cleaning_plans" ADD CONSTRAINT "cleaning_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "renos"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "renos"."cleaning_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."cleaning_plan_bookings" ADD CONSTRAINT "cleaning_plan_bookings_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "renos"."cleaning_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."cleaning_plan_bookings" ADD CONSTRAINT "cleaning_plan_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "renos"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."breaks" ADD CONSTRAINT "breaks_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "renos"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."invoices" ADD CONSTRAINT "invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "renos"."bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "renos"."invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "renos"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmContact" ADD CONSTRAINT "CrmContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "crm"."CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmDeal" ADD CONSTRAINT "CrmDeal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm"."CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmDeal" ADD CONSTRAINT "CrmDeal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "crm"."CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmDealProduct" ADD CONSTRAINT "CrmDealProduct_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "crm"."CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmActivity" ADD CONSTRAINT "CrmActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm"."CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmActivity" ADD CONSTRAINT "CrmActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "crm"."CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmActivity" ADD CONSTRAINT "CrmActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "crm"."CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmEmail" ADD CONSTRAINT "CrmEmail_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm"."CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."CrmTask" ADD CONSTRAINT "CrmTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm"."CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "flow"."FlowExecution" ADD CONSTRAINT "FlowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "flow"."FlowWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "flow"."FlowExecutionStep" ADD CONSTRAINT "FlowExecutionStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "flow"."FlowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "flow"."FlowExecutionLog" ADD CONSTRAINT "FlowExecutionLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "flow"."FlowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "flow"."FlowSchedule" ADD CONSTRAINT "FlowSchedule_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "flow"."FlowWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;